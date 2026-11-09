# bizzimpact.ai: 10-minute video script

Target: 9:30–9:50. Three speakers: **S** = Salman (engines), **L** = Lochan (research and V1), **A** = Abhinav (product spec). Swap names to match who actually built what.

**Before recording:**
- Run `cd website && npm run dev`.
- Open these tabs:
  1. `/`
  2. `/start?demo=landscaper`
  3. `/start?demo=cafe`
  4. `/discover`
  5. `/architecture`
  6. `/methodology`
- Zoom the browser to 110%. Close other tabs and notifications.

## The one-line pitch
> **"bizzimpact.ai is a neutral AI advisor for small businesses: it finds the right AI tools for *your* problem, rates them on what actually matters to *you*, and hands you a plan that works with the software you already use."**

## Three selling points (repeat them)
1. **Built around the owner, not the vendor.** A check-up in plain language, ratings personalised to the owner's budget, skills and data, and nobody can pay for ranking.
2. **Every claim has a source.** Prices, features, security statements and connections are quoted from vendor pages. Unknowns are shown, never guessed.
3. **It ends in action.** A tool stack within budget, workflow recipes into QuickBooks, Jobber, Google Calendar or Instagram, a calendar plan, and a 30-day check-in.

---

## Script

### 0:00–0:50 · The problem (Depth of research) — **L**
**Screen:** home page.
> "There are more than 36 million small businesses in the US. In May 2026 only about one in five US firms used AI. For businesses with fewer than 20 employees, adoption didn't grow at all while larger firms pulled ahead (Census Bureau).
> Why? Not awareness. The Federal Reserve found 54% of firms planning to use AI struggle to find or adapt tools to their needs, and 37% lack time to implement them. Owners also want to keep the software that already works: 29% would rather not change it (NFIB).
> So the real problem isn't 'show me AI tools'. It's 'which tool fits *my* business, works with what I have, and can I actually set it up?'"

### 0:50–1:40 · What exists and why it isn't enough (Depth of research) — **L**
**Screen:** `docs/RESEARCH.md`, section 3 table (or a slide).
> "We studied how existing products work.
> - Directories like There's An AI For That list over 50,000 tools but don't match them to you.
> - G2 and Capterra rate on crowd reviews: the same score for everyone, list prices, vendor-supplied integration logos.
> - FitGap matches requirements, but for general software, and you must know the category first.
> - Software Advice uses human advisors paid by vendors.
>
> Nobody combines discovery, a personal review and an integration plan. That's our product."

### 1:40–3:10 · Live demo 1: the check-up (UX) — **S**
**Screen:** `/start`. Click through steps 1–5 quickly, then load the example.
> "A landscaping owner. Step 1: business type and team size. Step 2: the software they already use (QuickBooks, Google Calendar, Jobber) and which they'll never replace. Step 3: pick up to three areas, ordered for their industry. Step 4: plain-language struggles. 'I miss calls when I'm busy' is their number one.
> Then only the follow-ups that change the answer: should the AI book appointments or just take a request? Budget, what data the tool will touch, and what it may do on its own.
> Every 'Not sure' is kept as an unknown. We never guess."

**Click:** "Try a filled-in example" → Review screen → **See my AI plan**.

### 3:10–4:40 · Demo 2: the plan (Applicability + Integration) — **S**
**Screen:** plan page, top section, then **Connect**.
> "Their AI stack: My AI Front Desk plus Buffer, from $99 a month, within budget, covering all five needs. Why this stack? Front Desk handles calls *and* bookings in one tool.
> How it fits their software: Front Desk syncs with Google Calendar, and reaches Jobber and QuickBooks through Zapier. We verified both apps in Zapier's own directory.
> **Connect it to your tools** turns this into workflows: 'When My AI Front Desk takes a call, Jobber creates a new client.' Each one shows how it connects and its source. And because the owner said 'I confirm bookings myself', it says so.
> This runs today. Add the timeline to Google or Outlook Calendar, open it in Excel, or send the plan to their own Zapier in one click. We never hold their passwords."

**Click:** "Add timeline to my calendar" (show the download), then scroll.

### 4:40–6:00 · Demo 3: the review, beyond reviews (Applicability + Architecture) — **S**
**Screen:** **Compare tools** section, then expand one card.
> "Ratings aren't stars. Each tool is scored on five pillars: does it solve your #1 problem, true cost *at your call volume*, works with your tools, security and control, and ease of setup. The weights adjust to *this* owner. Here: Jobber is must-keep, so compatibility counts more.
> Look at Goodcall: a red security badge. Its own privacy page says it uses call recordings to train its AI. That's quoted, linked, and reviewed by our team. Chatbase, by contrast, is green: SOC 2 Type II, and it doesn't train on your data.
> Setup is an objective tier. Phone agents are tier 3 because you must set up call forwarding with your carrier.
> Fit and confidence are separate. Tools we can't verify never become top picks.
> And this is new: **proven by owners like you.** Owners who got a plan from us check in after 30 days. Similar businesses count most, and we use a Bayesian average so a few early ratings can't game it."

