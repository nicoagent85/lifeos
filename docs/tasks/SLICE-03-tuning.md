# TASK: Slice 03 — Balance tuning pass + "smart" sim strategy

**Owner/reviewer:** Gonzalo. **Implementer:** backenddev. **Branch:** slice-03-tuning.
**Read first:** docs/WELLBEING_SYSTEM.md, docs/GAME_DESIGN.md, the existing engine in
packages/engine (esp. config.ts, actions.ts, resolveTurn.ts, wellbeing.ts, events/index.ts, cli.ts).

## The problem to solve (found via sim)
With seed 42, BROKE_YOUNG_ADULT, 30 turns:
- **grinder** (3 WORK / 2 STUDY, no wellbeing) → burns out, health 100→0, DIES ~turn 11.
- **balanced** (2 WORK / 1 STUDY / 1 EAT_HEALTHY / 1 HAVE_FUN, ZERO job-hunt) → stays healthy
  but goes BANKRUPT ~turn 6 (never promotes off GIG min-wage AND pays for upkeep).

Both extremes lose. **The job:** make a genuinely *smart* play — work + advance (study→jobhunt→
promote) + maintain wellbeing — the strategy that SURVIVES and gradually THRIVES, while pure-grind
(burnout) and pure-neglect-of-money (bankrupt) both still fail. This is Jaime's endorsed core
tension: "you can't only mind your health or you'll die broke; you can't only grind or you'll
burn out." The smart middle path must exist and be reachable.

## What to do

### 1. Add a 3rd CLI strategy: `smart`
A sensible weekly mix that promotes AND maintains wellbeing. Example weekly allocation across the
~5 action points (tune as needed): 2 WORK / 1 STUDY_WORK / 1 JOB_HUNT / 1 (WORK_OUT or HAVE_FUN,
alternating or stress-driven). The point: it earns, climbs tiers, and keeps health/stress in a
safe band. Keep `grinder` and `balanced` strategies for comparison.

### 2. TUNE the config constants (this is the core of the task — data, not logic)
Adjust values in config.ts so the `smart` strategy SURVIVES 30 turns on BROKE_YOUNG_ADULT seed 42
(does NOT die, does NOT go bankrupt) and is trending UP (promotes at least to ENTRY/SKILLED, cash
recovering by end). Levers you may tune (keep them as config; do not hardcode in logic):
- Action costs/effects: EAT_HEALTHY / WORK_OUT / HAVE_FUN cash + stat effects (likely too pricey now).
- Health/stress per-turn decay rates (likely too steep — grinder dies too fast).
- HEALTH_INCOME_MULTIPLIERS brackets, STRESS_INCOME_PENALTY.
- HEALTH_MEDICAL_RISK scaling.
- REST potency, energy-bonus thresholds.
- WAGE_BY_TIER / expensesWeekly if needed (but prefer tuning wellbeing knobs first).
Do NOT remove the tension — pure-grind should still burn out and pure-broke-spending should still
fail. Aim for: **smart survives & climbs; both extremes still lose.**

### 3. Keep determinism & all hard rules
Pure engine, integer cents, seeded prng per turn, ledger-first (balance==sum of deltas),
deterministic. No new deps. No DB/UI in this slice.

### 4. Tests
- Keep all existing tests green (update golden-master hardcoded values if tuning changed them —
  re-run, hardcode new, note old vs new).
- ADD a **`smart-survives` test**: run the smart strategy 30 turns (seed 42, BROKE_YOUNG_ADULT)
  and assert final status === 'ACTIVE' (not LOST) AND final cash > starting-ish floor (define a
  reasonable assertion, e.g. cash > -5000 cents and jobTier advanced beyond 'GIG').
- ADD a **`extremes-still-lose` test**: assert grinder ends LOST (burnout/health) AND the
  pure-spending balanced (no jobhunt) ends LOST (bankrupt). This locks the tension in place.

## Verify + run (paste real output)
  cd packages/engine && npx tsc --noEmit ; npx vitest run   (all green)
Then run ALL THREE 30-turn sims (seed 42, BROKE_YOUNG_ADULT), capture ~12 lines each:
  npx tsx src/cli.ts --scenario BROKE_YOUNG_ADULT --seed 42 --turns 30 --strategy grinder
  npx tsx src/cli.ts --scenario BROKE_YOUNG_ADULT --seed 42 --turns 30 --strategy balanced
  npx tsx src/cli.ts --scenario BROKE_YOUNG_ADULT --seed 42 --turns 30 --strategy smart
Also run `smart` across **5 seeds (42, 7, 100, 2026, 13)** and report final status + cash + jobTier
for each — this is the **difficulty read**: how often does a well-played life survive & thrive?

## Commit + push (branch only, NOT main)
  git checkout main && git pull origin main && git checkout -b slice-03-tuning
  ...work...
  git add -A && git commit -m "Slice 03: balance tuning + smart strategy (smart survives & climbs; extremes still fail) + tests" && git push -u origin slice-03-tuning

## PROOF OF WORK required (or rejected)
tsc result, vitest summary (N passed), git diff --stat main..slice-03-tuning, old-vs-new golden
master values, ~12 lines each of grinder/balanced/smart sims, the 5-seed smart table, and a
one-paragraph DIFFICULTY READ: when played well, does the player survive & thrive? how punishing
is the early game? does the core tension hold (both extremes still fail)? Be honest about what is
NOT verified.

Constraints: no new dependencies, no files outside repo, do not read credentials, do not merge to main.
