// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import { registerCommand } from "../commands";
import { isUsernameTaken, updateUsername } from "../../my/profile/db";
import { ErrorCode, ok, err } from "../../result";

vi.mock("../../my/profile/db");

const usernameTaken = vi.mocked(isUsernameTaken);
const overwriteUsername = vi.mocked(updateUsername);

const registration = {
  email: "new@example.com",
  password: "password-123",
  username: "chosen-name",
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
    overwriteUsername.mockReset();
  });

  it("overwrites the generated username with the chosen one", async () => {
    usernameTaken.mockResolvedValue(ok(false));
    overwriteUsername.mockResolvedValue(
      ok({ user_id: "user-1", username: "chosen-name", avatar_path: null }),
    );
    const supabase = signedUp();

    const result = await registerCommand(registration, supabase);

    expect(result.data?.userId).toBe("user-1");
    // signUp receives credentials only: the username is not auth metadata
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: registration.email,
      password: registration.password,
    });
    expect(overwriteUsername).toHaveBeenCalledWith(
      "user-1",
      "chosen-name",
      supabase,
    );
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
    expect(overwriteUsername).not.toHaveBeenCalled();
  });

  it("silently keeps the generated name when the overwrite race is lost", async () => {
    usernameTaken.mockResolvedValue(ok(false));
    overwriteUsername.mockResolvedValue(
      err(
        "username_taken",
        "That username is already taken",
        ErrorCode.CLIENT_ERROR,
      ),
    );

    const result = await registerCommand(registration, signedUp());

    expect(result.error).toBeUndefined();
    expect(result.data?.userId).toBe("user-1");
  });

  it("still signs the user in when the overwrite fails unexpectedly", async () => {
    usernameTaken.mockResolvedValue(ok(false));
    overwriteUsername.mockResolvedValue(
      err("update_failed", "boom", ErrorCode.SERVER_ERROR),
    );

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
    expect(overwriteUsername).not.toHaveBeenCalled();
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
        name: "AuthApiError",
        status: 400,
        code: "user_already_exists",
        __isAuthError: true,
      }),
    });

    const result = await registerCommand(registration, supabase);

    expect(result.error?.code).toBe("user_already_exists");
    expect(overwriteUsername).not.toHaveBeenCalled();
  });
});
