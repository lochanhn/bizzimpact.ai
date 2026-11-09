// Master questionnaire bank (Salman/master-questionnaire.md). Data, not code: adding an area,
// struggle or follow-up is an edit here. Every struggle maps to controlled capability IDs, and
// every question declares which engines use it (enforced by tests).
export const QUESTIONNAIRE_VERSION = '2026-11-08.1';
export type Engine = 'D' | 'R' | 'I';

export const INDUSTRIES = {
  food: { label: 'Food & Beverage', subtypes: ['Cafe / coffee shop', 'Restaurant', 'Bakery', 'Food truck', 'Catering', 'Bar'] },
  home: { label: 'Home Services', subtypes: ['HVAC', 'Plumbing', 'Electrical', 'Landscaping / lawn care', 'Cleaning', 'Roofing', 'Pest control', 'Handyman'] },
  retail: { label: 'Retail & E-commerce', subtypes: ['Physical store', 'Online store', 'Both online and in-store'] },
  professional: { label: 'Professional Services', subtypes: ['Accounting / bookkeeping', 'Legal', 'Consulting', 'Marketing agency', 'Real estate', 'Insurance'] },
  health: { label: 'Health & Wellness', subtypes: ['Clinic / practice', 'Dental', 'Therapy', 'Gym / fitness', 'Physiotherapy'] },
  beauty: { label: 'Beauty & Personal Care', subtypes: ['Salon', 'Barber', 'Spa', 'Nail studio'] },
  education: { label: 'Education & Training', subtypes: ['Tutoring', 'Training provider', 'Childcare'] },
  manufacturing: { label: 'Manufacturing & Wholesale', subtypes: ['Small manufacturer', 'Wholesale / distribution'] },
  other: { label: 'Other', subtypes: [] as string[] },
} as const;
export type IndustryId = keyof typeof INDUSTRIES;

export const CUSTOMERS = { b2c: 'Individuals (B2C)', b2b: 'Other businesses (B2B)', both: 'Both', gov: 'Government / organisations' } as const;
export const TEAM_SIZES = { solo: 'Just me', '2-10': '2–10', '11-50': '11–50', '51-249': '51–249', '250+': '250+' } as const;
export const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] as const;

export const SOFTWARE_GROUPS: { group: string; apps: string[] }[] = [
  { group: 'Accounting', apps: ['QuickBooks', 'Xero', 'FreshBooks', 'Wave'] },
  { group: 'Payments & POS', apps: ['Square', 'Clover', 'Toast', 'Shopify POS', 'Stripe'] },
  { group: 'Jobs & field service', apps: ['Jobber', 'Housecall Pro', 'ServiceTitan', 'LMN'] },
  { group: 'Calendar & email', apps: ['Google Workspace', 'Google Calendar', 'Microsoft 365 / Outlook', 'Calendly'] },
  { group: 'Website & online store', apps: ['Wix', 'Squarespace', 'WordPress', 'Shopify'] },
  { group: 'Marketing', apps: ['Mailchimp', 'Canva', 'Facebook / Instagram', 'Google Business Profile', 'HubSpot'] },
  { group: 'Team & payroll', apps: ['Gusto', 'Homebase', '7shifts'] },
  { group: 'Other', apps: ['Paper / spreadsheets', 'Zapier'] },
];
export const INDUSTRY_SOFTWARE: Partial<Record<IndustryId, string[]>> = {
  food: ['Square', 'Toast', 'Clover', '7shifts', 'QuickBooks', 'Canva', 'Facebook / Instagram'],
  home: ['Jobber', 'Housecall Pro', 'ServiceTitan', 'QuickBooks', 'Google Calendar', 'LMN'],
  retail: ['Shopify', 'Square', 'Mailchimp', 'QuickBooks', 'Canva', 'Facebook / Instagram'],
  professional: ['Microsoft 365 / Outlook', 'Google Workspace', 'QuickBooks', 'HubSpot', 'Calendly'],
  health: ['Google Calendar', 'Square', 'QuickBooks', 'Calendly'],
  beauty: ['Square', 'Google Calendar', 'Facebook / Instagram', 'Canva'],
};

export const TECH_COMFORT = { avoid: 'I avoid it — I need someone to help', steps: 'I can follow clear steps', comfortable: 'I’m comfortable, even with some technical setup' } as const;
export const SETUP_BY = { me: 'Me', team: 'Someone on my team', outside: 'Outside help / IT person', nobody: 'Nobody yet' } as const;

