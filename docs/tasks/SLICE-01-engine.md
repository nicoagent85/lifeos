# TASK: Slice 01 — Deterministic Engine + Sim Harness (NO DB, NO UI)

**Owner/reviewer:** Gonzalo. **Implementer:** backenddev.
**Goal of this slice:** a pure-TypeScript, deterministic simulation engine you can run from the
command line, plus tests, so we can balance the economy BEFORE building any database or UI.

## Hard rules (from docs/ — do not violate)
- **Pure engine:** all simulation logic in `packages/engine`. NO Next.js, NO Prisma, NO I/O,
  NO network, NO `Date.now()`, NO `Math.random()` inside engine logic.
- **Deterministic:** all randomness comes from a seeded PRNG you implement (`rng.ts`). Same
  (state, seed, turnIndex, choices) → identical result, every time.
- **Ledger-first:** every change to Cash or Boost Tokens emits an immutable ledger entry. The
  balance must always equal the sum of ledger deltas for that currency (assert this in tests).
- **Money = integers in minor units** (cents). NEVER floats for currency.
- **Config-driven balance:** all economic constants live in `config.ts` (data, not logic).

## Scope of THIS slice (keep tight)
Implement the smallest real loop:
1. **Types** (`state.ts`): GameState with cash, incomeWeekly, expensesWeekly, health, stress,
   happiness, actionPoints, reputation, boostTokens, skills {workSkill, lifeSkill}, jobTier,
   turnIndex, status (ACTIVE|LOST), flags, seed, ledger[] (in-memory for now).
2. **Seeded PRNG** (`rng.ts`): deterministic, e.g. mulberry32 or sfc32. Pure functions.
3. **Config** (`config.ts`): starting values for 3 scenarios (BROKE_YOUNG_ADULT, LAID_OFF,
   STUDENT), wage by jobTier (GIG/ENTRY/SKILLED/SENIOR), rent/food/bills per scenario, action
   point budget (5/week), skill costs, lose thresholds.
3. **Actions** (`actions.ts`): player allocates 5 action points across: WORK, STUDY_WORK,
   STUDY_LIFE, REST, JOB_HUNT, SIDE_GIG. Pure functions returning state deltas + ledger entries.
4. **Events** (`events/`): a small starter deck of ~8 events (car repair, medical bill, small
   bonus, rent hike, scam offer, friend asks for loan, scholarship, nothing-happens). Each: a
   key, weight, and a resolve fn producing deltas + ledger + log. Deterministic draw via rng.
5. **resolveTurn** (`resolveTurn.ts`): `(state, input) => { state, ledgerEntries, log }`.
   Applies actions → income/expenses → event → updates stats → checks lose conditions →
   increments turnIndex. Idempotent intent (don't double-apply same turnIndex).
6. **Sim harness** (`scripts/sim.ts` or `packages/engine/src/cli.ts`): run a save from a seed
   with a scripted or simple-strategy choice policy for N turns; print per-turn summary + final
   state + a ledger-integrity check. This is how we balance the economy.

## Setup
- Monorepo-lite with pnpm or npm workspaces is fine, OR keep it simple: a single
  `packages/engine` TypeScript package with its own package.json + tsconfig + vitest. Pick the
  SIMPLEST thing that builds and tests cleanly. Document your choice in the engine README.
- TypeScript strict mode ON. Use **vitest** for tests.
- Add `packages/engine/README.md` explaining how to run: build, test, and `sim`.

## Tests (REQUIRED — this is the point of the slice)
- **Determinism test:** same seed + same scripted choices over 20 turns → identical final state
  (deep-equal). Run twice, assert equal.
- **Ledger-integrity test:** after N turns, sum of CASH ledger deltas == final cash; same for
  BOOST_TOKEN. Assert on several seeds.
- **Golden-master test:** one fixed seed + fixed scripted choices → assert the exact final
  cash/health/turnIndex (commit the expected values). Catches accidental balance drift.
- **Lose-condition test:** a scenario/seed that drives cash deeply negative ends with status LOST.
- All tests must pass (`vitest run`) with zero failures.

## Out of scope (DO NOT build in this slice)
- No database / Prisma / Postgres / Supabase.
- No Next.js / UI / React.
- No real auth, no payments, no ads.
- No housing/transport/assets/investments/business (those are Phase 2).
Keep the event deck small (~8). We expand later.

## Deliverable / done criteria
- `packages/engine` builds (`tsc` clean, strict).
- `vitest run` → all green, including the 4 required test categories above.
- `sim` harness runs e.g. `npm run sim -- --scenario BROKE_YOUNG_ADULT --seed 42 --turns 20`
  and prints readable per-turn output + final state + "LEDGER OK" check.
- Report back: what's implemented, what's tested+passing, what's stubbed, and any balance
  observations from running the sim (e.g., "average player goes broke by week 9 — too harsh").
- Commit to a branch `slice-01-engine` and push; do NOT merge to main (Gonzalo reviews first).

## Reporting (per your doctrine)
Lead with: what is implemented, what was tested and the result, what is NOT verified, and any
risks/observations. Be honest about test coverage — untested code must be called untested.
