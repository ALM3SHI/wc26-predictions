import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WC26 Predictions",
    short_name: "WC26",
    description:
      "Predict World Cup 2026 knockout stage scores and compete on the global leaderboard",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#0A0A0F",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // App shortcuts — long-pressing the home-screen icon on Android
    // and 3D-touching on iOS reveals these quick-entry points. Order
    // matters: Android surfaces the first 4 in most launchers.
    shortcuts: [
      {
        name: "Matches",
        short_name: "Matches",
        description: "Predict the next kickoff",
        url: "/bracket",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Battle Pass",
        short_name: "Pass",
        description: "Track your season path",
        url: "/battle-pass",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Leagues",
        short_name: "Leagues",
        description: "Mini-leagues with friends",
        url: "/leagues",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Weekly recap",
        short_name: "Recap",
        description: "Your week in numbers",
        url: "/summary",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
