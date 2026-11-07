# bizzimpact.ai — version 1 build specification

Decision draft · November 7, 2026 · Team 33

**What we are building:** a website that helps a small-business owner describe one problem, compare suitable AI tools, and leave with a practical setup plan. The first release covers missed customer enquiries and marketing content. It recommends tools; it does not connect vendor accounts or run the owner's business.

This is our proposed two-day implementation scope, not an already built product. The friend's Phase 1 document is a reference, not the source of binding requirements. Research supports the topics below; question wording, scoring weights, and usability remain our design choices and need testing.

## 1. The problem and the first users

Owners struggle with choosing tools, checking whether they fit existing software, understanding costs, and finding time to set them up. A directory alone leaves those jobs to the owner. Our useful output is an explained recommendation with visible evidence, relevant restrictions, and a next step.

| First user | Problem we will demonstrate | Concrete result |
|---|---|---|
| Small HVAC or landscaping company | Calls or website enquiries arrive while staff are busy | Compare voice or web enquiry tools, identify a suitable plan, explain forwarding or website setup, and define a test before using it with customers |
| Independent cafe or restaurant | Marketing posts take too much time | Compare content and scheduling tools, explain the relevant free/paid limits, and give a first-post workflow |

Business type sets context, but the task drives matching. Do not recommend a telephone receptionist to someone who only needs website chat. Other businesses can use these same supported tasks; other tasks receive an honest unsupported message rather than fabricated recommendations.

**Initial market assumption:** US businesses, USD pricing, one owner/user. State this on the results page. Do not claim coverage of medical, legal, payroll, emergency dispatch, or regulated decisions.

### Research behind this scope

Use the existing source identifiers, not new claims of primary fieldwork:

- **S01–S03:** tool selection, implementation time, fit, skills, and accuracy are recurring adoption barriers. Survey populations differ; do not combine their percentages.
- **S05–S08:** owner accounts illustrate operational pressure, scattered enquiries, and paperwork. They are examples, not prevalence estimates.
- **R2-P01 and R2-P07:** reported content/marketing use and workshop evidence support explaining a concrete workflow rather than selling generic AI advice.
- **R2-P16 and R2-P17:** trades reports and vendor cases support examining existing software and enquiry workflows. Vendor evidence does not establish independent effectiveness.
- **S04, R2-P06 and R2-P15:** outcomes depend on task and context. We cannot promise a revenue increase from choosing a tool.

Source details and limitations remain in [the initial source register](research/sources.md), [additional sources](research/research-round-2-sources.md), and their companion research notes. No interviews with our intended users have been conducted.

## 2. The complete owner journey

1. Choose a business type and describe one problem.
2. Answer relevant questions about the current workflow, requirements, and budget.
3. Review a short summary; edit incorrect answers or inferences.
4. See up to three suitable recommendations. Show fewer when evidence or budget is insufficient.
5. Compare the relevant plans, reasons, restrictions, evidence, and unknowns.
6. Open one setup guide and download the recommendation and checklist as a text file.

No account or company address is needed. Support Back and editing without losing answers. Use labelled controls, keyboard access, visible focus, readable contrast, mobile layouts, and text alongside status colours. Unknown answers must remain possible.

## 3. Questionnaire: four core questions and up to four follow-ups

**Maximum: eight questions per assessment**, including conditional follow-ups. A review screen is not another questionnaire. Do not expose the old 51-question bank as a form. Ask one main question per screen, with related choices beneath it. Completion time must be measured, not guessed in marketing copy.

### Four core questions

