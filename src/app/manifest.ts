import type { MetadataRoute } from "next";

/**
 * Lets phones install the site to the home screen and open it full screen,
 * with no browser bar — the "opens like an app" behaviour.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mugabe Fitness — Personal Coaching",
    short_name: "Mugabe Fitness",
    description:
      "Personal coaching built to help you train with purpose, build strength, and become the strongest version of yourself.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#050505",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Android crops a circle out of maskable icons, which is why the mark
      // is drawn smaller on these.
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Programs", url: "/#programs" },
      { name: "Book a program", url: "/#contact" },
      { name: "My account", url: "/account" },
    ],
  };
}
