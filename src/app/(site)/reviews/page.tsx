import { Rss } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewsBrowser } from "@/components/games/reviews-browser";
import { Container, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getFilterOptions, getReviewEntries } from "@/lib/data/public";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Personal reviews and scores for the games I've played.",
  // Feed readers and browsers find the RSS feed from here.
  alternates: { types: { "application/rss+xml": "/reviews/feed.xml" } },
};

export default function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  return (
    <Container className="space-y-10 pt-12 sm:pt-16">
      <PageHeader
        eyebrow="Reviews"
        title="What I thought"
        description="Honest, personal write-ups of the games I've finished, dropped or can't stop thinking about."
        actions={
          <a
            href="/reviews/feed.xml"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            title="Follow the latest reviews in a feed reader"
          >
            <Rss /> RSS
          </a>
        }
      />
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function ReviewsContent({ searchParams }: { searchParams: PageProps<"/reviews">["searchParams"] }) {
  // The data does not depend on the URL (the browser filters it), but reading it keeps the page dynamic, so a
  // shared link arrives already filtered.
  await searchParams;
  const [options, reviews] = await Promise.all([getFilterOptions(), getReviewEntries()]);
  return <ReviewsBrowser reviews={reviews} options={options} />;
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading reviews">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[9rem_1fr] gap-8 border-b border-border py-7">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
