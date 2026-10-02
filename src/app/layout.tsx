import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionProvider } from "@/features/motion/provider";
import { SettingsProvider } from "@/features/settings/settings-provider";
import { strings } from "@/lib/strings";
import "./globals.css";

const geistSans = localFont({
  src: "../fonts/Geist-Regular.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../fonts/GeistMono-Regular.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: strings.app.name,
  description: strings.app.description,
  applicationName: strings.app.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: strings.app.name,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#050508",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <MotionProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
