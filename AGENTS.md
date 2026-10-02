<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Perch is a single Next.js app (no separate backend). Canonical checks are in the README: `pnpm typecheck`, `pnpm lint`, `pnpm dev` (binds `0.0.0.0:3000`), and `pnpm build`. There is no automated test script.

- Use pnpm with the lockfile (`pnpm install --frozen-lockfile`). `pnpm exec next typegen` must run before `pnpm typecheck`: `LayoutProps` and `next-env.d.ts` are generated and gitignored.
- Cloud Agent `start` creates gitignored `.env.local` with a `SESSION_SECRET` when that variable is unset, then runs `pnpm dev`. Do not commit `.env.local`.
- The home clock, Pomodoro timer, settings, and `/clock` work without GitHub. `/api/github/me` returns 401 until a session exists. Connecting GitHub needs `GITHUB_CLIENT_ID`; the Authorize button also needs `GITHUB_CLIENT_SECRET` and `GITHUB_REDIRECT_URI` (`http://localhost:3000/api/github/oauth/callback`).
- `pnpm-workspace.yaml` leaves `unrs-resolver` build scripts unapproved. ESLint still completes; do not flip `allowBuilds` unless a check actually fails.
