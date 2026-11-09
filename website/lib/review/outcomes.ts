// "Proven by owners like you": outcomes reported by owners who received a plan from us.
// Anti-manipulation by design:
//  - Only holders of a signed plan token can report, and only on tools that were in that plan.
//  - One report per plan per tool; check-ins open OUTCOME_MIN_DAYS after the plan (default 14).
//  - Bursts (many reports for one tool within an hour) are held for review, not counted.
//  - Similar businesses count more (same industry and size), and older reports fade.
//  - Bayesian average (IMDb-style) shrinks thin evidence toward neutral; the "fixed" share uses the
//    Wilson lower bound, so 1 of 1 never reads as 100%.
// Self-reported but plan-verified; the product adds invoice/OAuth proof of use later.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readJson, writeJson } from '../server/storage';
import { z } from 'zod';

export const OUTCOMES_VERSION = '1.0.0';
const DEV_SECRET = randomBytes(32).toString('hex');
const secret = () => process.env.PLAN_SIGNING_SECRET || DEV_SECRET;
const signingReady = () => process.env.NODE_ENV !== 'production' || !!(process.env.PLAN_SIGNING_SECRET && process.env.PLAN_SIGNING_SECRET.length >= 32 && !process.env.PLAN_SIGNING_SECRET.startsWith('GENERATE_WITH_'));
const storePath = () => process.env.OUTCOMES_PATH || 'outcomes.json';
const minDays = () => { const n = Number(process.env.OUTCOME_MIN_DAYS ?? '14'); return Number.isFinite(n) && n >= 0 ? n : 14; };
const PRIOR = 50, PRIOR_WEIGHT = 5, DECAY_PER_MONTH = 0.03, BURST_PER_HOUR = 5;

// ── Plan tokens ──────────────────────────────────────────────────────
export type PlanClaims = { planId: string; toolIds: string[]; industry: string; teamSize: string; issuedAt: string };
const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');
export function issuePlanToken(c: Omit<PlanClaims, 'planId' | 'issuedAt'>, now = new Date()): string {
  if (!signingReady()) return '';
  const claims: PlanClaims = { ...c, planId: randomBytes(9).toString('base64url'), issuedAt: now.toISOString() };
  const payload = b64(JSON.stringify(claims));
  return `${payload}.${sign(payload)}`;
}
export function verifyPlanToken(token: string): PlanClaims | null {
  if (!signingReady()) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload)), got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PlanClaims; } catch { return null; }
}

// ── Reports ──────────────────────────────────────────────────────────
export const reportSchema = z.object({
  token: z.string().min(20).max(2000),
  toolId: z.string().min(1).max(60),
  adopted: z.enum(['yes', 'tried', 'no']),
  fixed: z.enum(['yes', 'partly', 'no']).optional(),
  hoursSaved: z.enum(['0', '1-2', '3-5', '6+']).optional(),
  daysToValue: z.enum(['1', '2-7', '8-30', '30+']).optional(),
}).strict();
export type Report = Omit<z.infer<typeof reportSchema>, 'token'> & { planId: string; industry: string; teamSize: string; reportedAt: string; status: 'counted' | 'held' };
type Store = { reports: Report[] };
async function readStore(): Promise<Store> { return readJson<Store>(storePath(), { reports: [] }); }
async function writeStore(s: Store) { return writeJson(storePath(), s); }

