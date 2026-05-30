# WELLBEING_SYSTEM.md

> Added 2026-05-30 (Jaime's design call). Wellbeing is a **first-class, second progression
> pillar** alongside money/career. Money ladder: work → skill → promotion → income. Wellbeing
> ladder: healthy habits → better health/lower stress → which *feeds back* into income, energy,
> event odds, and resilience. The two ladders compete for the same scarce time/money — that
> competition is the core tension of the game.

## Design intent
- Health stops being a stat that only decays; it becomes something you **actively invest in.**
- Neglect is *tempting* (habits cost money/time now) but **quietly raises cost + risk** until it
  bites — the lesson ("you can't just grind forever") taught through consequences, not lectures.
- Stays the honest version: the world *responds* to how you treat yourself (approach "a"), with a
  gentler decay/recovery curve (approach "b") so burnout is a managed danger, not sudden death.

## v1 scope discipline (keep the SURFACE simple, the SYSTEM rich)
v1 = **Health + Stress** (existing stats) + **3 wellbeing upkeep actions** + feedback loops +
medical-expense risk + the wellness sponsor slot. NO new sub-stats (no sleep/diet/fitness-level
breakdown yet). Deepen later only if it proves fun.

## The three layers

### Layer 1 — Upkeep actions (spend time/money → build wellbeing)
New player actions (cost the scarce action-point budget and/or cash), competing with WORK/STUDY:
- **EAT_HEALTHY** — costs extra cash (vs. cheap food), raises Health, small Happiness up.
- **WORK_OUT** — costs action point(s), raises Health, lowers Stress.
- **HAVE_FUN** — costs cash, lowers Stress a lot, raises Happiness (the "recharge" valve).
(REST stays as the free-but-low-value baseline recovery.)
> Tension: every point spent on wellbeing is a point NOT spent earning/studying. Skipping is
> tempting short-term.

### Layer 2 — Feedback into the rest of life (the part that makes it a *pillar*)
**Good health / low stress → upside:**
- Work performance bonus: income multiplier scales mildly with Health (e.g. high health → +5–10%
  effective wage; low health → penalty).
- Energy: when Health is high AND Stress low, occasional **+1 action point** that week.
- Better event odds: positive-event weight up, negative-event weight down.
- Faster skill gain when not maxed-stress.

**Bad health / high stress → downside (your medical-sink idea):**
- **Medical-expense risk:** low Health raises the odds + size of medical-bill events (a real cash
  sink that punishes neglect, realistically).
- High Stress drags work performance (income penalty) and raises bad-event odds.
- Very low Health → lose action points (got sick), and the existing Health≤0 lose condition.

### Layer 3 — The honest lesson
You CAN neglect wellbeing to save money/time, and it works for a while — then risk + cost
compound. Balance becomes the *smart* play because the world makes it so, not because a rule says
"you must rest." Burnout is now a slope you can see and manage, not an ambush.

## Contextual wellness sponsors (showcase example — stubbed in v1)
This is one of the best honest-ad fits in the game (real advertiser category: fitness, nutrition,
wellness apps) AND stays on the right side of our trust line (opt-in, contextual, useful):
- Surfaces only when the player is engaging with wellbeing (e.g. choosing EAT_HEALTHY / WORK_OUT).
- Examples (Grade-A generic now, Grade-B contextual later — see SPONSOR_OFFERS.md):
  - fitness-app clip → small Health boost
  - healthy-meal-kit sponsor → discount on EAT_HEALTHY
  - gym sponsor → cheaper WORK_OUT
- v1: STUBBED (instant mock reward), like all monetization. Strengthens the Phase-3 story.

## Balance targets (for tuning + the sim)
- A player who balances work + wellbeing should out-perform a pure-grinder **over a long run**,
  even if the grinder is ahead early. (Wellbeing = long-term compounding advantage.)
- A pure-grinder should hit rising medical costs + performance penalties that catch up by ~mid-run.
- Neglect should never be a *silent* death — Health/Stress trends must be visible and the
  consequences telegraphed (events/warnings).
- All wellbeing constants live in config.ts (tunable data, not logic).

## Out of scope (later)
Sleep mechanic, diet detail, fitness/strength levels, chronic conditions, mental-health subsystem,
insurance mechanics. v1 keeps Health + Stress + 3 actions + feedback. Expand only if fun is proven.
