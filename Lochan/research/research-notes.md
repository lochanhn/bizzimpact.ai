# Understanding the problem — research notes

First research batch: November 6, 2026.

We are currently investigating business problems, existing evidence, and what still needs to be established. No target sector, final problem statement, software design, or implementation has been selected. Source IDs link to [sources.md](sources.md), which also records review depth and saved reports.

## 1. There is evidence of a tool-selection and adoption problem

In the Federal Reserve survey, 54% of firms planning to use AI reported difficulty finding/adapting tools to business needs, and 37% cited implementation/training time. Among current AI users, accuracy was a challenge for 46%, and fit/adaptation for 43%. These are different respondent groups, not percentages of all small businesses. The AI-barriers chart uses N=810 planned users and N=2,203 current users. [S01, printed page 28]

**Our interpretation:** The hackathon's premise has support, but “help people discover tools” captures only part of the difficulty. Fit, accuracy, and getting started deserve investigation too.

**Not established:** Which barrier is most important in each of the four example business types, or whether owners would use a new website to address it.

## 2. Existing systems and business size matter

NFIB reports 29% of owners prefer leaving working technology alone. Among owners who had not introduced new/improved technology, 19% said their earlier purchase still worked. The latter denominator is a subgroup, not all owners. Smaller businesses show lower uptake of technology than larger firms. [S02, pages 2–4]

**Our interpretation:** Asking an owner to replace working systems may add burden. We must discover the actual starting workflow before discussing AI adoption.

**Not established:** The current market share of any software among our target sectors, or the number using paper, spreadsheets, on-premises software, or cloud systems. None of these can be assumed from the word “legacy.”

## 3. The barriers are broader than lack of awareness

Among OECD survey non-users of generative AI, 57.3% said it did not suit their work, 52.5% were concerned about information supplied to models, and 49.8% cited employee skill gaps. These estimates cover seven non-US countries, not US owners. [S03, printed pages 41–42 / PDF pages 43–44]

**Our interpretation:** We should examine whether a task is suitable for AI at all, what information it needs, and what skills are required. A lack of enthusiasm need not mean an owner simply needs persuading.

**Not established:** That any proposed tool is safe, suitable, or beneficial for a particular business. Survey concerns do not replace product-specific checks.

## 4. Actual owner accounts reveal different problems

### Coffee shop: staffing and repeat customers

Mo Shalash of The Brew Crew describes hiring dependable staff as central to keeping the business viable. His account connects staff quality and service relationships with repeat customers. [S05, transcript discussion of labor philosophy and retention]

**Interpretation:** Our original “help a café make promotional posts” example may overlook more pressing needs. We should investigate training, staffing administration, and repeat-customer workflows before prioritizing marketing.

**Boundary:** One owner's experience does not establish the biggest problem for cafés generally. AI cannot simply supply reliable staff or substitute for hospitality.

### Landscaping: scattered requests and forgotten quotes

Brandon Comstock describes tracking property issues and requested extras through email, Google Maps pins, and spreadsheets. His business used LMN for customers, crews, and time, but struggled to retain and follow up on site issues and postponed quotes. [S06, transcript section on developing IssueID]

**Interpretation:** This is a concrete case of a gap between existing systems and a specific workflow. “What software do you use?” alone would miss where information falls through.

**Boundary:** He co-founded software addressing that gap, so commercial interest matters. This account does not prove those products lack the same features today, or that AI is necessary.

### Landscaping: administration and physical capacity are different

Landscape Management reports Velvet Green's operator handling accumulated voicemails while missing additional calls. He estimated an answering service saved two to four hours weekly. Separately, Left Side Lawn Care's owner reduced maintenance work because he could not find enough help and invested in equipment efficiency. [S07, call-handling and “Getting efficient” sections]

**Interpretation:** Call handling is an administrative task; mowing capacity is physical work. They require different responses. Some useful solutions may be ordinary software, outsourced services, or equipment rather than AI.

**Boundary:** Savings are self-reported from an older article. The answering service example does not establish an AI benefit or a typical saving.

### HVAC: a promising lead, with insufficient independent evidence so far

