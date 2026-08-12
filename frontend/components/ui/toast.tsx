"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      closeButton
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-card !text-card-foreground !shadow-[var(--shadow-lifted)]",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}

export { toast };
