# ECONOMY_MODEL.md

> The economy must be **deterministic, server-authoritative, auditable, and testable.** Every
> balance change is a ledger entry. No client math. No LLM in the money path. This is the rule
> that lets us add a marketplace later without the economy collapsing into exploits.

## Currencies (v1)
1. **Cash (in-game money)** — the survival/score currency. Earned by playing. Cannot be bought
   in v1.
2. **Boost Tokens (BT)** — premium convenience currency. In v1: **dev-mode only, granted free,
   no real payments.** Designed now so the loop accounts for them; monetized in Phase 3.

> v1 has NO real-money currency, NO tradeable token, NO wallet, NO cash-out. (See `RISK_REGISTER.md`.)

## Income sources (v1)
- **Job wage** — primary. Weekly amount = f(job tier, hours/action-points worked, small noise).
- **Side actions** — a one-off gig action (small, capped) so a desperate player has an out.
- **Event windfalls** — occasional (bonus, gift, small inheritance, scholarship). Rare by design.

## Expenses (recurring weekly)
- **Rent** (fixed per scenario in v1; housing system is Phase 2).
- **Food/living** — scales slightly with choices (you can underspend at a health/happiness cost).
- **Bills** — small fixed utilities/phone bundle.
- **Situational** — event-driven (repair, medical, fine).

## Money sinks (keep the economy from inflating)
Critical for long-term health and for a future marketplace. v1 sinks:
- Recurring expenses (the main sink).
- Event costs (repairs, medical, fines).
- Skill/education costs (spend cash to raise skill — converts money into progression).
- (Phase 2+) asset purchase + maintenance + depreciation; loan interest; taxes.

## Inflation control
- **Closed economy, single-player in v1** → inflation is a *balance* problem, not a monetary
  one. Controlled by tuning income vs. expense curves so the player is never trivially rich.
- Design rule: **net weekly surplus for an average-skill player should hover near zero early**,
  turning positive only through good decisions/skill growth. Getting ahead must be *earned.*
- All economic constants live in a single **tunable config file** (see TECH_ARCHITECTURE) so
  balancing is data, not code. We can re-tune without redeploying logic.

## Asset costs / maintenance / depreciation (Phase 2 — specced now)
- Assets (car, better housing, business) have: purchase cost, weekly maintenance (sink),
  depreciation (value decays), and a utility (reduce other costs / raise income / open events).
- Rule: **no asset is pure upside.** Every asset adds a maintenance sink. This keeps "buy your
  way ahead" honest.

## Taxes (Phase 2 — simplified)
- A simple flat-ish bracket applied to income, presented transparently. Teaches the concept
  without becoming an accounting app. Out of v1.

## Debt / interest (Phase 2 — one event in v1)
- v1: at most ONE "take a loan?" event with simple flat repayment — to seed the *feeling* of
  debt without a full credit model.
- Phase 2: proper debt with interest, minimum payments, credit score effects, and a
  **predatory-loan trap** as a teaching moment.

## How shortcuts work without destroying balance (Boost Tokens)
This is the anti-pay-to-win heart of the economy. Boost Tokens may buy **time and convenience,
never guaranteed outcomes.** Allowed BT uses:
- **Skip/accelerate** a wait (e.g., recover health faster, finish a study track sooner).
- **Extra action point** for a week (capped — diminishing returns, can't stack infinitely).
- **Re-roll or soften** one bad event outcome occasionally (capped per run).
- **Cosmetic / convenience** (extra save slots, themes).

BT may **NOT**:
- Directly grant Cash above a small, capped amount.
- Guarantee a promotion, a win, or a skill level.
- Remove the consequences of strategic mistakes wholesale.

Design test for any BT use: *"Does this sell time/convenience, or does it sell winning?"* If it
sells winning, it's cut. (Enforced in `MONETIZATION_MODEL.md` guardrails.)

## Auditability — the economy ledger
Every change to Cash or Boost Tokens is recorded as an immutable ledger entry:
`(id, save_id, turn, currency, delta, balance_after, reason_code, source, created_at)`.
- The player's balance is always **derivable by summing the ledger.** If balance ≠ ledger sum,
  that's a bug/exploit alarm.
- `reason_code` is an enum (WAGE, RENT, FOOD, EVENT_REPAIR, SKILL_PURCHASE, BT_GRANT, …) so we
  can analyze where money flows and tune sinks.
- This ledger is also the foundation any future marketplace will require.

## Determinism
- Each save has a **seed.** All randomness (event draws, noise on wages, outcomes) is driven by
  a seeded PRNG on the server. A turn is **reproducible**: same (state, seed, turn index,
  choices) → same result. This makes the economy testable and exploits detectable.
