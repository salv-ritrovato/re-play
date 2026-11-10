import type { Metadata } from "next";
import { AboutView } from "@/components/about/about-view";
import { Container } from "@/components/layout/page-header";
import { about } from "@/content/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "Salvatore, a die-hard gamer with more than 1,500 games played, and why this archive exists.",
};

export default function AboutPage() {
  return (
    <Container className="pt-12 sm:pt-16">
      <AboutView content={about} />
    </Container>
  );
}
