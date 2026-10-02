import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SettingsProvider } from "@/features/settings/settings-provider";
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

/**
 * Vazirmatn slot for Persian glyphs.
 * Drop official Vazirmatn files into src/fonts/ (see README). Until then a
 * compatible Arabic TTF is used so builds work offline.
 */
const vazirmatn = localFont({
  src: [
    {
      path: "../fonts/Vazirmatn-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Vazirmatn-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Perch",
  description: "Desk-companion dashboard for an old Android phone",
  applicationName: "Perch",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Perch",
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
      className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
