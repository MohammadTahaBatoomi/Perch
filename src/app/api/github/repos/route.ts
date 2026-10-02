import { NextResponse } from "next/server";
import { listRepos, GitHubApiError } from "@/server/github";
import { clearGitHubToken, getGitHubToken } from "@/server/session";

export async function GET() {
  const token = await getGitHubToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const repos = await listRepos(token);
    return NextResponse.json({
      repos: repos.map((r) => ({
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        stars: r.stargazers_count,
        open_issues_count: r.open_issues_count,
        pushed_at: r.pushed_at,
        language: r.language,
      })),
    });
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 401) {
      await clearGitHubToken();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Error",
        rateLimited: err instanceof GitHubApiError && err.rateLimited,
      },
      { status },
    );
  }
}
