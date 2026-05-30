# SPONSOR_OFFERS.md

> **v1 status: fully STUBBED.** The slot, UI, data shape, and cooldown logic exist; the reward
> is granted instantly in dev mode. NO real sponsor or ad integration in v1. This doc designs
> the system so it's ready to activate in Phase 3 without rework.

## The reality check (re: Jaime's ad-network note)
- **Generic ad networks (AdMob, AppLovin, Unity, ironSource)** sell *rewarded video* with only
  coarse category/contextual targeting. They will NOT guarantee "this ad is from a fuel brand"
  so you can hand out a fuel-specific benefit.
- **Category-guaranteed contextual sponsors** require **direct brand deals** or a specialized
  sponsor network — which need real DAU to be worth anyone's time.
- Therefore the system below supports **two reward grades**, and v1/early-Phase-3 leans entirely
  on the generic grade.

## Two reward grades
### Grade A — Generic reward (from Layer-1 rewarded video) — usable as soon as Phase 3
"Watch an ad → get a generic perk." Not tied to an advertiser category.
- Reward examples: a few Boost Tokens, +1 action point this week, a small generic discount on
  an in-game expense, soften one bad event.

### Grade B — Contextual sponsor reward (from Layer-2 direct deals) — later
"Every sponsor message gives a related real-life-style benefit." Requires a real partner.

## Sponsor categories (Grade B design) + contextual offer examples
| Category | In-game contextual reward |
|---|---|
| Fuel / transport | fuel savings, transport voucher, repair discount |
| Education | course discount, skill boost, scholarship voucher |
| Grocery / food | food discount, grocery voucher |
| Health / wellness | stress reduction, health-cost discount |
| Bank / finance | fee reduction, credit-education unlock, loan-processing boost |
| Business | marketing credit, software discount, inventory discount |
| Housing | moving discount, rent assistance, furniture discount |

**Core rule:** every sponsor message grants a *related, real-life-style* in-game benefit.

## Reward types (taxonomy used by both grades)
- Currency grant (Boost Tokens, capped).
- Temporary buff (extra AP, stress/health relief — time-boxed).
- Cost discount (reduce a specific upcoming expense).
- Event softener (improve/re-roll one outcome).
- Content unlock (trial of a premium scenario/cosmetic).

## How offers appear in-game (anti-annoyance is a feature)
- **Opt-in only.** Offers live in clearly labeled spots: a "Perks / Offers" panel, and a
  contextual "Get help with this?" button on relevant moments (e.g., a "fuel discount" option
  surfaces when a car/transport expense hits — but only if the player taps to seek it).
- **Never** interrupt the loop, never auto-play, never block progress. No forced views, no popups.
- Always show the value exchange plainly: "Watch a short ad → +1 action point this week."

## Cooldowns / limits (anti-fraud + anti-fatigue)
- Per-reward cooldown (e.g., a given perk available once every N turns).
- Global daily cap on rewarded views per user.
- Diminishing returns on stacked buffs (mirrors BT guardrails — no exploiting ads into dominance).
- Server-side verification of ad completion (SSV callbacks) before granting — logged in an
  `AdImpression/RewardGrant` audit table (see DATA_MODEL Phase 3) to catch fraud.

## How to avoid annoying users (the trust contract)
1. No forced ads, ever. No interstitials, no popups, no gameplay interruption.
2. Offers are *help the player asked for*, not ads we pushed.
3. Contextual = genuinely relevant to the moment, not random.
4. The free game never feels degraded to pressure spending/watching.
5. We measure ad-driven churn; if rewarded ads hurt retention, we pull back. Retention > ad revenue.

## v1 stub spec (what we actually build now)
- A `SponsorSlot` UI component that shows a Grade-A style "Watch for reward" / "Get a perk" CTA.
- In dev mode, tapping it **instantly grants** the configured reward and writes a normal ledger
  entry (reason_code `BT_GRANT` / a discount applied) — *no ad shown, no network call.*
- Cooldown + cap logic implemented and tested now, so Phase 3 only swaps the stub for a real SDK.
