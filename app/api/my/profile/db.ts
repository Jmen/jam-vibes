import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../../result";

export interface ProfileRow {
  user_id: string;
  username: string;
  avatar_path: string | null;
}

export async function getProfileRow(
  userId: string,
  supabase: SupabaseClient,
): Promise<Result<ProfileRow>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_path")
    .eq("user_id", userId)
    .single();

  if (error) {
    return err("profile_not_found", "Profile not found", ErrorCode.NOT_FOUND);
  }

  return ok(data);
}

export async function isUsernameTaken(
  username: string,
  supabase: SupabaseClient,
): Promise<Result<boolean>> {
  // ilike is case-insensitive equality here, matching the unique index on
  // lower(username); escape its wildcards so "a_b" cannot match "axb"
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

export async function updateUsername(
  userId: string,
  username: string,
  supabase: SupabaseClient,
): Promise<Result<ProfileRow>> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("user_id, username, avatar_path")
    .single();

  if (error) {
    if (error.code === "23505") {
      return err(
        "username_taken",
        "That username is already taken",
        ErrorCode.CLIENT_ERROR,
      );
    }

    return err("update_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data);
}

export async function updateAvatarPath(
  userId: string,
  avatarPath: string,
  supabase: SupabaseClient,
): Promise<Result<ProfileRow>> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_path: avatarPath, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("user_id, username, avatar_path")
    .single();

  if (error) {
    return err("update_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data);
}
