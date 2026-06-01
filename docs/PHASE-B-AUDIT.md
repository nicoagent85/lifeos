# Phase B — Spec vs Implementation Audit

_Purpose: verify that what was **designed** in `PHASE-B-MASTER-PLAN.md` is what was actually **built** in the engine. Every claim below is backed by a file + the real constant/function. Numbers are pulled directly from source, not from memory._

Last audited: 2026-06-01. Engine tests passing: **45**.

---

## 1. Dynamic Capacity + Life Stages (Slice 10) — ✅ IMPLEMENTED

| Design claim | Implemented? | Evidence |
|---|---|---|
| Weekly action points rise/fall with life stage | ✅ | `getActionCapacity()` in `config.ts` — `lifeStage` term: EARLY +1, ESTABLISHING 0, PEAK −1, LATE 0 |
| AP changes with health/stress | ✅ | `wellbeing` term: +1 if health≥80 & stress≤30; −1 if health<35 or stress≥80 |
| Each active business/venture costs time | ✅ | `obligations = -getObligationCount(state)` (−1 per non-delegated venture/business) |
| Delegating frees the time | ✅ | `getObligationCount` skips `delegated` ventures |
| AP clamped to a sane range | ✅ | `AP_MIN=3`, `AP_MAX=9`, base 5 |
| Engine and UI use ONE source of truth | ✅ | Both call `getActionCapacity` (UI: `page.tsx`; engine: `resolveTurn.ts`) |

**Life stage cutoffs:** EARLY <26 wks, ESTABLISHING 26–77, PEAK 78–155, LATE 156+.

---

## 2. Business v2 — Ventures Portfolio (Slice 11) — ✅ IMPLEMENTED

**Four venture types** (`VENTURE_DEFS` in `config.ts`). All requirements are REAL constants:

| Venture | Min Work Skill | Founding cost | Base rate | Equity mult | Heat/wk | Volatility |
|---|---|---|---|---|---|---|
| **Freelance Gig** | 40 | $500 | $80/wk* | 0.5× | 0 | 0.10 (very safe) |
| **Local Business** | 90 | $3,000 | $180/wk* | 1.0× | 0 | 0.20 (safe) |
| **Startup** | 140 | $10,000 | $350/wk* | 1.5× | 0 | 0.45 (volatile) |
| **Grey-Market Op** | 110 | $5,000 | $600/wk* | 0.8× | +6 | 0.60 (dangerous) |

\* base rate = income at exactly $5,000 capital, level 1, neutral reputation. Real income scales up from there.

| Mechanic | Implemented? | Evidence |
|---|---|---|
| Found a venture (skill + capital gate) | ✅ | `startVenture()` in `index.ts` — checks `minWorkSkill`, `minCapital` |
| Reinvest capital, diminishing returns | ✅ | `getVentureIncome` = `baseRate × √(capital/$5k) × repMult × levelMult` |
| Reputation boosts income | ✅ | `repMultiplier` = 1 + max(0,rep)/200 (rep 100 → +50%) |
| Levels raise the ceiling | ✅ | `levelMult = 1 + (level−1)×0.35`; level rises with capital (log2) |
| Delegate (free time, manager takes cut) | ✅ | `setVentureDelegated`; income ×0.6 when delegated |
| Sell/exit realizes equity as cash | ✅ | `exitVenture` → `getVentureEquity = capital × equityMult` |
| Counts toward net worth | ✅ | `getNetWorth` adds each venture's equity |
| Pays weekly into the ledger | ✅ | `resolveTurn` venture loop → `VENTURE_INCOME` ledger entries |

**Simulated income (mid-game, +$20k capital):** Freelance ~$580/wk · Local ~$850/wk · Startup ~$1,500/wk · Grey ~$3,000/wk. Differentiation confirmed.

---

## 3. Factor-Driven Risk Engine (Slice 12) — ✅ IMPLEMENTED

**Risk is NEVER random for a plain worker.** It only fires if you have business/venture exposure (`resolveRisk` gates on this — golden-master test proves vanilla players are unaffected).

Weekly risk probability (`computeRiskFactors` in `risk.ts`) is built from:

| Factor | Weight | Meaning |
|---|---|---|
| Grey-market heat | up to +0.30 (heat/600, capped) | the dominant driver for sketchy ops |
| Leverage (thin reserves) | +0.05 | low cash buffer vs obligations |
| Neglect (stress + low life skill) | +0.05 | burnout/poor judgment invites mistakes |
| Over-extension | +0.07 | running more hands-on ventures than you can |
| Volatility² | +0.08 | startup/grey are inherently shakier |

**Mitigated** by: cash reserves, Life Skill, Reputation (up to ~50% severity reduction).

| Outcome | When | Effect |
|---|---|---|
| **Grey BUST** | high heat + severity>0.6 | venture SEIZED, −25 reputation, −stress, cash hit |
| Grey shakedown | high heat, lower severity | pay a fine, lose some heat |
| Business setback | any exposure | cash loss + stress; severe = half a venture's capital |

**Simulated:** Ride a grey op long → busts ~every time. Get in/out fast → ~4 in 10 still burned. Freelance → almost nothing. This is the intended high-risk/high-reward shape.

---

## ⚠️ KNOWN GAP — flagged for decision

**There are currently TWO business systems running in parallel:**
1. **Legacy ladder** — `businessTier`: SIDE_BUSINESS → BUSINESS → ENTERPRISE (flat income, the old Slice 08 system the UI still shows).
2. **New ventures portfolio** — the richer system above (no UI yet).

This is intentional for back-compat (old saves don't break), but it WILL confuse a player who sees both. **Decision needed:** when the venture UI lands, either (a) hide the legacy ladder and migrate, or (b) present the legacy ladder as a fourth "auto-managed business" option. Recommend (a) — fold legacy into ventures for one clean system.

---

## What's NOT built yet (next slices)
- **Career paths** (Slice 13) — specialization tracks, not yet implemented.
- **UI for ventures + risk** (Slice 14) — engine works; nothing on screen yet. **This is why requirements aren't visible to the player** — they live in `VENTURE_DEFS`/`BUSINESS_SKILL_REQ` and aren't surfaced. Fixing next.
