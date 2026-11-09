// Server-only OpenRouter client with an app-level spend cap.
// - Key is read from the server environment only (never NEXT_PUBLIC_, never sent to the browser).
// - A local ledger provides a best-effort spend check, separate from the FastAPI ledger.
// - Enable only with a separate provider-limited key; concurrent/container-restarted calls need stronger shared accounting.
// - Bounded: timeout, one retry on 429/5xx, max tokens.
// - Only purpose, model, token counts and cost are logged; prompts and responses are not.
// Imported only by API routes and server libraries; node:fs keeps it out of any client bundle.
import { readJson, writeJson } from '../server/storage';
import { logEvent } from '../server/logger';

export const AI_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-5.5';
const LEDGER = () => process.env.AI_LEDGER_PATH || 'ai-ledger.json';
const RESERVE_PER_CALL = 0.05; // pre-call estimate; not an atomic reservation or guaranteed billing cap

export class AiUnavailable extends Error { constructor(public reason: 'disabled' | 'budget' | 'error', message: string) { super(message); } }
export type Annotation = { url: string; title: string };
export type ChatResult = { content: string; annotations: Annotation[]; costUsd: number };
type Ledger = { spentUsd: number; calls: { at: string; purpose: string; model: string; costUsd: number; inputTokens: number; outputTokens: number }[] };

export function aiEnabled(): boolean { return process.env.OPENROUTER_ENABLED === 'true' && !!process.env.OPENROUTER_API_KEY; }
export function webEnabled(): boolean { return aiEnabled() && process.env.LIVE_WEB_ENABLED === 'true'; }
export function budgetUsd(): number { const b = Number(process.env.AI_BUDGET_USD ?? '20'); return Number.isFinite(b) && b > 0 ? b : 20; }

async function readLedger(): Promise<Ledger> {
  return readJson<Ledger>(LEDGER(), { spentUsd: 0, calls: [] });
}
async function writeLedger(l: Ledger) {
  await writeJson(LEDGER(), { ...l, calls: l.calls.slice(-500) });
}
export async function spendSummary() { const l = await readLedger(); return { spentUsd: Math.round(l.spentUsd * 10000) / 10000, budgetUsd: budgetUsd(), calls: l.calls.length }; }

export type ChatOptions = {
  purpose: string; system: string; user: string; includeDomains?: string[];
  schema?: { name: string; schema: Record<string, unknown> };
  web?: { maxResults: number };
  maxTokens?: number; timeoutMs?: number;
  fetchImpl?: typeof fetch; // injectable for tests
};

export async function chat(o: ChatOptions): Promise<ChatResult> {
  if (!aiEnabled()) throw new AiUnavailable('disabled', 'AI features are not enabled.');
  const ledger = await readLedger();
  if (ledger.spentUsd + RESERVE_PER_CALL > budgetUsd()) throw new AiUnavailable('budget', 'The AI budget for this demo has been reached.');
  const body: Record<string, unknown> = {
    model: AI_MODEL, max_tokens: o.maxTokens ?? 1500, temperature: 0,
    messages: [{ role: 'system', content: o.system }, { role: 'user', content: o.user }],
    usage: { include: true },
  };
  // Strict JSON-schema mode stalls when combined with the web plugin, so web calls describe the
  // shape in the prompt instead; every response is validated with zod on our side either way.
  if (o.schema && !o.web) body.response_format = { type: 'json_schema', json_schema: { name: o.schema.name, strict: true, schema: o.schema.schema } };
  if (o.web) body.plugins = [{ id: 'web', engine: 'exa', max_results: o.web.maxResults, ...(o.includeDomains?.length ? { include_domains: o.includeDomains } : {}) }];
  // Hidden reasoning burns output tokens and time; our tasks are extraction and classification.
  body.reasoning = { enabled: false };
  const doFetch = o.fetchImpl ?? fetch;
  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await doFetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(o.timeoutMs ?? 30000),
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'X-Title': 'bizzimpact.ai' },
        body: JSON.stringify(body),
      });
    } catch { res = null; }
    if (res && res.ok) break;
    if (res && res.status !== 429 && res.status < 500) break;
    if (attempt === 0) await new Promise(r => setTimeout(r, 1200));
  }
  if (!res || !res.ok) {
    logEvent('ai_call', { route: o.purpose, status: res?.status ?? 0, reasonCode: res?.status === 429 ? 'rate_limited' : 'provider_rejected' });
    throw new AiUnavailable('error', 'The AI service did not respond. Showing catalogue results only.');
  }
  let raw: unknown;
  try { raw = await res.json(); } catch { throw new AiUnavailable('error', 'The AI service response was incomplete. Showing catalogue results only.'); }
  const data = raw as { choices?: { message?: { content?: string; annotations?: { type: string; url_citation?: { url: string; title?: string } }[] } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number } };
  const msg = data.choices?.[0]?.message;
  const costUsd = Number(data.usage?.cost ?? 0) || 0;
  const inputTokens = data.usage?.prompt_tokens ?? 0, outputTokens = data.usage?.completion_tokens ?? 0;
  const fresh = await readLedger();
  fresh.spentUsd += costUsd;
  fresh.calls.push({ at: new Date().toISOString(), purpose: o.purpose, model: AI_MODEL, costUsd, inputTokens, outputTokens });
  await writeLedger(fresh);
  logEvent('ai_call', { route: o.purpose, model: AI_MODEL, inputTokens, outputTokens, costUsd, status: 200 });
  const annotations = (msg?.annotations ?? []).filter(a => a.type === 'url_citation' && a.url_citation?.url).map(a => ({ url: a.url_citation!.url, title: (a.url_citation!.title ?? '').slice(0, 200) }));
  return { content: msg?.content ?? '', annotations, costUsd };
}

/** Parse model JSON defensively (some providers wrap JSON in prose or code fences). */
export function parseJson(content: string): unknown {
  try { return JSON.parse(content); } catch { /* fall through */ }
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
