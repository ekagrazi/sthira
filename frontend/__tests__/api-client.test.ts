import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api/client";

const getSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => ({
  getPublicBackendUrl: () => "https://api.example.test",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession } }),
}));

describe("API cold-start recovery", () => {
  beforeEach(() => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "access-token" } },
      error: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("retries one read but never retries a write", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Temporarily unavailable" }), {
          status: 503,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: "ready" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Temporarily unavailable" }), {
          status: 503,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ value: string }>("/api/read")).resolves.toEqual({
      value: "ready",
    });
    await expect(
      apiRequest("/api/write", { body: { value: true }, method: "POST" }),
    ).rejects.toMatchObject({ kind: "cold-start", status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer access-token",
    });
  });
});
