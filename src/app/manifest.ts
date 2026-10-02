import type { MetadataRoute } from "next";
import { strings } from "@/lib/strings";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: strings.app.name,
    short_name: strings.app.name,
    description: strings.app.shortDescription,
    start_url: "/",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#050508",
    theme_color: "#050508",
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
