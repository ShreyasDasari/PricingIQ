# PricingIQ — AI-Enabled Pricing Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Recharts](https://img.shields.io/badge/Recharts-2.13-22C55E?style=flat-square)](https://recharts.org)

[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-5-black?style=flat-square&logo=vercel)](https://sdk.vercel.ai)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)](https://pricingiq.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

**Live demo:** [pricingiq.vercel.app](https://pricingiq.vercel.app)

A full-stack pricing analytics platform that replaces manual quarterly reviews with real-time waterfall analysis, AI-generated executive summaries, and a multi-agent deal decision system — built specifically to demonstrate applied AI engineering for enterprise pricing operations.

---

## What Is This?

### The Problem

At most B2B software companies, pricing decisions happen in spreadsheets. A deal closes at 40% off list price, and nobody flagged it during the pipeline review because the analyst was working from a static Excel export pulled two weeks ago. Revenue leaks silently — volume discounts stacked on top of promotional discounts stacked on top of partner margin, with no single view showing where the money disappeared. By the time leadership asks why realized revenue came in $4M below forecast, the quarter is already closed. There is no early warning system, no pattern detection across deals, and no way for an analyst to assess a $1M deal in under an hour without building a custom model from scratch.

### What PricingIQ Does

PricingIQ gives a pricing analyst a live command center for their entire deal book. In ten seconds, an analyst can see exactly how much revenue leaked at each discount stage across 500 active deals, which deals are violating the approved discount corridor, and which ones carry the highest risk. In thirty seconds, they can generate a board-ready executive summary written in plain English — filtered to any product line, customer segment, or region — without touching a spreadsheet. And when a specific deal needs a decision, the War Room runs three specialized AI agents simultaneously to produce a structured verdict: approve it, escalate it, or send it back for renegotiation, with the exact dollar exposure quantified.

### Who Built It and Why

This project was built by Shreyas Dasari as a demonstration of applied AI engineering and pricing analytics capability for PTC Inc.'s Pricing Analyst role (JR111667). Rather than presenting slides about what he could build, Shreyas built it. The platform runs on 500 synthetic deals modeled on real enterprise SaaS pricing patterns across PTC's three core product lines (Creo, Windchill, and Service), four customer segments, and three global regions. Every number in the dashboard is derived from this dataset using the same analytical logic a pricing team would apply to live CRM data. Connect with Shreyas on [LinkedIn](https://linkedin.com/in/shreyasdasari).

---

## Platform Modules

### Pricing Waterfall Dashboard

**For the analyst:** Select any combination of product, segment, and region, and immediately see a waterfall chart decomposing list price into volume discounts, promotional discounts, partner discounts, net price, revenue leakage, and realized revenue — all in millions of dollars. Four KPI cards at the top give instant headline numbers; the corridor breakdown below shows how many deals fall inside, near, or outside the approved discount band.

**Under the hood:** Filtering runs client-side via `useMemo()` against the 500-deal in-memory dataset, so every dropdown change produces zero-latency recalculation. The `getWaterfallData()` function aggregates seven waterfall bars by summing each discount type across the filtered deal set. The chart itself is a Recharts `ComposedChart` with two stacked `Bar` layers — a transparent "invisible" bar that floats the colored bar to its correct Y position, producing the classic waterfall effect without a specialized chart type.

---

### Deal Corridor Analysis

**For the analyst:** A scatter plot maps every deal by discount rate (X-axis) versus list price (Y-axis), color-coded green, amber, or red based on whether the deal falls within, near, or outside the approved corridor. Three color-shaded reference zones make the boundary visible at a glance. Clicking any dot opens the full deal detail panel on the right.

**Under the hood:** The scatter chart uses Recharts `ReferenceArea` components to paint the three corridor zones directly on the chart canvas, and `ReferenceLine` markers at 20% and 35% to draw the exact boundary lines. Each dot's `Cell` component reads `corridorStatus` from the deal object and applies the corresponding color token. The selected deal state is managed in `DealsPage` and passed down to `CorridorScatter` as a prop, so both the chart and the table stay in sync on selection.

---

### Deal Scoring Engine

**For the analyst:** Every deal in the filtered set is scored 0–100 for risk and sorted accordingly. The table shows deal ID, product, segment, rep, list price, discount rate (color-coded by corridor status), net price, days in pipeline, and risk level. Clicking any row opens a factor attribution panel that shows exactly which inputs drove the score — like a simplified explanation of why a specific deal was flagged.

**Under the hood:** Risk scores are computed deterministically during data generation using a four-factor weighted formula: `riskScore = 0.4 × normalizedDiscount + 0.2 × normalizedDealSize + 0.2 × normalizedPipelineAge + 0.2 × (1 − closeRate)`. Each factor is normalized to [0, 1] against its product-specific range before weighting. The `shapFactors` field stored on each deal records the per-factor contribution, which the attribution panel renders as proportional bar charts with the weight labelled alongside each factor. The table renders up to 100 deals after client-side filtering and sorting, controlled by a `sortBy` state variable that accepts `riskScore`, `listPrice`, or `totalDiscountRate`.

---

### AI Narrative Generator

**For the analyst:** Choose a scope (any product, segment, and region combination), click Generate Narrative, and watch a 3–4 sentence executive summary stream in real time — written in the style of a McKinsey analyst briefing a VP of Sales. The summary covers overall pipeline health, the primary risk area with specific numbers, a recommended action, and the most critical deal or segment to watch.

**Under the hood:** The page uses the `useCompletion` hook from `@ai-sdk/react` with `streamProtocol: "text"`, which opens a streaming HTTP connection to `POST /api/narrative`. The route filters the deal set server-side, computes a compact stats string (total list, net, realized revenue; avg discount; corridor violations; high-risk count; per-product breakdown; top 3 risk deals by ID), and passes it as the prompt to `streamText()` with `gemini-flash-latest`. The system prompt instructs Gemini to use only the provided numbers and produce exactly 3–4 sentences of flowing prose with no headers or bullet points. The edge route has a `maxDuration` of 30 seconds.

---

### Intelligent Alerts System

**For the analyst:** Four configurable alert rules — Discount Ceiling, Realization Rate Floor, Pipeline Age Limit, and Large Deal Approval — each with a slider to set the threshold. Changing any slider instantly recomputes the breach list across all 500 deals. The breach count updates live as you drag, and clicking a rule card shows the full list of breaching deals in a sortable table.

**Under the hood:** Alert rules are defined as an array of `AlertRule` objects, each carrying its threshold bounds, step size, severity level, and a `check` function typed as `(deal, threshold) => boolean`. Thresholds live in a `Record<string, number>` state object. A single `useMemo()` call runs all four `check` functions across all 500 deals whenever any threshold changes, producing the per-rule breach lists in one pass. The Discount Ceiling rule fires when `totalDiscountRate * 100 > threshold`. The Large Deal Approval rule fires when `listPrice > threshold * 1000 && totalDiscountRate > 0.25` — requiring both size and discount conditions to be met simultaneously.

---

### Deal War Room (Multi-Agent System)

**For the analyst:** Enter any deal's parameters — product, segment, region, list price, total discount rate, days in pipeline, and optional deal context — and click Analyze. The War Room runs four AI agents and returns a structured decision: APPROVE, ESCALATE, or RENEGOTIATE, with a confidence level, a four-sentence executive summary, a primary action, and a quantified revenue impact. Three preset deals (High-Risk Partner, Standard Enterprise, Borderline Mid-Market) allow immediate exploration without manual entry.

**Under the hood — the full architecture:**

The War Room implements a genuine multi-agent orchestration pattern. The request lifecycle has four stages.

**Stage 1 — Deterministic tool execution (synchronous, TypeScript).** Before any AI call is made, three tool functions execute in sequence on the server:

`findSimilarDeals()` queries the 500-deal dataset for historical comparables. It uses a three-tier fallback: first, it searches for deals with the same product, same segment, and total discount within ±10 percentage points. If fewer than four matches are found, it relaxes to same product with ±15pp discount. If still insufficient, it falls back to same segment. It sorts the pool by discount proximity and takes the eight closest deals, then computes aggregate statistics: average discount rate, average realization rate, average days in pipeline, and corridor violation rate across the comparable set.

`prosecuteRisk()` takes the comparables data and computes financial exposure. Projected leakage is `max(0, listPrice × (rate − 0.20))` — the dollar amount above the 20% corridor target. Annualized risk exposure multiplies that by four. Escalation probability is classified as High if `rate > 0.42` or `daysInPipeline > 120`, Medium if `rate > 0.28` or `daysInPipeline > 60`, and Low otherwise.

`architectDeal()` computes the restructuring recommendation. The discount type to reduce is segment-driven: Partner deals reduce partner margin, Enterprise deals reduce volume discount, all others reduce promo discount. The recommended total discount is `min(currentRate, 0.20)`. Approval tier is Standard for rates ≤ 20%, VP Approval for rates ≤ 35%, and C-Suite Approval above that.

These three functions produce fully structured, deterministic data objects before any AI is involved. This is the "tool use" pattern from agentic AI design: TypeScript functions serve as the tools that ground each agent in verifiable facts.

**Stage 2 — Parallel specialist agent execution (`Promise.all`).** Three Gemini Flash agents fire simultaneously via `Promise.all([runDetective(), runProsecutor(), runArchitect()])`. Each agent receives its corresponding tool data pre-injected into the prompt as structured context. Each agent has a distinct system role and is instructed to respond with a strict JSON schema — no markdown, no code blocks, no explanation. The schemas are:

- `DetectiveOutput`: `similarDealsFound`, `avgDiscountRate`, `avgRealizationRate`, `avgDaysInPipeline`, `corridorViolationRate`, `pattern` (2–3 sentence narrative)
- `ProsecutorOutput`: `projectedLeakage`, `annualizedRiskExposure`, `escalationProbability`, `worstCaseRealization`, `prosecution` (worst-case narrative)
- `ArchitectOutput`: `recommendedTotalDiscount`, `discountToReduce`, `reductionAmount`, `projectedRealizationImprovement`, `approvalTier`, `architecture` (prescriptive recommendation)

Each agent runner wraps its `generateText()` call in a `parseJson<T>()` helper that strips any accidental markdown fencing and falls back to a fully-typed TypeScript default object if parsing fails, making the system resilient to malformed model output in production.

Firing three agents in parallel reduces total latency from roughly 15 seconds (sequential) to roughly 5 seconds (concurrent), since each Gemini call takes approximately 3–5 seconds independently.

**Stage 3 — Sequential orchestrator synthesis.** After `Promise.all` resolves, the Orchestrator agent runs as a fourth, sequential call. It receives the full structured outputs of all three specialist agents — quantified findings from the Detective, the worst-case prosecution from the Prosecutor, and the restructuring blueprint from the Architect — and synthesizes them into a final decision. Its output schema is:

`OrchestratorOutput`: `decision` (APPROVE | ESCALATE | RENEGOTIATE), `confidenceLevel` (High | Medium | Low), `executiveSummary` (exactly 4 sentences), `primaryAction` (one sentence), `revenueImpact` (one sentence).

The Orchestrator runs after the parallel stage because its inputs are the outputs of the other three agents — it cannot start until all three complete. This is a fan-in pattern: three parallel branches merge into one synthesis step.

**Stage 4 — Response and UI reveal.** The route returns a single `WarRoomResponse` JSON object containing all four agent outputs plus `durationMs`. The client renders four cards in a 2×2 grid, revealed with a 150ms staggered animation (`i * 150ms` delay per card). A live elapsed-time counter runs during the loading state to communicate that work is actively happening.

This architecture qualifies as a genuine agent system — not a chatbot — because the agents do not respond to conversation turns. Each agent receives a structured context derived from tool execution, produces a structured output with a defined schema, and that output becomes the input to the next stage. The system plans (tool selection is deterministic and segment-aware), uses tools (TypeScript functions as grounding mechanisms), and produces outputs that feed downstream computation. The route has a `maxDuration` of 60 seconds to accommodate the two-stage AI execution pattern on Vercel's edge runtime.

---

## Architecture Overview

### Tech Stack

| Layer | Technology | Why This Choice |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | React Server Components by default, edge-compatible API routes, zero-config Vercel deployment, `next/font` for optimized font loading |
| Language | TypeScript 5 (strict mode) | Full type safety across the data pipeline — every deal field, every agent input/output, every API contract is typed; strict mode catches null-safety issues at compile time |
| Styling | Tailwind CSS 3 | Utility-first approach eliminates CSS file management; `cn()` utility (clsx + tailwind-merge) handles conditional class composition cleanly |
| Charting | Recharts 2.13 | Composable React chart components; the stacked-bar trick for waterfall charts is well-supported; `ScatterChart` with `ReferenceArea` handles corridor visualization without a third-party plugin |
| AI model | Google Gemini Flash (`gemini-flash-latest`) | Low latency on inference-heavy workloads; the War Room makes four Gemini calls per request — Flash's speed makes the parallel pattern viable within the 60-second edge limit |
| AI SDK | Vercel AI SDK 5 (`ai`, `@ai-sdk/google`, `@ai-sdk/react`) | Unified interface for streaming (`streamText`) and single-turn generation (`generateText`); `useCompletion` hook handles SSE streaming state on the client with one line |
| Deployment | Vercel | Native Next.js support; edge runtime for API routes; `maxDuration` configuration for long-running agent calls; environment variable management |
| Data layer | In-memory TypeScript module | 500 synthetic deals generated at module load time with a seeded PRNG — no database, no cold-start data fetch, zero-latency filtering via `useMemo` |

### Data Architecture

The dataset is 500 deals generated deterministically by `src/data/deals.ts` using the mulberry32 pseudorandom number generator with seed 42. Because mulberry32 is seeded, the same 500 deals are produced on every run, in every environment, without any database or external dependency. The generation logic runs once at module initialization and the resulting array is exported as a constant.

Each deal carries the following fields:

`id` — sequential identifier in the format `DEAL-0001` through `DEAL-0500`. `product` — one of Creo, Windchill, or Service, drawn uniformly at random. `segment` — one of Enterprise, Mid-Market, SMB, or Partner. `region` — one of Americas, EMEA, or APAC. `quarter` — one of Q1 through Q4. `rep` — one of 15 named sales representatives.

`listPrice` — product-specific range: Creo $25K–$500K, Windchill $75K–$2M, Service $30K–$800K, rounded to the nearest $1K. `volumeDiscount`, `promoDiscount`, `partnerDiscount` — segment-aware rates. Enterprise volume discounts range 5–20%; SMB 0–6%; Partner 8–18%. Promo discounts are uniform 0–12%. Partner discounts are 5–15% for Partner-segment deals, 0–8% for others. `totalDiscountRate` — sum of all three discount rates, hard-capped at 0.55 to match enterprise pricing governance norms. `netPrice` — `listPrice × (1 − totalDiscountRate)`. `realizedRevenue` — net price adjusted by segment-aware noise: Enterprise gets a slight upside bias (−5% to +8%) reflecting upsell and expansion potential; SMB gets a downside bias (−12% to +2%) reflecting higher churn and collection risk; Mid-Market and Partner receive moderate noise (−7% to +4%).

`daysInPipeline` — uniform 1–180 days. `closeRate` — derived as `max(0.05, 1 − totalDiscountRate × 0.8 − daysInPipeline / 400)`, penalizing deep discounts and pipeline stagnation. `riskScore` — a four-factor weighted composite. `riskLevel` — High if `riskScore > 0.6`, Medium if `> 0.35`, Low otherwise. `corridorStatus` — green if `totalDiscountRate ≤ 0.20`, yellow if `≤ 0.35`, red if `> 0.35`. `shapFactors` — the per-factor contribution to the composite risk score, stored as `{ discount, dealSize, pipeline, closeRate }`.

The 15 sales rep names are distributed uniformly across the dataset. The list price floors were deliberately set at enterprise-realistic minimums (Creo at $25K, Windchill at $75K) and the discount cap was set at 55% to reflect actual enterprise SaaS pricing governance constraints.

### AI Architecture

The project uses two distinct AI patterns, matched to two different use cases.

**Pattern 1 — Prompted Summarization (Narrative Generator).** This is a single-turn, non-agentic pattern. The server computes a compact, structured stats string from the filtered deal data — covering pipeline totals, average discount, realization rate, corridor violations, per-product breakdown, and the top three highest-risk deal identifiers — and injects it into the prompt as context. The system prompt instructs Gemini Flash to behave as a senior pricing analyst writing a McKinsey-style briefing, constrains the output to exactly 3–4 sentences of flowing prose, and prohibits fabricating numbers not present in the context. The response streams token-by-token to the client via `streamText()` and the Vercel AI SDK's text stream protocol. This pattern is appropriate here because the task is bounded, the data is fully structured before the AI call, and no planning or tool use is required.

**Pattern 2 — Multi-Agent Orchestration (Deal War Room).** This is a genuine agentic pattern. What makes it agentic is not that it calls an LLM multiple times — it is that each agent has a defined role, receives tool-grounded context, produces a structured output that becomes another agent's input, and the system exhibits a fan-out / fan-in topology with a synthesis layer. The three specialist agents run in parallel after their respective tool functions have populated their contexts with deterministic data. The Orchestrator receives all three outputs and synthesizes a decision that could not be produced by any single agent alone. The TypeScript tool functions are not optional preprocessing — they are the grounding mechanism that prevents the AI from hallucinating numbers. Every dollar figure the AI agents cite in their narratives comes from a TypeScript computation, not from the model's parametric memory.

### API Design

**`POST /api/narrative`**

Input (JSON body):
```json
{
  "product": "Creo | Windchill | Service | All",
  "segment": "Enterprise | Mid-Market | SMB | Partner | All",
  "region": "Americas | EMEA | APAC | All"
}
```

Output: `text/plain` streaming response (Vercel AI SDK text stream protocol). Each chunk is a token fragment of the generated narrative. `maxDuration: 30`.

**`POST /api/war-room`**

Input (JSON body, typed as `WarRoomInput`):
```json
{
  "product": "string",
  "segment": "string",
  "region": "string",
  "listPrice": "number",
  "totalDiscountRate": "number (0–100 percentage scale)",
  "daysInPipeline": "number",
  "dealDescription": "string (optional)"
}
```

Output (JSON, typed as `WarRoomResponse`):
```json
{
  "detective": {
    "similarDealsFound": "number",
    "avgDiscountRate": "number",
    "avgRealizationRate": "number",
    "avgDaysInPipeline": "number",
    "corridorViolationRate": "number",
    "pattern": "string"
  },
  "prosecutor": {
    "projectedLeakage": "number",
    "annualizedRiskExposure": "number",
    "escalationProbability": "Low | Medium | High",
    "worstCaseRealization": "number",
    "prosecution": "string"
  },
  "architect": {
    "recommendedTotalDiscount": "number",
    "discountToReduce": "volume | promo | partner",
    "reductionAmount": "number",
    "projectedRealizationImprovement": "number",
    "approvalTier": "Standard | VP Approval | C-Suite Approval",
    "architecture": "string"
  },
  "orchestrator": {
    "decision": "APPROVE | ESCALATE | RENEGOTIATE",
    "confidenceLevel": "High | Medium | Low",
    "executiveSummary": "string",
    "primaryAction": "string",
    "revenueImpact": "string"
  },
  "durationMs": "number"
}
```

`maxDuration: 60`. Returns `400` on invalid request body, `500` if any agent or the orchestrator throws.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: Sidebar + scrollable main area, page metadata
│   ├── page.tsx                # Root redirect → /landing
│   ├── globals.css             # Tailwind base + component classes (.ent-table, .metric-value,
│   │                           #   .data-badge-*), CSS custom properties, keyframe animations
│   │
│   ├── landing/
│   │   └── page.tsx            # Full-screen dark landing page: PTC logo image, headline,
│   │                           #   role badge, CTAs, stat pills, DM Sans font, fadeUpIn animations
│   ├── demo/
│   │   └── page.tsx            # Module overview page: four cards with inline SVG mini-visualizations
│   │                           #   (WaterfallVisual, ScatterVisual, NarrativeVisual, AgentVisual)
│   ├── dashboard/
│   │   └── page.tsx            # Main metrics dashboard: 8 KPI cards, product breakdown table,
│   │                           #   segment breakdown table, critical alert feed, module nav links
│   ├── waterfall/
│   │   └── page.tsx            # Pricing waterfall: 3-filter UI, 4 KPIs, WaterfallChart component,
│   │                           #   per-discount-type breakdown footer, corridor band analysis bars
│   ├── deals/
│   │   └── page.tsx            # Deal scoring: CorridorScatter + sortable/filterable deal table
│   │                           #   + factor attribution side panel with composite score gauge
│   ├── narrative/
│   │   └── page.tsx            # AI narrative: filter scope selector, 4 KPIs, streaming text output,
│   │                           #   useCompletion hook, "How This Works" three-step explainer
│   ├── alerts/
│   │   └── page.tsx            # Intelligent alerts: 4 rule selector cards, threshold sliders,
│   │                           #   live breach count, full deal breach table
│   ├── war-room/
│   │   └── page.tsx            # Multi-agent UI: deal input form, 3 preset buttons, agent loading
│   │                           #   skeleton cards, staggered-reveal 2×2 results grid
│   │
│   └── api/
│       ├── narrative/
│       │   └── route.ts        # POST: filters deals server-side, builds stats string, streams
│       │                       #   Gemini Flash response via streamText; maxDuration: 30
│       └── war-room/
│           └── route.ts        # POST: 3 synchronous tool functions → Promise.all(3 agents)
│                               #   → sequential orchestrator → WarRoomResponse; maxDuration: 60
│
├── components/
│   ├── Sidebar.tsx             # Dark sidebar (220px): PricingIQ logo, 6 nav links with SVG icons,
│   │                           #   active state (border-l-2 highlight + bg), live data footer
│   ├── KpiCard.tsx             # Reusable metric card: value, label, QoQ delta indicator,
│   │                           #   vsTarget secondary line, status-driven left border accent color
│   ├── WaterfallChart.tsx      # Recharts ComposedChart: stacked transparent + colored bars,
│   │                           #   custom dark tooltip, zero reference line, no animation
│   └── CorridorScatter.tsx     # Recharts ScatterChart: 3 ReferenceArea corridor zones,
│                               #   2 ReferenceLine boundaries, click-to-select, custom dark tooltip
│
├── data/
│   └── deals.ts                # 500 synthetic deals via mulberry32 PRNG (seed 42); Deal interface;
│                               #   Product/Segment/Region/RiskLevel/CorridorStatus type unions;
│                               #   getWaterfallData() aggregation and waterfall bar builder
│
├── lib/
│   └── utils.ts                # cn() (clsx + tailwind-merge), fmt() (M/B/K number formatter),
│                               #   fmtPct() (percentage formatter), fmtDollar()
│
└── types/
    └── war-room.ts             # TypeScript interfaces for all War Room contracts:
                                #   WarRoomInput, SimilarDealSummary, DetectiveToolData,
                                #   ProsecutorToolData, ArchitectToolData, DetectiveOutput,
                                #   ProsecutorOutput, ArchitectOutput, OrchestratorOutput,
                                #   WarRoomResponse
```

---

## Getting Started

### Prerequisites

Node.js 18.18 or later is required (Next.js 15 minimum). npm 9 or later is recommended.

```bash
node --version   # must be >= 18.18.0
npm --version    # must be >= 9.0.0
```

### Installation

```bash
git clone https://github.com/shreyasdasari/pricingiq.git
cd pricingiq
npm install
cp .env.example .env.local
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Google Gemini API key. Used by both `POST /api/narrative` and `POST /api/war-room`. All four War Room agents use `gemini-flash-latest`. Get a free key at [aistudio.google.com](https://aistudio.google.com). |

Edit `.env.local` and set your key:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

Without this key, the Narrative Generator and Deal War Room return API errors. All other modules — Waterfall, Deal Scoring, Alerts, and Dashboard — run entirely client-side with no API key required.

### Running Locally

```bash
npm run dev
```

The application runs at [http://localhost:3000](http://localhost:3000). The root path redirects to `/landing`.

---

## Key Design Decisions

**1. Synthetic data generated at module load time, not fetched from a database.**
The 500-deal dataset is generated by a seeded pseudorandom function in `src/data/deals.ts` and exported as a module-level constant. The alternative was a real database (Postgres, SQLite) with a seed script. The seeded-PRNG approach was chosen because it eliminates all infrastructure dependencies — no connection strings, no migration scripts, no cold-start data fetch — while still producing a deterministic, realistic dataset that behaves identically in every environment. The mulberry32 algorithm with seed 42 ensures that every developer, every CI run, and every Vercel deployment sees the exact same 500 deals. The tradeoff is that the data cannot be updated without changing the code; for a demo platform, this is a feature rather than a limitation.

**2. Google Gemini Flash instead of Anthropic Claude for the AI routes.**
The `@ai-sdk/anthropic` package is present in `package.json` as a leftover from an earlier implementation where the narrative route used Claude. The project migrated both routes to Gemini Flash. The War Room makes four Gemini calls per request (three parallel specialists plus one orchestrator). Gemini Flash's low per-token latency makes this viable within a 60-second edge function limit; a slower model at comparable quality would push the total time past the Vercel ceiling for the parallel-plus-sequential pattern. The Vercel AI SDK's provider-agnostic interface (`generateText`, `streamText`) meant the migration required only changing the model constructor, leaving all surrounding logic untouched.

**3. Client-side filtering via `useMemo` instead of server-side query parameters.**
Every filter UI across the Waterfall, Deal Scoring, and Alerts modules operates entirely in the browser against the in-memory 500-deal array. The alternative was a server component that accepted `searchParams` and filtered on the server per request. Client-side was chosen because the dataset is small enough (500 objects, each approximately 400 bytes) that the full array fits comfortably in browser memory, and `useMemo` with a dependency array produces zero-latency filter responses — no network roundtrip, no loading state, no debounce required. The user experience is instantaneous dropdown interaction, which matters for an analytical tool where the analyst is exploring the data interactively.

**4. Deterministic TypeScript tool functions before every AI agent call.**
Each of the three War Room specialist agents receives a pre-computed data context from a TypeScript function (`findSimilarDeals`, `prosecuteRisk`, `architectDeal`) before its prompt is constructed. The alternative was to give the agents the raw deal data and ask them to compute the analytics themselves. The tool-first approach was chosen because it eliminates hallucinated numbers: every dollar figure, every percentage, every comparable deal ID in the agents' narratives is computed by TypeScript and injected into the prompt. The AI's job is to narrate and contextualize, not to calculate. This also makes the system testable — the tool functions can be unit-tested independently of the AI layer.

**5. `Promise.all` for parallel agent execution instead of a sequential chain.**
The three specialist agents fire simultaneously rather than feeding each other's outputs sequentially. An alternative design would have the Prosecutor read the Detective's output, and the Architect read the Prosecutor's — a chain where each agent adds context from the previous one. Parallel execution was chosen because the three agents operate on independent tool-data contexts and do not need each other's outputs to do their work: the Detective needs comparable-deal statistics, the Prosecutor needs risk metrics, and the Architect needs restructuring parameters, all computed independently by their respective tool functions. Running them in parallel reduces total latency from approximately 15 seconds (three sequential 5-second calls) to approximately 5 seconds. The Orchestrator is the one component that genuinely requires all three outputs, so it correctly runs as a sequential fourth step after `Promise.all` resolves.

---

## Alignment With PTC Pricing Analyst Role (JR111667)

| JD Requirement | How PricingIQ Demonstrates It | Where To See It |
|---|---|---|
| Pricing waterfall and corridor analysis | Full waterfall chart decomposing list → volume → promo → partner discounts → net price → revenue leakage → realized revenue. Three-band corridor analysis (0–20%, 21–35%, >35%) with live deal counts and percentage breakdowns. | [pricingiq.vercel.app/waterfall](https://pricingiq.vercel.app/waterfall) · `src/app/waterfall/page.tsx` · `src/data/deals.ts:getWaterfallData()` |
| AI-enabled analytics and automation | Two AI patterns in production: a streaming Gemini narrative generator that produces board-ready executive summaries from live deal data, and a four-agent War Room that delivers structured pricing decisions with quantified exposure. Both are live, not mocked. | [pricingiq.vercel.app/narrative](https://pricingiq.vercel.app/narrative) · [pricingiq.vercel.app/war-room](https://pricingiq.vercel.app/war-room) · `src/app/api/narrative/route.ts` · `src/app/api/war-room/route.ts` |
| Agent-based workflows | Three-plus-one agent architecture: Deal Detective (historical pattern analysis), Risk Prosecutor (worst-case exposure), Deal Architect (restructuring recommendation), Orchestrator (APPROVE / ESCALATE / RENEGOTIATE synthesis). Genuine fan-out / fan-in multi-agent topology with typed output contracts between stages. | [pricingiq.vercel.app/war-room](https://pricingiq.vercel.app/war-room) · `src/app/api/war-room/route.ts` · `src/types/war-room.ts` |
| Intelligent alerts and monitoring | Four configurable threshold rules (Discount Ceiling, Realization Rate Floor, Pipeline Age Limit, Large Deal Approval) with live slider controls. Breach detection reruns across all 500 deals on every threshold change. Breach list is immediately visible in a full deal table. | [pricingiq.vercel.app/alerts](https://pricingiq.vercel.app/alerts) · `src/app/alerts/page.tsx` |
| Dashboard development emphasizing insight | Main dashboard surfaces 8 KPI cards (total pipeline, realized revenue, avg discount, corridor violations, high-risk deals, revenue leakage, net price, total deals), a product-line performance table, a segment breakdown table, a critical alert feed, and module navigation. | [pricingiq.vercel.app/dashboard](https://pricingiq.vercel.app/dashboard) · `src/app/dashboard/page.tsx` |
| Daily deal scoring and assessment | Deal scoring engine assigns a 0–100 composite risk score to every deal using a four-factor weighted model. The factor attribution panel shows exactly which inputs drove each score. The table is sortable by risk score, list price, or discount rate. | [pricingiq.vercel.app/deals](https://pricingiq.vercel.app/deals) · `src/app/deals/page.tsx` · `src/data/deals.ts:generateDeals()` |
| Python/SQL data pipeline thinking | The TypeScript data pipeline in `deals.ts` demonstrates the same analytical skills: schema definition, field derivation (netPrice, realizedRevenue, riskScore), normalization, aggregation (`getWaterfallData`), and multi-condition filtering logic — all typed and deterministic. The War Room's `findSimilarDeals()` function is equivalent to a SQL similarity query with fallback join conditions. | `src/data/deals.ts` · `src/app/api/war-room/route.ts:findSimilarDeals()` |
| Speed to insight and reduced manual effort | Any filter combination across product, segment, and region produces a waterfall chart, corridor analysis, and deal risk table in under 100 milliseconds — client-side, zero server roundtrip. An AI executive summary generates and streams in under 10 seconds. A War Room decision analysis completes in approximately 5 seconds. | All filter-bearing module pages |
| Quarterly pricing review support | The Narrative Generator produces a scoped executive summary for any product/segment/region slice on demand, replacing a manual analyst write-up. The Dashboard surfaces the standard quarterly-review metrics — realization rate, average discount, corridor violations, high-risk deal count — in a single view. | [pricingiq.vercel.app/narrative](https://pricingiq.vercel.app/narrative) · [pricingiq.vercel.app/dashboard](https://pricingiq.vercel.app/dashboard) |
| Go-to-market pricing support | The War Room's Deal Architect agent produces segment-specific restructuring recommendations — Partner deals reduce partner margin, Enterprise deals reduce volume discount, others reduce promo — along with the required approval tier (Standard, VP, C-Suite). This directly mirrors deal desk and GTM pricing governance workflow. | [pricingiq.vercel.app/war-room](https://pricingiq.vercel.app/war-room) · `src/app/api/war-room/route.ts:architectDeal()` |

---

## Screenshots

![Pricing Waterfall Dashboard](screenshots/waterfall.png)
![Deal Corridor Analysis](screenshots/corridor.png)
![Deal War Room](screenshots/war-room.png)

> Add screenshots to a `/screenshots` directory in the project root and update the paths above.

---

## About The Builder

Shreyas Dasari is an AI/ML Engineer and Data Scientist with an M.S. in Information Systems from Northeastern University (December 2024). He currently builds AI systems at Humanitarians AI. PricingIQ was built to demonstrate applied AI engineering and pricing analytics capabilities for PTC's Pricing Analyst role (JR111667) — the goal being to show up to the interview with a working system rather than a slide deck.

[LinkedIn](https://linkedin.com/in/shreyasdasari) · [Live Demo](https://pricingiq.vercel.app)

---

## License

MIT License. See [LICENSE](./LICENSE).
