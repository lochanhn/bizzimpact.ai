# bizzimpact.ai website

Working local V1 built with Next.js, React, TypeScript and Zod. Uses a reviewed, versioned local catalogue; no database account or AI key is required.

## Run

```sh
cd website
npm ci
npm run dev
```

Then visit the printed local address yourself. No browser opens automatically. Use `npm run build` and `npm start` for a production build. Node 20.9 or newer is required.

## Included

- Responsive landing page and searchable/filterable 111-tool catalogue across seven business areas.
- Two adaptive assessment branches: marketing (eight questions) and phone/website enquiries (seven questions).
- Editable review, tab-session persistence, clear-answers control, and fictional demo scenarios.
- Validated server-side matching, plan/budget gates, explained fit scores, evidence links, separate needs-checking results, and useful empty/error states.
- Documentation-based guides, text-plan downloads and a generic blank enquiry CSV.
- Keyboard focus management and modal focus trapping. Visual and real-browser checks are still pending; no desktop application was launched.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Simulated-page tests cover both owner journeys, guides, catalogue search and clearing saved answers. These do not replace visual/browser checks. Matching/API tests cover annual commitments, overages, incompatible requirements, unknown prices/usage, unsupported tasks, schema validation, and ranking. They do not establish vendor product quality.

## Code

- `app/page.tsx`: owner journey, catalogue and guides.
- `app/globals.css`: responsive visual design; plain CSS keeps this initial build small.
- `app/api/assess/route.ts`: validates requests and returns deterministic matches.
- `app/api/catalog/route.ts`: public catalogue and source links.
- `lib/catalog.ts`: original tools, category definitions and unified 111-tool catalogue.
- `data/catalogue-expansion.json`: 100 additional evidence-linked research records.
- `lib/catalogue-expansion.ts`: type-safe adaptation, selected plan details and research checklists.
- `scripts/generate-catalogue-research.mjs`: regenerates the source register and findings from the reviewed records.
- `lib/assessment.ts`: answer schema and shared labels.
- `lib/match.ts`: plan selection, hard gates, cost calculations and scoring.

## Current limits

The active catalogue is a local fixture, not Supabase. No SQL credentials, authentication, AI interpretation, live vendor account connections, automated discovery, or deployment are configured. Owner free text is context only, not interpreted by AI. A SQL catalogue adapter can replace the local read without changing matching rules later.

Tool facts come from the project research and official pages reviewed November 7, 2026. Sources and unknowns are visible in the UI. Tools and setup guides have not been tested in vendor accounts. The application provides guidance, not installation or verified business outcomes.

Assessment bodies are not deliberately logged or stored on the server. Tab sessionStorage holds answers until cleared or the tab session ends. Review hosting access/error logs before deployment. Do not put the saved OpenRouter key in this app or use a `NEXT_PUBLIC_` variable for a secret. No paid API calls were made.

Research and proposed product scope: `../Lochan/v1-specification.md` and `../Lochan/research/`.

Verification on November 7, 2026: 21 automated tests passed, TypeScript and the production build passed, and the production server returned HTTP 200 for the homepage and catalogue. Actual HTTP requests returned Buffer for the cafe example and Goodcall for the HVAC example. The temporary verification server was stopped. No browser was opened; visual verification remains pending.

## Catalogue expansion

The catalogue now contains 111 distinct products: the original 11 and 100 additions. Fourteen have selected plan details (not necessarily complete compatibility or pricing); 97 are product-level reviews with plan checks outstanding. Unknown prices stay null. Product-only records cannot become confirmed matches or receive public fit scores. Broader finance, sales, automation and productivity categories are browsable; the questionnaire still supports phone enquiries, website enquiries and social content.

Catalogue search includes existing-software notes. Category and review-depth filters, incremental loading, per-tool research notes and filtered CSV export make the larger dataset usable. Official sources and findings are in `../Lochan/research/tool-catalogue/`. Research checklists for additions are labelled separately from the original setup guides.

Expansion verification: 31 automated tests and the production build passed. HTTP checks against the restarted localhost server confirmed 111 unique entries, 100 research additions, seven categories, Wordtune in the relevant free-text candidate flow, and Jasper held in needs-checking. Source/findings coverage was checked for all 100 additions. Browser visual checks remain pending; no browser was opened.