| ID | Owner-facing wording | Input and purpose |
|---|---|---|
| C1 | What kind of business do you run? | Cafe/restaurant; HVAC; landscaping; another business with optional short description. Context only, not an eligibility gate. |
| C2 | What would you like help with first? | Missed calls; website enquiries; marketing content; something else. Optional sentence: “Tell us what happens today.” Free text is limited to 1,000 characters; ask owners not to include customer details. |
| C3 | What software do you already use for this? | Searchable shortlist plus Other, None, Not sure. Relevant examples: Housecall Pro, a calendar, a website builder, Canva, Buffer. Allow version/plan only if known. None and Not sure are exclusive choices. |
| C4 | What can you spend on this each month? | Free only; USD amount; Not sure. Explain that some displayed monthly prices require paying for a year. Annual-payment willingness is a small optional control here; default is **not confirmed**, never yes. |

### Enquiry follow-ups

| ID | Wording | Branching and effect |
|---|---|---|
| E1 | Where do these enquiries arrive? | Phone; website chat/form; both; Not sure. Skip when C2 explicitly fixes the channel. If both, ask which to solve first within this question; one assessment solves one channel. |
| E2 | What should the tool do? | Take a message and contact details; answer common questions; request an appointment; confirm a booking. Select required actions. A booking request is different from a confirmed booking. |
| E3 | Where should the details or bookings go? | Email/manual copy is fine; named calendar/software; Not sure. Prefill C3; ask only for missing requirements. Named automatic booking or CRM transfer becomes a hard requirement. |
| E4 | Roughly how much would you use it? | Optional monthly calls, phone minutes, or chat conversations; use whichever the owner actually knows, otherwise Not sure. Never convert calls into minutes or unique callers without an explicit assumption. |

### Marketing follow-ups

| ID | Wording | Branching and effect |
|---|---|---|
| M1 | What do you need to create? | Captions/text; promotional images; video; email. Identify the priority output when several are chosen. Email-only is outside the initial catalogue: say so. |
| M2 | Where will you use it? | Instagram; Facebook; another named channel; printed materials; Not sure. Channel support must be checked at the product and plan level. |
| M3 | How do you want to publish it? | Copy/download it myself; schedule it inside the tool; Not sure. Automatic scheduling is a hard requirement only when selected. |
| M4 | About how many pieces do you need each month? | Optional number by output type, or Not sure. Post count is not a valid substitute for a vendor's token or credit allowance. |

Skip already answered follow-ups; never fill the maximum just to reach eight. Unsupported priorities lead to a clear message and the option to choose a supported task. The review screen distinguishes owner answers from suggested interpretations and lists missing information.

**Canonical mapping:** E2 selected actions are all mandatory; unselected actions are not optional preferences. M1 records one mandatory priority output; additional selected outputs are optional preferences unless the owner makes them required on the same screen. E1 fixes the mandatory enquiry channel. M2 records one required destination; additional destinations are optional unless marked required there. M3 scheduling and E3 named automatic destinations are mandatory when selected. Optional preferences can earn half task/channel credit, but missing a mandatory item always prevents a suitable result. Store `required_actions`, `preferred_actions`, `required_channels`, `preferred_channels`, `required_integrations`, `manual_handoff_allowed`, and `annual_commitment_allowed` explicitly. Not sure is null, not false; an unselected capability is not requested.

Existing software is context by default. Only an explicitly required connection becomes an eligibility gate. Display matching existing-software capabilities prominently, but do not silently boost scores just for a familiar product name.

### After choosing a tool

Offer an optional setup checklist and outcome worksheet, not more required assessment questions. The owner can record setup time and compare one week of their own results later. We do not imply we measured those results automatically.

## 4. Initial catalogue: 11 tools, with plan-level restrictions

**Evidence status:** official pages inspected on November 7, 2026. These are documented capabilities, not independently tested products or endorsements. Pricing can change. Store each claim with a source and checked date. Trial offers are not free ongoing plans. All amounts below are USD before taxes and unverified extras.

