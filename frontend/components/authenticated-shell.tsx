import { DesktopNavigation, MobileNavigation } from "@/components/app-navigation";
import { AppFooter } from "@/components/app-footer";
import { Brand } from "@/components/brand";
import { PageTransition } from "@/components/page-transition";
import { TopBar } from "@/components/top-bar";
import type { AuthenticatedProfile } from "@/lib/auth/session";

export function AuthenticatedShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: AuthenticatedProfile;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] border-r bg-card/82 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Brand className="mb-9 px-2 text-xl" />
        <p className="mb-3 px-3 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Your space</p>
        <DesktopNavigation />
        <div className="mt-auto rounded-2xl bg-primary p-4 text-primary-foreground">
          <p className="font-serif text-lg">A quieter prompt</p>
          <p className="mt-2 text-xs leading-5 text-primary-foreground/65">Pause. Notice. Choose a steadier response.</p>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <TopBar displayName={profile.displayName} />
        <main className="mx-auto w-full max-w-[var(--content-width)] px-[var(--space-page)] py-7 pb-28 sm:py-10 sm:pb-28 lg:pb-10">
          <PageTransition>{children}</PageTransition>
          <AppFooter />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