The Contracting Business Q&A describes possible losses between call intake, callbacks, dispatch, and booking. However, the interviewee sells an AI solution. [S08]

**Interpretation:** These steps provide a workflow to investigate, not proof that we should build around missed calls.

**Evidence still needed:** Named HVAC-owner accounts and stronger data about the size and frequency of this problem. We have not yet established either.

### Restaurants: cost pressure and existing automation

The National Restaurant Association's public summary emphasizes understanding food costs relative to sales. It explicitly warns that a lower cost ratio does not mean ingredients became cheaper. [S09]

TouchBistro's release describes existing automation in ordering, invoicing, marketing, inventory, and booking. [S10]

**Interpretation:** Restaurant problems may involve margins and how existing systems are used, not an absence of tools. A café, independent full-service restaurant, and larger chain should not automatically share one problem statement.

**Boundary:** The paid association dataset and TouchBistro's full methodology were not reviewed. No financial benchmark or adoption rate is being generalized to mom-and-pop restaurants.

## 5. Academic evidence cautions against promising benefits from access alone

Otis and colleagues studied randomized access to AI business advice among Kenyan entrepreneurs. Their published abstract reports no statistically detectable average improvement in revenues/profits and different effects across initial performance groups. [S04]

**Our interpretation:** Giving someone an AI assistant is not equivalent to improving their business. Appropriate advice, interpretation, implementation, and outcome checks all matter.

**Boundary:** This is one intervention in a different setting. It does not prove AI is generally ineffective, and cannot predict our US users' outcomes. We reviewed the published abstract and introductory material, not the full study. The downloaded older manuscript must not be cited as the final published version.

## 6. What is known, what is suggested, and what is unproven

| Status | What we can say now |
|---|---|
| Supported at a broad level | Firms report difficulties selecting/adapting AI and finding implementation time; data, skills, and relevance also matter. |
| Supported in particular published accounts | Some owners/operators experience hiring problems, request/quote tracking gaps, or call-handling backlogs. |
| Suggested by our interpretation | Understanding the current workflow and practical constraints may be more useful than presenting a large tool list. |
| Still unproven | Best target sector, most valuable task, willingness to use/pay for our platform, suitable tools, reliable connections, and measurable benefits. |

We should not rank sectors by counting how many articles a search engine returned. Nor should we combine survey adoption figures with different populations, dates, definitions, and methods into one “AI adoption rate.”

## 7. Working problem statement — deliberately provisional

Some small-business owners struggle to work out whether an AI tool fits a specific operational problem, works with their current workflow, and is worth the time and cost to adopt.

This is our synthesis of the initial evidence, not a final validated claim about all businesses. We still need to identify which owners, which recurring task, and what constraints make the problem specific enough to address.

## 8. What needs to be quantified before we make strong claims

These are measurement questions, not results we have already collected:

| Area | What to establish | Why |
|---|---|---|
| Frequency | Calls, requests, quotes, or other tasks per week | A rare inconvenience may not justify a new tool |
| Effort | Minutes per task, including checking and correcting work | Gross automation time is not net time saved |
| Business impact | Missed bookings, delayed quotes, errors, or lost follow-ups | Connect the task to an actual business outcome |
| Starting systems | Where information enters, is stored, and gets transferred | Exposes duplicates, handoffs, and compatibility needs |
| Total cost | Subscription, usage, setup, maintenance, and staff time | Avoid misleading “starting at” prices |
| Quality | Correctness and completeness for a defined sample task | Generated output alone does not prove success |
| Adoption burden | Steps, permissions, accounts, and training required | A capable tool may still be impractical |

If a paper measures perceived benefits, report them as perceived. If no reliable baseline is available, state that gap rather than inventing time savings or ROI.

## 9. Where the research continues

- Strengthen independent HVAC evidence and gather more current sector-specific accounts.
- Check whether the same problems recur across several independent sources.
- Review methods and relevant sections of additional papers, including evidence that challenges our assumptions.
- Document existing workflows and what tools already solve before proposing another product.
- Narrow the problem only when the evidence supports a clear choice.

This is the first evidence batch, not a completed market study. No coding, API use, owner outreach, or desktop application launches occurred.
