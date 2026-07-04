// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import { registerCommand } from "../commands";
import { isUsernameTaken, claimUsername } from "../../username/db";
import { usernameSchema } from "../../username/schema";
import { ErrorCode, ok, err } from "../../result";

// Keep the real usernameTaken(): the command's rejection is part of the
// behaviour under test, only the database access is stubbed
vi.mock("../../username/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../username/db")>()),
  isUsernameTaken: vi.fn(),
  claimUsername: vi.fn(),
}));

const usernameTaken = vi.mocked(isUsernameTaken);
const claim = vi.mocked(claimUsername);

const registration = {
  email: "new@example.com",
  password: "password-123",
  username: usernameSchema.parse("chosen-name"),
};

function supabaseStub(signUpResult: object): SupabaseClient {
  return {
    auth: { signUp: vi.fn().mockResolvedValue(signUpResult) },
  } as unknown as SupabaseClient;
}

function signedUp() {
  return supabaseStub({
    data: {
      user: { id: "user-1", email: registration.email },
      session: { access_token: "token", refresh_token: "refresh" },
    },
    error: null,
  });
}

describe("registerCommand", () => {
  beforeEach(() => {
    usernameTaken.mockReset();
    claim.mockReset();
  });

  it("claims the chosen username over the generated one", async () => {
    usernameTaken.mockResolvedValue(ok(false));
    claim.mockResolvedValue({
      kind: "claimed",
      row: { user_id: "user-1", username: "chosen-name", avatar_path: null },
    });
    const supabase = signedUp();

    const result = await registerCommand(registration, supabase);

    expect(result.data?.userId).toBe("user-1");
    // signUp receives credentials only: the username is not auth metadata
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: registration.email,
      password: registration.password,
    });
    expect(claim).toHaveBeenCalledWith("user-1", "chosen-name", supabase);
  });

  it("rejects a taken username before any account exists", async () => {
    usernameTaken.mockResolvedValue(ok(true));
    const supabase = signedUp();

    const result = await registerCommand(registration, supabase);

    expect(result.error).toMatchObject({
      code: "username_taken",
      type: ErrorCode.CLIENT_ERROR,
    });
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });

  it("silently keeps the generated name when the claim race is lost", async () => {
    usernameTaken.mockResolvedValue(ok(false));
    claim.mockResolvedValue({ kind: "taken" });

    const result = await registerCommand(registration, signedUp());

    expect(result.error).toBeUndefined();
    expect(result.data?.userId).toBe("user-1");
  });

  it("still signs the user in when the claim fails unexpectedly", async () => {
    usernameTaken.mockResolvedValue(ok(false));
    claim.mockResolvedValue({
      kind: "failed",
      error: {
        code: "update_failed",
        message: "boom",
        type: ErrorCode.SERVER_ERROR,
      },
    });

    const result = await registerCommand(registration, signedUp());

    expect(result.error).toBeUndefined();
    expect(result.data?.userId).toBe("user-1");
  });

  it("registers without a username and leaves the generated one alone", async () => {
    const supabase = signedUp();

    const result = await registerCommand(
      { email: registration.email, password: registration.password },
      supabase,
    );

    expect(result.data?.userId).toBe("user-1");
    expect(usernameTaken).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });

  it("fails registration when the availability check fails", async () => {
    usernameTaken.mockResolvedValue(
      err("username_check_failed", "boom", ErrorCode.SERVER_ERROR),
    );
    const supabase = signedUp();

    const result = await registerCommand(registration, supabase);

    expect(result.error?.code).toBe("username_check_failed");
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("propagates sign-up errors without touching the username", async () => {
    usernameTaken.mockResolvedValue(ok(false));
    const supabase = supabaseStub({
      data: { user: null, session: null },
      error: Object.assign(new Error("User already registered"), {
        status: 400,
        code: "user_already_exists",
      }),
    });

    const result = await registerCommand(registration, supabase);

    expect(result.error?.code).toBe("user_already_exists");
    expect(claim).not.toHaveBeenCalled();
  });
});
