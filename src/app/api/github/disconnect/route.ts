import { NextResponse } from "next/server";
import { z } from "zod";
import { revokeGrant } from "@/server/github";
import {
  clearDeviceCode,
  clearGitHubToken,
  getGitHubToken,
} from "@/server/session";

const BodySchema = z.object({
  revoke: z.boolean().optional(),
});

export async function POST(request: Request) {
  let revoke = false;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = BodySchema.parse(json);
    revoke = parsed.revoke ?? false;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const token = await getGitHubToken();
  if (token && revoke) {
    await revokeGrant(token);
  }
  await clearGitHubToken();
  await clearDeviceCode();
  return NextResponse.json({ ok: true });
}
