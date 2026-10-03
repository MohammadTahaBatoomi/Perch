import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Perch loads the Next.js desk server in a WebView.
 * Override at build time with PERCH_SERVER_URL (e.g. http://192.168.1.10:3000).
 */
const serverUrl =
  process.env.PERCH_SERVER_URL?.trim() ||
  "https://perch-one-rosy.vercel.app";

const isHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "app.perch.desk",
  appName: "Perch",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: isHttp,
  },
  android: {
    allowMixedContent: isHttp,
  },
};

export default config;
