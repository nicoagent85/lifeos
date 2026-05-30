# MONETIZATION_MODEL.md

> **v1 ships ZERO real monetization.** Everything here is designed now and *stubbed* so the loop
> accounts for it, then turned on in Phase 3 *after retention is proven.* Monetizing an unfun
> game just buys expensive proof that it's unfun.

## Free-to-play structure
- The **entire game is fully playable for free, start to finish.** Paying never unlocks the
  *ability* to win — only convenience, speed, cosmetics, and breadth of content.
- This is a deliberate **trust differentiator** in a genre full of predatory mechanics. It's
  also the safest posture legally and reputationally.

## The two-layer ad/reward model (this resolves Jaime's note)
Jaime's instinct — use existing ad networks (AdMob/AppLovin/etc.) for rewarded video — is right,
with one correction: **ad networks give you GENERIC rewarded video, not category-guaranteed
sponsor ads.** So we split it:

### Layer 1 — Generic Rewarded Video  (the real, scalable money) — Phase 3
- Integrate a standard rewarded-ad SDK/mediation (e.g., Google AdMob, AppLovin MAX).
- Player **opts in**: taps "Watch an ad for a reward" → gets a *generic* in-game perk
  (e.g., a few Boost Tokens, an extra action point this week, soften one bad event).
- **No forced ads, no popups, no interruptions.** Ads only appear when the player seeks a benefit.
- This works from day one of monetization, needs **no sponsor relationships**, and pays per view.

#### v1 experiment: the rewarded-ad button is REAL, the ad is FAKE (DECIDED 2026-05-29)
We build the full opt-in "Watch for a reward" flow in v1, but show a **placeholder/mock ad**
(~15s mock screen) instead of a real network ad. Why: ad networks (AdMob) won't serve real ads
to an unpublished app with ~20 testers, so we can't test the network in v1 anyway. But we CAN
test **the only thing that matters now: do players choose to watch?** If testers tap it for
rewards, that's the profitability signal. Phase 3 = swap the mock for a real SDK, no redesign.

#### Open-mind monetization ideas (Jaime, 2026-05-29) — parked for Phase 2/3, flagged for legal
Keep exploring ways to capitalize beyond third-party ad networks. Candidates to evaluate later:
- **Our own video content** as the "rewarded ad" (tutorials, our promos, IAP explainers) — we
  keep 100% and control quality/relevance.
- **Affiliate links** (e.g., Amazon products) surfaced contextually as opt-in offers — revenue
  via affiliate commission. ⚠️ requires disclosure (FTC/affiliate-program rules) + careful, non-
  spammy placement; never break the "no forced ads / honesty" line.
- **In-app videos that double as tutorials AND promos for our own IAP** — likely fine (it's our
  own content/product), but keep it opt-in and genuinely useful, not dark-pattern nagging.
- All of the above are **Phase 2/3 explorations**, must pass the "sells convenience/content, not
  winning" test, and any affiliate/real-money element gets a quick legal sanity check first.

### Layer 2 — Contextual Sponsor Offers  (the on-brand dream) — Phase 3+/later
- The "fuel sponsor → fuel discount" mapping requires **direct deals or a sponsor SDK**, because
  generic ad networks won't guarantee the advertiser's category. So Layer 2 only makes sense once
  we have meaningful DAU to sell.
- Details in `SPONSOR_OFFERS.md`. **In v1 these are fully stubbed** (the slot exists, grants a
  fake reward in dev mode) so the design and UI are ready when real deals are possible.

> Net: build the loop so it *can* show rewarded offers, ship Layer 1 first in Phase 3, treat
> Layer 2 as a later upgrade. Don't block v1 — or even Phase 3's start — on sponsor sales.

## Boost Tokens (BT)
- Premium **convenience** currency. In v1: dev-mode, free, no payments. Phase 3: buyable +
  earnable via rewarded video.
- **Allowed:** accelerate waits, +1 action point (capped/diminishing), occasional event re-roll
  (capped per run), cosmetics, extra save slots, premium scenarios/packs.
- **Forbidden:** direct large cash grants, guaranteed promotions/wins/skill levels, erasing the
  consequences of strategic mistakes. (Mirrors `ECONOMY_MODEL.md`.)

## Paid shortcut rules (the one test)
For any paid feature, ask: **"Does this sell TIME/CONVENIENCE/CONTENT, or does it sell WINNING?"**
- Sells time/convenience/content → allowed.
- Sells winning → cut. No exceptions.

## What CANNOT be bought (hard guardrails)
- Guaranteed game outcomes (promotion, win state, skill level).
- Large amounts of in-game Cash (only small, capped convenience top-ups, if ever).
- Removal of all consequences / godmode.
- Anything that lets a paying player dominate a future multiplayer economy by spending.

## Anti-pay-to-win guardrails
1. Free players can reach **every** win/milestone purely by playing.
2. BT effects are **capped and diminishing** — money can't be stacked into dominance.
3. Cosmetics and *content breadth* (scenario packs) are the preferred revenue, not power.
4. Any future marketplace must be designed so spending buys *participation*, not *guaranteed
   profit* (and that's a Phase 4 legal+design problem, see RISK_REGISTER).

## Likely revenue mix (post-validation, rough priority)
1. **Cosmetics & content packs** (scenario packs, themes) — safest, on-brand, no P2W.
2. **Premium subscription** — extra saves, advanced stats/analytics, AI advisor, scenario
   generator, deeper sim. Recurring + sticky.
3. **Generic rewarded video (Layer 1)** — opt-in, scales with DAU.
4. **Contextual sponsors (Layer 2)** — later, requires DAU + partnerships.
5. **Creator marketplace cut** — much later (players sell scenarios/businesses; we take a %).

## No-cash-out assumption (v1 and the foreseeable v-line)
- No mechanism to convert in-game value into real money. No wallet, no token, no P2P real-money
  transfer. This keeps us out of money-transmission / securities / gambling territory.
- Revisiting this is a **Phase 5, lawyers-first** decision — never an incremental feature.
