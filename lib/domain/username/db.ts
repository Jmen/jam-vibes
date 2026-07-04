import { SupabaseClient } from "@supabase/supabase-js";
// Interim imports from the delivery tree: Result and ProfileRow move into
// the domain layer when the full inversion of app/api lands
import { ErrorCode, Result, ResultError, ok, err } from "@/app/api/result";
import { ProfileRow } from "@/app/api/my/profile/db";
import { Username } from "./schema";

// Claiming a username is first-come-first-served against the unique index
// on lower(username): "taken" is a normal outcome of the domain, not a
// failure, and every caller must decide what losing means for its use case
export type ClaimUsernameOutcome =
  | { kind: "claimed"; row: ProfileRow }
  | { kind: "taken" }
  | { kind: "failed"; error: ResultError };

// The wire-level rejection shared by every flow that lets someone ask for
// a name which is already claimed
export function usernameTaken<T>(): Result<T> {
  return err(
    "username_taken",
    "That username is already taken",
    ErrorCode.CLIENT_ERROR,
  );
}

export async function isUsernameTaken(
  username: Username,
  supabase: SupabaseClient,
): Promise<Result<boolean>> {
  // ilike is case-insensitive equality here, matching the unique index on
  // lower(username); a Username admits "_", a LIKE wildcard, so escape it
  // so that "a_b" cannot match "axb"
  const pattern = username.replace(/[\\%_]/g, "\\$&");

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .ilike("username", pattern)
    .limit(1);

  if (error) {
    return err("username_check_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data.length > 0);
}

export async function claimUsername(
  userId: string,
  username: Username,
  supabase: SupabaseClient,
): Promise<ClaimUsernameOutcome> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("user_id, username, avatar_path")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { kind: "taken" };
    }

    return {
      kind: "failed",
      error: {
        code: "update_failed",
        message: error.message,
        type: ErrorCode.SERVER_ERROR,
      },
    };
  }

  return { kind: "claimed", row: data };
}
