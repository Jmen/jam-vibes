import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../../result";
import { isUuid } from "../humanId";
import { JamView, UpdateJam } from "./schema";
import { getJam, updateJam, setJamPhotoPath } from "./db";
import { signAudioPaths, signJamPhoto } from "./signedUrls";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export async function getJamCommand(
  idOrHumanId: string,
  supabase: SupabaseClient,
): Promise<Result<JamView>> {
  const jam = await getJam(idOrHumanId, supabase);

  if (jam.error) {
    return { error: jam.error };
  }

  const audioUrls = await signAudioPaths(jam.data.storagePaths());

  if (audioUrls.error) {
    return { error: audioUrls.error };
  }

  const photoUrl = await signJamPhoto(jam.data.photoPath());

  return jam.data.viewWithUrls(audioUrls.data, photoUrl);
}

export async function resolveJamId(
  idOrHumanId: string,
  supabase: SupabaseClient,
): Promise<Result<string>> {
  if (isUuid(idOrHumanId)) {
    return ok(idOrHumanId);
  }

  const { data, error } = await supabase
    .from("jams")
    .select("id")
    .eq("human_id", idOrHumanId)
    .eq("deleted", false)
    .maybeSingle();

  if (error) {
    return err("resolve_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  if (!data) {
    return err("jam_not_found", "Jam not found", ErrorCode.NOT_FOUND);
  }

  return ok(data.id);
}

export async function updateJamCommand(
  idOrHumanId: string,
  update: UpdateJam,
  supabase: SupabaseClient,
): Promise<Result<JamView>> {
  const jamId = await resolveJamId(idOrHumanId, supabase);

  if (jamId.error) {
    return { error: jamId.error };
  }

  const updated = await updateJam(jamId.data, update, supabase);

  if (updated.error) {
    return { error: updated.error };
  }

  return getJamCommand(jamId.data, supabase);
}

export async function uploadJamPhotoCommand(
  idOrHumanId: string,
  file: File,
  supabase: SupabaseClient,
): Promise<Result<JamView>> {
  const extension = ALLOWED_IMAGE_TYPES.get(file.type);

  if (!extension) {
    return err(
      "unsupported_image_type",
      "Photo must be a png, jpeg or webp image",
      ErrorCode.CLIENT_ERROR,
    );
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return err(
      "image_too_large",
      "Photo must be smaller than 5MB",
      ErrorCode.CLIENT_ERROR,
    );
  }

  const jamId = await resolveJamId(idOrHumanId, supabase);

  if (jamId.error) {
    return { error: jamId.error };
  }

  const path = `${jamId.data}/photo.${extension}`;

  // Storage RLS allows this write only for the jam's owner
  const { error: uploadError } = await supabase.storage
    .from("jam-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return err(
      "upload_failed",
      uploadError.message,
      ErrorCode.FORBIDDEN,
    );
  }

  const updated = await setJamPhotoPath(jamId.data, path, supabase);

  if (updated.error) {
    return { error: updated.error };
  }

  return getJamCommand(jamId.data, supabase);
}
