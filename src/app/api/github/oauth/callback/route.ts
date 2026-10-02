import { NextResponse } from "next/server";
import { z } from "zod";
import { exchangeAuthorizationCode, GitHubApiError } from "@/server/github";
import { consumeOAuthState, setGitHubToken } from "@/server/session";

const QuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

function redirectUri(): string {
  return (
    process.env.GITHUB_REDIRECT_URI ??
    "http://localhost:3000/api/github/oauth/callback"
  );
}

function appOrigin(): string {
  try {
    return new URL(redirectUri()).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function GET(request: Request) {
  const home = appOrigin();
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    code: url.searchParams.get("code") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    error: url.searchParams.get("error") ?? undefined,
    error_description: url.searchParams.get("error_description") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.redirect(`${home}/?github=invalid`);
  }

  const { code, state, error, error_description } = parsed.data;

  if (error) {
    const reason = encodeURIComponent(error_description ?? error);
    return NextResponse.redirect(`${home}/?github=denied&reason=${reason}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${home}/?github=invalid`);
  }

  const ok = await consumeOAuthState(state);
  if (!ok) {
    return NextResponse.redirect(`${home}/?github=state`);
  }

  try {
    const token = await exchangeAuthorizationCode(code, redirectUri());
    await setGitHubToken(token);
    return NextResponse.redirect(`${home}/?github=connected`);
  } catch (err) {
    const msg =
      err instanceof GitHubApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "exchange_failed";
    return NextResponse.redirect(
      `${home}/?github=error&reason=${encodeURIComponent(msg)}`,
    );
  }
}
