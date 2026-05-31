# PHASE B — "Real Life": Dynamic Capacity, Risk, Career Paths & Choices

> Author: Gonzalo (architect). Origin: Jaime's 2026-05-31 brief.
> Green-lit to build if game-defining. **It is** — this turns LifeOS from a finance toy into a
> life-path strategy/roguelike. Build engine-first, prove in simulation, then UI.

## Jaime's brief (verbatim intent)
1. **Dynamic action points (AP/"time").** AP should NOT top out at 6. As your income/position/life
   stage changes, your weekly capacity to plan should rise or fall. More responsibility → sometimes
   more to juggle, sometimes less free time. "Depending on where you're in life, it should increase or
   decrease."
2. **Real risk (option B), driven by other factors.** "This is real life." Risk depends on your
   choices and stats — not pure RNG. Mitigated/worsened by what you've built.
3. **Different job paths**, some better than others; you can **move between them**.
4. **Acquire more / multiple businesses**, **some sketchier than others** — higher reward, higher risk
   / downside.
5. **Bad decisions have real, sometimes worse, consequences.** Not everything is upside.

## North star
The late game must pose a continuous stream of *meaningful allocation + risk decisions* where your
stats, history, and choices interact — so two playthroughs feel different and "optimal" is contextual,
not a solved spreadsheet. Wealth must be *earned under risk*, never an autopilot annuity.

---

## DESIGN PILLARS

### Pillar 1 — Dynamic Capacity (AP becomes a real resource)
Replace the fixed `ACTION_POINTS_PER_WEEK (5) + 1 healthy bonus` with a computed **weekly capacity**:

`AP = BASE + lifeStageMod + wellbeingMod + obligationMod + perkMod` (clamped, e.g. 3..9)

