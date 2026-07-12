import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import localFont from "next/font/local";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Navigation } from "@/components/Navigation";
import { SplashScreen } from "@/components/SplashScreen";
import { IOSInstallGate } from "@/components/IOSInstallGate";
import { I18nProvider } from "@/lib/i18n";
import Image from "next/image";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WC26",
    // Splash images can be added here once designed — Safari falls back to
    // the theme color otherwise.
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "WC26",
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
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${fifa.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body text-gray-900 antialiased min-h-screen pb-[calc(env(safe-area-inset-bottom)+70px)] md:pb-0 pt-[env(safe-area-inset-top)] relative">
        <div className="fixed inset-0 -z-50 bg-[#F9FAFB]">
          <Image src="/images/pattern.png" alt="Background Pattern" fill priority className="object-cover opacity-80" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F9FAFB]/50 to-[#F9FAFB]" />
        </div>
        <I18nProvider>
          {/* iOS Add-to-Home-Screen gate wraps the whole app; it renders
              children when the visitor isn't on iOS or is already in
              standalone mode, and a blocking tutorial otherwise. */}
          <IOSInstallGate>
            <Navigation />
            {children}
          </IOSInstallGate>
          {/* Splash sits above everything but auto-dismisses after ~1.4s. */}
          <SplashScreen />
        </I18nProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
