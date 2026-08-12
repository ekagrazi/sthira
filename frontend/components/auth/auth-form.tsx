"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, signInWithGoogle, signup } from "@/app/auth/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initialAuthActionState,
  type AuthActionState,
} from "@/lib/auth/action-state";

function AuthFieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <FieldError>{messages[0]}</FieldError>;
}

export function AuthForm({
  mode,
  nextPath,
}: {
  mode: "login" | "signup";
  nextPath: string;
}) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    action,
    initialAuthActionState,
  );
  const isLogin = mode === "login";

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4" noValidate>
        <input name="next" type="hidden" value={nextPath} />
        {!isLogin && (
          <Field>
            <FieldLabel htmlFor="displayName">Name</FieldLabel>
            <Input
              aria-invalid={Boolean(state.fieldErrors?.displayName)}
              autoComplete="name"
              id="displayName"
              name="displayName"
              required
            />
            <AuthFieldError messages={state.fieldErrors?.displayName} />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            aria-invalid={Boolean(state.fieldErrors?.email)}
            autoComplete="email"
            id="email"
            name="email"
            required
            type="email"
          />
          <AuthFieldError messages={state.fieldErrors?.email} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
          <AuthFieldError messages={state.fieldErrors?.password} />
        </Field>
        {state.message && (
          <p
            aria-live="polite"
            className={state.success ? "text-sm text-guide-buddha-ink" : "text-sm text-destructive"}
            role="status"
          >
            {state.message}
          </p>
        )}
        <SubmitButton pendingLabel={isLogin ? "Signing in…" : "Creating account…"}>
          {isLogin ? "Sign in" : "Create account"}
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        <input name="next" type="hidden" value={nextPath} />
        <SubmitButton pendingLabel="Opening Google…" variant="outline">
          Continue with Google
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "New to Sthira?" : "Already have an account?"}{" "}
        <Link
          className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/55"
          href={
            isLogin
              ? `/signup?next=${encodeURIComponent(nextPath)}`
              : `/login?next=${encodeURIComponent(nextPath)}`
          }
        >
          {isLogin ? "Create one" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
