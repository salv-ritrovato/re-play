import { z } from "zod";
import { decimalPoint, stripAsterisks } from "@/lib/text";
import { COMPLETION_STATUSES, LAUNCHER_IDS, PLAY_STATUSES } from "@/lib/types";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .transform((v) => (v === "" ? null : v));

/** Free text the owner writes or pastes: stray asterisks (pasted bold markers) are removed. */
const prose = (max: number) => z.string().transform(stripAsterisks).pipe(text(max));

const dateString = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date")
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Use a valid date")
  .transform((v) => (v === "" ? null : v));

const numberString = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .transform(decimalPoint)
    .refine((v) => v === "" || !Number.isNaN(Number(v)), `${label} must be a number`)
    .refine(
      (v) => v === "" || (Number(v) >= min && Number(v) <= max),
      `${label} must be between ${min} and ${max}`,
    )
    .transform((v) => (v === "" ? null : Math.round(Number(v) * 10) / 10));

/** One item per line in the form, array in the database. */
const lines = z
  .string()
  .transform(stripAsterisks)
  .pipe(z.string().max(4000))
  .transform((v) =>
    v
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );

export const gameSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(160),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(80)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only"),
    short_description: prose(280),
    description: prose(8000),
    release_date: dateString,
    developer: text(120),
    publisher: text(120),

    genre_ids: z.array(z.uuid()),
    platform_ids: z.array(z.uuid()),
    launchers: z.array(z.enum(LAUNCHER_IDS)).max(LAUNCHER_IDS.length),

    rating: numberString(0, 10, "Rating"),
    play_status: z.enum(PLAY_STATUSES),
    completion_status: z.enum(COMPLETION_STATUSES),
    playtime_hours: numberString(0, 99999, "Playtime"),
    completed_on: dateString,

    review_en: prose(20000),
    review_it: prose(20000),
    pros: lines,
    cons: lines,
    featured: z.boolean(),
    is_online: z.boolean(),
    rank: text(40),
  })
  // An online game has no ending: no completion level, no completion date, never "completed".
  .refine((v) => !v.is_online || v.completion_status === "none", {
    path: ["completion_status"],
    message: "Online games have no completion level",
  })
  .refine((v) => !v.is_online || !v.completed_on, {
    path: ["completed_on"],
    message: "Online games have no completion date",
  })
  .refine((v) => !v.is_online || v.play_status !== "completed", {
    path: ["play_status"],
    message: "An online game can't be completed: use Playing, On hold or Dropped",
  })
  // Only online games have a rank.
  .refine((v) => !v.rank || v.is_online, {
    path: ["rank"],
    message: "Only online games have a rank",
  })
  // A review always exists in both languages, or not at all.
  .refine((v) => !v.review_en || v.review_it, {
    path: ["review_it"],
    message: "Add the Italian version of the review",
  })
  .refine((v) => !v.review_it || v.review_en, {
    path: ["review_en"],
    message: "Add the English version of the review",
  });

export type GameFormInput = z.input<typeof gameSchema>;
export type GameFormValues = z.output<typeof gameSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username").max(120),
  password: z.string().min(1, "Password is required"),
});

export const taxonomyNameSchema = z.string().trim().min(1, "Name is required").max(60);
