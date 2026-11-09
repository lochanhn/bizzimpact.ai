// Controlled capability taxonomy for problem-first discovery.
// Every capability an owner's problem can map to is listed here. Interpretation may only
// emit these IDs; catalogue tags are validated against the same list in tests.
// Phrases are matched after normalisation and light stemming (see interpret.ts), with
// up to two filler words allowed between phrase words ("miss customer calls" ≈ "miss call").

export const TAXONOMY_VERSION = '2026-11-08.1';

export type Area = 'calls' | 'chat' | 'marketing' | 'productivity' | 'operations' | 'sales' | 'finance' | 'gap';
export type Phrase = { text: string; weight: number };
export type CapabilityDef = {
  id: string;
  label: string;          // short owner-facing name
  plain: string;          // what it means in plain English
  area: Area;
  phrases: Phrase[];      // weight 1 = clear signal, 0.5 = supporting signal
};

const p = (weight: number, ...texts: string[]): Phrase[] => texts.map(text => ({ text, weight }));

export const CAPABILITIES: CapabilityDef[] = [
  // ── Phone and enquiries ──────────────────────────────────────────────
  { id: 'phone-answering', label: 'AI phone answering', area: 'calls',
    plain: 'Answers calls you cannot pick up, takes details and handles common questions.',
    phrases: [...p(1, 'miss call', 'missed call', 'answer the phone', 'answer call', 'answer phone', 'pick up the phone', 'phone ring', 'receptionist', 'answering service', 'voicemail', 'after hours call', 'call go unanswered', 'unanswered call', 'phone call', 'cannot pick up', 'phone enquiry', 'phone inquiry', 'call while'),
              ...p(0.5, 'phone', 'call', 'caller')] },
  { id: 'appointment-booking', label: 'Appointment booking', area: 'calls',
    plain: 'Lets customers request or book a time without you stepping in.',
    phrases: [...p(1, 'book appointment', 'booking appointment', 'appointment booked', 'schedule appointment', 'appointment scheduling', 'book a job', 'book job', 'take booking', 'online booking', 'reservation', 'book a table', 'get booked', 'booking request'),
              ...p(0.5, 'appointment', 'booking', 'book', 'schedule visit')] },
  { id: 'lead-capture', label: 'Lead and enquiry capture', area: 'calls',
    plain: 'Collects new-customer details so no enquiry is lost.',
    phrases: [...p(1, 'lose lead', 'lost lead', 'capture lead', 'new lead', 'lead capture', 'quote request', 'callback detail', 'capture detail'),
              ...p(0.5, 'lead', 'new customer', 'potential customer', 'enquiry', 'inquiry')] },

  // ── Customer support and messaging ──────────────────────────────────
  { id: 'website-chat', label: 'Website chat assistant', area: 'chat',
    plain: 'Answers visitor questions on your website, day or night.',
    phrases: [...p(1, 'website chat', 'chat on my website', 'chat on website', 'chatbot', 'chat bot', 'live chat', 'website visitor', 'site visitor', 'question on my website', 'question on website', 'website question'),
              ...p(0.5, 'website', 'chat', 'site')] },
  { id: 'customer-support', label: 'Customer question answering', area: 'chat',
    plain: 'Answers repeated customer questions from your approved information.',
    phrases: [...p(1, 'same question', 'customer question', 'answer question', 'frequently asked', 'faq', 'customer service', 'customer support', 'support ticket', 'support email', 'customer email', 'reply to customer', 'respond to customer', 'help desk', 'helpdesk', 'where is my order', 'order status'),
              ...p(0.5, 'support', 'question', 'ticket', 'complaint')] },
  { id: 'social-messaging', label: 'Social and text message replies', area: 'chat',
    plain: 'Replies to Instagram, Facebook, WhatsApp or text messages.',
    phrases: [...p(1, 'instagram dm', 'instagram message', 'facebook message', 'messenger', 'direct message', 'whatsapp', 'text message', 'sms', 'dm'),
              ...p(0.5, 'message', 'messages')] },
  // Channel-neutral need. Resolved into a concrete channel by the Q9 clarification.
  { id: 'customer-enquiries', label: 'Automatic replies to enquiries', area: 'chat',
    plain: 'Responds to incoming customer enquiries automatically; the channel decides which tools fit.',
    phrases: [...p(1, 'automatic response', 'automatic reply', 'auto reply', 'autoreply', 'respond automatically', 'reply automatically', 'answer automatically', 'respond faster', 'reply faster', 'slow to respond', 'customer inquiry', 'customer enquiry', 'enquiry get lost', 'inquiry get lost', 'enquiries get lost', 'inquiries get lost')] },

  // ── Marketing and content ───────────────────────────────────────────
  { id: 'social-content', label: 'Social media posts', area: 'marketing',
    plain: 'Drafts posts and captions for your social channels.',
    phrases: [...p(1, 'social media', 'social post', 'instagram post', 'facebook post', 'post on instagram', 'post on facebook', 'caption', 'tiktok', 'linkedin post', 'content idea', 'what to post'),
              ...p(0.5, 'instagram', 'facebook', 'post', 'content', 'social')] },
  { id: 'social-scheduling', label: 'Post scheduling', area: 'marketing',
    plain: 'Plans and schedules posts so they go out on time.',
    phrases: [...p(1, 'schedule post', 'scheduling post', 'post consistently', 'post regularly', 'consistent posting', 'content calendar', 'plan post', 'queue post', 'no time to post', 'forget to post'),
              ...p(0.5, 'consistent', 'regularly', 'every week')] },
  { id: 'copywriting', label: 'Marketing copy', area: 'marketing',
    plain: 'Writes promotions, descriptions, menus and website text.',
    phrases: [...p(1, 'write copy', 'marketing copy', 'product description', 'menu description', 'promotion text', 'website text', 'website copy', 'write promotion', 'write description', 'blog post', 'write blog', 'slogan', 'tagline'),
              ...p(0.5, 'write', 'writing', 'copy', 'wording', 'description', 'blog', 'promotion')] },
  { id: 'image-creation', label: 'Images and graphics', area: 'marketing',
    plain: 'Creates or edits graphics, flyers and product photos.',
    phrases: [...p(1, 'product photo', 'product image', 'photo edit', 'edit photo', 'background removal', 'remove background', 'flyer', 'poster', 'graphic', 'design image', 'menu design', 'banner', 'thumbnail'),
              ...p(0.5, 'image', 'photo', 'picture', 'design', 'visual')] },
  { id: 'video-creation', label: 'Video creation', area: 'marketing',
    plain: 'Makes or edits short videos and reels.',
    phrases: [...p(1, 'video', 'reel', 'short clip', 'youtube', 'explainer video', 'edit video', 'video editing'),
              ...p(0.5, 'clip', 'film')] },
  { id: 'seo-content', label: 'Search visibility (SEO)', area: 'marketing',
    plain: 'Helps your website show up when people search online.',
    phrases: [...p(1, 'seo', 'show up on google', 'show up in google', 'found on google', 'google search', 'search ranking', 'rank on google', 'rank higher', 'search engine', 'website traffic', 'nobody find', 'people cannot find', 'ai search'),
              ...p(0.5, 'google', 'search', 'ranking', 'traffic', 'visibility')] },
  { id: 'ad-creative', label: 'Advertising creative', area: 'marketing',
    plain: 'Produces ad images, videos and text variations.',
    phrases: [...p(1, 'ad creative', 'facebook ad', 'instagram ad', 'google ad', 'online ad', 'advert', 'ad campaign', 'paid ad', 'run ad', 'advertising'),
              ...p(0.5, 'ad', 'ads', 'campaign')] },
  { id: 'email-marketing', label: 'Email and SMS marketing', area: 'marketing',
    plain: 'Writes and sends newsletters, offers and win-back messages.',
    phrases: [...p(1, 'email marketing', 'newsletter', 'email campaign', 'email list', 'mailing list', 'sms marketing', 'text marketing', 'promotional email', 'repeat customer', 'bring customer back', 'win back', 'loyalty'),
              ...p(0.5, 'email', 'subscriber', 'returning customer')] },
  { id: 'voice-audio', label: 'Voiceover and audio', area: 'marketing',
    plain: 'Generates voiceovers, speech or music for promotions.',
    phrases: [...p(1, 'voiceover', 'voice over', 'narration', 'podcast', 'background music', 'jingle', 'audio ad', 'text to speech'),
              ...p(0.5, 'audio', 'music', 'voice')] },

  // ── Productivity ─────────────────────────────────────────────────────
  { id: 'meeting-notes', label: 'Meeting notes', area: 'productivity',
    plain: 'Records, transcribes and summarises meetings and client calls.',
    phrases: [...p(1, 'meeting note', 'take note', 'taking note', 'note taking', 'transcribe', 'transcript', 'meeting summary', 'summarise meeting', 'summarize meeting', 'minutes', 'action item', 'client meeting', 'zoom call', 'record meeting'),
              ...p(0.5, 'meeting', 'notes')] },
  { id: 'calendar-planning', label: 'Calendar and task planning', area: 'productivity',
    plain: 'Plans your day, tasks and focus time automatically.',
    phrases: [...p(1, 'plan my day', 'my calendar', 'my schedule', 'to do list', 'todo list', 'time management', 'manage my time', 'too many task', 'prioritise task', 'prioritize task', 'overwhelmed'),
              ...p(0.5, 'calendar', 'task', 'schedule', 'deadline', 'organise', 'organize')] },
  { id: 'writing-assistance', label: 'Everyday writing help', area: 'productivity',
    plain: 'Drafts, rewrites and proofreads emails and documents.',
    phrases: [...p(1, 'write email', 'writing email', 'proofread', 'grammar', 'spelling', 'rewrite', 'reword', 'sound professional', 'draft email', 'reply to email'),
              ...p(0.5, 'email', 'document', 'letter', 'proposal')] },
  { id: 'knowledge-search', label: 'Find information in documents', area: 'productivity',
    plain: 'Searches and summarises your own notes and documents.',
    phrases: [...p(1, 'find information', 'search my document', 'search document', 'find document', 'company knowledge', 'internal document', 'where we keep', 'cannot find file', 'summarise document', 'summarize document'),
              ...p(0.5, 'document', 'notes', 'information', 'file')] },

  // ── Operations ───────────────────────────────────────────────────────
  { id: 'workflow-automation', label: 'Workflow automation', area: 'operations',
    plain: 'Moves information between your apps and handles repetitive steps.',
    phrases: [...p(1, 'automate', 'automation', 'repetitive task', 'manual data entry', 'data entry', 'copy and paste', 'copy paste', 'connect my app', 'connect app', 'between app', 'zapier', 'same thing every day', 'double entry'),
              ...p(0.5, 'repetitive', 'manual', 'spreadsheet', 'workflow')] },
  { id: 'project-management', label: 'Jobs and team task tracking', area: 'operations',
    plain: 'Tracks projects, jobs and who is doing what.',
    phrases: [...p(1, 'track job', 'track project', 'project management', 'assign task', 'assign work', 'team task', 'who is doing what', 'keep track of job', 'job tracking', 'manage project'),
              ...p(0.5, 'project', 'team', 'track', 'progress')] },

  // ── Sales ────────────────────────────────────────────────────────────
  { id: 'crm-followup', label: 'Customer follow-up (CRM)', area: 'sales',
    plain: 'Keeps customer records and reminds you to follow up.',
    phrases: [...p(1, 'follow up', 'followup', 'forget to follow', 'crm', 'customer list', 'customer record', 'sales pipeline', 'pipeline', 'deal', 'quote follow', 'chase quote', 'client relationship', 'keep track of customer'),
              ...p(0.5, 'client', 'customer', 'quote', 'sales')] },
  { id: 'prospecting', label: 'Finding new clients', area: 'sales',
    plain: 'Researches prospects and drafts outreach to win new business.',
    phrases: [...p(1, 'find new client', 'find client', 'find new customer', 'get new client', 'get more client', 'prospect', 'outreach', 'cold email', 'lead list', 'b2b lead', 'generate lead', 'more lead', 'business development'),
              ...p(0.5, 'new client', 'grow sales', 'more customer', 'more business')] },

  // ── Finance ──────────────────────────────────────────────────────────
  { id: 'bookkeeping', label: 'Bookkeeping help', area: 'finance',
    plain: 'Helps with categorising transactions, reconciling and financial questions.',
    phrases: [...p(1, 'bookkeeping', 'accounting', 'reconcile', 'reconciliation', 'categorise transaction', 'categorize transaction', 'my books', 'the books', 'quickbooks', 'xero', 'profit and loss', 'cash flow', 'tax', 'taxes'),
              ...p(0.5, 'finance', 'financial', 'money', 'accountant')] },
  { id: 'receipt-capture', label: 'Receipts and paperwork capture', area: 'finance',
    plain: 'Reads receipts and documents so you do not type them in.',
    phrases: [...p(1, 'receipt', 'expense report', 'scan document', 'paperwork', 'shoebox', 'keep receipt', 'lost receipt'),
              ...p(0.5, 'expense', 'paper')] },
  { id: 'invoice-payables', label: 'Bills and invoice processing', area: 'finance',
    plain: 'Processes supplier bills and invoices for approval and payment.',
    phrases: [...p(1, 'supplier invoice', 'vendor invoice', 'pay supplier', 'pay vendor', 'pay bill', 'accounts payable', 'bill payment', 'invoice processing', 'process invoice'),
              ...p(0.5, 'invoice', 'bill', 'supplier')] },
  { id: 'spend-management', label: 'Spending control', area: 'finance',
    plain: 'Tracks company card spending and flags overspending.',
    phrases: [...p(1, 'company card', 'employee spending', 'spend management', 'track spending', 'overspend', 'control cost', 'expense policy'),
              ...p(0.5, 'spending', 'cost')] },

  // ── Known needs with no reviewed catalogue tool yet (honest gaps) ───
  { id: 'inventory-forecasting', label: 'Inventory and demand forecasting', area: 'gap',
    plain: 'Predicts what to order so you waste less and run out less.',
    phrases: [...p(1, 'inventory', 'overorder', 'over order', 'food waste', 'throw away food', 'waste food', 'stock level', 'run out of stock', 'running out', 'order ingredient', 'ordering ingredient', 'demand forecast', 'forecast demand', 'how much to order', 'spoilage', 'par level'),
              ...p(0.5, 'stock', 'waste', 'ingredient', 'supply', 'order')] },
  { id: 'review-management', label: 'Online review replies', area: 'gap',
    plain: 'Monitors and drafts replies to Google, Yelp and other reviews.',
    phrases: [...p(1, 'review', 'yelp', 'google review', 'bad review', 'negative review', 'reply to review', 'respond to review', 'star rating', 'reputation')] },
  { id: 'staff-scheduling', label: 'Staff shift scheduling', area: 'gap',
    plain: 'Builds staff rotas and handles shift swaps.',
    phrases: [...p(1, 'shift', 'staff schedule', 'employee schedule', 'rota', 'roster', 'who work when', 'staffing', 'call out sick', 'no show staff'),
              ...p(0.5, 'staff', 'employee')] },
  { id: 'route-dispatch', label: 'Route planning and dispatch', area: 'gap',
    plain: 'Plans job routes and dispatches crews efficiently.',
    phrases: [...p(1, 'route', 'dispatch', 'drive between job', 'driving time', 'fuel cost', 'technician schedule', 'crew schedule', 'which crew', 'travel time')] },
  { id: 'estimates-quotes', label: 'Estimates and quotes', area: 'gap',
    plain: 'Builds accurate job estimates and quotes faster.',
    phrases: [...p(1, 'estimate', 'write quote', 'writing quote', 'create quote', 'build quote', 'price a job', 'pricing job', 'bid')] },
  { id: 'cash-flow-forecasting', label: 'Cash flow forecasting', area: 'gap',
    plain: 'Projects your cash position weeks or months ahead from invoices, bills and seasonality.',
    phrases: [...p(1, 'cash flow forecast', 'forecast cash', 'enough cash', 'enough money next month', 'cash position', 'run out of cash', 'run out of money', 'predict cash')] },
  { id: 'collections-reminders', label: 'Invoice reminders and collections', area: 'gap',
    plain: 'Sends polite reminders for overdue invoices so you get paid sooner.',
    phrases: [...p(1, 'pay late', 'paying late', 'late payment', 'overdue invoice', 'chase invoice', 'chase payment', 'unpaid invoice', 'get paid faster', 'collect payment', 'accounts receivable')] },
  { id: 'supplier-comparison', label: 'Supplier price comparison', area: 'gap',
    plain: 'Compares supplier prices and terms and helps you request quotes.',
    phrases: [...p(1, 'compare supplier', 'supplier price', 'compare vendor', 'vendor price', 'cheaper supplier', 'better supplier', 'request for proposal', 'rfp')] },
  { id: 'contract-review', label: 'Contract review', area: 'gap',
    plain: 'Summarises contracts and flags risky clauses and renewal dates.',
    phrases: [...p(1, 'contract', 'lease', 'agreement', 'terms and condition', 'renewal date', 'auto renew', 'legal document', 'fine print')] },
  { id: 'market-research', label: 'Competitor and market research', area: 'gap',
    plain: 'Summarises what customers and competitors say so you can spot opportunities.',
    phrases: [...p(1, 'competitor', 'competition', 'market research', 'what customers say', 'customer feedback', 'new product idea', 'new service idea', 'test an idea', 'market gap')] },
  { id: 'code-generation', label: 'Building software and websites', area: 'gap',
    plain: 'Helps write and test code for apps, website features or internal tools.',
    phrases: [...p(1, 'write code', 'coding', 'build an app', 'build app', 'website feature', 'software development', 'developer', 'programming')] },
  { id: 'hiring-hr', label: 'Hiring and HR', area: 'gap',
    plain: 'Helps write job ads, screen applicants and handle HR paperwork.',
    phrases: [...p(1, 'hire', 'hiring', 'recruit', 'job applicant', 'job posting', 'job ad', 'payroll', 'onboard new employee', 'hr paperwork')] },
];

