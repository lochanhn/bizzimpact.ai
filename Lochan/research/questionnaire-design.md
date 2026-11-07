# Business questionnaire and discovery design

Draft 1 · November 6, 2026 · bizzimpact.ai

**Historical question bank:** the eight-question maximum proposed for the hackathon V1 is now defined in [v1-specification.md](../v1-specification.md). This older bank is retained for reference, not the form to implement.

This draft defines the questions we can put in front of a business owner, the follow-ups their answers trigger, and how those answers affect tool discovery and impact estimates. It builds on the evidence in [research-notes.md](research-notes.md) and the supplied Phase 1 specification, recorded as S11 in [sources.md](sources.md).

The first eight questions retain the supplied specification's wording. The deeper assessment below is our proposed extension, not an already approved part of that specification. Research informs the topics; the wording and branching have not been validated with owners. A target business type has not been selected.

## 1. What we should learn before finding tools

By the end, we should be able to write a specific brief:

> This business needs help with [task], which happens [volume/frequency]. Today [person/system] handles it through [workflow]. The main difficulty is [bottleneck], causing [impact]. Any candidate must work with [constraints]. The owner can spend [budget] and wants [outcome]. These details remain unknown: [gaps].

Do not turn missing information into invented assumptions. “Not sure” is useful information and should identify a follow-up or a limit on the result.

## 2. Owner journey

1. **Your business:** Save the reusable business profile, Q1–Q8.
2. **Today's problem:** Ask what the owner wants help with and confirm our understanding.
3. **How it works today:** Ask task-specific questions about the real workflow and bottleneck.
4. **Practical requirements:** Establish connections, data restrictions, setup effort, and budget details where needed.
5. **Review your brief:** Let the owner correct the facts before discovery.
6. **Explore candidates:** Show products with evidence, constraints, unknowns, and useful next steps.

Depth comes from relevant follow-ups. Do not display the whole question bank as one form or repeat answers already provided. Save progress, show meaningful section progress, permit Back, and allow editing before submission. Completion time must be measured later, not advertised as a guessed duration.

## 3. Reusable business profile

### Screen 1 — Tell us about your business

| ID | Exact question | Answers and interaction | Rule |
|---|---|---|---|
| Q1 | What kind of business do you run? | Food & Beverage; Home Services; Retail & E-commerce; Professional Services; Health & Wellness; Education; Manufacturing; Other. Search category and choose an applicable subtype, with custom entry. Example subtypes: restaurant, coffee shop, HVAC, landscaping. | Required |
| Q2 | In one sentence, what does your business primarily do? | Short text. Example: “We maintain residential yards and offer seasonal cleanups.” | Required; nonblank |
| Q3 | Who are your primary customers? | Individuals / consumers (B2C); Other businesses (B2B); Both B2C and B2B; Government / organizations; Other. | Optional |
| Q4 | How many people work in your business? | Just me; 2–10; 11–50; 51–250; 250+. | Required |

### Screen 2 — Understand your existing setup

| ID | Exact question | Answers and interaction | Rule |
|---|---|---|---|
| Q5 | Where does your business primarily operate? | Country and applicable state/region. | Required; no street address |
| Q6 | Which software or digital tools do you currently use? | Searchable multi-select with custom entries; None; Not sure. Label suggestions as examples, not evidence that the business uses them. | Required; None and Not sure each exclude all other selections |

### Screen 3 — Understand your priorities

| ID | Exact question | Answers and interaction | Rule |
|---|---|---|---|
| Q7 | Which areas of your business would you most like to improve? | Marketing; Getting new customers; Sales; Customer service; Scheduling; Inventory & purchasing; Logistics & delivery; Finance & invoicing; HR & workforce; Administrative work; Analytics & planning; Not sure yet. | Optional; at most three; Not sure yet is exclusive |
| Q8 | What's your approximate monthly budget for new AI tools? | Free tools only; Under $50; $50–$150; $150–$500; Over $500; Not sure yet. | Optional; combined budget across tools, not per product |

**Two issues to resolve before freezing the schema:** Q4 overlaps at 250 people, and Q8 overlaps at $150. The source wording is retained here so the differences are visible. Proposed corrections are `51–249; 250+` for headcount and `Under $50; $50–under $150; $150–$500; Over $500` for budget. These are proposed changes, not silent edits. Also label the dollar currency explicitly; a non-US location must not imply a currency conversion without explanation.

