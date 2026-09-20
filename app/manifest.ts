import type { MetadataRoute } from "next";

import { siteDescription, siteName } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} — Gimillan, Cogne`,
    short_name: siteName,
    description: siteDescription,
    start_url: "/",
    display: "browser",
    background_color: "#f1eee6",
    theme_color: "#f1eee6",
    lang: "it",
    icons: [
      { src: "/icon", type: "image/png", sizes: "32x32" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
