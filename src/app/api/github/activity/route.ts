import { NextResponse } from "next/server";
import { z } from "zod";
import { getActivityHeatmap, GitHubApiError } from "@/server/github";
import { clearGitHubToken, getGitHubToken } from "@/server/session";

const ReposSchema = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().regex(/^[\w.-]+\/[\w.-]+$/)).max(20));

export async function GET(request: Request) {
  const token = await getGitHubToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("repos");
  let repos: string[] = [];

  if (raw && raw.trim()) {
    const parsed = ReposSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid repos param" }, { status: 400 });
    }
    repos = parsed.data;
  }

  try {
    const { days, recent, source, totalContributions } =
      await getActivityHeatmap(token, repos);
    return NextResponse.json({
      days,
      recent,
      totalContributions,
      source,
      limitation:
        source === "calendar"
          ? "GitHub contribution calendar (last year)."
          : "Approximate activity for the last year.",
    });
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 401) {
      await clearGitHubToken();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status =
      err instanceof GitHubApiError
        ? err.status === 404
          ? 502
          : err.status
        : 500;
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Error",
        rateLimited: err instanceof GitHubApiError && err.rateLimited,
      },
      { status },
    );
  }
}
