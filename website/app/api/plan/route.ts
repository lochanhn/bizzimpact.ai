import { NextResponse } from 'next/server';
import { answersSchema } from '@/lib/intake/brief';
import { runPlan } from '@/lib/pipeline';
import { loadReports } from '@/lib/review/outcomes';
import { loggedRoute, readJSON } from '@/lib/server/http';

// Full pipeline. Answers are never logged; only counts and versions are.
export const POST = loggedRoute('/api/plan', async (request, trace) => {
  const parsed = answersSchema.safeParse(await readJSON(request, 32000));
  if (!parsed.success) {
    trace.details.reasonCode = 'invalid_input';
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check your answers.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const result = runPlan(parsed.data, await loadReports());
  trace.details = { catalogVersion: result.discovery.catalogVersion, rulesVersion: `review-${result.review.reviewVersion}`, suitableCount: result.review.topPicks.length, checkCount: result.discovery.totalCandidates, excludedCount: result.review.reviews.filter(r => r.status === 'not-suitable').length };
  return NextResponse.json(result);
});
