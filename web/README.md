# ProofCV · Web

Next.js + TypeScript + Tailwind rebuild of the ProofCV high-fidelity design
(`../project/ProofCV.dc.html`). ProofCV helps engineers turn scattered
experience into **traceable career evidence**, then generate credible,
verifiable resumes and job-hunt materials for specific roles — covering the
full loop: import → interview → evidence → JD match → resume → materials →
market → review → pipeline → public share.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
# or
npm run build && npm start
```

The landing page is the marketing home; click **用演示账号立即体验** (or
**进入演示** / login) to enter the app shell.

## Architecture

- **Single client-side app.** Routing is store state (`screen` +, inside the
  app, `tab`), matching the prototype. Swap for the Next router if you want
  real URLs per screen.
- **State:** one Zustand store (`src/lib/store.ts`) is the single source of
  truth — evidence, jobs, per-job analyses/matches/resumes/materials/reviews,
  the resume `TemplateSpec`, and market data. Evidence is the shared asset that
  jobs reuse.
- **Seed data:** `src/lib/seed.ts` — the full "林深 · 全栈/前端冲大厂" persona,
  ported verbatim from the prototype so every screen is clickable offline.
- **Styling:** inline styles carry the pixel-exact design values from the
  prototype (the design *is* the spec); global tokens, fonts, and keyframes
  live in `src/app/globals.css`.

### Screens (`src/components`)

`Home`, `Auth`, `AppShell` (236px sidebar + 58px topbar), `PublicProfile`,
`PublicResume`, `Toast`, and `screens/*`: Dashboard, Import, Interview,
Evidence, Github, Market, Jobs, Jd, Resume, Materials, Review, Pipeline,
Settings. Shared primitives (`Btn`, `Pill`, `Tags`, `Spinner`, `Page`) are in
`components/ui.tsx`.

## AI (mock now, one flag to go live)

Every AI action (import parse, interview, JD analysis, resume, materials,
review, market prompt) calls `ask()` in `src/lib/ai.ts`. **In mock mode
`ask()` returns `null` after a short delay**, so each handler falls back to its
high-quality seeded result while the loading spinner still shows — the exact
failure path the prototype used.

To go live:

1. Set `NEXT_PUBLIC_AI_LIVE=1`.
2. Implement `POST /api/ai` as a server route that calls the Anthropic API with
   `ANTHROPIC_API_KEY` and returns `{ text }`. `ask()` already posts there when
   live — nothing else changes. Streaming is recommended for chat/interview.

## Integrations (ported from real source, per the handoff)

- **Telos** (`xiashitao/Telos`) → the 定制简历 module. `src/lib/templates.ts`
  is the ported **TemplateSpec** (constrained JSON design params — skeleton /
  header / section / typography / colors; no code flows through, so A4/ATS stays
  safe) with 14 presets; `src/components/SpecRenderer.tsx` is the ported
  **SpecRenderer** (single / sidebar-left / sidebar-right / banner skeletons).
  **PDF export is real now**: `src/app/api/export/pdf/route.ts` is a
  Telos-style Puppeteer HTML→PDF server route (`puppeteer-core` + your local
  Chrome, located by `src/lib/chrome.ts` — env `CHROME_PATH` overrides). The
  editor posts the rendered SpecRenderer DOM (all inline styles) to it, so
  there is no duplicated rendering logic; internal prep annotations
  (`data-pcv-annot`: 已核验/待确认/证据不足/★钩子) are stripped from the
  employer-facing PDF.
- **boss-zhipin-scraper** (`eatmoreduck/boss-zhipin-scraper`) → 岗位列表's
  「导入 Boss 直聘数据」. Scraping needs a local logged-in Chrome via CDP and
  can't run in the browser — you run the Python locally and import its
  `boss_jobs_*.json` / `boss_details_*.json` output (file picker or paste;
  `src/lib/bossImport.ts` merges jobs+details by job id, tolerates field-name
  variants, flags entries that lack a real JD, and dedupes against existing
  jobs — nothing is fabricated for missing fields). Each imported job becomes
  an application package.

## Notes

- Google Fonts load via a `<link>` in `layout.tsx` (Noto Sans SC / Noto Serif
  SC / JetBrains Mono). If your network blocks the CDN, the UI falls back to
  system fonts.
- No bitmap assets: icons are text/geometry, the logo is a `P` tile, avatars are
  initials.
