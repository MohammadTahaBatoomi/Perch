# Perch

Desk-companion dashboard for an old Android phone.

Perch runs as a Next.js web app on your machine. Mount an old phone in landscape
next to your monitor and open the app in a browser/WebView — StandBy-style clock,
GitHub status/commits, and activity.

> Screenshots: _coming soon_ (MVP look & feel evaluation)

## Stack

- Next.js App Router
- Tailwind CSS v4, TypeScript strict
- GitHub OAuth (Authorize + Device Flow fallback)
- Fonts via `next/font/local` (Geist + Geist Mono in `src/fonts/`)

## Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. **New OAuth App**
   - Application name: `Perch` (or anything)
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/github/oauth/callback`
3. After creating, open the app and **enable Device Flow**
4. Copy the **Client ID** (and Client Secret if using the Authorize button)

### 2. Env

```bash
cp .env.example .env.local
```

Set:

```env
GITHUB_CLIENT_ID=Iv1.xxxxxxxx
GITHUB_CLIENT_SECRET=...   # needed for Authorize button
GITHUB_REDIRECT_URI=http://localhost:3000/api/github/oauth/callback
SESSION_SECRET=<openssl rand -base64 32>
# optional:
GITHUB_OAUTH_SCOPES=read:user repo
```

Private repos need the `repo` scope — a broader grant. Prefer public-only for MVP.

### 3. Install & run

```bash
pnpm install
pnpm dev
```

Serve on the LAN so the phone can reach your machine (`dev` already binds `0.0.0.0`):

```bash
# open http://<lan-ip>:3000 on the phone
```

```bash
pnpm typecheck
pnpm lint
```

## Secure context / Wake Lock caveats

The Screen Wake Lock API and some keep-awake strategies require a **secure context**
(HTTPS or localhost). Serving over plain `http://192.168.x.x` on the LAN is **not**
secure, so:

- Perch falls back to a muted looping video (NoSleep-style) after the first tap
- The keep-awake indicator shows `active` / `fallback` / `unavailable` honestly
- Options if you need native Wake Lock on the phone:
  - Chrome flag: `chrome://flags/#unsafely-treat-insecure-origin-as-secure` → add `http://<lan-ip>:3000`
  - Or local HTTPS with [mkcert](https://github.com/FiloSottile/mkcert)

## PWA

Manifest is included (`display: fullscreen`, `orientation: landscape`).

**TODO:** Do not add a service worker in MVP — SW requires a secure context and
complicates LAN HTTP usage.

## License

MIT
