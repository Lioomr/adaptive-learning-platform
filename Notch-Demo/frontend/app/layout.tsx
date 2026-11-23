import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Notch | Adaptive Learning", template: "%s | Notch" },
  description: "Explore the Notch adaptive learning demo through its student, instructor and advisor portals.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6FB" },
    { media: "(prefers-color-scheme: dark)", color: "#110C24" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Apply an explicit appearance before paint. With no saved choice, CSS follows the device.
const initialAppearance = `try {
  const theme = localStorage.getItem("notch-appearance");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.notchTheme = theme;
} catch {}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: initialAppearance }} /></head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
