import { STEAM_URL } from "@/content/about";

export type SocialId = "steam" | "instagram" | "anilist" | "inlumine";

/** The owner's profiles, shown as icons in the footer. Edit here. */
export const SOCIAL_LINKS: { id: SocialId; label: string; description: string; href: string }[] = [
  { id: "steam", label: "Steam", description: "My Steam profile", href: STEAM_URL },
  { id: "instagram", label: "Instagram", description: "My Instagram", href: "https://www.instagram.com/salv.ritrovato/" },
  { id: "anilist", label: "AniList", description: "My AniList, for anime and manga", href: "https://anilist.co/home" },
  { id: "inlumine", label: "inLumine", description: "inLumine Studio, the company I co-founded", href: "https://www.inlumine.it/" },
];
