import { NextResponse } from 'next/server';
import { z } from 'zod';
import { allowedWebhook } from '@/lib/integration/exports';
import { loggedRoute, readJSON } from '@/lib/server/http';

// Forwards the owner's plan to THEIR OWN Zapier or Make webhook. Allow-listed hosts only; nothing is stored.
const schema = z.object({ url: z.string().max(500), payload: z.record(z.string(), z.unknown()) }).strict();
const recent: number[] = [];

export const POST = loggedRoute('/api/integrations/webhook', async (request, trace) => {
  const parsed = schema.safeParse(await readJSON(request, 64000));
  if (!parsed.success) { trace.details.reasonCode = 'invalid_input'; return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const url = allowedWebhook(parsed.data.url);
  if (!url) { trace.details.reasonCode = 'invalid_input'; return NextResponse.json({ error: 'Paste a Zapier (hooks.zapier.com) or Make (hook.…make.com) webhook URL that starts with https://.' }, { status: 400 }); }
  const now = Date.now();
  while (recent.length && now - recent[0] > 6e4) recent.shift();
  if (recent.length >= 20) { trace.details.reasonCode = 'rate_limited'; return NextResponse.json({ error: 'Too many sends; please wait a minute.' }, { status: 429 }); }
  recent.push(now);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data.payload), redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!res.ok) return NextResponse.json({ error: `Your ${url.hostname.includes('zapier') ? 'Zapier' : 'Make'} webhook replied with an error (${res.status}). Check the URL and that the Zap or scenario is on.` }, { status: 502 });
    return NextResponse.json({ ok: true, message: `Sent to your ${url.hostname.includes('zapier') ? 'Zap' : 'Make scenario'}. It can now create tasks, rows or reminders in the tools you already use.` });
  } catch { return NextResponse.json({ error: 'Could not reach your webhook. Check the URL and try again.' }, { status: 502 }); }
});
