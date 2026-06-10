import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/clients/server", () => ({
  createCookieClient: async () => ({
    auth: { exchangeCodeForSession },
  }),
}));

const ORIGIN = "http://localhost:3000";

function callback(query: string) {
  return GET(new NextRequest(`${ORIGIN}/api/auth/callback${query}`));
}

function sessionFor(createdAt: string | null) {
  return {
    data: {
      user: createdAt === null ? null : { created_at: createdAt },
      session: {},
    },
    error: null,
  };
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it("redirects a brand-new account to the username prompt, carrying next", async () => {
    exchangeCodeForSession.mockResolvedValue(sessionFor(minutesAgo(0)));

    const response = await callback("?code=abc&next=%2Fjams%2F42");

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth/username?next=%2Fjams%2F42`,
    );
  });

  it("prompts even when the account's created_at is slightly ahead of us", async () => {
    exchangeCodeForSession.mockResolvedValue(sessionFor(minutesAgo(-1)));

    const response = await callback("?code=abc");

    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth/username?next=%2F`,
    );
  });

  it("sends a returning account straight to next", async () => {
    exchangeCodeForSession.mockResolvedValue(sessionFor(minutesAgo(10)));

    const response = await callback("?code=abc&next=%2Fjams%2F42");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/jams/42`);
  });

  it("defaults next to the home page", async () => {
    exchangeCodeForSession.mockResolvedValue(sessionFor(minutesAgo(10)));

    const response = await callback("?code=abc");

    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });

  it("sanitizes an off-site next for a returning account", async () => {
    exchangeCodeForSession.mockResolvedValue(sessionFor(minutesAgo(10)));

    const response = await callback(
      `?code=abc&next=${encodeURIComponent("https://evil.example")}`,
    );

    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });

  it("forwards only an in-app next to the username prompt", async () => {
    exchangeCodeForSession.mockResolvedValue(sessionFor(minutesAgo(0)));

    const response = await callback(
      `?code=abc&next=${encodeURIComponent("/\\evil.example")}`,
    );

    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth/username?next=%2F`,
    );
  });

  it("treats a session without a user as a returning sign-in", async () => {
    exchangeCodeForSession.mockResolvedValue(sessionFor(null));

    const response = await callback("?code=abc&next=%2Fjams%2F42");

    expect(response.headers.get("location")).toBe(`${ORIGIN}/jams/42`);
  });

  it("redirects to the auth page when the code is missing", async () => {
    const response = await callback("");

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth?error=callback`,
    );
  });

  it("redirects to the auth page when the exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "invalid code" },
    });

    const response = await callback("?code=bad");

    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth?error=callback`,
    );
  });
});