export type SubmitResult = { ok: true; status: Report['status']; message: string } | { ok: false; error: string };
export async function submitReport(input: unknown, now = new Date()): Promise<SubmitResult> {
  const p = reportSchema.safeParse(input);
  if (!p.success) return { ok: false, error: 'Please check your answers.' };
  const claims = verifyPlanToken(p.data.token);
  if (!claims) return { ok: false, error: 'This check-in link is not valid. Only owners who received a plan from us can report results.' };
  if (!claims.toolIds.includes(p.data.toolId)) return { ok: false, error: 'You can only report on tools that were in your plan.' };
  const ageDays = (now.getTime() - Date.parse(claims.issuedAt)) / 864e5;
  if (ageDays < minDays()) return { ok: false, error: `Check-ins open ${minDays()} days after your plan, so results reflect real use.` };
  if (ageDays > 365) return { ok: false, error: 'This plan is over a year old; please run a new check-up.' };
  if (p.data.adopted !== 'no' && !p.data.fixed) return { ok: false, error: 'Tell us whether it fixed the problem.' };
  const store = await readStore();
  if (store.reports.some(r => r.planId === claims.planId && r.toolId === p.data.toolId)) return { ok: false, error: 'You have already reported on this tool for this plan. Thank you!' };
  const lastHour = store.reports.filter(r => r.toolId === p.data.toolId && now.getTime() - Date.parse(r.reportedAt) < 36e5).length;
  const status: Report['status'] = lastHour >= BURST_PER_HOUR ? 'held' : 'counted';
  const { token: _t, ...rest } = p.data;
  store.reports.push({ ...rest, planId: claims.planId, industry: claims.industry, teamSize: claims.teamSize, reportedAt: now.toISOString(), status });
  if (!(await writeStore(store))) return { ok: false, error: 'We could not save your result right now. Please try again later.' };
  return { ok: true, status, message: status === 'counted' ? 'Thank you. Your result now helps owners like you.' : 'Thank you. Your result is held for a quick review before it counts.' };
}

// ── Aggregation ──────────────────────────────────────────────────────
export type OwnerEvidence = {
  toolId: string; reports: number; effective: number;     // effective = similarity- and age-weighted count
  adoptedShare: number | null; fixedAtLeast: number | null; // Wilson lower bound (%), among adopters
  score: number | null;                                    // Bayesian 0–100, null when no evidence
  typicalHours: string | null; typicalDays: string | null; label: string;
};
const FIX = { yes: 1, partly: 0.5, no: 0 } as const;
const mode = (xs: string[]) => { if (!xs.length) return null; const c = new Map<string, number>(); for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1); return [...c.entries()].sort((a, b) => b[1] - a[1])[0][0]; };
/** Wilson score lower bound (95%) for a proportion with (possibly fractional) weighted counts. */
export function wilsonLower(successes: number, n: number, z = 1.96): number {
  if (n <= 0) return 0;
  const p = successes / n, d = 1 + (z * z) / n;
  return Math.max(0, (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / d);
}
export function similarity(r: { industry: string; teamSize: string }, me: { industry: string; teamSize: string }) {
  return r.industry === me.industry ? (r.teamSize === me.teamSize ? 1 : 0.6) : r.teamSize === me.teamSize ? 0.3 : 0.15;
}

export function aggregate(reports: Report[], toolId: string, me: { industry: string; teamSize: string; industryLabel?: string }, now = new Date()): OwnerEvidence {
  const rs = reports.filter(r => r.toolId === toolId && r.status === 'counted');
  const w = (r: Report) => similarity(r, me) * Math.pow(1 - DECAY_PER_MONTH, Math.max(0, (now.getTime() - Date.parse(r.reportedAt)) / (30.44 * 864e5)));
  const effective = rs.reduce((n, r) => n + w(r), 0);
  const adopters = rs.filter(r => r.adopted !== 'no');
  const adoptW = adopters.reduce((n, r) => n + w(r), 0);
  const fixedW = adopters.reduce((n, r) => n + w(r) * FIX[r.fixed ?? 'no'], 0);
  // Bayesian average over adopters: (prior × weight + Σ fixed×100) / (weight + adopters). Thin evidence stays near 50.
  const score = adoptW > 0 ? Math.round((PRIOR * PRIOR_WEIGHT + fixedW * 100) / (PRIOR_WEIGHT + adoptW)) : null;
  const like = rs.filter(r => r.industry === me.industry).length;
  const label = !rs.length ? 'No owner results yet'
    : `${rs.length} owner${rs.length > 1 ? 's' : ''} reported results${like ? ` (${like} in ${me.industryLabel ?? 'your industry'})` : ''}`;
  return {
    toolId, reports: rs.length, effective: Math.round(effective * 100) / 100,
    adoptedShare: rs.length ? Math.round((adopters.length / rs.length) * 100) : null,
    fixedAtLeast: adoptW > 0 ? Math.round(wilsonLower(fixedW, adoptW) * 100) : null,
    score, typicalHours: mode(adopters.map(r => r.hoursSaved).filter((x): x is NonNullable<typeof x> => !!x)),
    typicalDays: mode(adopters.map(r => r.daysToValue).filter((x): x is NonNullable<typeof x> => !!x)), label,
  };
}
export async function loadReports(): Promise<Report[]> { return (await readStore()).reports; }
