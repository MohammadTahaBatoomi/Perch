import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepoStatuses, GitHubApiError } from "@/server/github";
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
});

export async function GET(request: Request) {
  const token = await getGitHubToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    repos: url.searchParams.get("repos") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid repos param" }, { status: 400 });
  }

  try {
    const statuses = await getRepoStatuses(token, parsed.data.repos);
    return NextResponse.json({ repos: statuses });
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