export type AreaId = 'marketing' | 'money' | 'stock' | 'service' | 'admin' | 'growth';
export const AREAS: { id: AreaId; title: string; subtitle: string }[] = [
  { id: 'marketing', title: 'Marketing & getting customers', subtitle: 'Posts, ads, being found online, staying in touch' },
  { id: 'money', title: 'Money & cash flow', subtitle: 'Bookkeeping, invoices, getting paid, knowing your cash' },
  { id: 'stock', title: 'Buying, stock & suppliers', subtitle: 'Ordering, waste, supplier prices' },
  { id: 'service', title: 'Customer service, calls & bookings', subtitle: 'Missed calls, bookings, questions, messages' },
  { id: 'admin', title: 'Admin, team & paperwork', subtitle: 'Meetings, data entry, scheduling, contracts, hiring' },
  { id: 'growth', title: 'Growing & improving the business', subtitle: 'Competitors, customer feedback, new ideas, building digital products' },
];
export const AREA_ORDER: Partial<Record<IndustryId, AreaId[]>> = {
  home: ['service', 'marketing', 'money', 'admin', 'stock', 'growth'],
  food: ['stock', 'service', 'marketing', 'money', 'admin', 'growth'],
  retail: ['marketing', 'stock', 'service', 'money', 'admin', 'growth'],
  professional: ['marketing', 'admin', 'money', 'service', 'growth', 'stock'],
  health: ['service', 'marketing', 'admin', 'money', 'growth', 'stock'],
  beauty: ['service', 'marketing', 'money', 'admin', 'stock', 'growth'],
};

