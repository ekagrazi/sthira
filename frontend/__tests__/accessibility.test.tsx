import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthPage } from "@/components/auth/auth-page";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { OnboardingForm } from "@/components/onboarding-form";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/guides/buddha"),
}));

vi.mock("@/app/auth/actions", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  signInWithGoogle: vi.fn(),
  signup: vi.fn(),
}));

vi.mock("@/app/onboarding/actions", () => ({
  saveOnboarding: vi.fn(async () => ({})),
}));

async function expectNoAccessibilityViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  expect(result.violations).toEqual([]);
}

describe("automated accessibility checks", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes the authentication page structure", async () => {
    const { container } = render(<AuthPage mode="login" nextPath="/dashboard" />);
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    await expectNoAccessibilityViolations(container);
  });

  it("passes onboarding fields and choice descriptions", async () => {
    const { container } = render(<OnboardingForm />);
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByLabelText(/A short note/u)).toHaveAttribute("maxlength", "180");
    await expectNoAccessibilityViolations(container);
  });

  it("passes the desktop and mobile shell navigation", async () => {
    const { container } = render(
      <AuthenticatedShell
        profile={{
          displayName: "Asha Rao",
          onboarded: true,
          onboardingIntent: "Find more calm",
          userId: "user-id",
        }}
      >
        <h1>Guides</h1>
      </AuthenticatedShell>,
    );

    const currentLinks = screen.getAllByRole("link", {
      current: "page",
      name: "Perspectives",
    });
    expect(currentLinks).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Open profile menu for Asha Rao/u })).toBeVisible();
    await expectNoAccessibilityViolations(container);
  });
});