Why these questions matter: Q1–Q3 establish task context; Q4 informs volume and seats without substituting for actual workload; Q5 informs availability and language follow-ups; Q6 reveals existing systems; Q7 guides exploration but does not replace a specific problem; Q8 gives a preliminary affordability constraint.

## 4. Understand the specific problem

The dashboard prompt remains: **“What would you like help with today?”** Accept 10–2000 characters, following the reference. A category choice can help an owner compose a sentence; it must not fabricate a problem on their behalf.

| ID | Owner-facing question | Answer format | How the answer is used |
|---|---|---|---|
| P01 | What would you like help with today? | Plain-language problem; examples relevant to the business, clearly labeled as examples. | Identify the task and proposed capability categories. |
| P02 | What happens today, from when this task starts until it is finished? | Short text, with optional step chips: receive, record, review, reply, schedule, follow up. | Locate the handoff or gap, rather than choosing a tool from a broad complaint. |
| P03 | Where does the process usually get stuck? | Select any: work arrives while we are busy; details get lost; we enter information twice; slow follow-up; hard to find information; errors; too much checking; other; not sure. | Narrow the capabilities needed; distinguish automation from information management. |
| P04 | Who handles this task now? | Me; employee/team; outside service; existing software; nobody consistently; other. Optional number of people involved. | Understand ownership and existing costs; do not infer staff replacement. |
| P05 | About how many times does this happen? | Number or range + per day/week/month; Not sure. For seasonal work, ask typical and busiest periods separately. | Estimate usage and peak capacity requirements. |
| P06 | About how much time do you spend on one of these tasks? | Minutes per task or total hours per week, including follow-up; Not sure. Use one mode to avoid double counting. | Establish an estimated baseline for later cost/benefit calculations. |
| P07 | What is the main effect on your business? | Choose main effect, optional others: my time; customer delays; missed sales; mistakes/rework; waste/costs; staff workload; other; not sure. | Select a relevant outcome measure. |
| P08 | What would a useful improvement look like for you? | Desired result in plain language. Optional target and period: hours/week, response time, fewer forgotten requests, less waste. | Define success in the owner's terms; do not insert an expected improvement percentage. |

P01 and a confirmed task are needed to make a specific discovery request. Other answers may be unknown or skipped; ask for missing essential details only when they change which tools are relevant. Never block basic exploration because the owner does not know task volume or financial impact.

### Conditional communication question from the reference

**Q9 — “How do customers usually reach your business?”**

Options: Phone calls; Email; Website; Social media; WhatsApp / SMS; Walk-ins; Online marketplaces; Other. Multi-select, optional, skippable. Show only when the channel affects discovery and is not already clear. If an owner explicitly said “phone calls,” do not ask again. An AI inference from ambiguous wording must remain a suggestion the owner can correct.

## 5. Follow-ups by task

Choose one primary task for the current run. A second problem becomes a separate run, rather than combining unrelated needs into one unclear search. Business type changes examples and vocabulary; task answers determine the branch. These questions are proposed requirements discovery, not proof of sector-wide demand.

### A — Calls, enquiries, and appointment requests

Use for a café, restaurant, HVAC firm, or landscaper when the problem actually concerns customer contact. Ask Q9 first only if necessary.

| ID | Question | Answers and decision |
|---|---|---|
| A01 | What should happen when a customer contacts you? | Give approved information; collect details; request a callback; request a booking; book a confirmed appointment; other. Distinguishes message capture from permission to book. |
| A02 | When do you need help handling enquiries? | During work hours; after hours; busy periods; all the time. If relevant, specify business hours and time zone. |
| A03 | Where do appointments or customer requests get recorded now? | Select a Q6 tool, paper, spreadsheet, other, or no consistent place. Ask exact product/plan only when checking a connection. |
| A04 | What rules must be checked before confirming a booking? | Service area; staff availability; service type; travel time; duration; other; no rules known. Keep uncertain booking rules for human confirmation. |
| A05 | Which enquiries must always go to a person? | Complaints; urgent situations; uncertain answers; custom prices; cancellations; other; owner defines rules. These become limits, not an AI-generated emergency procedure. |
| A06 | Which languages do customers need, and what information may be collected? | Language choices/custom; categories of contact/service details only. Do not request real customer records. |

Candidate capabilities could include enquiry capture, approved FAQ responses, handoff, or scheduling. A receptionist that captures messages is not automatically a booking integration.

### B — Customer requests, quotes, and follow-up

Especially relevant to the workflow in S06; also usable outside landscaping.

