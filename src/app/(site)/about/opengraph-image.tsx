import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "About Salvatore, the gamer behind Re:Play";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderOg({
    eyebrow: "About",
    title: "Hi, I'm Salvatore",
    subtitle: "A die-hard gamer with more than 1,500 games played, and why this archive exists.",
  });
}
