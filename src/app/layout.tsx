import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import localFont from "next/font/local";
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

const fifa = localFont({
  src: "../../public/fonts/fifa-26.otf",
  variable: "--font-fifa",
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
    statusBarStyle: "default",
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
  themeColor: "#FFFFFF",
};

/* ── Root Layout ──────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${fifa.variable}`}>
      <body className="font-body text-gray-900 antialiased min-h-screen pb-[calc(env(safe-area-inset-bottom)+70px)] md:pb-0 relative">
        <div className="wc-bg-pattern" />
        <Navigation />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