| ID | Question | Answers and decision |
|---|---|---|
| B01 | What gets lost or delayed? | New enquiries; site notes; requested extras; preparing quotes; following up; approved work; other. Identifies the exact gap. |
| B02 | Where are these details stored today? | Email; messages; notebook; spreadsheet; mapped photos; Q6 software; several places; other. Identify the source and destination separately. |
| B03 | What does a request need to stay attached to? | Customer; property/site; job; appointment; photo; other. Establish the minimum record structure. |
| B04 | How do you know when to follow up, and who is responsible? | Due date/reminder; software status; memory; no process; other. Capture handoff and responsibility. |
| B05 | Should the tool draft a response, organize requests, remind someone, or send messages itself? | Multi-select; direct sending requires separately approved rules and actual connection support. |
| B06 | Are prices fixed, calculated from a price list, or individually approved? | Fixed; price list; custom approval; mixed; not sure. Do not discover a quote generator that assumes prices the owner cannot delegate. |

Ordinary task tracking or reminders may address this problem. AI is relevant only if a useful capability such as extracting requests from text is needed.

### C — Staffing administration and training

Motivated by S05 and S07. This branch addresses administrative work around people; it does not promise to solve worker shortages.

| ID | Question | Answers and decision |
|---|---|---|
| C01 | Which part takes the most effort? | Planning shifts; covering absences; answering repeated staff questions; creating training materials; onboarding paperwork; other. |
| C02 | Where are schedules and staff instructions kept now? | Q6 software; spreadsheet; paper; messages; shared documents; no consistent location. |
| C03 | Which rules must be respected? | Availability; skills/qualifications; opening hours; role coverage; approval process; other. Collect categories, not unnecessary employee records. |
| C04 | Do you have written instructions or examples the tool could work from? | Up to date; incomplete; outdated; none; not sure. A tool cannot retrieve policies that do not exist. |
| C05 | Who would check a proposed schedule or training answer before it is used? | Owner; manager; designated employee; no one available; not sure. Identifies feasibility of review. |

Keep hiring decisions, payroll, and legal compliance outside an unsupported promise. If the issue is physically insufficient staffing, identify it as a capacity constraint rather than relabeling it as an AI task.

### D — Inventory, purchasing, and waste

Relevant when the owner identifies food waste or stock problems; S09–S10 motivate investigation, not a claim that forecasting is always the solution.

| ID | Question | Answers and decision |
|---|---|---|
| D01 | Which stock problem are you trying to reduce? | Waste/spoilage; running out; overordering; counting stock; supplier-price comparisons; purchase paperwork; other. |
| D02 | What records do you already keep? | Item-level sales; purchases/invoices; current stock; waste records; recipes/item quantities; none; not sure. |
| D03 | Where are those records, and can you export them? | Existing system; CSV/Excel; PDF invoices; photos; paper; not sure. Do not assume a PDF gives reliable structured inventory data. |
| D04 | How much history is available, and how often is it updated? | Duration + daily/weekly/monthly/irregular; Not sure. Determines whether a forecasting candidate is plausible. |
| D05 | What must a purchasing suggestion account for? | Delivery days; minimum orders; shelf life; storage limits; events/seasonality; other; not sure. |
| D06 | Who would approve changes to an order? | Owner; manager; purchasing staff; other; not sure. Distinguish suggestions from autonomous purchasing. |

If basic data is missing, provide a data-readiness explanation and simpler options before proposing forecasting. Never promise reduced waste solely because a product advertises AI.

### E — Marketing and repeat customers

Use only when selected by the owner. S05 motivates distinguishing attention from repeat business, not assuming that more content creates retention.

| ID | Question | Answers and decision |
|---|---|---|
| E01 | What result do you want from marketing? | Reach new customers; bring customers back; promote a specific offer; reply to reviews; create content faster; other. |
| E02 | Which channels do you already use? | Website; email; SMS; social networks; marketplace; printed material; other; none. Name the specific platforms if connection matters. |
| E03 | What materials could a tool use? | Existing photos; approved offers/prices; brand guidelines; previous posts; customer list with appropriate permission; none. Ask for categories only here. |
| E04 | What should happen after content is created? | Download/copy; save a draft in another tool; schedule after approval; publish after approval; other. Do not treat draft creation as automatic publishing. |
| E05 | How will you judge whether it helped? | Less writing time; enquiries; bookings/orders; repeat visits; other; not sure. Likes alone are not proof of revenue. |

### Other tasks

