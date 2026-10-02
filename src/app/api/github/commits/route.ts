import { NextResponse } from "next/server";
import { z } from "zod";
import { getMe, getRecentCommits, GitHubApiError } from "@/server/github";
import { clearGitHubToken, getGitHubToken } from "@/server/session";

const QuerySchema = z.object({
  repos: z
    .string()
    .min(1)
    .transform((s) =>
      s
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().regex(/^[\w.-]+\/[\w.-]+$/))
        .min(1)
        .max(20),
    ),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export async function GET(request: Request) {
  const token = await getGitHubToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    repos: url.searchParams.get("repos") ?? "",
    limit: url.searchParams.get("limit") ?? "30",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const me = await getMe(token);
    const commits = await getRecentCommits(
      token,
      parsed.data.repos,
      me.login,
      parsed.data.limit,
    );
    return NextResponse.json({ commits });
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
