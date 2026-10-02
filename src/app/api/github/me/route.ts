import { NextResponse } from "next/server";
import { getMe, GitHubApiError } from "@/server/github";
import { clearGitHubToken, getGitHubToken } from "@/server/session";

export async function GET() {
  const token = await getGitHubToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = await getMe(token);
    return NextResponse.json({
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
    });
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 401) {
      await clearGitHubToken();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = err instanceof GitHubApiError ? err.status : 500;
    const rateLimited = err instanceof GitHubApiError && err.rateLimited;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error", rateLimited },
      { status },
    );
  }
}
