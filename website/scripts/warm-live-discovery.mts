// Pre-warms live discovery for every catalogue gap (paid: ~$0.01 per search; cached 30 days).
// Usage: npm run warm:live  (requires OPENROUTER_ENABLED=true and LIVE_WEB_ENABLED=true in .env.local)
import { CAPABILITIES } from '../lib/discovery/taxonomy.ts';
import { liveDiscover } from '../lib/discovery/live.ts';
import { spendSummary } from '../lib/ai/openrouter.ts';

const industries = (process.argv.find(a => a.startsWith('--industries='))?.split('=')[1] ?? 'food,home,retail').split(',');
const gaps = CAPABILITIES.filter(c => c.area === 'gap').map(c => c.id);
const jobs = gaps.flatMap(cap => industries.map(ind => [cap, ind] as const));
let i = 0;
async function worker() {
  while (i < jobs.length) {
    const [cap, ind] = jobs[i++];
    const r = await liveDiscover(cap, ind);
    console.log(`${r.status.padEnd(8)} ${r.cached ? 'cached' : `$${r.costUsd.toFixed(4)}`} ${cap} | ${ind} → ${r.candidates.map(c => c.name).join(', ') || r.message}`);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
console.log(await spendSummary());
