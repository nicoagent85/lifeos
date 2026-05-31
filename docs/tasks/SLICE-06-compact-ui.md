# TASK: Slice 06 — Compact UI + ALL stats visible (no scrolling)

**Owner/reviewer:** Gonzalo. **Implementer:** frontenddev. **Branch:** slice-06-ui.
File to rework: apps/web/src/app/page.tsx (single-file game UI). Keep the engine untouched.

## Playtester feedback (Jaime) driving this
- "It would be nice not having to scroll down all the time, things could be more compact and there
  could be more variables."
- "I increased my work skills to 218 and nothing happened, I never knew what my life skills were
  at, etc." → He could NOT see lifeSkill, reputation, etc. ALL stats must be visible.
This slice is UX/readability ONLY. (Progression/aspirations = next slice, Phase A. Don't build that
here.)

## Requirements

### 1. Show ALL game state variables (currently only 7 shown)
The GameState exposes (read from @lifeos/engine GameState): turnIndex, cash (cents), expensesWeekly
(cents), health, stress, happiness, jobTier, skills.workSkill, **skills.lifeSkill** (MISSING now),
**reputation** (MISSING), **boostTokens** (MISSING), status. Show every one with a clear label.
- Health/Stress/Happiness: compact bars with numeric value.
- Cash: big, color-coded (green positive / red negative). Show weekly expenses near it.
- Week #, Job tier (badge), Work Skill, **Life Skill**, **Reputation**, **Boost Tokens**: compact
  labeled tiles.
- Add a tiny tooltip or one-line caption on each stat saying what it does (e.g. Reputation: "helps
  with job hunting"; Life Skill: "improves life events"; Boost Tokens: "premium currency (unused in
  v1)"). Keep captions short.

### 2. Compact layout — minimize/eliminate scrolling on a normal screen
- Goal: on a typical laptop screen (~900px tall) the player can see the full stat dashboard AND the
  action allocator AND the Resolve button WITHOUT scrolling. The action list is currently tall
  (9 actions each as a big row) — make it a tighter grid (e.g. 2-3 columns of compact action chips
  with +/- steppers), not one big vertical list.
- Keep the "Life History" log, but make it a side panel (desktop) / collapsible or shorter section
  (mobile) so it doesn't push everything down. On mobile, stats + actions come first; history below.
- Mobile-first still matters (it's a phone target) — on small screens it can stack, but keep each
  section compact (smaller paddings, grid the stats 3-4 per row).
- Reduce oversized paddings/margins; tighten the vertical rhythm. Use smaller cards.

### 3. Keep all existing functionality
- Start screen (3 scenarios), action allocation respecting AP limit (incl +1 healthy bonus), Resolve
  Week → updates state + shows the week's log + ledger, Game Over screen + Start New Life.
- Per-turn result: still surface the week's log lines + ledger entries (income/expense breakdown).
  Consider showing the MOST RECENT week's result prominently (so the player sees what just happened
  without scrolling the history).
- Money is integer cents → divide by 100 for display only. Never recompute game math in the UI.

### 4. Polish
- Keep dark mode (html already has `dark`). Make sure all new tiles have dark-friendly colors.
- Clean, dense, dashboard feel. shadcn/ui components. Tooltips via shadcn Tooltip if you add it
  (allowed) or simple title attributes.

## Verify + PROOF OF WORK (required or rejected)
- Run engine build then `GITHUB_PAGES=true pnpm --filter web build` — paste the successful output.
- Confirm apps/web/out/index.html still generates.
- Describe the new layout: confirm lifeSkill, reputation, boostTokens are now visible, and that the
  main play view fits without scrolling on desktop (state your assumption of viewport).
- `git diff --stat`.

## Commit + push (branch slice-06-ui, NOT main)
  git checkout main && git pull origin main && git checkout -b slice-06-ui
  ...work...
  git add -A && git commit -m "Slice 06: compact dashboard UI, all stats visible (lifeSkill/reputation/boostTokens), less scrolling" && git push -u origin slice-06-ui

Constraints: do NOT modify packages/engine. No DB/accounts. No unnecessary new deps (shadcn tooltip
ok). Don't read credentials. Don't merge to main. Keep it a static-exportable client component.
