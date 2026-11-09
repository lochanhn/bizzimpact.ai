// Deterministic problem interpreter: owner text (+ optional profile) → structured intent using
// controlled capability IDs only. No model call, no network, no cost. A future LLM interpreter
// must implement the same ProblemInterpreter interface and is validated against the same taxonomy.
import {
  CAPABILITIES, CAPABILITY_IDS, capabilityById, CHANNEL_CAPABILITIES, CHANNEL_HINTS, CHANNEL_LABELS, CHANNELS,
  PRIORITY_CAPABILITIES, type Channel,
} from './taxonomy';

export type IntentSource = 'text' | 'clarification' | 'profile' | 'questionnaire' | 'ai';
export type IntentCapability = {
  id: string; label: string; role: 'required' | 'optional'; confidence: number; source: IntentSource; evidence: string[];
};
export type Clarification = {
  id: 'Q9'; question: string; why: string; options: { value: Channel; label: string }[]; skippable: true;
};
export type Intent = {
  capabilities: IntentCapability[];
  excluded: { id: string; label: string; evidence: string[] }[];
  channels: Channel[];
  channelSource: 'text' | 'profile' | 'clarification' | 'skipped' | 'not-needed';
  clarification: Clarification | null;
  industryHint: string | null;
  notes: string[];
};
export type InterpretInput = {
  problem: string;
  priorities?: string[];
  profileChannels?: Channel[];
  clarification?: Channel | 'skip';
};
export interface ProblemInterpreter { readonly name: string; interpret(input: InterpretInput): Intent }

// ── Text normalisation ────────────────────────────────────────────────
export function normalise(text: string): string[] {
  return text.toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\bcan'?t\b/g, 'cannot').replace(/\bwon'?t\b/g, 'will not').replace(/n't\b/g, ' not')
    .replace(/\bdont\b/g, 'do not').replace(/\bdoesnt\b/g, 'does not').replace(/\bdidnt\b/g, 'did not')
    .replace(/e-?mail/g, 'email').replace(/follow-up/g, 'follow up').replace(/to-do/g, 'to do')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}
export function stem(word: string): string {
  let w = word;
  // Plural first, then verb endings, so "meetings" and "meeting" share one stem.
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length >= 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  // Only strip a final "e" from longer words, so "note" never collapses into the negation "not".
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}
const stemAll = (text: string) => normalise(text).map(stem);

type Span = { start: number; end: number };
const MAX_GAP = 2;
/** Finds a phrase in order, allowing up to MAX_GAP filler words between phrase words. */
export function findPhrase(tokens: string[], phrase: string[]): Span[] {
  const spans: Span[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== phrase[0]) continue;
    let pos = i, ok = true;
    for (let k = 1; k < phrase.length; k++) {
      let found = -1;
      for (let j = pos + 1; j <= Math.min(tokens.length - 1, pos + 1 + MAX_GAP); j++) if (tokens[j] === phrase[k]) { found = j; break; }
      if (found < 0) { ok = false; break; }
      pos = found;
    }
    if (ok) spans.push({ start: i, end: pos });
  }
  return spans;
}

// Explicit "I don't want / don't need / without X" style negation only. "I don't have time
// to post" is NOT a negation of posting, so a bare "not" is insufficient.
const NEGATING_VERBS = new Set(['want', 'need', 'interest', 'look', 'like']);
function negated(tokens: string[], start: number): boolean {
  const window = tokens.slice(Math.max(0, start - 4), start);
  if (window.some(w => w === 'without' || w === 'avoid' || w === 'except')) return true;
  const neg = window.findIndex(w => w === 'not' || w === 'never' || w === 'no');
  return neg >= 0 && window.slice(neg + 1).some(w => NEGATING_VERBS.has(w));
}

