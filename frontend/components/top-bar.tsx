import { Brand } from "@/components/brand";
import { ProfileMenu } from "@/components/profile-menu";

export function TopBar({ displayName }: { displayName: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/88 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-[var(--space-page)]">
        <Brand className="text-lg lg:hidden" />
        <p className="hidden text-sm text-muted-foreground lg:block">A quiet place to notice and reflect.</p>
        <ProfileMenu displayName={displayName} />
      </div>
    </header>
  );
}
