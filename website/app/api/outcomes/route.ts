import { NextResponse } from 'next/server';
import { submitReport } from '@/lib/review/outcomes';
import { loggedRoute, readJSON } from '@/lib/server/http';

// Owner check-in: "Did the tool fix your problem?" Accepted only with a signed plan token.
export const POST = loggedRoute('/api/outcomes', async (request, trace) => {
  const result = await submitReport(await readJSON(request, 4000));
  if (!result.ok) { trace.details.reasonCode = 'invalid_input'; return NextResponse.json({ error: result.error }, { status: 400 }); }
  return NextResponse.json(result);
});
