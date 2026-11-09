import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CAPABILITY_IDS } from '@/lib/discovery/taxonomy';
import { INDUSTRIES } from '@/lib/discovery/discover';
import { liveDiscover } from '@/lib/discovery/live';
import { loggedRoute, readJSON } from '@/lib/server/http';

const schema = z.object({
  capabilityId: z.string().refine(id => CAPABILITY_IDS.has(id), 'Unknown need.'),
  industry: z.enum(INDUSTRIES).nullable().optional(),
}).strict();

// Simple in-memory limiter on fresh (paid) searches; cached results are always free.
const recent: number[] = [];
const MAX_PER_HOUR = 30;

export const POST = loggedRoute('/api/discover/live', async (request, trace) => {
  const parsed = schema.safeParse(await readJSON(request, 2000));
  if (!parsed.success) { trace.details.reasonCode = 'invalid_input'; return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 }); }
  const now = Date.now();
  while (recent.length && now - recent[0] > 36e5) recent.shift();
  const limited = recent.length >= MAX_PER_HOUR;
  const result = await liveDiscover(parsed.data.capabilityId, parsed.data.industry ?? null, { cacheOnly: limited });
  if (limited && !result.cached) trace.details.reasonCode = 'rate_limited';
  if (!result.cached && result.searchedAt) recent.push(now);
  trace.details = { ...trace.details, suitableCount: result.candidates.length, excludedCount: result.dropped, costUsd: result.costUsd };
  return NextResponse.json(result);
});
