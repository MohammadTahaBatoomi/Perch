import { NextResponse } from "next/server";
import { z } from "zod";
import { GitHubApiError, startDeviceFlow } from "@/server/github";
import { clearDeviceCode, setDeviceCode } from "@/server/session";

export async function POST() {
  try {
    const flow = await startDeviceFlow();
    await setDeviceCode(flow.device_code);
    // device_code stays server-side only
    return NextResponse.json({
      user_code: flow.user_code,
      verification_uri: flow.verification_uri,
      expires_in: flow.expires_in,
      interval: flow.interval,
    });
  } catch (err) {
    await clearDeviceCode();
    const message =
      err instanceof Error ? err.message : "Failed to start device flow";
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// Validate empty body shape if ever extended
export const StartBodySchema = z.object({}).strict().optional();
