import { cn } from "@/lib/utils";
import { SectionMenuSkeleton } from "./SectionMenuSkeleton";

type FeedPageSkeletonProps = {
  className?: string;
};

export function FeedPageSkeleton({ className }: Readonly<FeedPageSkeletonProps>) {
  return (
    <section className={cn("min-h-screen", className)}>
      {/* Hero skeleton */}
      <section className="mb-20 flex h-[40vh] w-full flex-col pt-10 lg:h-[75vh] lg:flex-row lg:pb-10">
        <div className="flex h-full w-full flex-col justify-end pb-20 md:mb-1 md:justify-center md:pb-20">
          <div className="flex items-center justify-center">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10 md:h-16 md:w-96" />
          </div>
          <div className="mt-2 flex justify-center">
            <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="mx-auto my-auto flex h-[35vh] w-[85%] items-center justify-center pt-4 lg:h-[70vh]">
          <div className="mx-auto my-auto h-[85%] w-[95%] animate-pulse rounded-3xl border-2 border-white/20 bg-white/10" />
        </div>
      </section>
      <SectionMenuSkeleton />
    </section>
  );
}
