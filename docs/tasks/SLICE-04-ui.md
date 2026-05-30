# TASK: Slice 04 — First playable SCREEN (Next.js UI on top of the engine)

**Owner/reviewer:** Gonzalo. **Implementer:** frontenddev. **Branch:** slice-04-ui.
**Depends on:** Slice 03 tuning merged to main (a balanced engine). Read docs/GAME_DESIGN.md,
docs/WELLBEING_SYSTEM.md, docs/TECH_ARCHITECTURE.md.

## Goal
A clickable, playable single-player loop in the browser — NO database, NO auth, NO server yet.
Game state lives in client React state (and optionally localStorage so a refresh doesn't wipe it).
The engine package is the single source of truth for all game logic; the UI only renders state and
sends the player's chosen actions into `resolveTurn`. This is the "see it and click it" milestone.

## Architecture (do NOT duplicate game logic in the UI)
- Monorepo already has `packages/engine` (name `@lifeos/engine`, pure TS, deterministic).
- Create a Next.js (App Router) + TypeScript app at **`apps/web`**.
- Tailwind + shadcn/ui for styling (per TECH_ARCHITECTURE.md).
- The web app imports the engine and calls it directly in the client for now (no API route needed
  this slice; server-authoritative comes when we add the DB). Wire the workspace so `apps/web` can
  import from `packages/engine` (pnpm workspace; add a root `pnpm-workspace.yaml` if missing, and a
  root package.json if missing — keep it minimal).
- ALL money/stat math stays in the engine. The UI must never recompute balances or apply deltas
  itself — it calls `resolveTurn(state, { actions })` and renders the returned state/log/ledger.

## Engine API you will use (already exists — import from @lifeos/engine)
- `getStartingState(scenario: ScenarioKey, seed: number): GameState`
  scenarios: 'BROKE_YOUNG_ADULT' | 'LAID_OFF' | 'STUDENT'
- `resolveTurn(state, { actions: Record<ActionType, number> }): { state, newLedgerEntries, log }`
- `ActionType`: 'WORK' | 'STUDY_WORK' | 'STUDY_LIFE' | 'REST' | 'JOB_HUNT' | 'SIDE_GIG' |
  'EAT_HEALTHY' | 'WORK_OUT' | 'HAVE_FUN'
- `ACTION_POINTS_PER_WEEK` (base budget; engine grants +1 internally when health>=80 && stress<=30,
  so let the engine enforce the limit — UI should READ the allowed limit, not hardcode).
- `GameState` fields to render: cash (cents → format as $), health, stress, happiness, jobTier,
  skills.workSkill, turnIndex, status, reputation, expensesWeekly, ledger[].
- Money is integer CENTS — divide by 100 only for DISPLAY.

## Screens / UX (keep it clean and honest — no dark patterns)
1. **Start screen:** pick a scenario (3 cards: Broke Young Adult / Laid Off / Student), optional
   "seed" (default random or fixed), "Start Life" button.
2. **Main play screen (the core loop):**
   - Top: status bar — Cash ($), Health, Stress, Happiness (use bars/colors), Job tier, Week #,
     Work Skill.
   - Center: **action allocator.** Show all actions with short human descriptions + their costs
     (e.g. "Eat Healthy — $50, +health"). Let the player add/remove points per action with +/−
     steppers. Show "Action points used X / LIMIT". Disallow exceeding the limit (the engine throws
     if exceeded — prevent it in UI too). Show projected AP limit (note the +1 healthy bonus when
     it applies).
   - Bottom: **"Resolve Week"** button → calls resolveTurn, then shows the week's RESULT: the log
     lines (what happened, events), and the new ledger entries (income/expenses breakdown with
     reason codes RENT/FOOD/BILLS/WAGE/WELLBEING/etc.), and the updated stats (animate or highlight
     changes if easy).
   - A small **history/log panel** of past weeks.
3. **Game over screen:** when status === 'LOST', show why (from log), final stats, "Start New Life".
   Per design: losing = start a new life, framed honestly (no guilt/FOMO).

## Honesty constraints (hard — from RETENTION_AND_PACING.md)
- NO energy timers, NO FOMO, NO daily-login guilt, NO fake countdowns, NO manipulative nags.
- Any "watch a clip" wellness-sponsor button is a STUB (mock instant reward) and clearly optional.
  Do not build real ads. A single obviously-optional placeholder is fine to show the hook exists.

## Quality bar
- TypeScript strict, no `any` in app code where avoidable.
- It must actually RUN: `pnpm install` at root, `pnpm --filter web build` succeeds, and
  `pnpm --filter web dev` serves a playable loop. Paste the build output as proof.
- Mobile-first responsive (this is a PWA target eventually) but don't build PWA/service-worker yet.
- Clean, modern, friendly look. shadcn/ui components. Not cluttered.

## Verify + PROOF OF WORK (required or rejected)
- `pnpm install` output (success).
- `pnpm --filter web build` output (success, no type errors).
- `git diff --stat main..slice-04-ui` (show the files created).
- A short description of the exact click-path that works: start → allocate → resolve week → see
  result → repeat → reach a game-over. Confirm you actually clicked through it (or ran it headless).
- Be honest about anything NOT working or NOT verified.

## Commit + push (branch only, NOT main)
  git checkout main && git pull origin main && git checkout -b slice-04-ui
  ...work...
  git add -A && git commit -m "Slice 04: first playable Next.js UI on the engine (start → weekly action loop → game over)" && git push -u origin slice-04-ui

## Out of scope (later slices): database/Prisma/Supabase, auth/real accounts, server-authoritative
API, real ads, PWA/offline, multiplayer, marketplace. This slice = a local, clickable single life.