const COMPILED = CAPABILITIES.map(cap => ({
  cap, phrases: cap.phrases.map(ph => ({ ...ph, tokens: stemAll(ph.text) })).filter(ph => ph.tokens.length),
}));
const COMPILED_CHANNELS = CHANNELS.map(ch => ({ ch, hints: CHANNEL_HINTS[ch].map(stemAll) }));
const INDUSTRY_HINTS: [string, string[]][] = [
  ['food', ['restaurant', 'cafe', 'coffee', 'bakery', 'diner', 'pizzeria', 'food truck', 'catering', 'bar', 'kitchen', 'menu']],
  ['home', ['landscaping', 'landscaper', 'lawn', 'hvac', 'plumber', 'plumbing', 'electrician', 'roofing', 'cleaning', 'contractor', 'handyman', 'pest']],
  ['retail', ['shop', 'store', 'boutique', 'ecommerce', 'shopify', 'etsy', 'online store']],
  ['professional', ['law firm', 'accountant', 'consultant', 'agency', 'real estate', 'insurance']],
  ['health', ['salon', 'spa', 'clinic', 'dentist', 'gym', 'fitness', 'therapist', 'barber']],
].map(([k, words]) => [k as string, (words as string[]).map(w => w)]);

type Hit = { capId: string; weight: number; span: Span; raw: string };

