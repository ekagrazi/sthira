"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-dvh place-items-center bg-background p-4 text-foreground">
          <section className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8" role="alert">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sthira</p>
            <h1 className="mt-3 text-2xl font-semibold">This page needs another moment</h1>
            <p className="mt-3 leading-7 text-muted-foreground">
              Something interrupted the page before it could finish. Your account data was
              not changed.
            </p>
            <button
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm focus-visible:ring-3 focus-visible:ring-ring/55"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
