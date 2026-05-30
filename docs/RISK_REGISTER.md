# RISK_REGISTER.md

Severity: 🔴 high / 🟠 medium / 🟢 low. Each risk has an owner-visible mitigation.

## Product risks
- 🔴 **It's not fun.** The whole genre lives or dies on the loop. → v1 exists *only* to test this;
  hard scope cut; measure retention before anything else; willing to rework the loop, not paper
  over it with features.
- 🔴 **Scope creep** (the biggest danger Nico flagged). The idea wants to become Sims + SimCity +
  crypto + marketplace + investing all at once. → Phase gates with exit criteria; MVP_SCOPE as a
  contract; Gonzalo defaults "also add…" to a later phase.
- 🟠 **Audience mismatch / discovery.** A finance-strategy sim is niche-ish; getting it in front
  of the FIRE/side-hustle crowd is its own problem. → not a v1 concern, but note for Phase 3.

## Technical risks
- 🟠 **Economy logic leaks into UI/routes** → un-testable, exploitable. → isolated pure engine
  package; review checklist; golden-master tests.
- 🟠 **Non-determinism / balance drift** breaks reproducibility + tests. → seeded RNG only;
  golden-master tests fail on any drift.
- 🟢 **Serverless Postgres connection limits** under load. → pooling (Neon/Supabase); not a v1
  problem at low traffic.
- 🟠 **Monolith-now becomes hard to split later.** → engine package boundary keeps extraction
  cheap; reviewed each phase.

## Game-economy risks
- 🔴 **Exploitable economy** (money printing, ledger ≠ balance). → append-only ledger; balance
  derivable from ledger; anomaly logging; this is *the* reason for the deterministic design.
- 🟠 **Dominant strategy / boring optimum** (one path always wins). → balancer role hunts for it;
  config-driven tuning; multiple scenarios stress different strategies.
- 🟠 **Inflation** once a marketplace exists (Phase 4). → designed sinks now; ledger gives us the
  data; marketplace gated behind explicit anti-inflation design.

## Monetization risks
- 🔴 **Pay-to-win perception** kills trust + invites worse problems. → free players can reach
  every win; BT sells time/convenience only; capped/diminishing; cosmetics-first revenue.
- 🟠 **Rewarded ads hurt retention.** → opt-in only, no forced ads; measure ad-driven churn;
  retention > ad revenue; pull back if it hurts.
- 🟠 **Sponsor dependency / no DAU to sell.** → Layer-1 generic video first (no partners needed);
  Layer-2 contextual sponsors only after DAU; both stubbed in v1.

## Legal / regulatory risks
- 🔴 **Tokens / wallet / cash-out / real-money marketplace** → money transmission, securities,
  gambling, KYC/AML, consumer protection, crypto regs. → **explicitly OUT until Phase 5,
  lawyers-first.** v1–v3 are a closed economy with no real-money out.
- 🔴 **Real-world investment / funding real businesses** → regulated investment platform. →
  OUT; only ever as *simulated* in-game investing in v1–v2.
- 🟠 **Minors on platform** (ads, payments, data). → age-appropriate design; if real payments/ads
  land in Phase 3, add age gating + compliant ad config (e.g., AdMob child-directed settings)
  + privacy policy; legal review before payments go live.
- 🟠 **Ads/data privacy** (GDPR/CCPA, consent for ad SDKs). → consent flow + privacy policy as a
  Phase-3 gate, not an afterthought.

## Marketplace / token risks (Phase 4–5)
- 🔴 **Real-value P2P trading** invites fraud, chargebacks, scams, laundering. → not before a
  clear legal structure; design spending to buy participation, not guaranteed profit.

## User-trust risks
- 🟠 **Feels exploitative / preachy.** → honest monetization as a differentiator; wry, non-
  lecturing tone; transparent value exchange on every offer.
- 🟠 **Data handling** (saves, eventually accounts/payments). → minimal data in v1; treat ledger
  as sensitive; proper auth + privacy posture before accounts/payments.

## Process risks
- 🟠 **Two owners + agents double-editing docs/code.** → define Nico's role (peer vs. consult);
  single source of truth in `/projects/lifeos`; Gonzalo owns merges.
- 🟢 **Model cost overrun.** → tiered routing; boilerplate to cheap models; batch coding tasks.

## Top 3 to watch (if you read nothing else)
1. 🔴 Scope creep — the idea's gravity pulls toward "everything." Hold the gates.
2. 🔴 Is it fun — don't build past Phase 1 until retention says yes.
3. 🔴 Anything touching real money/tokens — stays out until lawyers, Phase 5+.
