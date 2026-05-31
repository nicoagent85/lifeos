# SLICE 09 — Phase A Progression UI

Expose the already-built Phase A engine in the web UI: **Net Worth headline, Milestones checklist,
Buy/Assets screen, Business panel**. UI ONLY. No engine changes. Mobile-dense (must still fit an
iPhone). Dark mode preserved.

## CONTEXT — what already exists (DO NOT rebuild)
The engine (`@lifeos/engine`) already exports everything you need:
- `purchaseAsset(state, assetId): { ok: boolean, log?: string, error?: string }` — mutates state in
  place (deducts cash via ledger, pushes assetId, applies expense delta). NOT an action-point action.
- `getNetWorth(state): number` — integer **cents**.
- `getMilestones(state): { id: string, name: string, done: boolean }[]`
- `ASSET_CATALOG`: array of `{ id, name, category, cost, effects, requires? }`. `category` ∈
  TRANSPORT | HOUSING | LEISURE | LIFESTYLE. `cost` is integer cents. `effects` may include
  `expensesWeeklyDelta` (cents, negative = cheaper), `statusValue` (cents), `happinessPerTurn`,
  `stressPerTurnDelta`, `eventBadWeightMultiplier`. `requires` is an array of prerequisite asset ids.
- `BUSINESS_SKILL_REQ`: `{ NONE:{skill,cost,next}, SIDE_BUSINESS:{...}, BUSINESS:{...} }` (cents costs).
- `BUSINESS_INCOME_BY_TIER`: `{ NONE:0, SIDE_BUSINESS:20000, BUSINESS:100000, ENTERPRISE:500000 }` (cents/wk).
- GameState already has: `assets: string[]`, `businessTier: 'NONE'|'SIDE_BUSINESS'|'BUSINESS'|'ENTERPRISE'`,
  `skills.workSkill`, `jobTier`, `cash`, `expensesWeekly`, `status` ('ACTIVE'|'LOST'|'WON').
- `ActionType` already includes `BUILD_BUSINESS` (advances the business tier when SENIOR + skill +
  cash met; counts as 1 AP). It is ALREADY in the action grid as a chip — keep it working.

## SCOPE (edit ONLY `apps/web/src/app/page.tsx`; add UI components under `apps/web/src/components/ui/` ONLY if shadcn-style and needed)
1. **Net Worth headline** in the play view (top, near cash). Big, formatted `$NNN,NNN`
   (`getNetWorth(state)/100`). Label "Net Worth". This is the score the player chases.
2. **Milestones checklist** — a compact panel listing `getMilestones(state)`; done = ✓/green/strikethrough,
   not-done = dim. Show count e.g. "3/7". Collapsible or in a tab is fine; must not blow up phone height.
3. **Buy / Assets screen** — a button/tab "Buy" opens a panel (Dialog/Sheet/collapsible) listing
   `ASSET_CATALOG` grouped by `category`. For each item show name, cost ($), a one-line effect summary
   (derive from effects: e.g. expensesWeeklyDelta<0 → "−$X/wk expenses"; statusValue → "+$X net worth";
   happinessPerTurn → "+happiness"; stressPerTurnDelta<0 → "−stress"; eventBadWeightMultiplier<1 → "fewer bad events").
   - OWNED items: show "Owned" badge, disable buy.
   - Affordable + prereqs met + not owned: enabled "Buy" button → calls `purchaseAsset(state,id)`; on
     `ok` do `setGameState({...state})` (clone so React re-renders) and surface `log`/`error` in the
     week-result strip or a toast-like line.
   - Locked (missing prereq): show "Requires <prereq name>" and disable.
   - Unaffordable: disable, show cost in red/dim.
   - NOTE: purchaseAsset is NOT an action — buying does NOT consume AP and does NOT resolve the week.
4. **Business panel** — show current `businessTier`, weekly passive income for that tier
   (`BUSINESS_INCOME_BY_TIER`), and the next step: if not ENTERPRISE, show the next tier's
   requirement from `BUSINESS_SKILL_REQ[currentTier]` (skill X + $Y). Make clear the player advances by
   using the **Build Business** action (already in the grid) when requirements are met — you may add a
   helper line "Ready to build!" when `skills.workSkill >= req.skill && jobTier==='SENIOR' && cash>=req.cost`.
   At ENTERPRISE show "Maxed — banking $5,000/wk" (or correct number).
5. **WON state** — when `gameState.status === 'WON'`, show a celebration banner (e.g. "🏆 Millionaire!
   You won — keep playing, it's open-ended.") at top of the play view. Do NOT block further play
   (WON keeps the game interactive, unlike LOST which shows Game Over). Keep the existing LOST screen.

## HARD CONSTRAINTS
- Money: divide cents by 100 for DISPLAY ONLY. Never do game math in the UI. Use
  `(n/100).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})` or similar.
- Keep ALL existing functionality: 3-scenario start screen, the 9 existing actions + BUILD_BUSINESS,
  AP limit incl +1 healthy bonus, Resolve→state+log+ledger, LOST Game Over + restart, dark mode,
  Life History panel, the dense 2-col mobile action grid.
- MOBILE FIT: the default play view must still fit ~390×700 CSS px with no/minimal scroll. Put the
  Buy screen and Milestones in overlays/tabs/collapsibles so they don't lengthen the main view.
  Respect iOS safe areas (existing env(safe-area-inset-*) usage — keep it).
- No new npm dependencies. Do NOT touch the engine, packages/, or any config/build files.
- Do NOT read credentials. Do NOT merge to main. Work on branch `slice-09-progression-ui`.
- Static-exportable client component (`"use client"`), must survive `output: 'export'`.

## GIT
- `git checkout main && git pull origin main && git checkout -b slice-09-progression-ui`
- Commit: "Slice 09: Phase A UI — net worth, milestones, buy screen, business panel, WON banner"
- `git push -u origin slice-09-progression-ui`. DO NOT merge to main.

## PROOF OF WORK (REQUIRED — claims without pasted output = REJECTED)
You MUST paste, verbatim, in your final report:
1. Full output of the production build:
   `cd /home/nodejs/.openclaw/workspace/projects/lifeos && (cd packages/engine && pnpm build) && GITHUB_PAGES=true pnpm --filter web build` — must end with the static route table and exit 0.
2. `ls -la apps/web/out/index.html` proving the file was generated (with byte size).
3. `git diff --stat main..slice-09-progression-ui` (the page.tsx change must be substantial, not a stub).
4. In words: confirm Net Worth headline, Milestones checklist (X/7), Buy screen (grouped, owned/locked/
   affordable states), Business panel (tier + passive income + next req), WON banner, AND that all 9
   original actions + BUILD_BUSINESS + Resolve + LOST screen + restart still exist. State how you kept
   the main play view phone-fit (what you moved into overlays/tabs).
If you cannot produce a passing build, say so explicitly — do NOT claim success.
