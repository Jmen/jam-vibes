import { ErrorCode, Result, ok, err } from "../../result";
import { createAdminClient } from "@/lib/supabase/clients/admin";
import { SignedUrl } from "./domain";

const URL_TTL_SECONDS = 60 * 60;

// Audio and jam photos live in private buckets; access control happened at
// the database layer (RLS decided whether the caller can see this jam at
// all), so signing here with the admin client does not widen access.
export async function signAudioPaths(
  paths: string[],
): Promise<Result<SignedUrl[]>> {
  if (paths.length === 0) {
    return ok([]);
  }

  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from("audio")
    .createSignedUrls(paths, URL_TTL_SECONDS);

  if (error) {
    return err("signing_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  const signed: SignedUrl[] = [];

  for (const entry of data ?? []) {
    if (!entry.error && entry.path && entry.signedUrl) {
      signed.push({ path: entry.path, url: entry.signedUrl });
    }
  }

  return ok(signed);
}

export async function signJamPhoto(
  photoPath: string | null,
): Promise<string | null> {
  if (!photoPath) {
    return null;
  }

  const admin = createAdminClient();

  const { data } = await admin.storage
    .from("jam-photos")
    .createSignedUrl(photoPath, URL_TTL_SECONDS);

  return data?.signedUrl ?? null;
}

export async function signJamPhotos(
  photoPaths: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();

  if (photoPaths.length === 0) {
    return urls;
  }

  const admin = createAdminClient();

  const { data } = await admin.storage
    .from("jam-photos")
    .createSignedUrls(photoPaths, URL_TTL_SECONDS);

  for (const entry of data ?? []) {
    if (!entry.error && entry.path && entry.signedUrl) {
      urls.set(entry.path, entry.signedUrl);
    }
  }

  return urls;
}