export const CAPABILITY_IDS = new Set(CAPABILITIES.map(c => c.id));
export const capabilityById = new Map(CAPABILITIES.map(c => [c.id, c]));

// Q9 channel answers resolve the channel-neutral "customer-enquiries" need.
export const CHANNELS = ['phone', 'email', 'website', 'social', 'sms', 'walk-in', 'marketplace', 'other'] as const;
export type Channel = typeof CHANNELS[number];
export const CHANNEL_LABELS: Record<Channel, string> = {
  phone: 'Phone calls', email: 'Email', website: 'Website', social: 'Social media',
  sms: 'WhatsApp / SMS', 'walk-in': 'Walk-ins', marketplace: 'Online marketplaces', other: 'Other',
};
export const CHANNEL_CAPABILITIES: Record<Channel, string[]> = {
  phone: ['phone-answering', 'lead-capture'],
  email: ['customer-support'],
  website: ['website-chat', 'customer-support'],
  social: ['social-messaging'],
  sms: ['social-messaging'],
  'walk-in': [],
  marketplace: ['customer-support'],
  other: ['customer-support'],
};
// Words in the problem that already name a channel, so Q9 is not asked redundantly.
export const CHANNEL_HINTS: Record<Channel, string[]> = {
  phone: ['phone', 'call', 'caller', 'voicemail', 'ring'],
  email: ['email', 'inbox', 'mail'],
  website: ['website', 'site', 'chat', 'web'],
  social: ['instagram', 'facebook', 'messenger', 'dm', 'tiktok', 'social'],
  sms: ['whatsapp', 'sms', 'text'],
  'walk-in': ['walk in', 'counter', 'in person'],
  marketplace: ['amazon', 'etsy', 'ebay', 'marketplace', 'doordash', 'ubereat'],
  other: [],
};

// Profile priorities (onboarding Q7) → capabilities, used only when the problem text is silent.
export const PRIORITY_CAPABILITIES: Record<string, string[]> = {
  marketing: ['social-content', 'copywriting'],
  'new-customers': ['lead-capture', 'seo-content'],
  sales: ['crm-followup', 'prospecting'],
  'customer-service': ['customer-support', 'phone-answering'],
  scheduling: ['appointment-booking', 'calendar-planning'],
  inventory: ['inventory-forecasting'],
  logistics: ['route-dispatch'],
  finance: ['bookkeeping', 'invoice-payables'],
  hr: ['hiring-hr', 'staff-scheduling'],
  admin: ['workflow-automation', 'writing-assistance'],
  analytics: ['bookkeeping'],
};
