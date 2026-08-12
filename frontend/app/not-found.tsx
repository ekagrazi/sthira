import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-6 text-center shadow-[var(--shadow-soft)] sm:p-9">
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">This path is quiet</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">
          The page you requested does not exist or is no longer available.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Return to Sthira
          </Link>
        </Button>
      </section>
    </main>
  );
}
