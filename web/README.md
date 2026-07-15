# ProofCV · Web

Next.js + TypeScript + Tailwind rebuild of the ProofCV high-fidelity design
(`../project/ProofCV.dc.html`). ProofCV helps engineers turn scattered
experience into **traceable career evidence**, then generate credible,
verifiable resumes and job-hunt materials for specific roles — covering the
full loop: import old resume → interview → evidence → import jobs → JD match →
job-specific resume → interview QA → mock interview → real-interview review →
confirmed updates flow back into QA/resume/evidence.

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
  truth — evidence, jobs, per-job analyses/matches/resumes/QA/mocks/records and
  the resume `TemplateSpec`. Evidence is the shared asset that jobs reuse.
- **Local-first persistence:** domain data is persisted to the browser's
  IndexedDB (`src/lib/storage.ts` adapter for zustand persist; falls back to
  localStorage in private mode). There is no server database — nothing is
  hosted. Migration = export/import a backup JSON from the Settings page
  (`src/lib/backup.ts`; import always previews counts and requires explicit
  confirmation before overwriting). Schema upgrades go through persist's
  version/migrate.
- **Seed data:** `src/lib/seed.ts` — the full "林深 · 全栈/前端冲大厂" persona,
  ported verbatim from the prototype so every screen is clickable offline.
- **Styling:** inline styles carry the pixel-exact design values from the
  prototype (the design *is* the spec); global tokens, fonts, and keyframes
  live in `src/app/globals.css`.

### Screens (`src/components`)

`Home`, `Auth`, `AppShell` (236px sidebar + 58px topbar), `Toast`, and
`screens/*`: Dashboard, Import, Interview, Evidence, Jobs, Package, Resume,
Qa, Mock, Records, Settings. Shared primitives (`Btn`, `Pill`, `Tags`,
`Spinner`, `Page`) are in `components/ui.tsx`.

## AI (bring your own key — configure it on the Settings page)

Every AI action (import parse, interview, JD analysis, resume, QA, mock
interview, review) calls `ask()` in `src/lib/ai.ts`. The mode is decided by
the runtime config on the **Settings page** (`src/lib/aiConfig.ts`, stored in
your browser's localStorage — the platform hosts nothing):

- **No key configured (default):** mock mode. `ask()` returns `null` after a
  short delay and each handler falls back to its deterministic,
  no-fabrication result. The sidebar badge shows "Mock".
- **API URL + Key filled in:** live mode. `ask()` posts to `POST /api/ai`
  (`src/app/api/ai/route.ts`), a **pure pass-through** that forwards your key
  to the provider you configured — Anthropic-native (`/v1/messages`) or
  OpenAI-compatible (`/chat/completions`, which covers most relay services);
  endpoint paths are auto-completed, keys are never stored or logged, and
  upstream error messages are surfaced verbatim (wrong key / wrong model /
  quota). Failed calls toast the error and fall back deterministically —
  they never fake a success.

The Settings page also has a connection test, a "remember key on this device"
toggle (uncheck = key kept in memory for this session only), and one-click key
removal. The old `NEXT_PUBLIC_AI_LIVE` flag is retired.

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
