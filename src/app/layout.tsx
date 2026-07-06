import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

/* ── Google Fonts ─────────────────────────────────────── */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

/* ── Metadata ─────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "WC26 Predictions | World Cup 2026",
  description:
    "Predict World Cup 2026 knockout stage scores and compete on the global leaderboard. Make your picks before each match kicks off!",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WC26",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0F",
};

/* ── Root Layout ──────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-wc-black text-white font-body antialiased">
        <Navigation />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
