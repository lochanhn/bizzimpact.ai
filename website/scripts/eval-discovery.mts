// Prints discovery accuracy metrics. Usage: npm run eval:discovery
// "tuning" was used while writing the rules; "holdout" was written afterwards and is the honest estimate.
import { evaluateDiscovery, EVAL_SETS } from '../lib/discovery/evaluate.ts';

for (const set of Object.keys(EVAL_SETS) as (keyof typeof EVAL_SETS)[]) {
  const r = evaluateDiscovery(set);
  console.log(`\n${set.toUpperCase()} set (${r.version}): ${r.passed}/${r.cases} cases passed`);
  console.log(`  Need recall ............... ${r.capabilityRecall}%`);
  console.log(`  Need precision ............ ${r.capabilityPrecision}%`);
  console.log(`  Accepted tool in top 3 .... ${r.top3HitRate}%`);
  console.log(`  Honest gap reported ....... ${r.gapAccuracy}%`);
  console.log(`  Q9 asked only when needed . ${r.clarificationAccuracy}%`);
  console.log(`  Latency median/max ........ ${r.medianMs} ms / ${r.maxMs} ms (in-process, no network, $0)`);
  for (const c of r.results.filter(x => !x.pass)) console.log(`  ✗ ${c.id} ${c.failures.join('; ')} — found [${c.found.join(', ')}]`);
}

if (process.argv.includes('--ai')) {
  const { aiInterpret } = await import('../lib/discovery/ai-interpret');
  const { evaluateHybrid } = await import('../lib/discovery/evaluate');
  const { spendSummary } = await import('../lib/ai/openrouter');
  for (const set of Object.keys(EVAL_SETS) as (keyof typeof EVAL_SETS)[]) {
    const r = await evaluateHybrid(set, p => aiInterpret(p));
    console.log(`\nHYBRID (rules + AI fallback) ${set.toUpperCase()}: ${r.passed}/${r.cases} passed · recall ${r.capabilityRecall}% · precision ${r.capabilityPrecision}% · top-3 ${r.top3HitRate}%`);
    for (const c of r.results.filter(x => !x.pass)) console.log(`  ✗ ${c.id} ${c.failures.join('; ')} — found [${c.found.join(', ')}]`);
  }
  console.log('AI spend so far:', await spendSummary());
}
