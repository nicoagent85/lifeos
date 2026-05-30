# TASK: Slice 02 — Wellbeing as a second progression pillar

**Owner/reviewer:** Gonzalo. **Implementer:** backenddev. **Branch:** slice-02-wellbeing.
**Read first:** docs/WELLBEING_SYSTEM.md (the contract), plus existing engine in packages/engine.

## Goal
Turn Health/Stress from passive decay into an active pillar with feedback loops, so balancing
wellbeing vs. grinding becomes the smart play. Found via sim: a pure grinder reaches SENIOR + ~$3.8k
but dies of burnout at turn 19 (health 100→0, stress pinned at 100). Fix that with mechanics, not
a rule.

## Scope (tight — Health + Stress + 3 actions + feedback + medical risk + stub sponsor)
Implement exactly:

### A. New upkeep actions (actions.ts)
Add to ActionType: 'EAT_HEALTHY' | 'WORK_OUT' | 'HAVE_FUN' (keep existing WORK/STUDY_WORK/
STUDY_LIFE/REST/JOB_HUNT/SIDE_GIG).
- EAT_HEALTHY: cost cash (config: ~2500 cents/pt), +health (config), +small happiness. Ledger
  reason code: add 'WELLBEING' to ReasonCode union; use it for these cash costs.
- WORK_OUT: costs the action point(s) only (no cash), +health, -stress.
- HAVE_FUN: cost cash (config), -stress (large), +happiness.
- Keep REST as the free low-value recovery baseline.

### B. Feedback loops (resolveTurn.ts + a new wellbeing.ts helper)
- **Income performance multiplier from Health:** WORK/SIDE_GIG income scaled by a health factor.
  Config-driven: e.g. health>=80 → 1.10x, 50–79 → 1.0x, 25–49 → 0.9x, <25 → 0.75x. Apply as
  integer-cents math (floor), still emit WAGE ledger entry with the final amount.
- **Stress penalty:** if stress>=90, additional income penalty (config, e.g. -10%) AND raise
  negative-event weight that turn.
- **Energy bonus:** if health>=80 AND stress<=30 at START of turn, grant +1 action point this
  week (so ACTION_POINTS can be 6 that turn). Cap at +1. Log it.
- **Event-odds shift:** pass a bias to the event draw — high health/low stress raises positive
  event weights, low health/high stress raises negative ones. Keep it deterministic (bias is a
  pure function of current stats; rng draw still seeded per turn).

### C. Medical-expense risk (events/index.ts)
- Make MEDICAL_BILL odds + size scale with low health (the neglect sink). Add config knobs.
- Add one new event 'CHECKUP_PROMPT' or fold into existing: when health is low, higher chance of
  a costly medical event. Keep deterministic.

### D. Wellness sponsor slot (STUB only)
Add a tiny stubbed helper `wellnessSponsorOffer(state)` returning a mock opt-in offer object
(e.g. { kind:'WORK_OUT_DISCOUNT', label:'Watch a clip → free workout this week' }). DO NOT wire
real ads/UI. In dev/sim, a flag can auto-accept to grant the mock reward via a WELLBEING ledger
entry. This just proves the hook exists. Keep it minimal.

### E. Config (config.ts)
All new constants here (data, not logic): action costs/effects, health income-factor brackets,
stress penalty threshold, energy-bonus thresholds, medical-risk scaling. Tunable.

## Hard rules (unchanged — do not violate)
- Pure engine, no I/O, no Math.random/Date.now; all rng from seeded prng (per turn from seed+turnIndex).
- Money = integer cents. Every cash/BT change emits a ledger entry; balance == sum of deltas.
- Deterministic: same (state, seed, choices) → identical result.

## Tests (keep existing 6 green; ADD these)
1. **wellbeing-helps test:** two identical seeds/strategies except one neglects wellbeing — over
   30 turns the balanced player ends with HIGHER health AND does not hit the burnout/LOST-by-health
   outcome that the grinder does (assert grinder health lower / or grinder LOST, balanced ACTIVE).
2. **income-factor test:** WORK income at health>=80 is strictly greater than the same WORK at
   health<25 (holding tier constant). Assert exact expected cents for one case.
3. **medical-risk test:** with low health, over many seeds, medical-event frequency/cost is higher
   than with high health (statistical over a fixed seed set — keep it deterministic & asserted).
4. **ledger-integrity still holds** with the new WELLBEING reason code (extend existing check).
- Update the golden-master expected values if A/B changed them (re-run, hard-code new numbers,
  note old vs new in report).

## Verify + run (paste real output)
  cd packages/engine && npx tsc --noEmit ; npx vitest run
Then run TWO sims, 30 turns, seed 42, BROKE_YOUNG_ADULT, and capture ~10 lines each:
  - "grinder" strategy: 3 WORK / 1 STUDY_WORK / 1 JOB_HUNT (no wellbeing)
  - "balanced" strategy: 2 WORK / 1 STUDY_WORK / 1 WORK_OUT / 1 HAVE_FUN (or similar)
Report: does the balanced player now AVOID burnout and ultimately do better/comparable, while the
grinder gets punished (medical costs, performance penalty, or death)? That's the success signal.

## Commit + push (branch only, NOT main)
  git checkout -b slice-02-wellbeing 2>/dev/null || git checkout slice-02-wellbeing
  git add -A && git commit -m "Slice 02: wellbeing pillar (upkeep actions, health/stress feedback, medical risk, stub wellness sponsor) + tests" && git push -u origin slice-02-wellbeing

## PROOF OF WORK required (or rejected)
- tsc result + vitest summary (N passed).
- new golden-master values (old vs new).
- ~10 lines each of grinder vs balanced sim output.
- one-paragraph balance read: is wellbeing now a meaningful pillar? does neglect get punished?
Be honest per your doctrine: what's implemented, tested+passing, and what's NOT verified.

## Out of scope: no DB, no UI, no real ads, no new sub-stats (sleep/diet/fitness levels). Phase 2+.
