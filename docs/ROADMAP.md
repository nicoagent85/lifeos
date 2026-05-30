# ROADMAP.md

> Phase gates are **decision points**, not calendar dates. We do not advance a phase until the
> prior phase's exit criterion is met. The recurring trap in this idea is scope creep; phase
> gates are the antidote.

## Phase 0 — Foundation / Design  ← WE ARE HERE
- Produce + review these foundation docs.
- Jaime/Nico answer `OPEN_QUESTIONS.md` blockers.
- **Exit criterion:** docs approved; v1 scope and stack locked; open questions resolved enough
  to start.

## Phase 1 — Playable Prototype  (validate FUN — the whole point of v1)
Build the "Fun Core" from `MVP_SCOPE.md`:
- Engine package (deterministic, tested), Next.js app, Postgres schema (`[v1]` tables only).
- Character creation (3 scenarios), weekly turn loop, money core, jobs+skills (lite), ~30 events,
  pressure stats, lose/milestone conditions.
- Stubbed Boost Tokens + stubbed sponsor slot.
- Lightweight analytics (turns/session, session length, D1/D7, restart rate).
- **Exit criterion (the only one that matters):** real playtesters keep playing — measurable
  retention + restart pull. If not, **stop and fix the loop**, do not add features.

## Phase 2 — Economy Depth  (only if Phase 1 retention is real)
- Housing (buy/move), transportation, full debt + credit score, assets (maintenance/depreciation),
  taxes, investments, business/side-hustle mechanics, more scenarios, milestone tiers.
- **Exit criterion:** deeper systems increase session length / return rate without breaking
  balance (golden-master tests stay green; no dominant strategy).

## Phase 3 — Monetization Test  (only with proven retention)
- Real payments for Boost Tokens; **Layer-1 generic rewarded video** (AdMob/AppLovin).
- Cosmetics + first content/scenario packs; premium subscription trial.
- Sponsor slot stays stubbed → optionally pilot **Layer-2** contextual sponsor if DAU justifies.
- **Exit criterion:** positive unit economics signal (ARPDAU / conversion) WITHOUT measurable
  pay-to-win or ad-driven churn.

## Phase 4 — Multiplayer / Marketplace Research
- Design (not necessarily ship) shared economy: player businesses, trading, leaderboards,
  rentals. Heavy on inflation/exploit/abuse controls — the deterministic ledger pays off here.
- **Lawyers involved before any real-value mechanic.**
- **Exit criterion:** a multiplayer design that can't be exploited into inflation/scams, with a
  clear legal read.

## Phase 5 — Advanced / LLM Content + (maybe) Real-Value Economy
- LLM-generated scenarios/events/NPC/advisor text — **content only, hand-reviewed, never game
  state** (mirrors TECH_ARCHITECTURE bright line).
- Only here, lawyers-first, do we even *evaluate* tokens/wallet/cash-out/real-world investment.
  This may never happen, and that's fine.

## Cross-phase rule
Anything from a later phase that sneaks into an earlier one must be justified against the current
phase's exit criterion. If it doesn't move *that* needle, it waits. (Gonzalo enforces this.)
