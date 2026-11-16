import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "AdaptLearn | Notch Demo", description: "A shared fictional learning demonstration" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
