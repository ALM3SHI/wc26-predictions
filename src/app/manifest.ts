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
    theme_color: "#8B5CF6",
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
  };
}