**Click:** expand "Security & privacy details" on Goodcall. Optionally submit one check-in.

### 6:00–6:50 · Demo 4: honest gaps and live discovery (Applicability) — **S**
**Screen:** `/start?demo=cafe`.
> "A cafe whose #1 problem is food waste. Our reviewed catalog has no inventory-forecasting tool, and we say so. We won't invent one. One click searches the web live. These are real products, each linked to its own website and labelled 'not yet verified'. Meanwhile the rest of the plan (receipts into QuickBooks, Instagram posts) costs $0."

**Click:** "Search the web for inventory and demand forecasting tools".

### 6:50–8:00 · How we built it (Architecture & scalability) — **A**
**Screen:** `/architecture`.
> "Three engines, Discover, Review and Integrate, connected by versioned records: the Business Brief, the discovery result and the review result. Any engine can be replaced or scaled on its own.
> The core is rules-based: every plan costs zero dollars to produce and is fully testable. AI sits at the edges: understanding unusual wording, finding new tools on the web, and extracting cited facts. It always runs against our fixed list of needs, behind a hard spending cap. The whole demo cost about 70 cents in AI.
> Questions, needs and tool tags are data, not code. A new industry is a data edit, not a rewrite."

### 8:00–9:00 · Evidence it works, and the 16-week plan — **A** + **L**
**Screen:** `/architecture` roadmap table, or a slide with the numbers.
> **A:** "Proof: on 15 owner problems we had never seen, it identified the right needs 15 out of 15 and put an acceptable tool in the top three every time. 87 automated tests. And when our own data was wrong (3 of 30 facts), we changed the rules: blog posts never count, and red badges need a human-reviewed quote."
> **L:** "In 16 weeks:
> - Weeks 1–3: move data to Postgres, with accounts.
> - Weeks 4–6: 500 plan-verified tools and a human approval queue.
> - Weeks 7–9: marketplace ingestion and one-click Zapier templates.
> - Weeks 10–12: read-only connections to detect each owner's software.
> - Weeks 13–16: a pilot with an SBDC and a trade association, measured by one number: owners who say the problem is fixed after 30 days."

### 9:00–9:45 · Close — **S**
**Screen:** plan page, "Your AI stack" card.
> "Small businesses don't need another list of AI tools. They need a trusted advisor that understands their business, is honest about what it doesn't know, and gets them to a working setup. That's bizzimpact.ai. Thank you."

---

## Rubric map (where each point is earned)
| Criterion | Where in the video | Proof on screen |
|---|---|---|
| Depth of research (10) | 0:00–1:40, 8:00 | Census, Fed, NFIB, OECD; competitor methods; RESEARCH.md |
| Small Business Applicability (10) | 3:10–6:50 | Existing software kept; legacy apps (QuickBooks, Jobber, Calendar); SBA SBDC/SCORE links; cost at usage; plain language |
| Architecture & Scalability (10) | 4:40–6:00, 6:50–8:00 | `/architecture`; versioned records; data-not-code; rules core and AI edges; spend cap |
| User Experience (10) | 1:40–4:40 | 7-step check-up, "Not sure" everywhere, one-link demo, review screen, clear plan |
| Demo & presentation (10) | Whole video | Three speakers; numbers; live product, no slides needed |

## Likely judge questions (have answers ready)
- **"Is it really discovering tools?"** Yes: live web search plus a catalog that grows (126 found so far, labelled unverified until a person approves them).
- **"Why trust your scores?"** The method is published at `/methodology`, every fact is quoted and linked, and nobody can pay for ranking.
- **"Do you integrate for real?"** We plan workflows and hand them to tools owners trust (calendar file, spreadsheet, their own Zapier/Make). We deliberately don't hold credentials. Read-only detection via partners is in the 16-week plan.
- **"What if your data is wrong?"** It happened (3 of 30). We caught it and changed the rules. Unknowns lower confidence; they never inflate scores.
- **"Business model?"** Free for owners; licences to SBDCs, banks and chambers. No paid ranking; any future referral fees disclosed and kept out of scores.

## Recording checklist
- [ ] Clear browser storage, or use a private window, so the check-up starts empty
- [ ] Rehearse once with a stopwatch; cut words, not demo
- [ ] Record the screen at 1080p and the voice with a headset mic
- [ ] Each speaker appears or is named on screen at least once
- [ ] Export, check the audio, upload to the designated Google Drive **before 11:59 pm**
