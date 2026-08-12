"use client";

import { useActionState } from "react";

import {
  saveOnboarding,
  type OnboardingActionState,
} from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { onboardingOptions, parseOnboardingIntent } from "@/lib/onboarding";

const initialState: OnboardingActionState = {};

export function OnboardingForm({ defaultIntent }: { defaultIntent?: string }) {
  const [state, action] = useActionState(saveOnboarding, initialState);
  const initialIntent = parseOnboardingIntent(defaultIntent);

  return (
    <form action={action} className="space-y-7" noValidate>
      <fieldset aria-describedby="choice-description choice-error" className="space-y-3">
        <legend className="text-sm font-semibold">What are you hoping to find here?</legend>
        <p className="text-sm leading-6 text-muted-foreground" id="choice-description">
          Choose the closest fit. There is no permanent answer.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {onboardingOptions.map((option) => (
            <label className="group relative cursor-pointer" key={option.value}>
              <input
                className="peer sr-only"
                defaultChecked={initialIntent.choice === option.value}
                name="choice"
                required
                type="radio"
                value={option.value}
              />
              <span className="flex h-full min-h-28 flex-col rounded-xl border bg-background/75 p-4 transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] group-hover:border-input peer-checked:border-primary peer-checked:bg-card peer-checked:shadow-sm peer-focus-visible:ring-3 peer-focus-visible:ring-ring/55">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="mt-2 text-sm leading-5 text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.choice?.[0] && (
          <FieldError id="choice-error">{state.fieldErrors.choice[0]}</FieldError>
        )}
      </fieldset>

      <Field>
        <FieldLabel htmlFor="details">A short note <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
        <FieldDescription id="details-description">
          Add context you would like your reflection space to remember.
        </FieldDescription>
        <Textarea
          aria-describedby="details-description details-error"
          aria-invalid={Boolean(state.fieldErrors?.details)}
          defaultValue={initialIntent.details}
          id="details"
          maxLength={180}
          name="details"
          placeholder="For example: respond to difficult days with more patience."
          rows={3}
        />
        {state.fieldErrors?.details?.[0] && (
          <FieldError id="details-error">{state.fieldErrors.details[0]}</FieldError>
        )}
      </Field>

      {state.message && (
        <p aria-live="polite" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <SubmitButton pendingLabel="Saving your intention…">Continue to Sthira</SubmitButton>
    </form>
  );
}
