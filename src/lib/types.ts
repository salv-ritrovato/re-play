export const PLAY_STATUSES = ["backlog", "playing", "completed", "on_hold", "dropped"] as const;
export type PlayStatus = (typeof PLAY_STATUSES)[number];

export const COMPLETION_STATUSES = ["none", "main_story", "completionist"] as const;
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];

export const PLAY_STATUS_LABEL: Record<PlayStatus, string> = {
  backlog: "Backlog",
  playing: "Playing",
  completed: "Completed",
  on_hold: "On hold",
  dropped: "Dropped",
};

export const COMPLETION_LABEL: Record<CompletionStatus, string> = {
  none: "Not completed",
  main_story: "Main story",
  completionist: "100%",
};

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

/** Row shape returned by the `library_search` RPC. */
export interface GameSummary {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  rating: number | null;
  play_status: PlayStatus;
  completion_status: CompletionStatus;
  playtime_hours: number | null;
  review_en: string | null;
  review_it: string | null;
  cover_path: string | null;
  cover_blur: string | null;
  created_at: string;
  is_online: boolean;
  genres: Taxonomy[];
  platforms: Taxonomy[];
  total_count: number;
}

export interface GameDetail {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  rating: number | null;
  play_status: PlayStatus;
  completion_status: CompletionStatus;
  playtime_hours: number | null;
  completed_on: string | null;
  review_en: string | null;
  review_it: string | null;
  pros: string[];
  cons: string[];
  cover_path: string | null;
  cover_blur: string | null;
  featured: boolean;
  is_online: boolean;
  created_at: string;
  updated_at: string;
  genres: Taxonomy[];
  platforms: Taxonomy[];
  tags: Taxonomy[];
}

export interface LibraryFilters {
  q?: string;
  genres?: string[];
  platforms?: string[];
  years?: number[];
  minRating?: number;
  maxRating?: number;
  status?: PlayStatus[];
  completion?: CompletionStatus[];
  developer?: string;
  publisher?: string;
  reviewedOnly?: boolean;
  /** undefined = everything, true = online/competitive only, false = single-player only */
  online?: boolean;
  sort: SortKey;
  page: number;
  view: "grid" | "list";
}

export const SORT_OPTIONS = [
  { value: "added", label: "Recently added" },
  { value: "played", label: "Recently played" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "rating_asc", label: "Lowest rated" },
  { value: "title", label: "Alphabetical" },
  { value: "release_desc", label: "Release date (newest)" },
  { value: "release_asc", label: "Release date (oldest)" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const REVIEW_SORT_OPTIONS = [
  { value: "added", label: "Recently added" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "rating_asc", label: "Lowest rated" },
  { value: "title", label: "Alphabetical" },
] as const;

export const LANGS = ["en", "it"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { en: "English", it: "Italiano" };

export function reviewFor(
  game: { review_en: string | null; review_it: string | null },
  lang: Lang,
): string | null {
  return (lang === "it" ? game.review_it : game.review_en) || null;
}