export type ShowWhen = { b2b?: true; notSolo?: true; industries?: IndustryId[]; techOrIndustries?: IndustryId[] };
export type Struggle = { id: string; area: AreaId; label: string; capabilities: string[]; show?: ShowWhen };
export const STRUGGLES: Struggle[] = [
  { id: 'M1', area: 'marketing', label: 'I don’t know what to post, or never find time to post', capabilities: ['social-content', 'social-scheduling'] },
  { id: 'M2', area: 'marketing', label: 'Writing website text, menus, product descriptions or blogs takes too long', capabilities: ['copywriting'] },
  { id: 'M3', area: 'marketing', label: 'I need better photos, flyers or graphics', capabilities: ['image-creation'] },
  { id: 'M4', area: 'marketing', label: 'I’d like short videos or reels but can’t make them', capabilities: ['video-creation'] },
  { id: 'M5', area: 'marketing', label: 'People can’t find us on Google', capabilities: ['seo-content'] },
  { id: 'M6', area: 'marketing', label: 'I spend on ads but they don’t bring customers', capabilities: ['ad-creative'] },
  { id: 'M7', area: 'marketing', label: 'I don’t stay in touch with past customers (emails, offers, texts)', capabilities: ['email-marketing'] },
  { id: 'M8', area: 'marketing', label: 'Leads and quotes go cold because I forget to follow up', capabilities: ['crm-followup'] },
  { id: 'M9', area: 'marketing', label: 'I want to win new business clients', capabilities: ['prospecting'], show: { b2b: true } },
  { id: 'M10', area: 'marketing', label: 'I don’t know how to handle online reviews', capabilities: ['review-management'] },
  { id: 'F1', area: 'money', label: 'My bookkeeping is always behind; sorting transactions takes hours', capabilities: ['bookkeeping'] },
  { id: 'F2', area: 'money', label: 'Receipts and paperwork pile up', capabilities: ['receipt-capture'] },
  { id: 'F3', area: 'money', label: 'I can’t tell if I’ll have enough cash next month', capabilities: ['cash-flow-forecasting'] },
  { id: 'F4', area: 'money', label: 'Customers pay late and I chase invoices', capabilities: ['collections-reminders'] },
  { id: 'F5', area: 'money', label: 'Writing quotes and estimates is slow', capabilities: ['estimates-quotes'] },
  { id: 'F6', area: 'money', label: 'Paying supplier bills is messy', capabilities: ['invoice-payables'] },
  { id: 'F7', area: 'money', label: 'I’m not sure where the money goes (spending, subscriptions)', capabilities: ['spend-management'] },
  { id: 'S1', area: 'stock', label: 'I over-order and throw stock or food away', capabilities: ['inventory-forecasting'] },
  { id: 'S2', area: 'stock', label: 'I run out of things that sell well', capabilities: ['inventory-forecasting'] },
  { id: 'S3', area: 'stock', label: 'Comparing supplier prices takes too long', capabilities: ['supplier-comparison'] },
  { id: 'S4', area: 'stock', label: 'Costs creep up and I don’t notice until too late', capabilities: ['spend-management'] },
  { id: 'S5', area: 'stock', label: 'Supplier invoices and purchase paperwork take time', capabilities: ['invoice-payables'] },
  { id: 'C1', area: 'service', label: 'I miss phone calls when I’m busy or after hours', capabilities: ['phone-answering', 'lead-capture'] },
  { id: 'C2', area: 'service', label: 'Customers want to book without calling me', capabilities: ['appointment-booking'] },
  { id: 'C3', area: 'service', label: 'Customers ask the same questions again and again', capabilities: ['customer-support'] },
  { id: 'C4', area: 'service', label: 'Visitors leave my website without getting answers', capabilities: ['website-chat'] },
  { id: 'C5', area: 'service', label: 'Customer emails pile up and my replies are slow', capabilities: ['customer-support'] },
  { id: 'C6', area: 'service', label: 'Instagram, Facebook, WhatsApp or text messages go unanswered', capabilities: ['social-messaging'] },
  { id: 'C7', area: 'service', label: 'Unhappy customers slip through the cracks', capabilities: ['customer-support'] },
  { id: 'A1', area: 'admin', label: 'I take notes in meetings and forget the action items', capabilities: ['meeting-notes'] },
  { id: 'A2', area: 'admin', label: 'I type the same information into several apps', capabilities: ['workflow-automation'] },
  { id: 'A3', area: 'admin', label: 'I lose track of jobs, tasks and who is doing what', capabilities: ['project-management'] },
  { id: 'A4', area: 'admin', label: 'My day and calendar are chaos', capabilities: ['calendar-planning'] },
  { id: 'A5', area: 'admin', label: 'Writing emails and documents takes too long', capabilities: ['writing-assistance'] },
  { id: 'A6', area: 'admin', label: 'I can’t find files or information when I need them', capabilities: ['knowledge-search'] },
  { id: 'A7', area: 'admin', label: 'I’m not sure what I’m signing in contracts, or I miss renewal dates', capabilities: ['contract-review'] },
  { id: 'A8', area: 'admin', label: 'Building staff schedules and covering shifts is a headache', capabilities: ['staff-scheduling'], show: { notSolo: true } },
  { id: 'A9', area: 'admin', label: 'Hiring takes too long (job posts, screening)', capabilities: ['hiring-hr'], show: { notSolo: true } },
  { id: 'A10', area: 'admin', label: 'Planning routes and sending crews out wastes time', capabilities: ['route-dispatch'], show: { industries: ['home'] } },
  { id: 'G1', area: 'growth', label: 'I don’t really know what competitors do better or worse', capabilities: ['market-research'] },
  { id: 'G2', area: 'growth', label: 'I want to understand what customers say about us', capabilities: ['market-research', 'review-management'] },
  { id: 'G3', area: 'growth', label: 'I want to test a new product or service idea', capabilities: ['market-research'] },
  { id: 'G4', area: 'growth', label: 'I want to build or improve an app, website feature or software', capabilities: ['code-generation'], show: { techOrIndustries: ['professional', 'retail'] } },
];

