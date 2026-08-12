"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavigationItemActive, primaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return primaryNavigation.map(({ href, icon: Icon, label }) => {
    const active = isNavigationItemActive(pathname, href);

    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={cn(
          mobile
            ? "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-[0.58rem] font-semibold"
            : "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold",
          "transition-colors duration-[var(--motion-fast)] focus-visible:ring-3 focus-visible:ring-ring/55",
          active
            ? "bg-primary text-primary-foreground shadow-[0_8px_22px_rgb(56_44_36/14%)]"
            : "text-muted-foreground hover:bg-muted/75 hover:text-foreground",
        )}
        href={href}
        key={href}
      >
        <Icon aria-hidden="true" className={mobile ? "size-5" : "size-[1.1rem]"} />
        <span className="truncate">{label}</span>
      </Link>
    );
  });
}

export function DesktopNavigation() {
  return (
    <nav aria-label="Desktop primary" className="space-y-1">
      <NavigationLinks />
    </nav>
  );
}

export function MobileNavigation() {
  return (
    <nav
      aria-label="Mobile primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-2 pt-2 backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around gap-0.5">
        <NavigationLinks mobile />
      </div>
    </nav>
  );
}
