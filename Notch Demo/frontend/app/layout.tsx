import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font; CSS fallbacks are defined in globals.css.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-plex-arabic", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AdaptLearn | Notch Demo", template: "%s | AdaptLearn Demo" },
  description: "A shared, fictional adaptive learning demonstration across Student, Instructor and Advisor portals.",
};

export const viewport: Viewport = { themeColor: "#1E2B58", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${plexArabic.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
