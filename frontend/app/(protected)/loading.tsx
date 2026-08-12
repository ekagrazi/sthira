import { PageSkeleton } from "@/components/loading-skeleton";

export default function ProtectedLoading() {
  return (
    <div className="mx-auto w-full max-w-[var(--content-width)] px-[var(--space-page)] py-10">
      <PageSkeleton />
    </div>
  );
}
