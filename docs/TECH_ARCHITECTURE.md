# TECH_ARCHITECTURE.md

## Recommended stack (v1) — confirms your direction
- **App type:** Web / PWA, mobile-first.
- **Frontend:** Next.js (App Router) + TypeScript.
- **UI:** Tailwind + shadcn/ui.
- **Backend:** Next.js Route Handlers / Server Actions for v1. **No separate backend yet** —
  see "Why monolith first" below.
- **DB:** PostgreSQL.
- **ORM:** Prisma.
- **Hosting:** Vercel (app) + **Supabase** (Postgres + Auth). DECIDED 2026-05-29 — Supabase wins
  over Neon because v1 uses **real accounts**, and Supabase gives Postgres + auth in one.
- **Auth (v1):** **Real accounts via Supabase Auth** (email + social login). DECIDED — Jaime wants
  it more personal; accounts also enable cross-device saves and a cleaner path to Phase 3.
- **Game loop:** turn-based, weekly. Player triggers "advance week"; server resolves.

### Why monolith-first (Next.js API) is the right call now
A separate backend buys us scaling and language flexibility we don't need at zero users, at the
cost of speed-to-playtest. The thing we're optimizing for is **how fast we learn if it's fun.**
The architecture below keeps the simulation engine **cleanly extractable** into a standalone
service later, so monolith-now is reversible, not a trap.

## The most important architectural decision: an isolated simulation engine
The economy/simulation logic is a **pure, framework-agnostic TypeScript package** — NOT
scattered through API routes or React components.

```
/packages/engine        ← pure simulation. No Next, no Prisma, no I/O. 100% unit-testable.
  /src
    state.ts            ← types: GameState, Stats, JobTier, ...
    rng.ts              ← seeded PRNG (deterministic)
    economy.ts          ← income/expense/sink math, ledger entry generation
    actions.ts          ← apply player actions to state
    events/             ← event deck + resolution (pure functions)
    resolveTurn.ts      ← (state, choices, seed, turn) => { newState, ledgerEntries, log }
    config.ts           ← ALL tunable economic constants (data, not logic)
  /test                 ← deterministic golden-master + property tests

/apps/web               ← Next.js app
  /app                  ← routes, server actions
  /lib/db               ← Prisma client, repositories (the only place that touches Postgres)
  /lib/sim              ← thin adapter: load state → call engine.resolveTurn → persist ledger
  /components           ← shadcn/ui dashboard, event cards, etc.

/packages/db            ← Prisma schema + migrations (shared types)
```

### Server-authoritative design (non-negotiable)
- The **client never computes balances or outcomes.** It sends *intents* ("work, study, choose
  event option B") and renders server-returned state.
- The server: loads `GameState` from Postgres → calls `engine.resolveTurn()` → writes new state
  + ledger entries in **one transaction** → returns new state.
- A turn is **idempotent per (save, turnIndex)**: replaying the same advance request can't
  double-apply (guard with a turn counter / unique constraint).

### Deterministic vs. content-generated (the bright line)
| Deterministic (engine, server) | Content-generated (offline / later, never live game state) |
|---|---|
| All money math, balances, ledger | Event flavor text, scenario descriptions |
| Stat changes, action resolution | NPC dialogue, advisor explanations |
| Event *draw* + outcome rules | Sponsor copy |
| Job/skill progression rules | Cosmetic/theme content |
| RNG (seeded) | New scenario *ideas* (still hand-reviewed before becoming config) |

**LLMs never read or write balances.** They generate *content* that is reviewed and baked into
config/data. This rule protects the economy and is repeated in every relevant doc on purpose.

## Simulation engine design principles
1. **Pure functions:** `resolveTurn(state, input) → {state, ledger, log}`. No side effects.
2. **Seeded RNG:** all randomness from one seeded PRNG; seed stored per save.
3. **Config-driven balance:** every constant in `config.ts` (or a JSON the engine loads) so
   balancing is data we can tune without touching logic.
4. **Ledger-first:** the engine *emits* ledger entries; the app persists them. Balance is always
   derivable from the ledger (audit invariant).
5. **Golden-master tests:** fixed seed + scripted choices → asserted exact end state. Catches
   any accidental balance drift on every commit.

## Deployment assumptions (v1)
- Vercel for the Next app (preview deploys per PR — great for playtesting branches).
- Neon/Supabase Postgres with connection pooling (serverless-friendly).
- Migrations via Prisma Migrate, run in CI on deploy.
- Cheap by design: at v1 traffic this stays in free/low tiers.

## Security assumptions (v1)
- Server-authoritative everything → client can't forge balances.
- Validate all inputs server-side (zod) against current state (e.g., can't "work" with 0 AP).
- Rate-limit "advance turn" per save to stop scripted exploitation.
- No secrets in client. Env via Vercel project settings.
- Even with no payments in v1, treat the ledger as the source of truth and log anomalies — this
  habit is what makes Phase 3+ (real money) safe.

## What we are explicitly NOT building yet
WebSockets/realtime, microservices, a separate game server, Redis, queues, blockchain, payment
SDKs, ad SDKs. All deferred. The engine package boundary keeps them addable without a rewrite.
