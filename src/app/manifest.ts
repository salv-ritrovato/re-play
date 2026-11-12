import type { MetadataRoute } from "next";

/** What a phone needs to add the site to the home screen: name, colours and the icons with the contracted logo. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Re:Play - My journey through gaming",
    short_name: "Re:Play",
    description: "A personal archive of every video game I've played: ratings, reviews and statistics.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
