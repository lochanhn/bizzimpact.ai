// Verifies which anchor apps and catalogue tools are listed in Zapier's public app directory.
// A catalogue tool counts only if its Zapier page mentions the vendor's own domain (avoids
// same-name apps). Writes data/reviewed/zapier-listings.json. Free; polite sequential requests.
// Usage: npm run verify:zapier
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { tools } from '../lib/catalog.ts';
import { APPS } from '../lib/integration/graph.ts';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const slugify = (s: string) => s.toLowerCase().replace(/\.ai\b/g, '-ai').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
const APP_SLUGS: Record<string, string[]> = {
  quickbooks: ['quickbooks'], xero: ['xero'], freshbooks: ['freshbooks'], wave: ['wave'], square: ['square'], clover: ['clover'], toast: ['toast'],
  stripe: ['stripe'], shopify: ['shopify'], jobber: ['jobber'], housecall: ['housecall-pro'], servicetitan: ['servicetitan'], lmn: ['lmn'],
  'google-calendar': ['google-calendar'], outlook: ['microsoft-outlook'], calendly: ['calendly'], wix: ['wix'], squarespace: ['squarespace'], wordpress: ['wordpress'],
  mailchimp: ['mailchimp'], canva: ['canva'], facebook: ['facebook-pages'], instagram: ['instagram-for-business'], 'google-business': ['google-business-profile', 'google-my-business'],
  hubspot: ['hubspot'], gusto: ['gusto'], homebase: ['homebase'], '7shifts': ['7shifts'], zoom: ['zoom'], teams: ['microsoft-teams'], 'google-meet': ['google-meet'],
};

async function get(url: string): Promise<{ status: number; html: string }> {
  try { const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000), redirect: 'follow' }); return { status: r.status, html: r.status === 200 ? await r.text() : '' }; }
  catch { return { status: 0, html: '' }; }
}
const out: { generatedAt: string; apps: Record<string, string>; tools: Record<string, string> } = { generatedAt: new Date().toISOString(), apps: {}, tools: {} };
for (const app of APPS) {
  if (app.id === 'zapier') continue;
  for (const slug of APP_SLUGS[app.id] ?? [slugify(app.name)]) {
    const r = await get(`https://zapier.com/apps/${slug}/integrations`);
    if (r.status === 200) { out.apps[app.id] = slug; break; }
    await new Promise(res => setTimeout(res, 250));
  }
  console.log(`app  ${app.id.padEnd(16)} ${out.apps[app.id] ?? '—'}`);
}
for (const t of tools) {
  if (t.id === 'zapier') continue;
  const domain = host(t.sources[0].url);
  const base = t.name.replace(/\s*(AI Receptionist|Magic Write|Lyro|Hugo|CSR AI|Intelligence|JAX|by Intercom)\b.*/i, '').trim();
  const candidates = [...new Set([slugify(t.name), slugify(base), slugify(t.id)])];
  for (const slug of candidates) {
    const r = await get(`https://zapier.com/apps/${slug}/integrations`);
    if (r.status === 200 && r.html.toLowerCase().includes(domain)) { out.tools[t.id] = slug; break; }
    await new Promise(res => setTimeout(res, 250));
  }
  if (out.tools[t.id]) console.log(`tool ${t.id.padEnd(16)} ${out.tools[t.id]}`);
}
await fs.writeFile(path.join(process.cwd(), 'data', 'reviewed', 'zapier-listings.json'), JSON.stringify(out, null, 2));
console.log(`apps listed: ${Object.keys(out.apps).length}/${APPS.length - 1}; tools listed (domain-matched): ${Object.keys(out.tools).length}/${tools.length - 1}`);
