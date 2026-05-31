# TASK: Slice 08 — Phase A progression ENGINE (assets, business/investment ladder, net worth, milestones)

**Owner/reviewer:** Gonzalo. **Implementer:** backenddev. **Branch:** slice-08-progression.
Scope: PURE ENGINE only (packages/engine). NO UI this slice. Deterministic, integer cents, ledger-first.
This fixes the #1 playtest problem: "gets boring — nothing to spend money on, no reason to keep
studying past SENIOR, no goals, week 30 == week 5." We add a DESTINATION.

## Read first
packages/engine/src/{state,config,actions,resolveTurn,economy,wellbeing,cli}.ts and
test/{engine,strategy}.test.ts. Keep the existing public API working (getStartingState, resolveTurn,
ACTION_POINTS_PER_WEEK, GameState, ActionType, LedgerEntry). Money is INTEGER CENTS. Append-only
ledger; balance must equal sum of deltas. Seeded mulberry32 RNG per turn (seed+turnIndex). No new deps.

## 1. ASSETS (give money meaning — a sink + ongoing effects)
- Add to GameState: `assets: string[]` (ids of owned assets). Add `netWorth` is COMPUTED (see §4), not
  stored.
- New config `ASSET_CATALOG`: a list of assets, each: { id, name, category:'HOUSING'|'TRANSPORT'|
  'LEISURE'|'LIFESTYLE', cost (cents, one-time), effects }. Effects can include any of:
  - `expensesWeeklyDelta` (cents, +/-): e.g. buying a home REDUCES rent portion (own home → lower
    weekly expenses); a fancier lifestyle asset may INCREASE expenses.
  - `eventBadWeightMultiplier` (e.g. a reliable car → fewer/cheaper bad events; multiply bad-event
    weight/cost).
  - `happinessPerTurn` / `stressPerTurnDelta` (small ongoing wellbeing effect).
  - `statusValue` (cents) — contributes to net worth / score even if no gameplay effect (pure
    aspiration). Resale not required (one-way sink is fine for v1).
  - Some assets are PREREQS/tiered (e.g. must own STARTER_HOME before LUXURY_HOME) via optional
    `requires: string[]`.
- New action `BUY_ASSET` is NOT an action-point action (purchases shouldn't compete with the weekly
  5 AP). Instead add a separate engine entry point: `purchaseAsset(state, assetId): {ok, log, error}`
  that validates funds + prereqs + not-already-owned, deducts cash via applyDelta with a NEW
  ReasonCode 'ASSET_PURCHASE', pushes asset id, applies one-time expense/effect deltas. (Ongoing
  per-turn effects are applied in resolveTurn — see §3.) Throw/return error cleanly on invalid buy.
- Provide ~8-12 assets spanning early→late game (e.g. Used Car, Reliable Car, Studio Apartment,
  Starter Home, Family Home, Luxury Home, Weekend Trip, World Vacation, Home Gym, etc.). Tune costs
  so they're meaningful sinks at the cash levels players actually reach (playtester hit ~$48k by
  week 32; early items affordable in ~5-15 weeks, luxury items aspirational at $100k+).

