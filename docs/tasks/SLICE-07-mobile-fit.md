# TASK: Slice 07 — Make the game FIT a phone screen (iPhone) with minimal/zero scrolling

**Owner/reviewer:** Gonzalo. **Implementer:** frontenddev. **Branch:** slice-07-mobile.
File: apps/web/src/app/page.tsx only. Do NOT touch packages/engine.

## The problem (real playtester, iPhone 17, screenshot reviewed)
Slice 06 made things *tidier* but the page is STILL taller than the phone viewport — actually feels
like MORE scrolling. Root cause: big card paddings + a tall "Status" card + a separate "Plan Your
Week" header card + NINE full-width action rows, each with a tall full-width +/- pill. Nine tall
rows can never fit a phone. We must go genuinely DENSE on mobile.

Target: on an iPhone (~390x844 CSS px, with Safari chrome eating ~140px → usable ~700px tall), the
player should see the **stat dashboard + all 9 actions + AP counter + Resolve button** with little or
no scrolling. The Life History can live below the fold (that's fine) — but the PLAY controls must fit.

## Required changes
1. **Kill wasted vertical space.** Card padding ~12px (not 24-36). Card gaps ~8-10px. Merge the
   "Plan Your Week" header into the actions card header (one compact row: title + "AP 4/6" + healthy
   badge). Don't use separate big cards with large margins between every block.
2. **Stat dashboard: dense, ~2 short rows.**
   - Row of compact tiles: Week, Cash (with weekly exp small), Job badge, Work Skill, Life Skill,
     Reputation, Tokens. Small labels (~11-12px), values ~16-18px. 3-4 tiles per row on mobile.
   - Health / Stress / Happiness as THIN bars (~6-8px tall) with inline numeric, can be 3-across.
   - Keep the short what-it-does tooltips/captions (title attr is fine).
3. **Actions: compact 2-column grid on mobile (3-col on wider).** Each action = a small cell:
   name (~14px) + tiny cost badge if any + an inline stepper [- N +] with 44px-tappable but NOT
   full-width pills. Short/no description (move description into a title tooltip to save height).
   All 9 actions must be visible together in the grid without scrolling the actions area.
4. **Resolve Week button:** normal height (~44-48px), not the huge h-14. Keep it directly under the
   action grid and visible.
5. **Most-recent-week result:** keep it, but compact (a thin summary line/strip), collapsible or
   short — must not blow up height. Full Life History stays below.
6. Respect iOS safe areas (env(safe-area-inset-*)) so content isn't hidden behind notch/toolbar.
7. Keep ALL functionality (start screen, AP limit incl +1 healthy bonus, Resolve→state+log+ledger,
   Game Over + restart). Keep dark mode. Money cents→/100 display only; no game math in UI.
8. Desktop must still look fine (use responsive breakpoints; denser everywhere is OK).

## Verify + PROOF OF WORK (or rejected)
- (cd packages/engine && pnpm build) then `GITHUB_PAGES=true pnpm --filter web build` — paste full
  successful output; confirm apps/web/out/index.html generated.
- State in words: at ~390px wide / ~700px usable height, the stat dashboard + all 9 actions + AP +
  Resolve fit without scrolling (or list exactly what still needs a small scroll and why).
- Confirm all 9 actions, lifeSkill/reputation/boostTokens still rendered.
- `git diff --stat`.

## Commit + push (branch slice-07-mobile, NOT main)
  git checkout main && git pull origin main && git checkout -b slice-07-mobile
  ...work...
  git add -A && git commit -m "Slice 07: dense mobile layout — fits iPhone viewport, 2-col action grid, thin bars" && git push -u origin slice-07-mobile

Constraints: only edit page.tsx; no engine changes; no DB/accounts; no unnecessary deps; don't read
credentials; don't merge to main; keep it a static-exportable "use client" component.
