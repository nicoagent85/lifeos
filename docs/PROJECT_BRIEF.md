# PROJECT_BRIEF.md

## Product definition
LifeOS is a free-to-play, turn-based **life & personal-finance simulator** played in the
browser (Web/PWA, mobile-first). You start at a chosen life situation — broke young adult,
student, laid-off worker, single parent, immigrant in a new city, etc. — and try to build
**stability, wealth, and happiness** through the decisions you make each week: work, study,
spend, borrow, invest, and handle whatever life throws at you.

Think **BitLife + Monopoly + a personal-finance simulator**, not a 3D Sims clone.

## Target user
Primary (v1):
- 18–40, mobile-first, English-first.
- Already interested in: FIRE / financial independence, side hustles, investing, "what would
  I do if I started over," entrepreneurship, immigration/poverty-escape stories.
- Plays in short sessions (commute, breaks). Enjoys systems/strategy games (Football Manager,
  tycoon games, BitLife) where **decisions** beat graphics.

Explicitly NOT the v1 target: hardcore 3D sim fans, crypto/DeFi speculators, real-money traders.

## Core promise
> "Can you build a life from where you start?"

Every week you face real-feeling tradeoffs with consequences. The game respects your time,
never forces ads on you, and never lets a credit card guarantee a win.

## What makes it different
1. **Realistic financial strategy made genuinely fun** — most life sims are cozy/decorative or
   fantasy. Few make money/career/risk decisions the actual game. That gap is the wedge.
2. **Start-from-anywhere framing** — different starting scenarios create replayability and an
   emotional "second life / second chance" hook.
3. **Honest monetization** — opt-in only, no forced ads, no pay-to-win. This is a *trust*
   differentiator in a genre full of predatory mechanics.
4. **Deterministic, auditable economy** — invisible to the player, but it's why the game can
   later grow a multiplayer marketplace without collapsing into exploits.

## Initial product boundaries (v1)
IN: single-player, in-game currency only, turn-based weekly loop, a small set of life systems
(see `MVP_SCOPE.md`), simulated/stubbed monetization hooks.

OUT (v1): crypto, real tokens, cash-out, real-money player-to-player marketplace, real-world
investment, multiplayer, real ad/sponsor integrations, LLM controlling game state.

## Success definition for v1
v1 succeeds if it answers ONE question: **"Do people who try it keep playing?"**
- Leading signal: D1/D7 retention and average turns-per-session.
- If retention is flat, no amount of monetization or marketplace work matters. We stop and
  rework the loop, not add features.
