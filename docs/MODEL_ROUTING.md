# MODEL_ROUTING.md

> Goal: spend the most capable (expensive) models where judgment matters, cheap models on
> mechanical work. Exact model names will drift; route by **tier + role**, not brand loyalty.
> Confirm available models/quotas in OpenClaw config before locking spend (see OPEN_QUESTIONS).

## Routing by role
| Role | Model tier | Why | Likely pick (verify availability) |
|---|---|---|---|
| **Architecture / strategy / doc authoring** (me) | Top reasoning | high-stakes judgment, scope discipline | Claude Opus-class (current default) |
| **Coding (ACP harness)** | Strong coding model | most of the build; needs reliability + tool use | Claude Code (Sonnet/Opus-class) and/or Codex (GPT-5-class) |
| **Cheap / simple tasks** (renames, boilerplate, doc formatting, test stubs) | Small/fast | volume work, cost control | a small fast model (e.g., Haiku-class / mini-class) |
| **Game economy balancing** | Top reasoning + math | tuning curves, spotting dominant strategies, reading sim outputs | Opus-class reasoning model; pair with deterministic test outputs |
| **Content / scenario / event generation** | Strong creative writing | event flavor, scenario copy, NPC/advisor text — **content only** | a strong general model (Claude/GPT-class); output hand-reviewed before becoming config |

## Hard rule (repeated on purpose)
**No model — at any tier — reads or writes live balances or game state.** Content models produce
text that is reviewed and baked into config/data. The deterministic engine is the only authority
over money. (Mirrors TECH_ARCHITECTURE + ECONOMY_MODEL.)

## Coding-agent strategy
- Default ACP harness for build: **one primary coding agent** to keep style consistent; bring in
  a second (e.g., Codex vs. Claude Code) for **independent review** of the engine + economy
  logic specifically, since that's the highest-risk code.
- Thread-bound persistent sessions per work-stream on Discord (per OpenClaw ACP conventions).

## Proposed subagents / helper roles
1. **Engine/Sim coder** — implements pure engine functions + golden-master tests. Highest rigor.
2. **App/UI coder** — Next.js + shadcn dashboard, event cards, scenario picker.
3. **Schema/DB coder** — Prisma schema, migrations, repositories.
4. **Economy balancer (analysis role)** — runs sim scenarios, proposes config tweaks, hunts
   dominant strategies. Works off deterministic outputs, not vibes.
5. **Content writer (role)** — events/scenarios/copy as reviewable drafts.
6. **Reviewer (independent)** — second model auditing engine/economy diffs for exploits + bright-line violations.

> In OpenClaw terms these are task-scoped ACP/subagent spawns I orchestrate, not always-on
> services. I keep them ephemeral and well-specified to control cost.

## Cost posture
- Phase 1 is small; keep spend lean. Use top-tier models for engine/economy + reviews; push
  boilerplate to cheap models. Batch related changes into fewer, larger coding tasks (avoid
  tight one-task-per-tiny-edit loops) — also respects rate limits.
