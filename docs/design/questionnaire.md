# bizzimpact.ai: Master Questionnaire (Intake of the Discovery Engine)

Draft 1 · November 8, 2026 · Owner: Salman · Status: **for agreement before build**

Combines:
- Salman's six-area framework of small-business struggles.
- The research-backed question bank in [Lochan/research/questionnaire-design.md](../../Lochan/research/questionnaire-design.md). Source IDs S01–S11 and R2-P01–P17 refer to Lochan's source registers.

Phone calls and bookings sit inside Area 4, Customer Service.

---

## 1. Purpose

The questionnaire is the **front of the Discovery Engine**. Its output, the **Business Brief**, is the single input for all three engines:

```
Questionnaire ──► BUSINESS BRIEF ──► Discovery Engine (what tools fit the need)
                                 ├─► Review Engine    (how to weigh them for this owner)
                                 └─► Integration Engine (what they must work with, and how to adopt)
```

So every question must earn its place: **each answer must change a decision in at least one engine** (rightmost columns below). If no engine uses an answer, the question is cut.

## 2. Design principles (and the evidence behind them)

| # | Principle | Why |
|---|---|---|
| 1 | **Recognise, don't articulate.** Owners pick from options in their own language; free text is optional. | Owners struggle to name AI needs: 54% of firms planning AI found it hard to find or adapt tools to their needs (S01). |
| 2 | **Progressive depth.** A short *Quick Check* gives results; an optional *Deep Dive* on the top problem sharpens them. | Owners need a fast first result. Research says to gather detail only where it changes a decision (R2 synthesis). |
| 3 | **Branch, never dump.** Owners only see follow-ups triggered by their answers. | Avoid the 51-question wall (Lochan's design §2). |
| 4 | **Start from what they already use.** Existing software and must-keep tools are asked early. | 29% prefer to leave working technology alone (S02). |
| 5 | **"Not sure" is always allowed** and recorded as *unknown*, never turned into a guess. | Honest unknowns drive follow-ups and warnings, not invented assumptions. |
| 6 | **Task over industry.** Industry sets examples and ordering; the ticked struggle drives matching. | Different tasks need different data, permissions and connections (R2 synthesis). |
| 7 | **Ask about data and autonomy explicitly.** | 52.5% of non-users worry about information given to AI (S03). |
| 8 | **No sensitive data.** No passwords, customer records, bank details or street address. | Privacy and trust. |
| 9 | **Owner language.** Avoid terms like "ticket triage", "RFP" or "SLA". Every option reads like something an owner would say. | UX criterion: a first-time user can complete it. |
| 10 | **Review before results.** The owner sees and edits their brief before discovery runs. | Corrects misreadings and builds trust (Lochan's design §8). |

**Interaction standards:**
- One topic per screen, with a progress bar and Back/Next.
- Answers are saved on every step.
- Fully keyboard-accessible and mobile-first.
- Each screen explains "Why we ask."

## 3. Flow and length

```
QUICK CHECK  (always, ~3–4 min, measured later, not promised)
  Section 1  Your business            6 questions
  Section 2  Your current setup       4 questions
  Section 3  Where it hurts           pick up to 3 of 6 areas
  Section 4  What exactly             checkboxes in each chosen area + "which matters most?"
  Section 6  Budget & guardrails      5 questions
  ──► Review brief ──► Results (Discovery)

DEEP DIVE  (optional, offered before results: "Answer 6–8 more for sharper results")
  Section 5  Your #1 problem          universal workflow questions + area-specific follow-ups
  ──► Review brief ──► Results
```

Typical owner sees **~20 questions in the Quick Check and ~30 with the Deep Dive**. Never all ~75 in the bank.

---

## 4. Section 1: Your business

Legend for the last three columns: **D** = Discovery, **R** = Review, **I** = Integration.

| ID | Question (owner-facing) | Answer type and options | Rule | D | R | I |
|---|---|---|---|---|---|---|
| B1 | What kind of business do you run? | Food & Beverage · Home Services · Retail & E-commerce · Professional Services · Health & Wellness · Beauty & Personal Care · Education & Training · Manufacturing & Wholesale · Other (type) | Required | ✓ order areas and examples | ✓ industry fit | |
| B2 | Which best describes it? | Subtypes per B1. Examples: Food: cafe/coffee, restaurant, bakery, food truck, catering, bar. Home: HVAC, plumbing, electrical, landscaping/lawn, cleaning, roofing, pest control, handyman. Retail: physical store, online store, both. Plus Other. | Required | ✓ | ✓ | |
| B3 | In one sentence, what does your business do? | Short text (≤150 chars), with an example | Optional | ✓ context for free-text interpretation | | |
| B4 | Who are your customers? | Individuals (B2C) · Other businesses (B2B) · Both · Government/organisations | Optional | ✓ shows B2B-only struggles | | |
| B5 | How many people work in the business, including you? | Just me · 2–10 · 11–50 · 51–249 · 250+ | Required | ✓ size fit | ✓ penalise enterprise/developer tools for small teams | ✓ seats |
| B6 | Where are you based? | Country + US state | Required | ✓ regional availability | | ✓ **local SBDC/SCORE help** |

## 5. Section 2: Your current setup

| ID | Question | Answer type and options | Rule | D | R | I |
|---|---|---|---|---|---|---|
| T1 | Which software or apps do you use today? | Searchable multi-select grouped by job. Suggestions follow B1. **Accounting:** QuickBooks, Xero, FreshBooks, Wave. **Payments/POS:** Square, Clover, Toast, Shopify POS, Stripe. **Jobs/field service:** Jobber, Housecall Pro, ServiceTitan, LMN. **Calendar/email:** Google Workspace, Microsoft 365/Outlook, Calendly. **Website:** Wix, Squarespace, WordPress, Shopify. **Marketing:** Mailchimp, Canva, Facebook/Instagram, Google Business Profile. **Team/payroll:** Gusto, Homebase, 7shifts. Plus *Paper/spreadsheets*, Other, **None**, **Not sure**. | Required; None and Not sure are exclusive | ✓ "already in your software" | ✓ stack-fit score | ✓ **core input** |
| T2 | Which of these do you rely on most and would not want to replace? | Pick from T1 (max 3) | Shown if T1 has 2+ tools | | ✓ | ✓ **must-keep = hard constraint** |
| T3 | How comfortable are you setting up a new app? | I avoid it, I need someone to help · I can follow clear steps · I'm comfortable, even with some technical setup | Required | ✓ downrank developer tools | ✓ **ease-of-setup weight** | ✓ depth of setup guide |
| T4 | Who would set up a new tool? | Me · Someone on my team · Outside help/IT person · Nobody yet | Required | | ✓ | ✓ adoption plan, SBA help offer |

## 6. Section 3: Where it hurts

**A1. Which parts of your business would you most like help with?** Cards, pick **up to 3**. "Not sure yet" shows all areas with examples.

| Area | Card title (owner language) | Card subtitle |
|---|---|---|
| 1 | **Marketing & getting customers** | Posts, ads, being found online, staying in touch |
| 2 | **Money & cash flow** | Bookkeeping, invoices, getting paid, knowing your cash |
| 3 | **Buying, stock & suppliers** | Ordering, waste, supplier prices |
| 4 | **Customer service, calls & bookings** | Missed calls, bookings, questions, messages |
| 5 | **Admin, team & paperwork** | Meetings, data entry, scheduling, contracts, hiring |
| 6 | **Growing & improving the business** | Competitors, customer feedback, new ideas, building digital products |

Industry-aware ordering (from B1):
- **Home services:** 4 → 1 → 2 → 5 → 3 → 6
- **Food & beverage:** 3 → 4 → 1 → 2 → 5 → 6
- **Retail:** 1 → 3 → 4 → 2 → 5 → 6
- **Professional services:** 1 → 5 → 2 → 4 → 6 → 3

All areas always remain selectable.

## 7. Section 4: What exactly

For each chosen area: **"Which of these sound like you?"** (tick any). Then across all ticks: **"Which ONE matters most right now?"** That becomes the *focus problem*.

Each struggle maps to capability IDs in `lib/discovery/taxonomy.ts`. ⚠ = no reviewed catalogue tool yet, so it is shown as an honest gap until the catalogue is extended.

### Area 1: Marketing & getting customers
| ID | Struggle (owner wording) | Capabilities | Show when |
|---|---|---|---|
| M1 | I don't know what to post, or never find time to post | social-content, social-scheduling | |
| M2 | Writing website text, menus, product descriptions or blogs takes too long | copywriting | |
| M3 | I need better photos, flyers or graphics | image-creation | |
| M4 | I'd like short videos or reels but can't make them | video-creation | |
| M5 | People can't find us on Google | seo-content | |
| M6 | I spend on ads but they don't bring customers | ad-creative | |
| M7 | I don't stay in touch with past customers (emails, offers, texts) | email-marketing | |
| M8 | Leads and quotes go cold because I forget to follow up | crm-followup | |
| M9 | I want to win new business clients | prospecting | B4 = B2B or both |
| M10 | I don't know how to handle online reviews | review-management ⚠ | |

### Area 2: Money & cash flow
| ID | Struggle | Capabilities | Show when |
|---|---|---|---|
| F1 | My bookkeeping is always behind; sorting transactions takes hours | bookkeeping | |
| F2 | Receipts and paperwork pile up | receipt-capture | |
| F3 | I can't tell if I'll have enough cash next month | cash-flow-forecasting ⚠ (new) | |
| F4 | Customers pay late and I chase invoices | collections-reminders ⚠ (new) | |
| F5 | Writing quotes and estimates is slow | estimates-quotes ⚠ | |
| F6 | Paying supplier bills is messy | invoice-payables | |
| F7 | I'm not sure where the money goes (spending, subscriptions) | spend-management | |

### Area 3: Buying, stock & suppliers
| ID | Struggle | Capabilities | Show when |
|---|---|---|---|
| S1 | I over-order and throw stock or food away | inventory-forecasting ⚠ | |
| S2 | I run out of things that sell well | inventory-forecasting ⚠ | |
| S3 | Comparing supplier prices takes too long | supplier-comparison ⚠ (new) | |
| S4 | Costs creep up and I don't notice until too late | spend-management | |
| S5 | Supplier invoices and purchase paperwork take time | invoice-payables | |

### Area 4: Customer service, calls & bookings
| ID | Struggle | Capabilities | Show when |
|---|---|---|---|
| C1 | I miss phone calls when I'm busy or after hours | phone-answering, lead-capture | |
| C2 | Customers want to book without calling me | appointment-booking | |
| C3 | Customers ask the same questions again and again | customer-support (+ channel follow-up X1) | |
| C4 | Visitors leave my website without getting answers | website-chat | |
| C5 | Customer emails pile up and my replies are slow | customer-support | |
| C6 | Instagram, Facebook, WhatsApp or text messages go unanswered | social-messaging | |
| C7 | Unhappy customers slip through the cracks | customer-support | |

### Area 5: Admin, team & paperwork
| ID | Struggle | Capabilities | Show when |
|---|---|---|---|
| A1 | I take notes in meetings and forget the action items | meeting-notes | |
| A2 | I type the same information into several apps | workflow-automation | |
| A3 | I lose track of jobs, tasks and who is doing what | project-management | |
| A4 | My day and calendar are chaos | calendar-planning | |
| A5 | Writing emails and documents takes too long | writing-assistance | |
| A6 | I can't find files or information when I need them | knowledge-search | |
| A7 | I'm not sure what I'm signing in contracts, or I miss renewal dates | contract-review ⚠ (new) | |
| A8 | Building staff schedules and covering shifts is a headache | staff-scheduling ⚠ | B5 ≠ Just me |
| A9 | Hiring takes too long (job posts, screening) | hiring-hr ⚠ | B5 ≠ Just me |
| A10 | Planning routes and sending crews out wastes time | route-dispatch ⚠ | B1 = Home Services |

### Area 6: Growing & improving the business
| ID | Struggle | Capabilities | Show when |
|---|---|---|---|
| G1 | I don't really know what competitors do better or worse | market-research ⚠ (new) | |
| G2 | I want to understand what customers say about us | market-research ⚠, review-management ⚠ | |
| G3 | I want to test a new product or service idea | market-research ⚠ | |
| G4 | I want to build or improve an app, website feature or software | code-generation ⚠ (new) | B1 = Professional/Retail-online, or T3 = comfortable |

**Count:** 43 struggles. 27 map to catalogue tools today and 16 are honest gaps; the gaps are a catalogue-research task, not a design change. Six new capability IDs are needed: cash-flow-forecasting, collections-reminders, supplier-comparison, contract-review, market-research, code-generation.

## 8. Section 5: Deep dive on the #1 problem (optional)

### 8a. Universal workflow questions, asked about the focus problem
| ID | Question | Answer type | D | R | I |
|---|---|---|---|---|---|
| W1 | How do you handle this today? | Nobody really handles it · I do it myself · Someone on my team · An outside service · Existing software · Paper/spreadsheet | ✓ existing-tool path | | ✓ |
| W2 | How often does it happen? | Number + per day/week/month, or Not sure. "Busier in some seasons?" toggle. | ✓ usage-priced plans | ✓ cost at volume | |
| W3 | Roughly how much time does it take you each week? | <1 h · 1–3 h · 3–5 h · 5–10 h · 10+ h · Not sure | | ✓ value estimate (assumptions shown) | |
| W4 | What does it cost the business most? | My time · Lost customers or sales · Mistakes/rework · Waste/extra costs · Staff stress · Slow responses | | ✓ outcome to measure | |
| W5 | What would "fixed" look like? | Options per area + optional target (e.g. "answer every call", "save 3 h/week") | | ✓ success metric | ✓ adoption check-in |

### 8b. Area-specific follow-ups, shown only if triggered
| ID | Trigger | Question | Options | Used by |
|---|---|---|---|---|
| X1 | C3, C5, C7, or problem text without a channel | How do customers usually reach you? | Phone · Email · Website · Instagram/Facebook · WhatsApp/SMS · Walk-ins · Marketplaces (Amazon, Etsy, DoorDash) · Other | D (channel → capability) |
| X2 | C1, C2 | When a customer calls or writes, what should happen? | Answer common questions · Take a message/details · Request a booking for me to confirm · Book it directly · Not sure | D (capture ≠ booking), R (autonomy) |
| X3 | C1, C2 | When do you need cover? | During work hours · After hours · Busy periods · All the time | D, R |
| X4 | C2 | Where do bookings live today? | From T1 calendars/booking tools · Paper · Not sure | **I** (must connect) |
| X5 | C1–C7 | What must always go to a real person? | Complaints · Emergencies · Custom prices · Cancellations · Other | R (handoff required), I (setup rules) |
| X6 | Area 4 | Which languages do customers use? | English · Spanish · Other | D, R |
| X7 | Area 1 | What do you want marketing to achieve first? | New customers · Repeat customers · Promote an offer · Save my time | D (sub-capability), R (metric) |
| X8 | M1, M3, M4, M6 | Where do you post or advertise? | Facebook · Instagram · TikTok · Google · Email · Print · Website | D, I |
| X9 | M1, M7 | After content is drafted… | I'll copy/post it myself · Schedule it after I approve · Post automatically | R (autonomy), I |
| X10 | Area 2 | Which accounting software do you use? (pre-filled from T1) | QuickBooks · Xero · FreshBooks · Wave · Spreadsheet · Accountant handles it | **I** (must connect), D |
| X11 | Area 2 | Who approves money decisions? | Me · Bookkeeper/accountant · Manager | R (human-in-loop), I |
| X12 | Area 3 | What records do you keep? | Sales by item (POS) · Purchase invoices · Stock counts · Waste log · None | D (**data readiness**: forecasting needs history), I |
| X13 | Area 3 | Should a tool suggest orders, or place them? | Suggest only · Place within limits | R (autonomy) |
| X14 | A1 | Where do meetings happen? | Zoom · Google Meet · Microsoft Teams · Phone · In person | **I** |
| X15 | A2 | Which apps do you copy information between? | Pick from T1 (2+) | **I** (connection path), D |
| X16 | Area 6, G4 | Do you have someone technical? | Yes, in-house · Freelancer/agency · No | D, R |

## 9. Section 6: Budget & guardrails (always asked, short)
| ID | Question | Options | Rule | D | R | I |
|---|---|---|---|---|---|---|
| R1 | What could you spend per month on new AI tools, **in total**? | Free only · Under $50 · $50–149 · $150–499 · $500+ · Not sure | Required | ✓ hard filter | ✓ cost score | ✓ bundle total |
| R2 | Would you pay yearly upfront for a discount? | Yes · No · Depends | Optional | ✓ annual-only plans | ✓ | |
| R3 | What information would the tool handle? | Public business info only · Customer names/contacts · Payments/card data · Health information · Employee information · Financial records · Not sure | Multi; required | ✓ | ✓ **compliance flags** (PCI, HIPAA, TCPA for calls/texts) | ✓ setup cautions |
| R4 | What may the tool do on its own? | Only draft — I approve everything · Organise and remind · Send approved messages · Take actions (book, order) within my rules | Required | ✓ | ✓ **autonomy fit** | ✓ setup rules |
| R5 | How soon do you want something working? | This week · This month · Just exploring | Optional | | ✓ prefers quick-setup tools | ✓ plan timeline |
| R6 | Would you like free help from a local small-business advisor (SBA SBDC/SCORE)? | Yes · Maybe later · No | Optional | | | ✓ adds advisor to plan (state from B6) |

## 10. Optional free text (last screen)
**"Anything else we should know?"** Up to 2,000 characters.
- Interpreted by the existing text interpreter.
- May only **add** needs, labelled *inferred*. It never overrides ticked answers.
- It can trigger X1 if the text mentions enquiries without naming a channel.

## 11. Review screen: "Here's what we understood"
Four editable blocks, shown before results:
1. **Your business:** B1–B6, T1.
2. **What to fix:** areas, ticked struggles, ★ focus problem, and Deep Dive facts.
3. **Your must-haves:** must-keep tools (T2), budget, data handled, autonomy.
4. **Still unknown:** every "Not sure", and what it affects ("Budget unknown, so we can't confirm affordability").

## 12. Output: the Business Brief (contract to all three engines)

```jsonc
{
  "briefVersion": "1.0", "questionnaireVersion": "2026-11-08.1", "createdAt": "…",
  "business":   { "industry": "home", "subtype": "landscaping", "description": "…", "customers": "B2C",
                  "teamSize": "2-10", "country": "US", "state": "MD" },
  "stack":      { "tools": ["QuickBooks", "Google Calendar", "Jobber"], "mustKeep": ["Jobber"],
                  "status": "listed" /* | none | not-sure */ },
  "readiness":  { "techComfort": "follow-steps", "setupBy": "me" },
  "needs": [    // the Discovery query
    { "struggleId": "C1", "capabilities": ["phone-answering", "lead-capture"], "priority": "focus", "source": "ticked" },
    { "struggleId": "C2", "capabilities": ["appointment-booking"], "priority": "secondary", "source": "ticked" },
    { "struggleId": null, "capabilities": ["crm-followup"], "priority": "inferred", "source": "free-text", "evidence": "forget to follow up" }
  ],
  "focusDetail": { "today": "nobody", "frequency": { "value": 40, "per": "week", "seasonal": true },
                   "hoursPerWeek": "3-5", "mainCost": "lost-customers", "success": "answer every call",
                   "followups": { "X2": "request-booking", "X3": ["work-hours", "busy-periods"], "X4": "Google Calendar",
                                  "X5": ["emergencies", "custom-prices"], "X6": ["English", "Spanish"] } },
  "constraints": { "budgetMonthly": "50-149", "annualOk": "depends",
                   "dataHandled": ["customer-contacts"], "autonomy": "send-approved",
                   "timeline": "this-month", "wantsAdvisor": true },
  "unknowns":   [ { "field": "focusDetail.frequency", "effect": "Usage-based prices cannot be totalled." } ],
  "answersRaw": { /* every original answer, for audit and editing */ }
}
```

### How each engine reads the brief
| Engine | Reads | Decides |
|---|---|---|
| **Discovery** | needs, business, stack, budgetMonthly, X-follow-ups | Which tools address the needs; hard filters; honest gaps |
| **Review** | constraints (budget, data, autonomy, annual), readiness, focusDetail (volume, success metric), teamSize | How to weigh fit for *this* owner: cost at their volume, ease vs comfort, compliance flags, autonomy match |
| **Integration** | stack, mustKeep, X4/X10/X14/X15, setupBy, state, wantsAdvisor, timeline | Compatibility with existing tools, multi-tool bundle, adoption steps, local SBA help |

## 13. Scalability

- **Questions are data, not code.** The whole bank (areas, struggles, follow-ups, triggers, mappings) lives in one versioned JSON file. Adding an industry, struggle or language is a data change.
- **The brief is versioned.** Old briefs remain readable, and each discovery run snapshots the brief it used.
- **Every question carries `usedBy: [D|R|I]` metadata.** A test fails if a question is used by no engine, which enforces "every question earns its place".
- **Later:**
  - Industry packs (e.g. dental, auto repair) as data files.
  - Translations.
  - AI-assisted intake that produces the same brief from a conversation.

## 14. Open items for team review
- Validate wording with 3–5 real owners: time to complete, confusing options.
- Confirm the budget and headcount bands. Lochan flagged the overlaps; corrected bands are used here.
- Extend the catalogue for the ⚠ capabilities, or keep them as honest gaps for the demo.
