# DATA_MODEL.md

> Schema is **superset-aware**: v1 tables are marked `[v1]`; Phase 2+ tables are sketched so the
> v1 schema doesn't paint us into a corner. Build only `[v1]` tables now.

## Entity overview
```
User [v1] ──< Save [v1] ──< Turn [v1]
                 │
                 ├──< Transaction (economy ledger) [v1]
                 ├──< CharacterState [v1]  (1:1 snapshot of current stats)
                 ├──< EventLog [v1]
                 ├──< JobState [v1]
                 ├──< SkillState [v1]
                 ├──< Debt        [Phase 2]
                 ├──< Asset       [Phase 2]
                 ├──< Investment  [Phase 2]
                 └──< Business    [Phase 2]
SponsorOffer [Phase 3]      BoostToken ledger uses Transaction [v1, dev-mode]
```

## [v1] Tables

### User
Minimal in v1 (anonymous/device or simple account).
- `id` (uuid, pk)
- `handle` (nullable)
- `auth_provider` / `auth_subject` (nullable until real auth)
- `created_at`

### Save  (one playthrough = one "run")
- `id` (uuid, pk)
- `user_id` (fk → User)
- `scenario_key` (enum: BROKE_YOUNG_ADULT | LAID_OFF | STUDENT | …)
- `seed` (bigint — deterministic RNG seed)
- `status` (enum: ACTIVE | WON | LOST | ABANDONED)
- `current_turn` (int, default 0)
- `created_at`, `updated_at`, `ended_at` (nullable)

### Turn  (immutable log of each resolved week)
- `id` (uuid, pk)
- `save_id` (fk)
- `turn_index` (int) — **UNIQUE (save_id, turn_index)** ← idempotency guard
- `input_json` (jsonb — the player's chosen actions/event choice)
- `state_before_json` (jsonb snapshot)
- `state_after_json` (jsonb snapshot)
- `log_json` (jsonb — human-readable resolution log for the UI)
- `created_at`

### CharacterState  (1:1 current snapshot for fast reads; also reconstructable from Turns)
- `save_id` (pk, fk)
- `cash` (int — store money in integer minor units, never floats)
- `income_weekly`, `expenses_weekly` (int)
- `health`, `stress`, `happiness` (int 0–100)
- `action_points` (int)
- `reputation` (int)
- `boost_tokens` (int — dev-mode in v1)
- `flags_json` (jsonb — active conditions e.g. {"injured_until_turn": 14})
- `updated_at`

### Transaction  (THE ECONOMY LEDGER — append-only, never updated/deleted)
- `id` (uuid, pk)
- `save_id` (fk)
- `turn_index` (int)
- `currency` (enum: CASH | BOOST_TOKEN)
- `delta` (int, signed, minor units)
- `balance_after` (int)
- `reason_code` (enum: WAGE | SIDE_GIG | RENT | FOOD | BILLS | EVENT_COST | EVENT_WINDFALL |
   SKILL_PURCHASE | LOAN_IN | LOAN_REPAY | BT_GRANT | BT_SPEND | …)
- `source` (enum: ENGINE | DEV_TOOL)
- `meta_json` (jsonb, nullable)
- `created_at`
- **Invariant:** for a given (save, currency), entries ordered by id reconstruct `balance_after`.

### JobState
- `save_id` (fk)
- `job_tier` (enum: GIG | ENTRY | SKILLED | SENIOR)
- `weekly_base_wage` (int)
- `hours_committed` (int / action points allocatable)
- `since_turn` (int)

### SkillState
- `id` (pk)
- `save_id` (fk)
- `skill_key` (enum: WORK_SKILL | LIFE_SKILL)  (v1 keeps it to 1–2)
- `level` (int)
- `progress` (int — points toward next level)

### EventLog
- `id` (pk)
- `save_id` (fk)
- `turn_index` (int)
- `event_key` (string — references the event deck definition)
- `choice_key` (string — which option the player picked)
- `outcome_json` (jsonb)
- `created_at`

> **Event *definitions* (the deck) live in code/config, not the DB** — they're versioned content,
> not per-save data. `EventLog` just records what happened.

## [Phase 2] Tables (sketched, do not build yet)
- **Debt**: `principal, interest_rate, min_payment, remaining, origin_turn, is_predatory`.
- **Asset**: `type, purchase_cost, current_value, weekly_maintenance, depreciation_rate, utility_json`.
- **Investment**: `instrument_key, amount_in, current_value, risk_tier`.
- **Business**: `type, weekly_revenue_model_json, weekly_costs, level`.

## [Phase 3] Tables (sketched)
- **SponsorOffer**: `sponsor_key, category, reward_type, reward_value, cooldown_turns, active`.
- **AdImpression / RewardGrant**: audit of rewarded-ad views and what they granted (anti-fraud).
- **Payment / Entitlement**: real BT purchases, receipts, entitlements (only when payments land).

## Data conventions (apply from v1)
- **Money is integers in minor units** (e.g., cents). Never floats for currency.
- **Append-only ledger** — corrections are compensating entries, never edits.
- **jsonb snapshots** on Turn give us full replay/debug without over-normalizing v1.
- **Enums in code + DB** kept in sync via Prisma; `reason_code`/`scenario_key` are the analytics
  backbone — name them carefully now.
