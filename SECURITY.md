# Security model

## GitHub authentication

Perch uses the **GitHub OAuth App web authorize flow** (Authorize button on
github.com). The user is redirected to GitHub, clicks Authorize, and returns
with a one-time `code` that only the server exchanges for an access token.

### Secrets

- `GITHUB_CLIENT_ID` — public; used in the authorize redirect
- `GITHUB_CLIENT_SECRET` — **server-only** (`.env.local` / Route Handlers). Never
  sent to the browser, never logged
- Access tokens after exchange are encrypted (AES-GCM / `SESSION_SECRET`) into
  an **httpOnly**, **SameSite=Lax** cookie (`perch_gh`)

### What never happens

- No personal access tokens in `.env`, code, or docs
- Access tokens are **never** sent to client JS, logged, or written to
  `localStorage` / `sessionStorage`
- Client secret never appears in Network responses to the browser

### Cookie storage

All GitHub REST calls run in Next.js Route Handlers that read and decrypt that
cookie. Client JS only hits `/api/github/*`.

### Inputs

Every Route Handler validates query/body with **zod** before use.

### Scopes

Default: `read:user repo` so private contributions can match your GitHub profile
when enabled. Narrower scopes like `read:user public_repo` still work for public
activity only.

### Disconnect

`POST /api/github/disconnect` clears the session cookie.
