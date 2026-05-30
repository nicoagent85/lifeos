# TASK: Slice 05 — Deploy to GitHub Pages (static export + auto-deploy Action)

**Owner/reviewer:** Gonzalo. **Implementer:** frontenddev. **Branch:** slice-05-ghpages.
Repo: github.com/nicoagent85/lifeos. App: apps/web (Next.js 16, Turbopack, shadcn/ui).

## Goal
Make the game deployable to GitHub Pages as a fully STATIC site (no server needed — all logic runs
in the browser via @lifeos/engine). It will live at https://nicoagent85.github.io/lifeos/ so the
basePath must be `/lifeos`. Add a GitHub Actions workflow that builds and publishes on every push
to main. Jaime will flip on Pages (Source = GitHub Actions) himself.

## Why this works
The app has NO database, NO auth, NO API routes — game state is client-side React + the engine.
That's a perfect static-export candidate.

## Steps

### 1. Static export config (apps/web/next.config.ts)
- Set `output: 'export'`.
- Set `basePath: '/lifeos'` and `assetPrefix: '/lifeos'` (Pages serves under /lifeos). Make this
  conditional on an env so local dev still works at root: e.g.
    const isPages = process.env.GITHUB_PAGES === 'true';
    basePath: isPages ? '/lifeos' : undefined, assetPrefix: isPages ? '/lifeos/' : undefined,
    output: 'export'
- Keep `transpilePackages: ['@lifeos/engine']` if present.
- Images: if next/image is used, add `images: { unoptimized: true }` (required for export).
- Ensure there's nothing server-only (no API routes, no server actions, no dynamic SSR). The page
  is already "use client" — good.

### 2. Add `.nojekyll`
Static Next output has folders starting with `_` (e.g. `_next`). GitHub Pages' Jekyll would ignore
them. The workflow must publish a `.nojekyll` file at the site root (touch it in the output dir).

### 3. GitHub Actions workflow: .github/workflows/deploy.yml
Trigger on push to main (and workflow_dispatch). It should:
- checkout, setup-node 20, setup pnpm (use pnpm/action-setup), `pnpm install --frozen-lockfile`
  (or without frozen if lockfile drift — prefer frozen; if it fails, use plain install).
- build engine first: `pnpm --filter @lifeos/engine build`
- build web with Pages env: `GITHUB_PAGES=true pnpm --filter web build`
- the static output is `apps/web/out` (Next export dir). `touch apps/web/out/.nojekyll`.
- upload artifact from `apps/web/out` and deploy via the official Pages actions:
  actions/configure-pages, actions/upload-pages-artifact (path: apps/web/out),
  actions/deploy-pages. Set the needed permissions: `pages: write`, `id-token: write`, `contents: read`,
  and a `concurrency` group. Use the standard two-job (build + deploy) or single-job Pages pattern.

### 4. Verify the static build LOCALLY before relying on CI
Run: `GITHUB_PAGES=true pnpm --filter web build` and confirm:
- it succeeds, and produces `apps/web/out/index.html` (static HTML).
- grep the output to confirm asset paths are prefixed with `/lifeos/` (so they'll resolve on Pages).
Paste the build output + `ls apps/web/out | head` + a grep showing `/lifeos/` asset prefixing.

## PROOF OF WORK (required or rejected)
- Full successful `GITHUB_PAGES=true pnpm --filter web build` output.
- `ls apps/web/out` showing index.html and _next/.
- A grep proving asset URLs contain `/lifeos/`.
- The contents of .github/workflows/deploy.yml.
- `git diff --stat`.
Be honest about anything not verified (you can't run the Actions runner here — that's fine; verify
the LOCAL static export thoroughly so CI will mirror it).

## Commit + push (branch only, NOT main)
  git checkout main && git pull origin main && git checkout -b slice-05-ghpages
  ...work...
  git add -A && git commit -m "Slice 05: static export + GitHub Pages auto-deploy workflow (basePath /lifeos)" && git push -u origin slice-05-ghpages

## Out of scope: custom domain wiring (GoDaddy) — do later; server/DB features (would break static
export — not now). Just get a working static Pages deploy.

Constraints: no unnecessary new deps, do not duplicate the engine, no files outside repo, do not
read credentials, do not merge to main.