## 2. SKILL PAYOFF BEYOND SENIOR — business/investment ladder
Once the player maxes the job ladder (SENIOR), workSkill currently does NOTHING. Fix:
- Add `businessTier: 'NONE'|'SIDE_BUSINESS'|'BUSINESS'|'ENTERPRISE'` to GameState (default 'NONE').
- New action(s) (action-point actions, count toward the 5 AP):
  - `BUILD_BUSINESS`: progresses the business ladder when gated requirements met. Gate each step on
    workSkill thresholds ABOVE the SENIOR promotion (90), e.g. SIDE_BUSINESS needs workSkill>=110 &&
    jobTier===SENIOR; BUSINESS needs >=160 (+ maybe cash investment); ENTERPRISE needs >=220 (matches
    the "218 and nothing happened" complaint — now 218 means you're near ENTERPRISE!). Spend cash to
    start each tier (investment via ASSET_PURCHASE-like deduction, ReasonCode 'BUSINESS_INVEST').
  - Business produces escalating PASSIVE income each turn (config `BUSINESS_INCOME_BY_TIER`, paid in
    resolveTurn with ReasonCode 'BUSINESS_INCOME'), so studying past 90 finally compounds. Passive
    income should scale so late game is about GROWING wealth, not just surviving.
- Optionally add simple `INVEST` action later — NOT required this slice; business ladder is enough.
  Keep it focused.

## 3. resolveTurn integration
- Apply owned-asset ongoing effects each turn (expense deltas are already folded into expensesWeekly
  at purchase time, so DON'T double-apply; per-turn happiness/stress/event effects apply here).
- Apply business passive income each turn based on businessTier.
- Asset `eventBadWeightMultiplier` must actually influence the event draw (pass an aggregate
  multiplier into drawAndResolveEvent or apply to bad-event cost). Keep deterministic.

## 4. NET WORTH + MILESTONES + WON state (the "what am I working toward")
- Export `getNetWorth(state): number` (cents) = cash + sum(asset statusValue for owned) +
  business equity (config `BUSINESS_EQUITY_BY_TIER`). 
- Add config `MILESTONES`: ordered list { id, name, test(state)->bool } e.g. "First $10k net worth",
  "Buy your first home", "Reach SENIOR", "Start a business", "Six figures ($100k)", "Build an
  enterprise", "Millionaire ($1M net worth)". Export `getMilestones(state): {id,name,done}[]` and
  track newly-completed ones in resolveTurn log ("Milestone reached: ...").
- WON state: when the player hits the TOP milestone (e.g. Millionaire) set status='WON' with a win
  log — but the game is OPEN-ENDED, so WON is a celebration, not a hard stop (player may keep going;
  your call to allow continue — at minimum don't crash). Keep existing LOSE conditions intact.

## 5. Balance via SIMULATION (this is the proof the slice is FUN, not just compiles)
- Update cli.ts: add a new strategy `tycoon` (or extend `smart`) that, once stable, buys assets and
  builds the business ladder — i.e. plays toward the new progression. 
- Run sims and INCLUDE the output in your report: show that a smart/tycoon player can progress
  GIG→…→SENIOR→SIDE_BUSINESS→BUSINESS→ENTERPRISE and grow net worth past $100k→$1M over a long game
  (e.g. 60-100 turns), while reckless play still fails. Show that money now gets SPENT (assets) and
  net worth is the real score. Report net worth + businessTier + owned assets + milestones over time.
- Keep early-game difficulty roughly as-is (don't trivialize survival).

## 6. Tests (golden-master + new)
- All existing tests must still pass.
- Add tests: purchaseAsset (funds check, prereq check, double-buy rejection, expense delta applied,
  ledger balance == sum of deltas after purchase); business ladder gating (can't skip tiers / needs
  skill+cash); business passive income paid; getNetWorth math; milestone completion; WON trigger.
- Determinism: same seed+actions → same net worth/business/assets (golden).

## Verify + PROOF OF WORK (or REJECTED — paste real output)
- `cd packages/engine && pnpm build` (tsc clean), `pnpm test` (paste full pass count),
  and at least TWO sim runs pasted (e.g. tycoon seed 42 turns 80, and a reckless run that fails).
  Show net worth growth + business progression + assets bought + milestones in the sim output.
- `git diff --stat`. Be honest about anything not done.

## Commit + push (branch slice-08-progression, NOT main)
  git checkout main && git pull origin main && git checkout -b slice-08-progression
  ...work...
  git add -A && git commit -m "Slice 08: Phase A progression engine — assets, business ladder, net worth, milestones" && git push -u origin slice-08-progression

Constraints: pure engine only (no apps/web changes), integer cents, ledger-first, seeded RNG, no new
deps, don't read credentials, don't merge to main. If you must change the public API, keep BACKWARD
COMPAT (new fields optional/defaulted) so the existing UI still builds.