export class RuleInterpreter implements ProblemInterpreter {
  readonly name = 'rule-based-v1';
  interpret(input: InterpretInput): Intent {
    const rawTokens = normalise(input.problem);
    const tokens = rawTokens.map(stem);
    const notes: string[] = [];

    // 1. Collect every phrase occurrence.
    const hits: Hit[] = [];
    for (const { cap, phrases } of COMPILED) for (const ph of phrases)
      for (const span of findPhrase(tokens, ph.tokens))
        hits.push({ capId: cap.id, weight: ph.weight, span, raw: rawTokens.slice(span.start, span.end + 1).join(' ') });

    // 2. Strong (weight 1) hits are accepted first, longest first. Weak hits may not reuse
    //    tokens already explained by a strong hit (so "my books" ≠ "book an appointment").
    hits.sort((a, b) => b.weight - a.weight || (b.span.end - b.span.start) - (a.span.end - a.span.start));
    const consumed = new Set<number>();
    const score = new Map<string, number>(), evidence = new Map<string, Set<string>>(), negatedCaps = new Map<string, Set<string>>();
    const perCapPhrase = new Set<string>();
    for (const h of hits) {
      const idx = Array.from({ length: h.span.end - h.span.start + 1 }, (_, i) => h.span.start + i);
      if (h.weight < 1 && idx.some(i => consumed.has(i))) continue;
      const key = `${h.capId}:${h.raw}`;
      if (perCapPhrase.has(key)) continue; // count each phrase once per capability
      perCapPhrase.add(key);
      if (negated(tokens, h.span.start)) {
        if (!negatedCaps.has(h.capId)) negatedCaps.set(h.capId, new Set());
        negatedCaps.get(h.capId)!.add(h.raw);
        continue;
      }
      if (h.weight >= 1) idx.forEach(i => consumed.add(i));
      score.set(h.capId, (score.get(h.capId) ?? 0) + h.weight);
      if (!evidence.has(h.capId)) evidence.set(h.capId, new Set());
      evidence.get(h.capId)!.add(h.raw);
    }
    for (const id of negatedCaps.keys()) score.delete(id);

    // 3. Required = at least one clear signal; optional = supporting words only (max 3).
    let caps: IntentCapability[] = [...score.entries()].map(([id, s]) => ({
      id, label: capabilityById.get(id)!.label, role: s >= 1 ? 'required' as const : 'optional' as const,
      confidence: Math.min(1, Math.round(s * 100) / 100), source: 'text' as const, evidence: [...(evidence.get(id) ?? [])],
    }));
    const required = caps.filter(c => c.role === 'required');
    const optional = caps.filter(c => c.role === 'optional').sort((a, b) => b.confidence - a.confidence).slice(0, required.length ? 2 : 3);
    caps = [...required, ...optional];

    // 4. Channel-neutral enquiries → resolve the channel from text, profile, or Q9.
    let channels: Channel[] = [];
    let channelSource: Intent['channelSource'] = 'not-needed';
    let clarification: Clarification | null = null;
    const enquiry = caps.find(c => c.id === 'customer-enquiries');
    if (enquiry) {
      const fromText = COMPILED_CHANNELS.filter(({ hints }) => hints.some(h => findPhrase(tokens, h).length)).map(({ ch }) => ch);
      if (fromText.length) { channels = fromText; channelSource = 'text'; }
      else if (input.clarification === 'skip') { channelSource = 'skipped'; }
      else if (input.clarification) { channels = [input.clarification]; channelSource = 'clarification'; }
      else if (input.profileChannels?.length) { channels = input.profileChannels; channelSource = 'profile'; }
      else clarification = {
        id: 'Q9', question: 'How do customers usually reach your business?',
        why: 'Phone, website, email and social messages need different tools. Answering helps us show the right ones, or you can skip.',
        options: CHANNELS.map(value => ({ value, label: CHANNEL_LABELS[value] })), skippable: true,
      };
      caps = caps.filter(c => c.id !== 'customer-enquiries');
      const add = (id: string, role: IntentCapability['role'], source: IntentSource, ev: string[]) => {
        const existing = caps.find(c => c.id === id);
        if (existing) { if (role === 'required') existing.role = 'required'; return; }
        caps.push({ id, label: capabilityById.get(id)!.label, role, confidence: role === 'required' ? 1 : 0.5, source, evidence: ev });
      };
      if (channelSource === 'skipped') {
        notes.push('Channel skipped, so options for phone, website, email and social messages are all shown.');
        ['phone-answering', 'website-chat', 'customer-support', 'social-messaging'].forEach(id => add(id, 'optional', 'clarification', enquiry.evidence));
      } else {
        const src: IntentSource = channelSource === 'text' ? 'text' : channelSource === 'profile' ? 'profile' : 'clarification';
        for (const ch of channels) {
          for (const id of CHANNEL_CAPABILITIES[ch]) add(id, 'required', src, [...enquiry.evidence, CHANNEL_LABELS[ch]]);
          if (ch === 'walk-in') notes.push('Walk-in enquiries are handled in person; no catalogue tool automates them.');
        }
      }
    }

    // 5. Silent text → fall back to stated priorities, clearly labelled as inferred.
    if (!caps.length && !clarification && input.priorities?.length) {
      for (const pr of input.priorities) for (const id of PRIORITY_CAPABILITIES[pr] ?? [])
        if (!caps.some(c => c.id === id)) caps.push({ id, label: capabilityById.get(id)!.label, role: 'optional', confidence: 0.5, source: 'profile', evidence: [`Priority: ${pr}`] });
      if (caps.length) notes.push('We could not identify a specific task in your description, so these come from your stated priorities.');
    }

    // Defensive: only controlled IDs may leave the interpreter.
    caps = caps.filter(c => CAPABILITY_IDS.has(c.id));
    caps.sort((a, b) => (a.role === b.role ? b.confidence - a.confidence : a.role === 'required' ? -1 : 1));

    const lower = ` ${rawTokens.join(' ')} `;
    const industryHint = INDUSTRY_HINTS.find(([, words]) => words.some(w => lower.includes(` ${w} `) || lower.includes(` ${w}s `)))?.[0] ?? null;

    return {
      capabilities: caps,
      excluded: [...negatedCaps.entries()].map(([id, ev]) => ({ id, label: capabilityById.get(id)!.label, evidence: [...ev] })),
      channels, channelSource, clarification, industryHint, notes,
    };
  }
}

export const defaultInterpreter: ProblemInterpreter = new RuleInterpreter();
