// Capability tags for every catalogue tool.
// Tags are derived from each record's reviewed description/evidence text (lib/catalog.ts and
// data/catalogue-expansion.json), not from marketing assumptions. 'p' = the record's primary
// purpose; 's' = a secondary capability the record explicitly mentions.
// Setup audience is set only where the record's own wording says so (e.g. "Developer platform",
// "Build AI agents", "Enterprise"); everything else stays 'owner' (no special setup claim).

export type Strength = 'p' | 's';
export type Audience = 'owner' | 'builder' | 'developer' | 'enterprise';
export type IndustryKey = 'food' | 'home' | 'retail' | 'professional' | 'health' | 'education' | 'manufacturing' | 'other';
export type ToolTag = {
  caps: Record<string, Strength>;
  audience?: Audience;
  audienceEvidence?: string;
  industries?: IndustryKey[];
};

const t = (caps: Record<string, Strength>, extra: Omit<ToolTag, 'caps'> = {}): ToolTag => ({ caps, ...extra });
const builder = (evidence: string): Omit<ToolTag, 'caps'> => ({ audience: 'builder', audienceEvidence: evidence });

export const TOOL_TAGS: Record<string, ToolTag> = {
  // ── Original plan-reviewed tools ──
  goodcall: t({ 'phone-answering': 'p', 'lead-capture': 'p', 'customer-support': 's' }, { industries: ['home', 'food', 'professional'] }),
  smith: t({ 'phone-answering': 'p', 'lead-capture': 'p', 'appointment-booking': 's' }),
  frontdesk: t({ 'phone-answering': 'p', 'appointment-booking': 'p', 'lead-capture': 's', 'website-chat': 's', 'social-messaging': 's' }),
  dialzara: t({ 'phone-answering': 'p', 'lead-capture': 'p', 'appointment-booking': 's' }),
  tidio: t({ 'website-chat': 'p', 'customer-support': 'p', 'lead-capture': 's' }),
  crisp: t({ 'customer-support': 'p', 'website-chat': 'p' }),
  housecall: t({ 'phone-answering': 'p', 'lead-capture': 'p' }, { industries: ['home'] }),
  buffer: t({ 'social-content': 'p', 'social-scheduling': 'p', copywriting: 's' }),
  canva: t({ copywriting: 'p', 'social-content': 's', 'image-creation': 's' }),
  predis: t({ 'social-content': 'p', 'image-creation': 'p', 'video-creation': 's', 'social-scheduling': 's' }),
  simplified: t({ copywriting: 'p', 'image-creation': 'p', 'social-content': 's' }),

  // ── Marketing: writing ──
  jasper: t({ copywriting: 'p', 'social-content': 's' }),
  'copy-ai': t({ copywriting: 'p', prospecting: 's' }, { audience: 'enterprise', audienceEvidence: 'Record describes workflows for “go-to-market teams”.' }),
  writesonic: t({ 'seo-content': 'p', copywriting: 's' }),
  rytr: t({ 'crm-followup': 'p', 'writing-assistance': 's' }),
  anyword: t({ copywriting: 'p', 'ad-creative': 's' }),
  writer: t({ copywriting: 'p', 'workflow-automation': 's' }, { audience: 'enterprise', audienceEvidence: 'Record describes “Enterprise AI agents”.' }),
  grammarly: t({ 'writing-assistance': 'p', copywriting: 's' }),
  wordtune: t({ 'writing-assistance': 'p', copywriting: 'p' }),
  quillbot: t({ 'writing-assistance': 'p', copywriting: 's' }),
  frase: t({ 'seo-content': 'p', copywriting: 's' }),
  surfer: t({ 'seo-content': 'p', copywriting: 's' }),
  scalenut: t({ 'seo-content': 'p', copywriting: 's' }),
  marketmuse: t({ 'seo-content': 'p' }),
  semrush: t({ 'seo-content': 'p', 'ad-creative': 's' }),
  ahrefs: t({ 'seo-content': 'p', copywriting: 's' }),

  // ── Marketing: images and ads ──
  'adobe-express': t({ 'image-creation': 'p', 'social-content': 'p', 'video-creation': 's' }),
  photoroom: t({ 'image-creation': 'p' }, { industries: ['retail'] }),
  pixelcut: t({ 'image-creation': 'p' }, { industries: ['retail'] }),
  pebblely: t({ 'image-creation': 'p' }, { industries: ['retail'] }),
  flair: t({ 'image-creation': 'p' }, { industries: ['retail'] }),
  adcreative: t({ 'ad-creative': 'p', 'image-creation': 's' }),
  creatopy: t({ 'ad-creative': 'p', 'image-creation': 'p', 'video-creation': 's' }),
  pencil: t({ 'ad-creative': 'p', 'video-creation': 's' }),

  // ── Marketing: video and audio ──
  lumen5: t({ 'video-creation': 'p', 'social-content': 's' }),
  invideo: t({ 'video-creation': 'p' }),
  pictory: t({ 'video-creation': 'p' }),
  descript: t({ 'video-creation': 'p', 'voice-audio': 's' }),
  veed: t({ 'video-creation': 'p' }),
  kapwing: t({ 'video-creation': 'p', 'social-content': 's' }),
  runway: t({ 'video-creation': 'p' }),
  synthesia: t({ 'video-creation': 'p' }),
  heygen: t({ 'video-creation': 'p' }),
  opusclip: t({ 'video-creation': 'p', 'social-content': 's' }),
  murf: t({ 'voice-audio': 'p' }),
  elevenlabs: t({ 'voice-audio': 'p' }),
  suno: t({ 'voice-audio': 'p' }),

  // ── Marketing: social management ──
  hootsuite: t({ 'social-content': 'p', 'social-scheduling': 'p', 'social-messaging': 's' }),
  later: t({ 'social-scheduling': 'p', 'social-content': 's' }),
  socialbee: t({ 'social-content': 'p', 'social-scheduling': 'p' }),
  ocoya: t({ 'social-content': 'p', copywriting: 's' }),
  publer: t({ 'social-content': 'p', 'social-scheduling': 's' }),
  metricool: t({ 'social-content': 'p', 'social-scheduling': 'p' }),
  flick: t({ 'social-content': 'p' }),
  contentstudio: t({ 'social-content': 'p', 'social-scheduling': 'p' }),

  // ── Marketing: email and customer messaging ──
  mailchimp: t({ 'email-marketing': 'p' }),
  brevo: t({ 'email-marketing': 'p', 'social-messaging': 's' }),
  klaviyo: t({ 'email-marketing': 'p' }, { industries: ['retail'] }),
  omnisend: t({ 'email-marketing': 'p' }, { industries: ['retail'] }),
  hubspot: t({ 'crm-followup': 'p', 'customer-support': 's' }),
  activecampaign: t({ 'email-marketing': 'p', 'workflow-automation': 's' }),

  // ── Customer support and chat ──
  'intercom-fin': t({ 'customer-support': 'p', 'website-chat': 'p' }),
  zendesk: t({ 'customer-support': 'p' }),
  freshdesk: t({ 'customer-support': 'p' }),
  gorgias: t({ 'customer-support': 'p', 'social-messaging': 's' }, { industries: ['retail'] }),
  helpscout: t({ 'customer-support': 'p', 'website-chat': 's' }),
  ada: t({ 'customer-support': 'p', 'website-chat': 's' }),
  chatbase: t({ 'website-chat': 'p', 'customer-support': 'p' }),
  botpress: t({ 'website-chat': 'p', 'customer-support': 's' }, builder('Record: “Build and configure AI agents for business workflows.”')),
  voiceflow: t({ 'website-chat': 'p', 'customer-support': 's' }, builder('Record: “Design and operate conversational agents.”')),
  landbot: t({ 'website-chat': 'p', 'lead-capture': 's' }, builder('Record: “Build conversational customer enquiry workflows.”')),
  manychat: t({ 'social-messaging': 'p', 'lead-capture': 's' }),
  tars: t({ 'website-chat': 'p', 'lead-capture': 's' }, builder('Record: “Build conversational enquiry and support agents.”')),
  kommunicate: t({ 'website-chat': 'p', 'customer-support': 'p' }),
  userlike: t({ 'website-chat': 'p', 'customer-support': 'p', 'social-messaging': 's' }),
  chatbot: t({ 'website-chat': 'p', 'customer-support': 'p' }),

  // ── Phone agents ──
  retell: t({ 'phone-answering': 'p' }, builder('Record: “Build AI phone agents for customer calls.”')),
  bland: t({ 'phone-answering': 'p' }, builder('Record: “Create automated phone conversation workflows.”')),
  vapi: t({ 'phone-answering': 'p' }, { audience: 'developer', audienceEvidence: 'Record: “Developer platform for voice-agent applications.”' }),
  rosie: t({ 'phone-answering': 'p', 'lead-capture': 'p', 'appointment-booking': 's' }),
  slang: t({ 'phone-answering': 'p', 'appointment-booking': 's' }, { industries: ['food'] }),

  // ── Productivity ──
  notion: t({ 'knowledge-search': 'p', 'writing-assistance': 's' }),
  otter: t({ 'meeting-notes': 'p' }),
  fireflies: t({ 'meeting-notes': 'p' }),
  fathom: t({ 'meeting-notes': 'p' }),
  tldv: t({ 'meeting-notes': 'p', 'knowledge-search': 's' }),
  'read-ai': t({ 'meeting-notes': 'p' }),
  sembly: t({ 'meeting-notes': 'p', 'project-management': 's' }),
  avoma: t({ 'meeting-notes': 'p', 'crm-followup': 's' }),
  reclaim: t({ 'calendar-planning': 'p' }),
  motion: t({ 'calendar-planning': 'p', 'project-management': 's' }),
  clickup: t({ 'project-management': 'p', 'knowledge-search': 's' }),
  coda: t({ 'knowledge-search': 'p', 'writing-assistance': 's' }),

  // ── Operations ──
  taskade: t({ 'project-management': 'p', 'workflow-automation': 's' }),
  asana: t({ 'project-management': 'p' }),
  monday: t({ 'project-management': 'p', 'workflow-automation': 's' }),
  zapier: t({ 'workflow-automation': 'p' }),
  make: t({ 'workflow-automation': 'p' }, builder('Record: “Create visual workflows using AI and app connections.”')),
  lindy: t({ 'workflow-automation': 'p', 'writing-assistance': 's' }),
  airtable: t({ 'workflow-automation': 'p', 'project-management': 's' }),

  // ── Sales ──
  bardeen: t({ prospecting: 'p', 'workflow-automation': 's' }),
  pipedrive: t({ 'crm-followup': 'p' }),
  'zoho-crm': t({ 'crm-followup': 'p' }),
  apollo: t({ prospecting: 'p' }),
  clay: t({ prospecting: 'p' }),
  regie: t({ prospecting: 'p', 'crm-followup': 's' }),

  // ── Finance ──
  quickbooks: t({ bookkeeping: 'p' }),
  xero: t({ bookkeeping: 'p' }),
  dext: t({ 'receipt-capture': 'p', bookkeeping: 's' }),
  vic: t({ 'invoice-payables': 'p' }),
  ramp: t({ 'spend-management': 'p', 'invoice-payables': 's' }),
};
