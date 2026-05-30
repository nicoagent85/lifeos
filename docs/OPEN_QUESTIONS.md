# OPEN_QUESTIONS.md

Questions Jaime/Nico need to answer. **Blockers** must be resolved before/early in Phase 1;
others can be decided as we go. I've given a recommended default for each so we can proceed if
you just say "go with your defaults."

## DECIDED (2026-05-29)
1. **Accounts vs anonymous saves** → **Real accounts.** Jaime: more personal, better retention.
   Since Postgres+Supabase is chosen (below), use **Supabase Auth** (email + social login).
2. **Neon vs Supabase** → **Supabase.** Gives us Postgres + auth in one, which real accounts need.
3. **Nico's role** → **Occasional consultant only.** Do NOT treat as a peer agent. Gonzalo owns
   the project and uses subagents as needed.
4. **Playtester pool** → **Does not exist yet.** Must be sourced before Phase 1 retention can be
   read. NOT a Phase 1 blocker for *building*, but IS a blocker for *validating fun*. Plan to
   source ~20–50 testers during Phase 1 build (friends, small Discord, niche communities).

## Important but not blocking
5. **App name** — "LifeOS / Start From Zero" is the working title. Lock a name or keep working
   title through Phase 1? (Default: keep working title; naming is a Phase 3 marketing decision.)
6. **English-only v1?** (Default: yes.)
7. **Which 3 starting scenarios ship first?** (Default: Broke Young Adult, Laid-Off Worker,
   Student — Single Parent designed for v1.1.)
8. **Tone calibration** — how wry/opinionated should the game's voice be? (Default: honest +
   lightly wry, never preachy.)

## Decisions reserved for later phases (don't answer now)
- Real payment processor (Phase 3).
- Ad network choice — AdMob vs. AppLovin MAX (Phase 3).
- Any token/wallet/cash-out — Phase 5, lawyers-first.

---

# Gonzalo's setup assessment (the meta-asks Jaime requested)

## Subagents / helper agents I need
(See `MODEL_ROUTING.md` for detail.) Task-scoped, ephemeral, orchestrated by me:
1. Engine/Sim coder (highest rigor) 2. App/UI coder 3. Schema/DB coder
4. Economy balancer (analysis) 5. Content writer 6. Independent reviewer (engine/economy audit).

## Tools / scripts that would make me more efficient
- A `projects/lifeos/` **CHANGELOG** + per-slice task-spec template (I'll create as we start).
- A simulation **CLI harness** (run N turns with a seed + scripted choices → dump state/ledger)
  so the balancer and I can test economy changes without the UI. (Build early in Phase 1.)
- Golden-master test fixtures committed alongside the engine.
- A simple `scripts/` folder for repeatable tasks (seed DB, reset save, run sim scenario).

## Is my current OpenClaw agent setup sufficient? (checked the live config 2026-05-29)
**Findings:**
- **ACP is NOT configured** in `openclaw.json` (the `acp` block is empty — no backend, not
  enabled). So true ACP coding harnesses (Claude Code / Codex) are **not wired up** here yet.
  Two paths: (a) set up ACP, or (b) use what already exists →
- **A coding-subagent fleet ALREADY EXISTS:** `backenddev`, `frontenddev`, `testerdev` — each
  with its own workspace, running Gemini 3.1 Pro. Other operators (Nico, Jose) already use them
  via `subagents.allowAgents`. **Gonzalo currently has NO `subagents` allowlist** → I cannot
  spawn them yet. **This is the one config change I need.** (See recommended patch below.)
- **Models available** (via OpenRouter): Opus 4.8, GPT-5.5, Gemini 3.1 Pro, Sonnet 4.6, GPT-5.4
  mini, Deepseek 3.2, etc. So MODEL_ROUTING tiers are real, not aspirational.

**Recommendation (simplest path to start building):** skip ACP setup for now and give Gonzalo
the existing dev fleet. Add to my agent config:
```
subagents: { allowAgents: ['backenddev', 'frontenddev', 'testerdev'] }
```
Optional upgrade: point those dev agents (or a dedicated engine coder) at a stronger coding
model (e.g. GPT-5.5 or Sonnet 4.6) for the high-risk engine/economy code. Gemini 3.1 Pro is fine
for UI/boilerplate.

## What I need from Jaime to start Phase 1
1. **Approve the one config change** above (give Gonzalo the dev-agent fleet). I can apply it via
   the gateway tool on your say-so — it triggers a restart.
2. **GitHub access for the repo.** You made an account (`nicoagent85@gmail.com`). Cleanest option:
   create an empty repo (e.g. `lifeos`) under that account, then either (a) generate a
   **fine-grained Personal Access Token** scoped to that one repo and give it to me to store as a
   credential, or (b) add my push as needed. I'll walk you through the exact clicks when you're
   ready. (Until then I can build locally in the workspace and we push later — not a hard blocker.)
3. **Approve `MVP_SCOPE.md`** (the cuts).

## Config / access I may need later (not now)
- Supabase project keys (when we wire auth/DB — I can scaffold against a local Postgres first).
- Vercel access (deploys) — or you hold those keys and I hand you deploy-ready branches.
- Phase 3: payment + ad-SDK credentials. I will not request access beyond what a phase needs.

## What I need from Jaime/Nico to start Phase 1
1. Answer the 4 blockers above (or say "use your defaults").
2. Confirm ACP coding agents are available + a git remote location.
3. Approve `MVP_SCOPE.md` (especially the cuts — that's the one that'll sting).
4. Confirm the playtester pool exists or how we'll get one.
