import { ChartColumn, Clock, Gamepad2, Star, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { IconLabel } from "@/components/ui/icon-label";
import { BarList, Columns } from "@/components/stats/charts";
import { EmptyState } from "@/components/layout/empty-state";
import { Container, PageHeader, Section } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats } from "@/lib/data/public";
import { formatRating } from "@/lib/format";

export const metadata: Metadata = {
  title: "Statistics",
  description: "The numbers behind my gaming journey, computed from the archive.",
};

export default function StatisticsPage() {
  return (
    <Container className="space-y-14 pt-12 sm:pt-16">
      <PageHeader
        eyebrow="Statistics"
        title="The journey in numbers"
        description="Everything here is calculated live from the collection."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <StatsContent />
      </Suspense>
    </Container>
  );
}

async function StatsContent() {
  const { totals, genres, platforms, ratings, years } = await getStats();

  if (!totals || totals.total_games === 0) {
    return (
      <EmptyState
        icon={ChartColumn}
        title="No data to chart yet"
        description="Statistics appear as soon as games are added to the archive."
      />
    );
  }

  // Fill gaps so the distribution always shows 0-10.
  const ratingBuckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i}-${i + 1}`,
    value: ratings.find((r) => r.bucket === i)?.games ?? 0,
  }));

  // Fill year gaps between first and last year for an honest timeline.
  const yearItems: { label: string; value: number }[] = [];
  if (years.length > 0) {
    const first = years[0].year;
    const last = years[years.length - 1].year;
    for (let y = first; y <= last; y++) {
      yearItems.push({ label: String(y), value: years.find((r) => r.year === y)?.games ?? 0 });
    }
  }

  return (
    <div className="space-y-20">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-10 border-y border-border py-10 sm:grid-cols-3">
        <Figure icon={Gamepad2} label="Games played" value={totals.total_games} />
        <Figure icon={Star} label="Average rating" value={formatRating(totals.average_rating)} />
        <Figure icon={Clock} label="Hours played" value={Number(totals.total_playtime_hours.toFixed(1))} />
      </dl>

      <div className="grid gap-16 lg:grid-cols-2">
        <Section eyebrow="Taste" title="Games by genre">
          <BarList items={genres.map((g) => ({ label: g.name, value: g.games }))} emptyLabel="Assign genres to your games to see this." />
        </Section>
        <Section eyebrow="Hardware" title="Games by platform">
          <BarList items={platforms.map((p) => ({ label: p.name, value: p.games }))} emptyLabel="Assign platforms to your games to see this." />
        </Section>
      </div>

      <div className="grid gap-16 lg:grid-cols-2">
        <Section eyebrow="Judgement" title="Rating distribution">
          <Columns items={ratingBuckets} emptyLabel="No rated games yet." />
        </Section>
        <Section eyebrow="Timeline" title="Games played by year">
          <Columns
            items={yearItems}
            emptyLabel="Add completion dates to see your timeline."
          />
        </Section>
      </div>
    </div>
  );
}

function Figure({ icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="space-y-2">
      <dt className="eyebrow">
        <IconLabel icon={icon}>{label}</IconLabel>
      </dt>
      <dd className="text-4xl font-semibold tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}