- **BASE = 5.**
- **Wellbeing bonus** (keep existing): +1 if health>=80 && stress<=30. Add **−1 if health<35 OR stress>=80**
  (when you're falling apart, you can do less — real life).
- **Life-stage modifier** (see Pillar 4): early/free life = +1; established/over-committed = −1..−2.
- **Obligation modifier (NEW):** each business/dependent/major commitment consumes capacity unless
  delegated. Owning a hands-on business = −1 AP (you're running it) until you "hire a manager"
  (delegate: costs income %, frees the AP). This makes scaling a *time* problem, not just money.
- **Perk modifier:** certain assets/upgrades grant +AP (e.g., "Reliable Car" saves commute → +0 now
  but a future "Move downtown"/"Personal Assistant" asset → +1). Gives assets late-game purpose.

Net effect: a broke young adult has lots of free time but little money; a senior tycoon has money but
their week is eaten by obligations unless they spend to buy time back. **Time becomes the late-game
currency.** UI: show AP as "Time this week: N" with a tooltip breakdown of why it's high/low.

### Pillar 2 — Business v2: reinvestment, multi-business, scaling, sketch factor
Replace the 3-rung linear annuity with a **portfolio of ventures**, each an object on state.

A **Venture** = `{ id, type, capital, level, integrity }`:
- **Invest** (action or between-turn): pump cash in → raises `capital`. Weekly income scales with
  capital via **diminishing returns**: `income = baseRate(type) * sqrt(capital/unit) * repMult * levelMult`.
  So reinvestment matters but isn't infinite — real allocation decisions.
- **Skills drive it (not just Work Skill):**
  - **Work Skill** → unlocks higher venture *types* and `levelMult` ceilings.
  - **Reputation** → `repMult` (a known operator earns more; also gates legit financing).
  - **Life Skill** → reduces volatility / improves event outcomes (judgment, relationships).
- **Venture types differ in risk/reward (the "sketchy" axis):**
  - `FREELANCE` (low cap, low risk, low reward) — entry.
  - `LOCAL_BIZ` (cafe/shop) — medium, tied to reputation.
  - `STARTUP` — high reward, high variance, can fail hard.
  - `GREY_MARKET` (the sketchy one) — highest weekly yield, but accumulates **heat**; risk of a
    bust/lawsuit/seizure that can wipe the venture AND hit reputation + cash + stress. Tempting and
    dangerous. Embodies "some more sketchy than others / worst consequences."
- **Multiple ventures**: you can run several, but each costs AP (obligation) unless you delegate.
  Portfolio management = juggling time, risk, and diversification.
- **Equity / net worth**: venture equity = f(capital, level, integrity). Selling a venture realizes
  cash (exit) — a strategic option.

### Pillar 3 — Risk Engine (option B, factor-driven, not pure RNG)
A dedicated business/life **risk roll each week**, where probability and severity depend on YOUR state:
- **Triggers/weights scale with:** sketch level (GREY_MARKET heat), leverage (low cash reserves vs
  obligations), neglect (high stress, low life skill), over-extension (more ventures than you can
  staff), and aggressive choices.
- **Mitigators:** cash reserve buffer, Life Skill, Reputation, diversification, having delegated/
  insured.
- **Outcomes range:** minor (bad month −income), moderate (lawsuit/fine −cash, −rep), severe (venture
  collapse, audit/seizure for grey-market, partner lawsuit). Good-side too: viral moment, big client,
  acquisition offer.
- Deterministic: seeded per turn (seed+turnIndex), same as existing event draw. Fully testable.

### Pillar 4 — Life Stages (the thing that flexes capacity & options)
A coarse **lifeStage** derived from turnIndex + position (e.g. EARLY → ESTABLISHING → PEAK → LATE),
optionally with milestone gates. Stage changes:
- shift AP (Pillar 1),
- change event/risk weights (young = more volatility/opportunity; later = more obligations/stability),
- gate certain ventures/jobs (you can't run an enterprise in week 2).
Keeps the run evolving instead of plateauing.

### Pillar 5 — Career Paths & Mobility (different jobs, switching, consequences)
Replace the single linear GIG→ENTRY→SKILLED→SENIOR wage ladder with **multiple tracks**:
- e.g. `CORPORATE` (steady, high ceiling, high stress at top), `TRADE` (good early money, lower
  ceiling, lower stress), `CREATIVE` (volatile income, high happiness, reputation-building),
  `PUBLIC_SECTOR` (low pay, very stable, low risk).
- Each track has its own wage curve, stress profile, and synergy (e.g. CREATIVE builds Reputation that
  feeds ventures; CORPORATE builds Work Skill fastest).
- **Switching tracks (JOB_HUNT into a new track):** possible but has a **cost** — you may reset tier
  progress / take a pay cut / spend reputation. Models real career-change friction. Bad-timing switches
  hurt; well-timed ones unlock synergy.

### Pillar 6 — Choices with consequences (decision events)
Beyond passive risk: occasional **decision events** that pause for a player choice (2–3 options) with
asymmetric, sometimes-bad outcomes: e.g. "Cut corners to win a contract?" (cash now vs reputation/heat
later), "Take the high-interest loan?" (capital now vs debt spiral), "Cover for a friend?" (rep/
happiness vs cash/legal). Choice + your stats determine outcome. This is where "you can make bad
decisions with worse consequences" lives.

---

## DELIVERY PLAN (engine-first, simulate, then UI — verify each slice myself)

- **Slice 10 — Dynamic Capacity (AP) + Life Stages.** Computed AP w/ breakdown; lifeStage; obligation
  cost from ventures; delegate mechanic stub. Sim: confirm AP moves with stage/health/obligations.
- **Slice 11 — Business v2 (ventures, invest, scaling, multi, sketch + heat).** Replace tier ladder
  with venture portfolio; reinvestment w/ diminishing returns; rep/lifeSkill multipliers; venture
  types incl GREY_MARKET heat. Sim: a builder reaches $1M via legit vs a risky grey path that
  sometimes busts.
- **Slice 12 — Risk Engine + Decision Events (option B).** Factor-driven weekly risk + 2–3 decision
  events. Sim: reckless/over-leveraged runs get punished; careful runs survive; grey-market run has
  fat tails (some win big, some blow up).
- **Slice 13 — Career Paths & Mobility.** Multiple tracks + switching cost. Sim: each track viable
  with different feel; ill-timed switch hurts.
- **Slice 14 — UI for all of the above.** Time/AP breakdown, Ventures panel (invest/delegate/sell/
  heat meter), risk/decision modals, career-track picker, life-stage indicator. Keep mobile-fit.

### Non-negotiables (carry forward)
- Pure deterministic engine; integer cents; ledger-first; seeded mulberry32 per turn; golden tests.
- Backward compatible: new GameState fields optional/defaulted; old saves/UI keep building.
- No LLM in money path. Money cents→/100 for DISPLAY only.
- Honesty: risk is real but **always legible** (player can see why something happened) and **never a
  dark pattern**. Sketchy options are in-fiction risk, not real-world manipulation.
- I verify every slice myself: build + tests + my own simulation before merge.

### Open tuning questions (decide via simulation, not guesswork)
- AP clamp range (3..9?) and exact stage/obligation modifiers.
- Diminishing-returns curve constant so reinvestment is attractive but not runaway.
- Grey-market expected value: must be *tempting* (higher EV early) but with a real ruin probability so
  it's a genuine gamble, not a trap or a free lunch.
- Whether WON (Millionaire) stays the single win or becomes one of several end-states/legacy scores.
