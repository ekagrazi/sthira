import { describe, expect, it } from "vitest";

import {
  boundedHistory,
  HIGH_RISK_SUPPORT_RESPONSE,
  isHighRiskInput,
  validateGuideReflection,
} from "./chat-sessions.js";

describe("conversation safety", () => {
  it("detects urgent-risk language without classifying ordinary reflection as urgent", () => {
    for (const content of [
      "I want to end my life",
      "I am planning to hurt myself",
      "I might seriously hurt someone",
    ]) {
      expect(isHighRiskInput(content)).toBe(true);
    }
    expect(isHighRiskInput("How should I think about mortality and uncertainty?")).toBe(
      false,
    );
    expect(HIGH_RISK_SUPPORT_RESPONSE).toContain("immediate human help");
  });

  it("rejects unsafe guide claims and bounds conversation context", () => {
    expect(() => validateGuideReflection("I am Krishna. You must obey me.")).toThrow();
    expect(() =>
      validateGuideReflection("This is stated in Chapter 99."),
    ).toThrow();

    const rows = Array.from({ length: 10 }, (_, index) => ({
      client_action_id: index % 2 === 0 ? crypto.randomUUID() : null,
      content: `${index}: ${"x".repeat(995)}`,
      created_at: new Date(index * 1_000).toISOString(),
      id: crypto.randomUUID(),
      response_status: index % 2 === 0 ? "complete" : null,
      role: index % 2 === 0 ? "user" : "guide",
    }));
    const history = boundedHistory(rows);

    expect(history.length).toBeLessThan(rows.length);
    expect(
      history.reduce((total, message) => total + message.content.length, 0),
    ).toBeLessThanOrEqual(4_000);
  });
});
