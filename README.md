# LifeOS — Foundation Docs

**Working title:** LifeOS / Start From Zero
**Status:** Foundation / pre-code (Phase 0)
**Architect/Operator:** Gonzalo
**Owners:** Jaime dV, Nico
**v1 goal (locked):** Validate FUN. Not monetization, not marketplace, not tokens.

## Reading order (docs live in `docs/`)
1. `docs/PROJECT_BRIEF.md` — what we're building and why
2. `docs/MVP_SCOPE.md` — the hard scope cut (read this before arguing about features)
3. `docs/GAME_DESIGN.md` — the loop and what makes it fun (open-ended; no hard ending)
4. `docs/RETENTION_AND_PACING.md` — pacing + honest reasons to return
5. `docs/ECONOMY_MODEL.md` — the numbers and balance philosophy
6. `docs/TECH_ARCHITECTURE.md` — stack + deterministic engine
7. `docs/DATA_MODEL.md` — schema
8. `docs/MONETIZATION_MODEL.md` — F2P, Boost Tokens, ads (two-layer + v1 fake-ad experiment)
9. `docs/SPONSOR_OFFERS.md` — contextual sponsor design (mostly stubbed in v1)
10. `docs/ROADMAP.md` — phases 0→5
11. `docs/AGENT_WORKFLOW.md` — how Gonzalo runs the project
12. `docs/MODEL_ROUTING.md` — which model for what
13. `docs/RISK_REGISTER.md` — what can kill this
14. `docs/OPEN_QUESTIONS.md` — decisions log + what Jaime must answer

## Repo layout (target)
```
docs/              foundation docs (this is what's here now)
packages/engine/   deterministic simulation engine (pure TS) — Phase 1
apps/web/          Next.js + Tailwind + shadcn app — Phase 1
packages/db/       Prisma schema + migrations — Phase 1
scripts/           sim CLI harness, dev utilities — Phase 1
```

## The three decisions everything hangs on
1. **Validate fun first.** Smallest loop that's already fun ships first.
2. **Deterministic, server-authoritative economy.** No LLM in the money path. Ever.
3. **Hard scope cut.** v1 is ~6 systems, not 16. Depth comes after retention is proven.
