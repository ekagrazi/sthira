"use client";

import { ChevronDown, LogOut } from "lucide-react";

import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string | null): string {
  if (!name) return "S";
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileMenu({ displayName }: { displayName: string | null }) {
  const label = displayName ?? "Your profile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`Open profile menu for ${label}`} className="gap-2" variant="ghost">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
          >
            {initials(displayName)}
          </span>
          <span className="hidden max-w-40 truncate sm:inline">{label}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <p className="truncate px-2 pb-2 text-sm font-medium">{label}</p>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button className="w-full" type="submit">
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
