import { NextResponse } from 'next/server';
import { discover, discoverWithIntent, discoveryRequestSchema } from '@/lib/discovery/discover';
import { aiInterpret } from '@/lib/discovery/ai-interpret';
import { AI_MODEL, aiEnabled } from '@/lib/ai/openrouter';
import { loggedRoute, readJSON } from '@/lib/server/http';

// Problem-first discovery. Rules first (free, deterministic); AI fallback only when rules find no need.
// The owner's text is never logged; only counts and versions are.
export const POST = loggedRoute('/api/discover', async (request, trace) => {
  const parsed = discoveryRequestSchema.safeParse(await readJSON(request));
  if (!parsed.success) {
    trace.details.reasonCode = 'invalid_input';
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check your request.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  let result = discover(parsed.data);
  // Fallback when the rules find no clear (required) need; clarification questions still take priority.
  if (result.status !== 'needs_clarification' && !result.intent.capabilities.some(c => c.role === 'required') && aiEnabled()) {
    try {
      const intent = await aiInterpret(parsed.data.problem);
      if (intent.capabilities.length) {
        const p = parsed.data.profile;
        result = discoverWithIntent(intent, { industry: p.industry, teamSize: p.teamSize, budget: p.budget, software: p.software, limit: parsed.data.limit }, { interpreter: `ai-fallback (${AI_MODEL})`, profileSnapshot: p });
      }
    } catch { result.notices.push('AI help is unavailable right now, so only our standard matching was used.'); }
  }
  trace.details = { catalogVersion: result.catalogVersion, rulesVersion: `discovery-${result.engineVersion}`, suitableCount: result.totalCandidates, excludedCount: result.excluded.length };
  return NextResponse.json(result);
});
