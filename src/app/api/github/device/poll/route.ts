import { NextResponse } from "next/server";
import { z } from "zod";
import { pollDeviceFlow } from "@/server/github";
import {
  clearDeviceCode,
  getDeviceCode,
  setGitHubToken,
} from "@/server/session";

const BodySchema = z.object({}).strict().optional();

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    BodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const deviceCode = await getDeviceCode();
  if (!deviceCode) {
    return NextResponse.json(
      { status: "expired" as const, message: "No pending device flow" },
      { status: 400 },
    );
  }

  const result = await pollDeviceFlow(deviceCode);

  if (result.status === "success") {
    await setGitHubToken(result.access_token);
    await clearDeviceCode();
    return NextResponse.json({ status: "success" as const });
  }

  if (result.status === "expired" || result.status === "denied") {
    await clearDeviceCode();
  }

  return NextResponse.json(result);
}
