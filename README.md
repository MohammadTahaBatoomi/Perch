<div align="center">

# Perch

**Turn an old Android phone into a desk companion for your dev setup.**

An always-on, landscape dashboard that sits next to your monitor: a big clock, your GitHub repos at a glance, and (soon) live stats and shortcuts from your laptop.

[

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

](LICENSE)


![Next.js](https://img.shields.io/badge/Next.js-App_Router-black)




![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)




![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)



<!-- Replace with a real photo or screenshot: docs/screenshot.png -->
<img src="docs/screenshot.png" alt="Perch running on a phone next to a monitor" width="720" />

</div>

---

## Why Perch?

Most of us have a spare phone in a drawer. Perch gives it a job: keep the things you glance at all day in one calm, always-on screen, without alt-tabbing and without sending your data to anyone else's server.

- **Runs on your machine.** The Next.js app runs on your laptop; the phone is just a screen.
- **No personal access tokens.** GitHub is connected with OAuth. Tokens live in an encrypted, `httpOnly` cookie and never reach client-side JavaScript.
- **Built for weak, Google-free phones.** Tested on a Huawei Nova Y70 (no GMS). Light animations, OLED-friendly black, burn-in protection.
- **RTL and Jalali friendly.** Persian digits and the Jalali calendar are first-class.

## Features

| Feature | Status |
| --- | --- |
| StandBy-style clock, Jalali + Gregorian date, Persian digits | ✅ Working |
| Keep-screen-awake (Wake Lock, with a muted-video fallback) and fullscreen | ✅ Working |
| GitHub connection (Authorize + Device Flow) | ✅ Working |
| Repo status, recent commits, activity | ✅ Working |
| Pomodoro timer and settings | ✅ Working |
| Laptop stats (CPU / RAM / disk / battery) | 🧪 Mock data for now |
| App launcher | 🧪 Mock data for now |
| Laptop agent over WebSocket | 🗓 Planned |
| Phone as touchpad / keyboard | 🗓 Planned |
| Desktop screen sharing (WebRTC) | 🗓 Planned |

## Quick start

**Requirements:** Node.js 20+, [pnpm](https://pnpm.io), and a GitHub account.

```bash
git clone https://github.com/MohammadTahaBatoomi/Perch.git
cd Perch
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

Open <http://localhost:3000> on your laptop. To use it on the phone, open `http://<your-lan-ip>:3000` there (the dev server already binds to `0.0.0.0`).

### 1. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers) → New OAuth App**.
2. Fill in:
   - **Application name:** `Perch` (anything works)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/github/oauth/callback`
3. Open the app after creating it and tick **Enable Device Flow**.
4. Copy the **Client ID**. Generate a **Client Secret** only if you want the Authorize button (see the table below).

### 2. Configure the environment

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret   # only for the Authorize button; server-side only
GITHUB_REDIRECT_URI=http://localhost:3000/api/github/oauth/callback
SESSION_SECRET=                            # openssl rand -base64 32
GITHUB_OAUTH_SCOPES="read:user public_repo"   # optional
```

| Variable | Required | Notes |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Yes | From your OAuth App. |
| `GITHUB_CLIENT_SECRET` | Authorize flow only | Never exposed to the browser. Device Flow does not need it. |
| `GITHUB_REDIRECT_URI` | Authorize flow only | Must match the callback URL in your OAuth App. |
| `SESSION_SECRET` | Yes | Encrypts the session cookie (AES-GCM). |
| `GITHUB_OAUTH_SCOPES` | No | Defaults to public repos. Add `repo` for private repos, which is a much broader permission. |

### 3. Connect GitHub from the phone

Two ways to connect:

- **Device Flow (recommended on the phone):** Perch shows a code and a QR code. Approve it at <https://github.com/login/device>. No keyboard, no redirect.
- **Authorize button:** Redirects to GitHub and back to `GITHUB_REDIRECT_URI`. Because that URL points to `localhost`, it only works in a browser running on the same machine as the server, not on the phone.

The session cookie belongs to the browser that completed the flow, so connect **on the phone itself** (Device Flow) for the phone to show your data.

## Keep the screen on

Wake Lock needs a secure context (HTTPS or `localhost`). Plain `http://192.168.x.x` is not secure, so Perch falls back to a muted looping video after the first tap, and the indicator always shows the real state: `active`, `fallback`, or `unavailable`.

To get native Wake Lock on the phone:

- In a Chromium browser, open `chrome://flags/#unsafely-treat-insecure-origin-as-secure` and add `http://<lan-ip>:3000`, or
- serve the app over local HTTPS with [mkcert](https://github.com/FiloSottile/mkcert).

## Android app (APK / AAB)

Perch ships a [Capacitor](https://capacitorjs.com) shell so the phone gets a real app with native keep-screen-on, no browser chrome, and no dependency on Google services. The app is a WebView that loads your Perch server.

**Build with GitHub Actions:** run **Actions → Android APK + AAB → Run workflow** (it also runs on pushes that touch Android files). The signed APK and AAB are uploaded as the `perch-android` artifact.

| Setting | Default | Notes |
| --- | --- | --- |
| `PERCH_SERVER_URL` (input or repo variable) | `http://10.0.2.2:3000` | Emulator address. For a real phone use `http://<your-lan-ip>:3000`. |

**Build locally:**

```bash
PERCH_SERVER_URL=http://192.168.1.10:3000 pnpm cap:sync
```

Install on a device with `adb install`, or copy the APK to the phone.

## Project layout

```
src/        Next.js app (App Router): UI, route handlers, server modules
android/    Capacitor Android project
public/     Static assets and web manifest
docs/       Extra documentation
.github/    CI workflows (Android build)
```

## Security

- GitHub tokens are stored only in an encrypted, `httpOnly`, `SameSite=Lax` cookie and used only inside route handlers.
- All GitHub API calls are made server-side.
- Secrets belong in `.env.local`, which is git-ignored.

See [SECURITY.md](SECURITY.md) for the full model and how to report a vulnerability.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on `0.0.0.0:3000` |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm cap:sync` | Sync the web config into the Android project |

## Roadmap

1. Laptop agent (Node + WebSocket) with real CPU, RAM, disk, and battery stats
2. Real app launcher with an allow-list (the phone sends an `appId`, never a command)
3. Phone as touchpad and keyboard
4. Optional desktop screen sharing over WebRTC

Ideas and PRs are welcome. Open an issue first for anything big.

## Contributing

1. Fork the repo and create a branch.
2. Run `pnpm typecheck && pnpm lint` before opening a PR.
3. Keep PRs small and focused.

## License

[MIT](LICENSE) © Mohammad Taha Batoomi