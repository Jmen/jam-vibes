import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../../result";
import { claimUsername, usernameTaken } from "@/lib/domain/username/db";
import { Profile, UpdateProfile } from "./schema";
import { ProfileRow, getProfileRow, updateAvatarPath } from "./db";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

function toProfile(
  row: ProfileRow,
  email: string,
  supabase: SupabaseClient,
): Profile {
  let avatarUrl: string | null = null;

  if (row.avatar_path) {
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(row.avatar_path);
    avatarUrl = data.publicUrl;
  }

  return {
    userId: row.user_id,
    email,
    username: row.username,
    avatarUrl,
  };
}

export async function getMyProfileCommand(
  userId: string,
  email: string,
  supabase: SupabaseClient,
): Promise<Result<Profile>> {
  const row = await getProfileRow(userId, supabase);

  if (row.error) {
    return { error: row.error };
  }

  return ok(toProfile(row.data, email, supabase));
}

export async function updateMyProfileCommand(
  userId: string,
  email: string,
  update: UpdateProfile,
  supabase: SupabaseClient,
): Promise<Result<Profile>> {
  const outcome = await claimUsername(userId, update.username, supabase);

  switch (outcome.kind) {
    case "claimed":
      return ok(toProfile(outcome.row, email, supabase));
    case "taken":
      return usernameTaken();
    case "failed":
      return { error: outcome.error };
  }
}

export async function uploadAvatarCommand(
  userId: string,
  email: string,
  file: File,
  supabase: SupabaseClient,
): Promise<Result<Profile>> {
  const extension = ALLOWED_IMAGE_TYPES.get(file.type);

  if (!extension) {
    return err(
      "unsupported_image_type",
      "Avatar must be a png, jpeg or webp image",
      ErrorCode.CLIENT_ERROR,
    );
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return err(
      "image_too_large",
      "Avatar must be smaller than 5MB",
      ErrorCode.CLIENT_ERROR,
    );
  }

  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return err("upload_failed", uploadError.message, ErrorCode.SERVER_ERROR);
  }

  const row = await updateAvatarPath(userId, path, supabase);

  if (row.error) {
    return { error: row.error };
  }

  return ok(toProfile(row.data, email, supabase));
}
