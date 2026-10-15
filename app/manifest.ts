import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: process.env.BRAND_NAME || process.env.NEXT_PUBLIC_BRAND_NAME || "Global Market Hub",
    short_name: "GMH",
    description: "Fresh India-first affiliate finds.",
    start_url: "/in/under/under-49",
    display: "standalone",
    background_color: "#f7f4ed",
    theme_color: "#0f766e",
    lang: "en-IN",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