For invoicing, analysis, logistics, or a custom problem, use P02–P08 and ask for the input, desired output, existing system, responsible person, and non-negotiable constraints. Do not force a problem into the nearest branch. If the catalog does not cover it, state the gap.

## 6. Practical requirements that affect discovery

Ask these once for the selected task; reuse previously confirmed answers where applicable.

| ID | Question | Answers and why it matters |
|---|---|---|
| R01 | Which existing tools must you keep using for this task? | Select from Q6, custom, none, not sure. Distinguishes a requirement from a preference. |
| R02 | How would you prefer to move information between tools? | Automatically; upload/download a file; copy/paste is acceptable; not sure. Match connection effort to what the owner accepts. |
| R03 | What information would the tool need, and what must stay out? | Public business information; customer contact data; employee data; financial records; other; not sure. Optional restrictions: no external sharing, no model training on our data, other. Unknown support remains unknown. |
| R04 | Who could set this up, and how much time could they spend? | Me; employee; outside help; nobody yet; not sure. Time: numeric hours/range or unknown. Feasibility includes available help. |
| R05 | Besides the monthly budget, is there a one-time setup budget? | Amount + currency; no setup spend; not sure. Ask monthly amount/currency only if Q8 is missing, ambiguous, or too broad for a decision. |
| R06 | What should the tool be allowed to do on its own? | Prepare drafts only; organize information; send approved messages; make bookings under rules; other; not sure. Permission preferences are requirements, not actual authorization to connect an account. |

Do not collect passwords, API keys, exact addresses, real customer conversations, employee files, or bank information in the questionnaire. Product-specific permissions belong in a later, explicit setup flow.

## 7. How answers become a discovery request

Store the owner's actual answer, any normalized value, and whether a value is explicit, confirmed, inferred, or unknown. Preserve units and dates. The owner can correct a suggested interpretation before it affects discovery.

| Answer | Discovery decision |
|---|---|
| P01–P03 plus selected branch | Required and optional capabilities, each explained by an answer |
| Q1–Q3 | Business context and appropriate examples; do not exclude general-purpose tools solely because their marketing does not name the industry |
| Q4 and P05 | Seats and workload requirements; headcount alone is not a usage estimate |
| Q5, A06, confirmed language needs | Regional/language availability checks |
| Q6, R01–R02, destination-system questions | Existing-system compatibility and acceptable manual alternatives |
| Q8, R05, P05 | Total-cost feasibility; unknown price never means free |
| R03, R06 and branch approval rules | Data and action constraints; unsupported or uncertain claims cannot count as confirmed compliance |
| R04 and data-readiness answers | Setup prerequisites and feasible adoption path |
| P06–P08 | Baseline and desired impact; no automatic ROI claim |

**Constraint handling:** Explicitly incompatible candidates are excluded with a reason. Unverified requirements produce a clearly marked “needs verification” candidate, not a confirmed match. An unknown essential condition can justify asking a targeted question or withholding a confident match. Owner-defined non-negotiable restrictions must not disappear into a weighted score.

**Phase 1 scope:** Produce relevant candidates with sources. Keep the reference's catalog-only baseline available without model calls. Deeper assessment can refine discovery progressively; do not require every question before showing any useful result. Scores, personalized rankings, installation, and multi-tool deployment remain later modules unless the team changes scope.

## 8. What the owner should see before and after discovery

### Confirm the brief

Show four editable blocks: the task and bottleneck; the present workflow; the required constraints; the desired improvement. Show unknowns explicitly. Do not expose internal taxonomy labels as the owner's explanation.

### Candidate information

Each candidate should show:

- The part of the stated task it could address, with a reason tied to answers.
- Sourced capabilities and dated evidence, with vendor claims distinguished from tests.
- Known price and usage limits; unresolved charges shown as unknown.
- Existing-software connection evidence: documented native connection, documented third-party connection, file exchange, manual use, unverified, or incompatible.
- Data/setup prerequisites and the unanswered questions that matter.
- A clear explanation of whether it is an AI product, AI-enabled existing software, a non-AI complement, or unverified.

Do not label candidates “best,” assign stars, or imply accounts are connected in Phase 1. “No suitable candidate found” is a valid result with a useful explanation of the unmet requirement.

### Information handed to later modules

Keep separate dimensions for task coverage, affordability, compatibility, setup effort, and quality of evidence. The later scoring module must define its evidence rules and weights before producing numbers. The questionnaire does not establish a tool's reliability; tool research and practical evaluation supply that evidence.