| ID / tool | Documented use | Relevant cost and limitation | V1 matching treatment / sources |
|---|---|---|---|
| T01 Goodcall | AI telephone answering and customer enquiry handling | Starter $79/month includes 100 unique customers; additional unique customers $0.79 each. Unique customers are not calls or minutes. | Voice candidate. Specific calendar and destination compatibility needs verification. [Pricing](https://www.goodcall.com/pricing), [workflow](https://www.goodcall.com/how-it-works). |
| T02 Smith.ai AI Receptionist | Voice answering, qualification, summaries and appointment scheduling | Free plan lists 25 calls/month, then $3/call. Pro $150/month includes 75 calls; do not invent an overage rate. | Calendly scheduling is explicitly listed. Do not substitute the separate human receptionist service's prices. [AI plan details](https://smith.ai/pricing/ai-receptionist). |
| T03 My AI Front Desk | Voice receptionist, enquiry handling and appointment booking | Business-in-a-Box $99 month-to-month, or displayed $79/month billed annually. Includes 200 voice minutes, 100 chatbot conversations and 400 SMS; additional usage has separate credit rules. | Exact calendar, destination, and extra-usage cost must be checked before a confirmed fit. Zapier is a connector, not proof of every integration. [Pricing](https://www.myaifrontdesk.com/pricing), [product](https://www.myaifrontdesk.com/ai-receptionist). |
| T04 Dialzara | Voice messages and transfers; higher plans add calendar functions | Lite $29/month, 60 minutes, $0.48/minute overage. Pro $99/month, 220 minutes, $0.45/minute overage; Google/Outlook calendar sync listed from Pro. Page also lists number fees despite included-number wording. | Lite cannot satisfy a required calendar booking workflow. Phone-number fee is unresolved, so advertised base price is a lower bound. [Pricing and FAQ](https://dialzara.com/pricing). |
| T05 Tidio Lyro | AI customer support through chat and knowledge answers | First 50 Lyro conversations are a one-time allowance, not 50 free every month. Pricing displays $32.50/month with annual billing context; commitment and required-plan details need confirmation. | Web enquiry candidate; total ongoing cost remains unknown until billing terms and volume are confirmed. [Pricing](https://www.tidio.com/pricing/), [AI agent](https://www.tidio.com/ai-agent/). |
| T06 Crisp Hugo | AI responses within the Crisp customer inbox | Mini $45/month/workspace includes $5 of Hugo credits. Free includes no Hugo credits. Usage is token based; extra usage requires pay-as-you-go. | Web enquiry candidate. No fixed monthly conversation guarantee; credit exhaustion can hand work back to people. [Pricing](https://crisp.chat/en/pricing/), [Hugo billing](https://help.crisp.chat/en/article/how-does-hugo-ai-pricing-and-billing-works-h78hkv/). |
| T07 Housecall Pro CSR AI | Enquiry answering and scheduling using an existing Housecall Pro setup | Cost not established by the reviewed official help pages; requires an existing Housecall Pro workflow and onboarding. | Only consider as an existing-software option. Help articles differ on booking availability: confirm rollout, permissions and add-on price first. [Overview](https://help.housecallpro.com/en/articles/9740104-csr-ai-overview), [getting started](https://help.housecallpro.com/en/articles/12996637-getting-started-with-csr-ai). |
| T08 Buffer | AI help drafting posts plus social publishing and scheduling | Free: three channels, ten scheduled posts per channel at a time, AI assistant included. Essentials displayed $5/channel/month requires $60/channel paid yearly. | Strong candidate for a simple social-text workflow; match the exact channel and queue limit. Do not describe ten scheduled slots as ten posts per month. [Pricing](https://buffer.com/pricing), [AI instructions](https://support.buffer.com/en-us/articles/using-buffers-ai-assistant-qbBulfw9sn). |
| T09 Canva Magic Write | Drafting text alongside promotional design workflows | Magic Write available on Free with limited usage; paid allowance differs. Paid plan price was not reliably extracted. Content Planner scheduling is restricted to eligible paid/organisation plans. | Free drafting/manual publishing candidate; free automatic scheduling is not supported by reviewed evidence. Do not extrapolate text allowance to all AI image/video features. [Magic Write](https://www.canva.com/magic-write/), [Content Planner](https://www.canva.com/help/content-planner/), [pricing](https://www.canva.com/pricing/). |
| T10 Predis.ai | AI social text, images and video, with plan-specific publishing | Annual view lists Core $230/year (displayed about $19/month), 1,300 credits/month, no Auto Posting. Rise $474/year (displayed about $40/month), 3,200 credits/month and Auto Posting. Trial requires a card and charges after three days. | Annual totals are authoritative for this snapshot; do not calculate payment from rounded monthly labels. Exact account/channel and scheduler versus Auto Posting behaviour needs verification. [Plans](https://predis.ai/pricing/). |
| T11 Simplified | AI copy, design and social workflow | Starter $79/month; listed monthly campaign/word/design allowances apply. Exact target-channel and scheduling entitlement must be checked. | Content candidate; native publishing remains uncertain until the needed channel/plan is evidenced. [Pricing and product details](https://simplified.com/pricing). |

The catalogue is a seed for implementation, not 11 automatically eligible recommendations. Populate specific channel, plan and action evidence before a record can pass a hard requirement. Unknowns in this table must survive into the database and UI.

**Excluded from the first shortlist:** Synthflow's current [pricing page](https://synthflow.ai/pricing) describes annual enterprise contracts. That does not fit our small-business self-service starting point. The six inspected GitHub projects are architecture references, not consumer tools to recommend automatically; they require development/hosting and some have licensing restrictions.

## 5. Matching and the meaning of a score

The AI model must not decide prices, compatibility or rank by intuition. Use deterministic rules over reviewed catalogue evidence.

### Eligibility comes first

Evaluate **plans**, then group eligible plans by tool. A plan is:

- **Suitable on documented requirements:** all hard requirements have affirmative evidence, with no known budget violation. If price or usage is incomplete, it cannot enter this group when the owner has a firm budget.
- **Needs checking:** no known contradiction, but a hard requirement or relevant total cost is unknown. Display separately, with the exact missing check.
- **Excluded:** documented conflict with a required action, channel, integration, annual-payment constraint, or firm budget. Keep a short reason available; do not show as a recommendation.

No annual commitment is acceptable unless the owner confirms willingness. A free-only owner can see a capped free tier with a conspicuous stop/overage warning; it does not qualify as free at unlimited or unknown usage. If the service cannot be stopped before paid overages, mark cost as needing checking. A known ongoing volume exceeding a free allowance excludes the free plan.

Required native integrations need exact product/plan evidence. A Zapier logo does not establish a working automation. Manual copy is valid only if the owner accepts it. Unknown task support is not a match. Requirements outside catalogue coverage receive no confident recommendation.

### Transparent fit score, only after eligibility

Use this **proposed rubric**, not a probability that the tool will succeed:

| Criterion | Weight | Full / half / zero |
|---|---:|---|
| Task coverage | 40 | All requested supported actions / priority action only with optional extras missing / unsupported or unknown |
| Output or enquiry channel | 25 | Exact documented channel and required output / documented manual route accepted by owner / unknown or unsupported |
| Budget | 20 | Relevant total within budget, or adequate free allowance / base within budget but uncertain extras / unknown or over budget |
| Existing workflow | 15 | Exact documented required connection, or no connection required / accepted manual handoff / unknown or unsupported |

Score = sum of criterion weight × {1, 0.5, 0}. Keep halves, e.g. 7.5; do not round each term. Hard requirements override any score: half credit never repairs a failed mandatory condition. If budget is Not sure, give zero budget points and show that the cost assessment is incomplete. A score of 80 with no budget answer is not an 80% success prediction.

Show a short breakdown, criterion reasons and source links. Separately show **evidence completeness**: number of the four criteria with enough facts for a full evaluation / 4. A partial match with clear evidence can still have complete evidence. Do not equate page availability with product quality or trust.

Within each tool, choose the highest-scoring suitable plan, then lower confirmed comparable monthly cost, then stable plan ID. Comparable cost means a total for the same owner-supplied usage, including known mandatory fees; a monthly equivalent is usable only when its annual commitment is accepted. If units, volume or mandatory fees prevent a total, cost is unknown and sorts after known costs. Then sort the selected tool plans by score, cost and stable tool ID. Show up to three tools, one relevant plan each. Needs-checking alternatives are a separate section, ordered by number of unresolved hard requirements, then tool ID, without a public fit score.

### Worked checks

- Owner needs Google Calendar booking. Dialzara Lite is excluded even though its base price is lower. Pro remains a candidate only if booking semantics and the required calendar action are evidenced; calendar sync alone is not proof of confirmed appointment creation.
- Owner needs free text posts on a supported Buffer channel, accepts its queue limit, and requires no other connection. With all four criteria evidenced, Buffer Free scores 100 under this rubric. This says the documented requirements match; it says nothing about writing quality or future sales.
- Goodcall Starter with **120 unique customers**: $79 + 20 × $0.79 = **$94.80/month**, before other charges. With 120 calls but unknown unique callers, show no calculated total.
- Predis Core costs **$230 upfront per year**, about $19.17/month equivalent. A $20/month budget does not make it eligible without annual-payment consent.

## 6. Recommendation and setup page

Each result must show the tool and relevant plan, why it matches, exclusions/unknowns, current-software route, cost basis, usage limits, source links and checked date. Use “documented fit”, not “verified best tool”. Clearly distinguish native integration, connector, manual handoff, and unverified compatibility.

Each setup guide contains:

1. Prerequisites and the correct official product/plan link.
2. Three to five concrete setup steps for the chosen task.
3. What connects to existing software and what remains manual.
4. A realistic test using made-up information, plus failure checks.
5. How to pause the workflow and where the owner must review output.

Guides are our instructions based on documentation, labelled **not tested in a vendor account** until actually tested. Do not display fake Connect, Installed or Setup complete states.

### Complete demo guide A: cafe social text with Buffer

- Prerequisites: a supported social account, permission to connect it, and the selected plan's limits.
- Create or open a Buffer account through its official site; review plan terms before accepting a trial or paid plan.
- In Create or the post composer, open AI Assistant. Describe the real offer, audience and tone without customer information.
- Generate a draft; check the price, date, opening hours and claims. Edit rather than publishing blindly.
- Insert the reviewed text. Connect the supported channel through Buffer's own flow if the owner chooses scheduling, and review its permissions.
- Preview and schedule one post. Confirm the correct business account, timezone and appearance. A copied draft is a valid manual alternative when accepted.
- Test outcome: one accurate draft, with a preview and the correct destination. Our website exports the plan, not a claim that a post was published.

### Complete demo guide B: Goodcall Starter enquiry capture

- Start with message capture and callback, rather than assuming confirmed calendar bookings are supported.
- Select Goodcall Starter only after reviewing its current unique-customer allowance and overage terms; confirm the phone carrier's forwarding support and charges. The [official workflow](https://www.goodcall.com/how-it-works) documents briefing, practice calls, lead delivery and forwarding. Carrier setup remains an unverified prerequisite, not a claim of compatibility.
- In Goodcall, brief the agent with approved services, hours, lead questions and the destination for emailed/texted enquiries. Ask it to take callback details instead of quoting prices or confirming appointments. Verify the configuration in its practice-call workflow before publishing.
- Use a temporary/test number or limited forwarding arrangement first; retain the original answering route.
- Make several test calls: normal enquiry, out-of-area request, unclear speech, unavailable staff and an urgent request. Confirm message accuracy and human handoff; it must not promise emergency response or invent prices.
- Enable customer-facing forwarding only after those checks. Explain how to disable forwarding and return to the earlier route.
- Our website does not provision the number, handle real calls, or verify carrier compatibility. Those remain explicit owner/vendor steps.

### Fixed scenarios for implementation and demo

| Field | Marketing scenario | Enquiry scenario |
|---|---|---|
| Business/problem | Cafe; social captions | HVAC; missed phone enquiries |
| Existing software | None | None for enquiry handling |
| Budget/commitment | Free only; no annual payment | Not sure; no annual payment |
| Required output/action | Text captions only | Capture caller details and service request; no confirmed booking |
| Channel | Facebook, subject to current catalogue evidence | Phone |
| Handoff | Manual copy is acceptable; scheduling not required | Email lead to owner; no CRM/calendar connection |
| Usage | One first caption; future monthly volume unknown | 80 unique customers/month, explicitly supplied in the demo |
| Expected documented candidate | Buffer Free; AI drafting is included, manual copying avoids a publishing-connection requirement | Goodcall Starter; reviewed workflow documents lead capture/email and phone answering |
| Cost/result boundary | $0 within evidenced free usage; no unlimited-use claim | $79 subscription base at this volume; carrier charges and affordability remain unassessed; zero budget points and incomplete cost evidence |

These are fictional test inputs, not research interviews. Populate the exact plan/capability claims before implementation. Buffer's future monthly generation allowance is not established here: show that limitation rather than inventing a quota. The marketing happy path covers one first caption and documented free AI availability; the owner must review further usage before continuing. Neither scenario authorises buying a plan or running a real call/post. If a necessary claim cannot be supported, demonstrate the needs-checking result honestly and pick a documented alternative before claiming a complete suitable-result demo.

A CSV intake template can demonstrate a manual handoff, with fields `received_at, name, callback_number, service_requested, preferred_time, status`. Label it **our generic template**, not an import format supported by a particular CRM. V1 should export this blank template and the chosen guide; no real customer records are collected.

## 7. Cost and benefit without invented savings

Show subscription cost, commitment, billing unit, included allowance, overages, setup charges, and unknowns separately. Calculate totals only when usage and all relevant pricing inputs are known. Unknown is not zero; a free trial is not a free plan.

Offer an optional local worksheet after results:

- Current time per task and number of tasks, entered by the owner.
- Expected time after setup, explicitly an assumption until measured.
- Estimated hours saved = volume × (before minutes − after minutes) / 60.
- Optional value of time = hours × an owner-entered hourly value; this is time value, not cash profit.
- Record actual outcomes later: correctly captured enquiries, replies needing correction, time per reviewed post, and total tool bill. Compare similar periods; do not imply causality from a one-week comparison.

No prefilled revenue uplift, conversion percentage, accuracy benchmark or guaranteed return on investment.

## 8. Technical design: one application, a small database, optional AI

**Proposed stack:** Next.js App Router + React + TypeScript; Tailwind for styling; server Route Handlers in the same application; Supabase PostgreSQL for the catalogue. This is simpler to operate in two days than separate Python and JavaScript services. No FastAPI, vector database, queues, microservices or owner login in the first release.

| Component | Responsibility |
|---|---|
| Front end | Adaptive questionnaire, editable summary, result comparisons, guides and downloads. Answers live in sessionStorage; Clear removes them. Do not store secrets there. |
| Server | Validate inputs, apply deterministic matching and cost rules, fetch reviewed catalogue records, return evidence and reason codes. |
| SQL database | Tools, plans, capabilities, integration claims, evidence, setup guides and catalogue versions. No guest questionnaire histories. |
| Optional OpenRouter call | Convert a free-text problem into allowed task/requirement suggestions. Owner confirms the suggestions. No pricing, compatibility or ranking authority. |
| Versioned seed files | Reviewable source for catalogue updates, imported through a migration/seed command; no public write endpoint. |

A small SQL database is useful for the structured relationships; it is not necessary for “AI memory”. Use foreign keys and explicit unknown states. Proposed tables:

- `tools`: id, name, official_url, product_scope.
- `plans`: id, tool_id, label, currency, commitment_months, renewal_terms, price_status.
- `price_components`: id, plan_id, component_type (subscription/usage/mandatory_fee), billing_period, upfront_amount, monthly_base, usage_unit, allowance, overage_amount, charge_status, evidence_id. Multiple rows support voice, chat, SMS and number fees on one plan. Credit conversion that is not established stays unknown; never add incompatible units.
- `claims`: id, tool_id, plan_id where relevant, claim_type, key, supported/unsupported/unknown, source_id, checked_at, review_note.
- `sources`: id, url, title, accessed_at, relevant_excerpt_or_paraphrase, review_status.
- `guides`: id, tool_id, plan_id, task, steps, prerequisites, test_steps, rollback_steps, source_ids, tested_status.
- `catalog_versions`: id, created_at, research_revision.

Represent annual commitments and plan-specific features explicitly; do not infer them from a tool-wide description. A versioned rubric belongs in code, not an editable LLM prompt. Record catalogue and rules versions in results so a recommendation is reproducible.

### Minimal server contract

- `GET /api/catalog`: current public reviewed catalogue; no secrets or internal notes.
- `POST /api/assess`: validated answers → summary, suitable results, needs-checking alternatives, exclusions and rule/source versions.
- `GET /api/tools/[id]`: public detail, evidence and relevant guides.
- `POST /api/interpret`: optional structured AI suggestions; disabled unless explicitly configured and authorised.

Use Zod schemas on both boundaries, reject invalid enum values and oversized payloads, and return useful errors. Never trust a client-supplied score or price. Do not fetch arbitrary owner-supplied URLs. Downloads are generated locally from the returned public plan and current answers.

Use the same catalogue interface for database reads and a clearly labelled local fixture fallback. Before the demo, choose one mode and test it; do not silently switch to different data or scoring. No hosted database is assumed to have been provisioned yet.

### Database and privacy

Keep database credentials and any API key on the server. Prefer a restricted read-only database role for runtime catalogue reads; use a separate migration credential. If using the Supabase Data API, enable RLS and give only the necessary reviewed-catalogue access. Do not put a service-role key in browser code.

Guest answers are transmitted only to assess the current request and are not inserted into SQL. Do not collect customer names, phone numbers or uploads. Explain that sessionStorage lasts for the tab session and can be cleared. Turn off request-body capture in error monitoring and review hosting log defaults before deployment.

### Logging: enough to debug, without recording the owner's problem

Structured server events: random request ID, timestamp, route, status, latency, catalogue/rules versions, candidate tool IDs and rule reason codes. Never log free-text answers, full request bodies, email addresses, API keys or model prompts/responses. Do not attach an identity to a guest request. Retain application diagnostics for seven days where hosting configuration allows, then remove them; otherwise disclose actual retention before launch.

If AI is enabled, record provider/model identifier, token counts, reported request cost, latency and error class without prompt text. These are technical usage records, separate from business benefit metrics.

### Optional AI and the $25 credit

The existing OpenRouter credential stays unused until explicitly authorised. The core flow must work without it through structured choices and deterministic matching. On activation, use one server-side interpretation request per submitted problem, a short timeout, output-token cap, strict schema validation and rule-based fallback. Show inferred fields for confirmation.

Before live activation, choose a currently priced model, verify its data-handling terms and enforce rate limits plus a global usage ledger. Target at most $20 of this credit, reserving $5. Application estimates are not a guaranteed provider spending cap: use provider limits where available and disable calls if cost cannot be established. Do not spend credit to manufacture tool reviews.

Technical references: [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [OpenRouter quickstart](https://openrouter.ai/docs/quickstart). Version/package selection is checked when implementation starts.

## 9. What legacy-system integration means in V1

First identify the system the business already uses. Then show a sourced native option where documented, a specifically evidenced connector route, or an accepted manual route. Exporting a guide or blank CSV demonstrates a handoff; it is not a live integration.

The existing-software question is a product requirement, not decoration. A cafe already using Canva should see its relevant capabilities before being asked to buy another subscription. A Housecall Pro user can see CSR AI as an option needing an add-on quote. Never claim our site has connected either account.

For the hackathon, we demonstrate **compatibility-aware recommendations and practical handoffs**. Actual OAuth connections, CRM writes, phone forwarding and appointment creation require vendor-specific development and live tests, and are outside this first build. Say this clearly in the presentation.

## 10. Build order for the remaining two days

These are work blocks, not promises that access to external services is already available.

1. **Catalogue and matching first:** create the seed, evidence fields, plan gates and scoring function. Confirm enough evidence exists for the two demo paths; unknown tools remain needs-checking.
2. **Complete one end-to-end journey:** questionnaire → review → results → guide → download. Use a deterministic fixture before adding optional AI.
3. **Add the second journey:** reuse the screens and matching engine, with task-specific follow-ups and guide content.
4. **Add the SQL catalogue adapter:** migrate/seed the reviewed records, verify read permissions, and choose the demonstrated data mode.
5. **Validate and polish:** meaningful rule tests, mobile/keyboard checks where permitted, plain-language labels, error/empty states, evidence dates and annual-price disclosures.
6. **Prepare the demo:** two owner scenarios, one intentional incompatibility example, visible sources, clear scope, and a record of real team contributions. Enable optional AI only after explicit key-use authorisation and budget controls.

Do not let optional AI, authentication, a visual workflow builder, ratings, or extra business sectors block a working core journey. If time becomes tight, demonstrate fewer fully evidenced tools and disclose the smaller catalogue.

## 11. Acceptance checks before calling V1 ready

- Both demo journeys complete with at most eight questions, including Back/edit behaviour.
- Unknown budget, unknown software, unsupported tasks and zero suitable tools all produce useful results without invented facts.
- An annual-only plan cannot pass without annual-payment consent. Trials and free tiers are correctly distinguished.
- Booking requests and confirmed bookings are distinct; unsupported or unknown mandatory connections cannot appear as suitable.
- Costs use the correct billing unit. Free overages, the Goodcall example and the Predis annual total behave as described.
- Ranking is reproducible; every displayed capability and price has a checked source; evidence completeness is separate from fit.
- A guide and blank CSV/text download work and are labelled as guidance, with no fake installation or success state.
- No credential reaches client code or Git; no private answers appear in stored logs; SQL runtime access cannot edit the catalogue.
- Keyboard, mobile layout, validation and failure states are checked. Desktop/browser-based verification requires the user's explicit permission under the workspace preference; file-based checks can proceed independently.
- Actual vendor connections and performance remain untested unless separately carried out and documented.

## 12. How this serves the judging criteria

| Criterion | Concrete evidence we can present |
|---|---|
| Research depth — 10 | Downloaded papers, dated source register, stated survey limitations, owner accounts and a trace from research → questions → matching rules |
| Small-business applicability — 10 | Two relevant workflows, current-software question, real plan limits, honest compatibility handling and usable setup instructions |
| Architecture/scalability — 10 | One reusable application, structured versioned catalogue, server validation and deterministic matching; more tasks add data/rules rather than separate apps |
| User experience — 10 | Relevant follow-ups, editable summary, clear costs/unknowns, accessible controls and an actionable guide |
| Demo/presentation — 10 | Two complete scenarios, a visible mismatch example, explicit implementation limits and truthful team contribution notes |

This maps deliverables to criteria; it does not guarantee a score. The original challenge also envisages broader discovery. V1 is a reviewed catalogue, **not live internet-wide discovery**. State that gap rather than displaying simulated search. Evaluate a bounded official-source discovery/review process after the core demo is reliable. Likewise, no SBA integration is implemented or claimed.

## 13. Deferred work

Live discovery and source refresh automation; owner accounts and saved history; vendor OAuth and write operations; installation automation; verified user reviews; measured post-setup outcomes; more business workflows; multi-user permissions; and detailed operational analytics. Each needs its own evidence, validation and privacy decisions.

The immediate next implementation task is the catalogue schema and matching rules, followed by one complete journey. No application code, paid AI call, deployment or Git push is part of this specification deliverable.
