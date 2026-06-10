import { randomUUID } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../result";
import { AudioView } from "./schema";
import { AudioRow, insertAudio, listMyAudioForJam } from "./db";
import { resolveJamId } from "../jams/[id]/commands";
import { signAudioPaths } from "../jams/[id]/signedUrls";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = new Map([
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/wave", "wav"],
  ["audio/mpeg", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/aac", "aac"],
  ["audio/ogg", "ogg"],
  ["audio/webm", "webm"],
  ["audio/flac", "flac"],
]);

async function toViews(rows: AudioRow[]): Promise<Result<AudioView[]>> {
  const urls = await signAudioPaths(rows.map((row) => row.file_path));

  if (urls.error) {
    return { error: urls.error };
  }

  const views: AudioView[] = [];

  for (const row of rows) {
    const signed = urls.data.find((url) => url.path === row.file_path);

    if (!signed) {
      return err(
        "audio_url_missing",
        `No playable URL for audio ${row.id}`,
        ErrorCode.SERVER_ERROR,
      );
    }

    views.push({
      id: row.id,
      jamId: row.jam_id,
      fileName: row.file_name,
      url: signed.url,
      createdAt: row.created_at,
    });
  }

  return ok(views);
}

export async function uploadAudioCommand(
  userId: string,
  jamIdOrHumanId: string,
  file: File,
  supabase: SupabaseClient,
): Promise<Result<AudioView>> {
  const extension = ALLOWED_AUDIO_TYPES.get(file.type);

  if (!extension) {
    return err(
      "unsupported_audio_type",
      `Audio type ${file.type || "unknown"} is not supported`,
      ErrorCode.CLIENT_ERROR,
    );
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return err(
      "audio_too_large",
      "Audio must be smaller than 20MB",
      ErrorCode.CLIENT_ERROR,
    );
  }

  const jamId = await resolveJamId(jamIdOrHumanId, supabase);

  if (jamId.error) {
    return { error: jamId.error };
  }

  const path = `${userId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return err("upload_failed", uploadError.message, ErrorCode.SERVER_ERROR);
  }

  const row = await insertAudio(
    userId,
    jamId.data,
    path,
    file.name || null,
    supabase,
  );

  if (row.error) {
    return { error: row.error };
  }

  const views = await toViews([row.data]);

  if (views.error) {
    return { error: views.error };
  }

  return ok(views.data[0]);
}

export async function listMyAudioCommand(
  userId: string,
  jamIdOrHumanId: string,
  supabase: SupabaseClient,
): Promise<Result<AudioView[]>> {
  const jamId = await resolveJamId(jamIdOrHumanId, supabase);

  if (jamId.error) {
    return { error: jamId.error };
  }

  const rows = await listMyAudioForJam(userId, jamId.data, supabase);

  if (rows.error) {
    return { error: rows.error };
  }

  return toViews(rows.data);
}
