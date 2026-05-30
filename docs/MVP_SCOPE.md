# MVP_SCOPE.md

> **Read this before debating features.** The single highest-leverage decision in this project
> is *what we DON'T build first.* The original brief listed ~16 systems. That is a v2 wearing
> an MVP costume. Below is the cut.

## The principle
The fun in this genre comes from **interesting decisions under tension**, not from system
count. We ship the smallest loop that is *already fun*, measure retention, then add depth.
A bloated MVP delays the only thing that matters: finding out if the loop is fun.

---

## v1 — IN SCOPE (the "Fun Core")
The minimum needed to test whether weekly life decisions are fun.

1. **Character creation (lite)** — pick a starting scenario (3–4 options), see your starting
   stats. No deep customization yet.
2. **Weekly turn loop** — the heartbeat. Each turn: see your situation → choose actions →
   resolve → see consequences → next week.
3. **Money core** — cash, income (from a job), expenses (rent + food + a couple of bills).
   This is the central tension: survive and get ahead.
4. **Jobs & skills (lite)** — a small job ladder. Working earns money; studying/skill-building
   trades short-term money/time for better future income. The core risk/reward axis.
5. **Life events** — a curated deck of ~25–40 events (car breaks, medical bill, job offer, rent
   hike, scam, small windfall). This is where the *story* and the tension live.
6. **Stats that create pressure** — cash, income, expenses, **health, stress, happiness**,
   one or two skills. Enough to force tradeoffs (work more → money up, health/happiness down).

That's it. Six systems. Single-player. In-game currency only.

### v1 monetization presence
Built so the loop accounts for them, but **no real payment/ad-network integrations**:
- Dev-mode "Boost Tokens" (no payments wired up).
- **Rewarded-ad button is REAL, the ad is FAKE** (DECIDED 2026-05-29): full opt-in "Watch for a
  reward" flow with a ~15s mock ad. Purpose: test *do players choose to watch?* — the profitability
  signal — without depending on a real ad network that won't serve an unpublished app. Phase 3
  swaps the mock for a real SDK, no redesign. (See `MONETIZATION_MODEL.md`.)
These exist so we can design around them AND run the watch-rate experiment — not to make money in v1.

---

## v1 — EXPLICITLY OUT OF SCOPE
Deferred on purpose. Each has a home in `ROADMAP.md`.

- Housing system (buying/moving) → start everyone renting a fixed place. *Phase 2.*
- Transportation as a system → fold into events/expenses for now. *Phase 2.*
- Debt & credit score as a system → one simple loan event max; no full credit model. *Phase 2.*
- Assets, depreciation, maintenance → *Phase 2.*
- Investments → *Phase 2.*
- Business / side-hustle mechanics → *Phase 2.*
- Real Boost Token payments → *Phase 3.*
- Real ads / rewarded video → *Phase 3.*
- Contextual sponsor deals → *Phase 3+.*
- Multiplayer, marketplace, trading, leaderboards → *Phase 4.*
- Tokens, wallet, crypto, cash-out, real-world investment → *Phase 5 / maybe never.*
- LLM-generated scenarios/events/NPC text → *Phase 5* (content only, never game state).

---

## First playable milestone (the bar for "Phase 1 done")
A player can, in the browser, on their phone:
1. Pick a starting scenario.
2. Play **at least 20 weekly turns** without a dead end or softlock.
3. Experience meaningful tradeoffs (working vs. studying vs. resting) and random events.
4. Reach a recognizable outcome (e.g., stable/thriving vs. spiraling into a crisis).
5. Feel the pull to *start again and play differently.*

## Minimum feature set to test "is it fun?"
- 3 starting scenarios with distinctly different opening tension.
- The 6 systems above, balanced enough that no single strategy dominates.
- ~30 life events that feel varied.
- A clear end/checkpoint per "run" so we can measure runs completed + restarts.
- Lightweight analytics: turns per session, session length, D1/D7 return, restart rate.

## Definition of "we cut something correctly"
If a feature can be removed and a playtester still can't stop after 15 minutes, it stays out
of v1. If they CAN stop, the loop — not the feature list — is the problem to fix.
