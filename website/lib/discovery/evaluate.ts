// Measures discovery against the hand-written evaluation set (data/discovery-eval.json).
import tuningSet from '../../data/discovery-eval.json';
import holdoutSet from '../../data/discovery-holdout.json';
import { discover } from './discover';

export const EVAL_SETS = { tuning: tuningSet, holdout: holdoutSet };

type Case = { id: string; industry: string; problem: string; expect: string[]; acceptTop3?: string[]; expectGap?: string; expectClarification?: boolean; expectNoClarification?: boolean; forbid?: string[] };
export type CaseResult = { id: string; problem: string; pass: boolean; failures: string[]; found: string[]; top3: string[]; ms: number };
export type EvalReport = {
  version: string; cases: number; passed: number;
  capabilityRecall: number; capabilityPrecision: number; top3HitRate: number; gapAccuracy: number; clarificationAccuracy: number;
  medianMs: number; maxMs: number; results: CaseResult[];
};

export function evaluateDiscovery(set: keyof typeof EVAL_SETS = 'tuning'): EvalReport {
  const evalSet = EVAL_SETS[set];
  const cases = evalSet.cases as Case[];
  let tp = 0, fp = 0, fn = 0, top3Hits = 0, top3Total = 0, gapOk = 0, gapTotal = 0, clarOk = 0, clarTotal = 0;
  const results: CaseResult[] = [];
  for (const c of cases) {
    const started = performance.now();
    const r = discover({ problem: c.problem, profile: { industry: c.industry as never } });
    const ms = performance.now() - started;
    const found = r.intent.capabilities.filter(x => x.role === 'required').map(x => x.id);
    const failures: string[] = [];
    for (const e of c.expect) if (found.includes(e)) tp++; else { fn++; failures.push(`missed ${e}`); }
    for (const f of found) if (!c.expect.includes(f)) fp++;
    for (const f of c.forbid ?? []) if (r.intent.capabilities.some(x => x.id === f)) failures.push(`forbidden ${f}`);
    const top3 = r.candidates.slice(0, 3).map(x => x.toolId);
    if (c.acceptTop3) { top3Total++; if (top3.some(t => c.acceptTop3!.includes(t))) top3Hits++; else failures.push(`top3 ${top3.join(',')} outside accepted set`); }
    if (c.expectGap) { gapTotal++; if (r.gaps.some(g => g.capabilityId === c.expectGap)) gapOk++; else failures.push(`gap ${c.expectGap} not reported`); }
    if (c.expectClarification || c.expectNoClarification) {
      clarTotal++;
      const asked = r.status === 'needs_clarification';
      if (asked === !!c.expectClarification) clarOk++; else failures.push(c.expectClarification ? 'clarification not asked' : 'redundant clarification asked');
    }
    results.push({ id: c.id, problem: c.problem, pass: failures.length === 0, failures, found, top3, ms });
  }
  const times = results.map(r => r.ms).sort((a, b) => a - b);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 100);
  return {
    version: evalSet.version, cases: cases.length, passed: results.filter(r => r.pass).length,
    capabilityRecall: pct(tp, tp + fn), capabilityPrecision: pct(tp, tp + fp), top3HitRate: pct(top3Hits, top3Total),
    gapAccuracy: pct(gapOk, gapTotal), clarificationAccuracy: pct(clarOk, clarTotal),
    medianMs: Math.round(times[Math.floor(times.length / 2)] * 100) / 100, maxMs: Math.round(times[times.length - 1] * 100) / 100, results,
  };
}

/** Hybrid evaluation: rules first, AI fallback only for cases the rules cannot match (costs a few cents). */
export async function evaluateHybrid(set: keyof typeof EVAL_SETS, ai: (problem: string) => Promise<import('./interpret').Intent>): Promise<EvalReport> {
  const { discoverWithIntent } = await import('./discover');
  const base = evaluateDiscovery(set);
  const cases = EVAL_SETS[set].cases as Case[];
  let tp = 0, fp = 0, fn = 0, top3Hits = 0, top3Total = 0, gapOk = 0, gapTotal = 0, clarOk = 0, clarTotal = 0;
  const results: CaseResult[] = [];
  for (const c of cases) {
    const started = performance.now();
    let r = discover({ problem: c.problem, profile: { industry: c.industry as never } });
    if (r.status !== 'needs_clarification' && !r.intent.capabilities.some(x => x.role === 'required')) {
      const intent = await ai(c.problem);
      if (intent.capabilities.length) r = discoverWithIntent(intent, { industry: c.industry }, { interpreter: 'ai-fallback', profileSnapshot: {} });
    }
    const ms = performance.now() - started;
    const found = r.intent.capabilities.filter(x => x.role === 'required').map(x => x.id);
    const failures: string[] = [];
    for (const e of c.expect) if (found.includes(e)) tp++; else { fn++; failures.push(`missed ${e}`); }
    for (const f of found) if (!c.expect.includes(f)) fp++;
    const top3 = r.candidates.slice(0, 3).map(x => x.toolId);
    if (c.acceptTop3) { top3Total++; if (top3.some(t => c.acceptTop3!.includes(t))) top3Hits++; else failures.push('top3'); }
    if (c.expectGap) { gapTotal++; if (r.gaps.some(g => g.capabilityId === c.expectGap)) gapOk++; else failures.push('gap'); }
    if (c.expectClarification || c.expectNoClarification) { clarTotal++; if ((r.status === 'needs_clarification') === !!c.expectClarification) clarOk++; else failures.push('clarification'); }
    results.push({ id: c.id, problem: c.problem, pass: !failures.length, failures, found, top3, ms });
  }
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 100);
  return { ...base, passed: results.filter(r => r.pass).length, capabilityRecall: pct(tp, tp + fn), capabilityPrecision: pct(tp, tp + fp), top3HitRate: pct(top3Hits, top3Total), gapAccuracy: pct(gapOk, gapTotal), clarificationAccuracy: pct(clarOk, clarTotal), results };
}
