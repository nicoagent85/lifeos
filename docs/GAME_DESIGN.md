# GAME_DESIGN.md

## Design north star
**Interesting decisions under tension.** Every week the player should feel: "I can't do
everything — what do I trade off?" If a turn ever feels obvious or free, the design failed.

## Core gameplay loop (v1)
```
[See your week]  →  [Choose actions (limited time/energy)]  →  [Resolve]  →  [Event]  →  [Consequences]  →  next week
```
1. **See your week:** dashboard — cash, income/expenses for the week, health, stress,
   happiness, skills, and any active situation.
2. **Choose actions:** the player spends a limited **Time/Energy budget** (e.g., 5 action
   points/week) across options like: Work extra, Study/skill up, Rest/recover, Job hunt,
   Handle a chore/errand, Socialize. Scarcity is the engine of tension.
3. **Resolve:** deterministic engine applies income, expenses, stat changes.
4. **Event:** draw from the event deck (weighted by state — e.g., low health raises medical
   event odds). Player makes a choice; choice has consequences.
5. **Consequences:** stats update, money moves, sometimes a new ongoing condition starts
   (e.g., "injured: -1 action point for 3 weeks").
6. Repeat. Pressure compounds; good weeks build a buffer, bad luck tests it.

### Why this is fun (the tension sources)
- **Time scarcity:** can't work, study, rest, and socialize all at once.
- **Money pressure:** rent/food are due whether or not you had a good week.
- **Risk/reward:** studying costs you now for a payoff later — but rent is due *now.*
- **Compounding:** small good/bad decisions snowball. Stress→health→medical bills→debt spiral
  is a *story* the player creates themselves.
- **Identity & replay:** different starting scenarios = different opening problems = "let me
  try it as the single parent this time."

## Player goals
- **Short-term:** survive the week (don't go broke, don't crash health/happiness to zero).
- **Mid-term:** build a buffer, climb the job/skill ladder, reduce stress.
- **Long-term (the "score"):** reach a **life milestone / stability state** within a run, and
  beat your own past runs. v1 measures *runs completed* and *restart rate.*

## Progression systems (v1)
- **Skills:** 1–2 skills (e.g., a "Work Skill" and a "Life Skill"). Higher skill → better jobs
  / better event outcomes. Slow to raise; that's the point.
- **Job ladder:** ~4 tiers (e.g., Gig → Entry → Skilled → Senior). Promotion gated by skill +
  reputation + a bit of luck/events.
- **Reputation:** a hidden-ish stat nudged by choices; affects job offers and event branches.

## Starting scenarios (v1: ship 3, design 4)
Each scenario = different starting stats + a signature opening tension:
1. **Broke Young Adult** — low cash, entry job, no debt. Baseline / tutorial-friendly.
2. **Laid-Off Worker** — decent skills, NO job, savings draining, rent due. Tension = urgency.
3. **Student** — no income, has time to study, tempting debt, future payoff. Tension = patience
   vs. survival.
4. **(designed, maybe v1.1) Single Parent** — extra fixed expense + extra event load + lower
   time budget. Tension = everything is harder; emotionally resonant.

## Stats / resources (v1)
| Stat | Role |
|---|---|
| Cash | survival + score |
| Income (weekly) | derived from job |
| Expenses (weekly) | rent + food + bills |
| Time/Energy (action points) | the scarce turn resource |
| Health | low health → medical events, lost action points |
| Stress | high stress → health decay, worse choices/outcomes |
| Happiness | "are you actually living?" — a lose condition if it bottoms out |
| Skill(s) | gate progression |
| Reputation (semi-hidden) | gates job/event branches |

## Life events (v1: ~30, deck-based)
Categories: financial shock (car/medical/rent hike), opportunity (job offer, side gig, small
windfall, scholarship), social (friend asks for a loan, networking), trap (scam, impulse buy,
predatory loan), wildcard (inheritance, viral moment). Each event = short framing + 2–3 choices
+ deterministic consequences. **Events are the soul of the game — most design polish goes here.**

## Progression / lose / long-term  (DECIDED 2026-05-29: the game does NOT "end")
**The life keeps going.** There is no hard "you finished the game" ending. A run is an
open-ended life that escalates: stability → assets → businesses → investments → wealth →
(eventually) millionaire/billionaire ambitions, with new systems unlocking as you grow.
- **Milestones are pull, not finish lines:** Stability ("first stable month") → Comfort →
  Business owner → Investor → Wealthy → ... Each milestone is a visible next goal that keeps the
  player reaching, never a stop sign. (Detailed in `RETENTION_AND_PACING.md`.)
- **Lose conditions still exist (tension matters):** Cash deeply negative with no recovery path
  (bankruptcy spiral), OR Health to zero, OR Happiness bottomed too long ("burnout"). Losing =
  *this life ended, start a new one* — a story, not a punishment screen, and NOT the end of the app.
- **The "20 turns" figure** is only a *measurement checkpoint for us* during testing (did the
  player stay engaged ~20 weeks?), NOT an in-game ending.
- **Long-term:** more milestone tiers + scenarios, then Phase 2 systems (housing/assets/
  investments/business) deepen the climb; later phases add parallel lives, more ambitions, etc.

## Tone
Honest, a little wry, never preachy. The game has *opinions* about money the way a good mentor
does — it lets you make mistakes and shows you the consequences, instead of lecturing.
