import { SupabaseClient, AuthError } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { ErrorCode, Result, ok, err } from "../result";
import { isUsernameTaken, updateUsername } from "../my/profile/db";
import {
  Credentials,
  Session,
  ForgotPassword,
  ResetPassword,
  Register,
  Ok,
} from "./schema";

function authError<T>(error: AuthError): Result<T> {
  const type =
    error.status && error.status >= 500
      ? ErrorCode.SERVER_ERROR
      : error.status === 401
        ? ErrorCode.UNAUTHORIZED
        : ErrorCode.CLIENT_ERROR;

  return err(error.code ?? "auth_error", error.message, type);
}

function toSession(
  user: { id: string; email?: string } | null,
  session: { access_token: string; refresh_token: string } | null,
): Result<Session> {
  if (!user || !session) {
    return err(
      "no_session",
      "Authentication did not produce a session",
      ErrorCode.SERVER_ERROR,
    );
  }

  return ok({
    userId: user.id,
    email: user.email ?? "",
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  });
}

export async function registerCommand(
  registration: Register,
  supabase: SupabaseClient,
): Promise<Result<Session>> {
  const { email, password, username } = registration;

  if (username) {
    // Reject before any account exists: a taken username must not leave a
    // half-registered account behind
    const taken = await isUsernameTaken(username, supabase);

    if (taken.error) {
      return { error: taken.error };
    }

    if (taken.data) {
      return err(
        "username_taken",
        "That username is already taken",
        ErrorCode.CLIENT_ERROR,
      );
    }
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return authError(error);
  }

  const session = toSession(data.user, data.session);

  if (session.error || !username) {
    return session;
  }

  // Overwrite the generated username with the chosen one, using the new
  // session. Losing the race to a concurrent signup is silently ignored:
  // the generated name stands (see ADR 0001)
  const overwrite = await updateUsername(
    session.data.userId,
    username,
    supabase,
  );

  if (overwrite.error && overwrite.error.code !== "username_taken") {
    logger.warn(
      { action: "register user", error: overwrite.error },
      "keeping the generated username",
    );
  }

  return session;
}

export async function signInCommand(
  credentials: Credentials,
  supabase: SupabaseClient,
): Promise<Result<Session>> {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return authError(error);
  }

  return toSession(data.user, data.session);
}

export async function signOutCommand(
  supabase: SupabaseClient,
): Promise<Result<Ok>> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return authError(error);
  }

  return ok({ ok: true as const });
}

export async function forgotPasswordCommand(
  input: ForgotPassword,
  supabase: SupabaseClient,
  redirectTo: string,
): Promise<Result<Ok>> {
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  });

  if (error) {
    return authError(error);
  }

  // Always succeed: do not leak which emails are registered
  return ok({ ok: true as const });
}

export async function resetPasswordCommand(
  input: ResetPassword,
  supabase: SupabaseClient,
): Promise<Result<Session>> {
  const { data, error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: input.tokenHash,
  });

  if (error) {
    return authError(error);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (updateError) {
    return authError(updateError);
  }

  return toSession(data.user, data.session);
}