## 9. Cost and impact worksheet

The owner provides a baseline; tool documentation supplies prices/limits; later tests supply observed effort and correctness. Keep those sources separate. Mark assumptions and missing values.

| Item | Calculation or display rule |
|---|---|
| Current monthly task time | Tasks/week × minutes/task × 4.33 ÷ 60, or reported weekly hours × 4.33. Use one route. Label 4.33 as an average-month assumption. |
| Proposed monthly cost | Subscription + required seats/add-ons + usage fees + paid connector costs. Unknown terms prevent a confirmed total. |
| One-time setup | Fees plus owner/employee hours. Show time separately unless an hourly value was supplied. |
| Estimated net time released | Baseline hours minus remaining handling, review, exception, and maintenance time. Requires an explicit assumption or measurement for each component. |
| Optional time value | Estimated hours released × owner-supplied hourly value. This is capacity value, not automatically cash savings. |
| Optional cash case | Avoided cash costs + estimated incremental contribution after variable costs − new recurring costs. Keep assumptions visible; do not use gross revenue as profit. |
| Result with insufficient evidence | “We can estimate the cost, but do not yet have enough information to estimate the benefit.” |

**Illustration only:** 40 tasks/week at 6 minutes gives 17.32 hours/month. If a stated scenario leaves 7 hours of handling/review and 1 hour of maintenance, estimated time released is 9.32 hours/month. At an owner-entered $20/hour, its capacity value is $186.40. A hypothetical $40/month tool leaves $146.40 of capacity value after its fee, before setup or other costs. These are invented example inputs, not product prices, research findings, or guaranteed cash savings. If review takes longer than expected, the estimate must change and may become negative.

## 10. Research traceability

The sources motivate questions; they do not validate this questionnaire or prove demand in every sector.

| Evidence theme | Source IDs | Questions/design it informs |
|---|---|---|
| Fit, implementation effort, and accuracy concerns | S01 | P01–P03, R04, separate fit and evidence dimensions |
| Working technology may be retained | S02 | Q6, R01–R02, current-workflow questions |
| Suitability, skills, and information concerns | S03 | R03–R04, data readiness, option that AI is not the right intervention |
| Business advice does not automatically improve outcomes | S04 | P07–P08, transparent impact assumptions, no guaranteed benefit |
| Café staffing and repeat-customer relationships | S05 | C branch and E01/E05, without treating staffing shortage as an AI feature |
| Site requests, scattered records, postponed quotes | S06 | B branch, destination systems and record links |
| Call backlog versus physical-work capacity | S07 | A branch and task suitability checks |
| Intake-to-dispatch handoffs, vendor perspective only | S08 | A03–A05 as hypotheses requiring more evidence |
| Restaurant cost context and existing automation | S09–S10 | D branch and total-cost worksheet; sector generalization remains limited |
| Eight-question profile and Phase 1 boundary | S11 | Q1–Q9 wording, baseline, source-aware discovery, deferred scoring/adoption |

## 11. Walkthroughs to review the design

These are designed scenarios, not user-test results or real business profiles.

1. **Landscaper with missed calls:** Q1–Q8 → explicit phone problem → P02–P08 as needed → A branch → requirements → confirmed brief. Skip redundant Q9. Required capability follows the chosen action: capture messages and booking requests is different from confirming appointments. A known calendar requirement must be checked, not assumed from an accounting tool.
2. **Restaurant with food waste:** Q1–Q8 → waste problem → P02–P08 → D branch. If sales and stock history are unavailable, flag data readiness. Do not present forecasting effectiveness as established.
3. **Café with staffing difficulty:** Determine whether the problem is availability, scheduling effort, training information, or service quality. Use C only for a concrete administrative task; do not promise that AI supplies missing workers.
4. **Unclear customer enquiries:** Ask Q9 if the channel changes the discovery. If skipped, keep the channel unknown and show the effect on confidence and compatibility.
5. **Existing system must stay:** A candidate that requires replacing that system is incompatible. A file workflow is acceptable only if the owner accepts that approach and the file path is supported.
6. **No budget or usage estimate:** Discovery can proceed with uncertainty labels. Do not claim the candidate is affordable or generate a numeric benefit.

Before implementation, review question wording, branch relevance, edge values, unknown handling, and whether each answer changes a decision. Check that changing an answer invalidates dependent assumptions while preserving an editable draft. This document is ready for team review; no questionnaire UI or scoring engine has been built.
