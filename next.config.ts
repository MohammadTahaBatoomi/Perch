import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Keep AGENTS.md from being rewritten on every `next dev`
  agentRules: false,
};

export default nextConfig;