// Conditional follow-ups. `trigger` lists struggle IDs (any ticked) or area IDs prefixed with "area:".
export type Followup = { id: string; trigger: string[]; question: string; multi: boolean; options: Record<string, string>; usedBy: Engine[]; why: string };
export const FOLLOWUPS: Followup[] = [
  { id: 'X1', trigger: ['C3', 'C5', 'C7'], question: 'How do customers usually reach you?', multi: true, usedBy: ['D'], why: 'Phone, website, email and social messages need different tools.',
    options: { phone: 'Phone calls', email: 'Email', website: 'Website', social: 'Instagram / Facebook', sms: 'WhatsApp / SMS', 'walk-in': 'Walk-ins', marketplace: 'Marketplaces (Amazon, Etsy, DoorDash)', other: 'Other' } },
  { id: 'X2', trigger: ['C1', 'C2'], question: 'When a customer calls or writes, what should happen?', multi: false, usedBy: ['D', 'R'], why: 'Taking a message and booking a time are different features.',
    options: { faq: 'Answer common questions', capture: 'Take a message and their details', request: 'Request a booking for me to confirm', book: 'Book the appointment directly', unsure: 'Not sure' } },
  { id: 'X3', trigger: ['C1', 'C2'], question: 'When do you need cover?', multi: true, usedBy: ['D', 'R'], why: 'Some services only cover business hours.',
    options: { hours: 'During work hours', after: 'After hours', busy: 'Busy periods', always: 'All the time' } },
  { id: 'X4', trigger: ['C2'], question: 'Where do your bookings live today?', multi: false, usedBy: ['I'], why: 'A booking tool must write into the calendar you already use.',
    options: { google: 'Google Calendar', outlook: 'Outlook / Microsoft 365', calendly: 'Calendly', jobber: 'Jobber', housecall: 'Housecall Pro', square: 'Square Appointments', paper: 'Paper / diary', unsure: 'Not sure' } },
  { id: 'X5', trigger: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'], question: 'What must always go to a real person?', multi: true, usedBy: ['R', 'I'], why: 'These become hand-off rules the tool must support.',
    options: { complaints: 'Complaints', emergencies: 'Emergencies', prices: 'Custom prices', cancellations: 'Cancellations', nothing: 'Nothing specific' } },
  { id: 'X6', trigger: ['area:service'], question: 'Which languages do your customers use?', multi: true, usedBy: ['D', 'R'], why: 'Not every assistant handles every language.',
    options: { en: 'English', es: 'Spanish', other: 'Other' } },
  { id: 'X7', trigger: ['area:marketing'], question: 'What should marketing achieve first?', multi: false, usedBy: ['D', 'R'], why: 'We measure success against this.',
    options: { new: 'Bring in new customers', repeat: 'Bring customers back', offer: 'Promote an offer', time: 'Save me time' } },
  { id: 'X8', trigger: ['M1', 'M3', 'M4', 'M6'], question: 'Where do you post or advertise?', multi: true, usedBy: ['D', 'I'], why: 'Tools differ in which channels they can publish to.',
    options: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', google: 'Google', email: 'Email', print: 'Print', website: 'Website' } },
  { id: 'X9', trigger: ['M1', 'M7'], question: 'After content is drafted…', multi: false, usedBy: ['R', 'I'], why: 'Scheduling and auto-posting need extra features and permissions.',
    options: { manual: 'I’ll copy and post it myself', schedule: 'Schedule it after I approve', auto: 'Post automatically' } },
  { id: 'X10', trigger: ['area:money'], question: 'Which accounting software do you use?', multi: false, usedBy: ['D', 'I'], why: 'Finance tools must work with your books.',
    options: { quickbooks: 'QuickBooks', xero: 'Xero', freshbooks: 'FreshBooks', wave: 'Wave', spreadsheet: 'Spreadsheet', accountant: 'My accountant handles it' } },
  { id: 'X11', trigger: ['area:money'], question: 'Who approves money decisions?', multi: false, usedBy: ['R', 'I'], why: 'We keep a person in control of payments.',
    options: { me: 'Me', bookkeeper: 'Bookkeeper / accountant', manager: 'A manager' } },
  { id: 'X12', trigger: ['area:stock'], question: 'What records do you keep?', multi: true, usedBy: ['D', 'I'], why: 'Forecasting needs sales and stock history.',
    options: { sales: 'Sales by item (POS)', invoices: 'Purchase invoices', counts: 'Stock counts', waste: 'Waste log', none: 'None yet' } },
  { id: 'X13', trigger: ['area:stock'], question: 'Should a tool suggest orders, or place them?', multi: false, usedBy: ['R'], why: 'Placing orders on its own needs more trust.',
    options: { suggest: 'Suggest only', place: 'Place orders within my limits' } },
  { id: 'X14', trigger: ['A1'], question: 'Where do your meetings happen?', multi: true, usedBy: ['I'], why: 'Note-takers connect to specific meeting apps.',
    options: { zoom: 'Zoom', meet: 'Google Meet', teams: 'Microsoft Teams', phone: 'Phone', inperson: 'In person' } },
  { id: 'X16', trigger: ['G4'], question: 'Do you have someone technical?', multi: false, usedBy: ['D', 'R'], why: 'Building software tools assume some technical skill.',
    options: { inhouse: 'Yes, in-house', freelancer: 'A freelancer or agency', no: 'No' } },
];

// Deep-dive questions about the focus problem (all optional).
export const DEEP_DIVE = {
  W1: { question: 'How do you handle this today?', usedBy: ['D', 'I'] as Engine[], options: { nobody: 'Nobody really handles it', me: 'I do it myself', team: 'Someone on my team', outside: 'An outside service', software: 'Existing software', paper: 'Paper / spreadsheet' } },
  W2: { question: 'How often does it happen?', usedBy: ['R'] as Engine[] },
  W3: { question: 'Roughly how much time does it take each week?', usedBy: ['R'] as Engine[], options: { '<1': 'Under 1 hour', '1-3': '1–3 hours', '3-5': '3–5 hours', '5-10': '5–10 hours', '10+': '10+ hours', unsure: 'Not sure' } },
  W4: { question: 'What does it cost the business most?', usedBy: ['R'] as Engine[], options: { time: 'My time', customers: 'Lost customers or sales', mistakes: 'Mistakes / rework', waste: 'Waste / extra costs', stress: 'Staff stress', slow: 'Slow responses' } },
  W5: { question: 'What would “fixed” look like?', usedBy: ['R', 'I'] as Engine[] },
};

export const BUDGETS = { free: 'Free tools only', 'under-50': 'Under $50', '50-149': '$50–$149', '150-499': '$150–$499', '500+': '$500 or more', unknown: 'Not sure yet' } as const;
export const BUDGET_CAP: Record<keyof typeof BUDGETS, number | null> = { free: 0, 'under-50': 49.99, '50-149': 149.99, '150-499': 499.99, '500+': null, unknown: null };
export const ANNUAL = { yes: 'Yes', no: 'No', depends: 'Depends on the saving' } as const;
export const DATA_HANDLED = { public: 'Public business info only', contacts: 'Customer names / contact details', payments: 'Payments or card data', health: 'Health information', employees: 'Employee information', financial: 'Financial records', unsure: 'Not sure' } as const;
export const AUTONOMY = { draft: 'Only draft — I approve everything', organise: 'Organise and remind', send: 'Send messages I’ve approved', act: 'Take actions (book, order) within my rules' } as const;
export const TIMELINE = { week: 'This week', month: 'This month', exploring: 'Just exploring' } as const;
export const ADVISOR = { yes: 'Yes please', later: 'Maybe later', no: 'No thanks' } as const;

// Which engines use each profile/guardrail question (tests enforce every question is used).
export const QUESTION_USAGE: Record<string, Engine[]> = {
  B1: ['D', 'R'], B2: ['D', 'R'], B3: ['D'], B4: ['D'], B5: ['D', 'R', 'I'], B6: ['D', 'I'],
  T1: ['D', 'R', 'I'], T2: ['R', 'I'], T3: ['D', 'R', 'I'], T4: ['R', 'I'],
  A: ['D'], S: ['D'], FOCUS: ['D', 'R', 'I'],
  R1: ['D', 'R', 'I'], R2: ['D', 'R'], R3: ['D', 'R', 'I'], R4: ['D', 'R', 'I'], R5: ['R', 'I'], R6: ['I'], TEXT: ['D'],
};

export function visibleStruggles(area: AreaId, ctx: { industry?: IndustryId; customers?: string; teamSize?: string; techComfort?: string }): Struggle[] {
  return STRUGGLES.filter(s => s.area === area && (!s.show || (
    (!s.show.b2b || ctx.customers === 'b2b' || ctx.customers === 'both') &&
    (!s.show.notSolo || ctx.teamSize !== 'solo') &&
    (!s.show.industries || (ctx.industry !== undefined && s.show.industries.includes(ctx.industry))) &&
    (!s.show.techOrIndustries || ctx.techComfort === 'comfortable' || (ctx.industry !== undefined && s.show.techOrIndustries.includes(ctx.industry)))
  )));
}
export function triggeredFollowups(struggleIds: string[], areas: AreaId[]): Followup[] {
  return FOLLOWUPS.filter(f => f.trigger.some(t => t.startsWith('area:') ? areas.includes(t.slice(5) as AreaId) : struggleIds.includes(t)));
}
