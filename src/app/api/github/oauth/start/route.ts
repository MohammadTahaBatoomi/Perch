import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/server/github";
import { createOAuthState } from "@/server/session";

function redirectUri(): string {
  return (
    process.env.GITHUB_REDIRECT_URI ??
    "http://localhost:3000/api/github/oauth/callback"
  );
}

export async function GET() {
  try {
    const state = await createOAuthState();
    const url = buildAuthorizeUrl(state, redirectUri());
    return NextResponse.redirect(url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to start OAuth";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
