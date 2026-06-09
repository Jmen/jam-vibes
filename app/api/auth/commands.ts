import { SupabaseClient, AuthError } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../result";
import {
  Credentials,
  Session,
  ForgotPassword,
  ResetPassword,
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
  credentials: Credentials,
  supabase: SupabaseClient,
): Promise<Result<Session>> {
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    return authError(error);
  }

  return toSession(data.user, data.session);
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
