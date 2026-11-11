import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bitácora",
    short_name: "Bitácora",
    description: "Diario personal: retos, hábitos, fe y progreso.",
    start_url: "/",
    display: "standalone",
    background_color: "#15100c",
    theme_color: "#15100c",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
