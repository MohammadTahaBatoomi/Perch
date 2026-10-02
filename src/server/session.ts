import "server-only";

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { decrypt, encrypt } from "./crypto";

export const GH_TOKEN_COOKIE = "perch_gh";
export const GH_DEVICE_COOKIE = "perch_gh_device";
export const GH_OAUTH_STATE_COOKIE = "perch_gh_oauth_state";

const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const DEVICE_MAX_AGE = 60 * 15; // 15 minutes
const STATE_MAX_AGE = 60 * 10; // 10 minutes

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function setEncryptedCookie(
  store: CookieStore,
  name: string,
  value: string,
  maxAge: number,
): Promise<void> {
  const encrypted = await encrypt(value);
  store.set(name, encrypted, cookieOptions(maxAge));
}

export async function readEncryptedCookie(
  store: CookieStore,
  name: string,
): Promise<string | null> {
  const raw = store.get(name)?.value;
  if (!raw) return null;
  try {
    return await decrypt(raw);
  } catch {
    return null;
  }
}

export async function getGitHubToken(): Promise<string | null> {
  const store = await cookies();
  return readEncryptedCookie(store, GH_TOKEN_COOKIE);
}

export async function setGitHubToken(token: string): Promise<void> {
  const store = await cookies();
  await setEncryptedCookie(store, GH_TOKEN_COOKIE, token, TOKEN_MAX_AGE);
}

export async function clearGitHubToken(): Promise<void> {
  const store = await cookies();
  store.delete(GH_TOKEN_COOKIE);
}

export async function setDeviceCode(deviceCode: string): Promise<void> {
  const store = await cookies();
  await setEncryptedCookie(store, GH_DEVICE_COOKIE, deviceCode, DEVICE_MAX_AGE);
}

export async function getDeviceCode(): Promise<string | null> {
  const store = await cookies();
  return readEncryptedCookie(store, GH_DEVICE_COOKIE);
}

export async function clearDeviceCode(): Promise<void> {
  const store = await cookies();
  store.delete(GH_DEVICE_COOKIE);
}

/** Create CSRF state for web OAuth authorize redirect. */
export async function createOAuthState(): Promise<string> {
  const state = randomBytes(24).toString("hex");
  const store = await cookies();
  const hash = createHash("sha256").update(state).digest("hex");
  store.set(GH_OAUTH_STATE_COOKIE, hash, cookieOptions(STATE_MAX_AGE));
  return state;
}

export async function consumeOAuthState(state: string): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(GH_OAUTH_STATE_COOKIE)?.value;
  store.delete(GH_OAUTH_STATE_COOKIE);
  if (!expected || !state) return false;
  const hash = createHash("sha256").update(state).digest("hex");
  return hash === expected;
}
