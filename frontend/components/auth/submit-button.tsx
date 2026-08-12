"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingLabel,
  variant,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-10 w-full"
      disabled={pending}
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
