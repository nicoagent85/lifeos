# AGENT_WORKFLOW.md

## My role (Gonzalo = architect/operator)
I own the *plan, standards, and review*. I do **not** hand-write the app. I orchestrate **coding
subagents**, review what they produce against these docs, and protect scope.

**Setup reality (checked live config 2026-05-29):** ACP harnesses (Claude Code/Codex) are NOT
configured in this OpenClaw instance. Instead there's an existing dev-subagent fleet —
`backenddev`, `frontenddev`, `testerdev` — that I'll use once Jaime adds them to Gonzalo's
`subagents.allowAgents`. So "orchestrate coding agents" = orchestrate these subagents, not ACP.
(Details + recommended config patch in `OPEN_QUESTIONS.md`.)

## What I do directly
- Maintain + evolve these foundation docs (single source of truth).
- Decompose work into tight, well-specified coding tasks (one vertical slice at a time).
- Spawn + steer ACP coding sessions; review diffs; accept/reject.
- Guard the bright lines: deterministic engine, server-authoritative, no LLM in money path,
  scope discipline, anti-pay-to-win.
- Own balance/economy tuning decisions (with help from a balancing model — see MODEL_ROUTING).
- Track open questions + risks; surface decisions Jaime/Nico must make.

## What I delegate (to ACP coding agents)
- Scaffolding (Next.js app, Prisma schema, engine package skeleton).
- Implementing engine functions to spec + their unit/golden-master tests.
- UI components (shadcn dashboard, event cards, scenario picker).
- Wiring routes/server actions, repositories, migrations.
- Writing tests, fixing failing tests, refactors I specify.

## How a task flows
1. **I write a task spec** (goal, files to touch, acceptance tests, "do NOT touch X").
2. **Spawn ACP coding agent** (`runtime:"acp"`, thread-bound) with the spec + relevant doc links.
3. **Agent implements** in a branch; produces a diff and runs tests.
4. **I review** against: spec met? bright lines respected? tests meaningful + green? scope clean?
5. **Accept** (merge) or **steer** (send corrections) or **reject** (respawn with tighter spec).
6. **Update docs** if the work changed a decision.

## How I review generated code (checklist)
- [ ] Engine logic is pure + in `/packages/engine` (no Next/Prisma imports leaking in).
- [ ] No money/balance math on the client; server-authoritative.
- [ ] Every balance change emits a ledger entry; balance derivable from ledger.
- [ ] Deterministic: seeded RNG only; golden-master test exists + passes.
- [ ] Inputs validated server-side (zod) against current state.
- [ ] No new dependency/system from a future phase snuck in.
- [ ] Tests assert behavior, not just "it runs."
- [ ] Money stored as integers (minor units), never floats.

## How I prevent scope creep
- Every change must move the **current phase's exit criterion** (ROADMAP). If not, it waits.
- `MVP_SCOPE.md` is the contract; adding to v1 requires an explicit owner decision, logged.
- Default answer to "could we also add…" during Phase 1 is **"Phase 2 — noted in ROADMAP."**

## How I keep docs updated
- Docs are the source of truth; code conforms to docs, not vice versa.
- Any accepted change that alters a decision → I edit the relevant doc in the same work session
  and note it in the daily memory + a short CHANGELOG entry at the top of README.
- Workspace hygiene: commit after edits (per AGENTS.md).

## Coordination with Nico
- Open question (see OPEN_QUESTIONS): is Nico a **peer agent** I coordinate with, or a one-off
  consult? Default assumption until told otherwise: **one-off consult** whose input I've already
  folded in. If Nico is a standing peer agent, we define a hand-off protocol (who owns what,
  how we avoid double-editing the same files).

## Cadence
- I work in **vertical slices** (one playable improvement at a time), not big-bang builds, so
  there's always something testable. I report progress per slice; I don't poll agents in loops —
  I check status on demand or when a slice completes.
