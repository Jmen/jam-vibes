import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../../../result";
import { AddLoop, AddLoopResponse } from "./schema";
import { insertLoop, insertLoopAudio, softDeleteLoop } from "./db";
import { findAccessibleAudio } from "../../../audio/db";
import { resolveJamId } from "../commands";

export async function addLoopToJamCommand(
  jamIdOrHumanId: string,
  userId: string,
  loop: AddLoop,
  supabase: SupabaseClient,
): Promise<Result<AddLoopResponse>> {
  const jamId = await resolveJamId(jamIdOrHumanId, supabase);

  if (jamId.error) {
    return { error: jamId.error };
  }

  const audioIds = loop.audio.map((track) => track.audioId);

  if (new Set(audioIds).size !== audioIds.length) {
    return err(
      "duplicate_audio",
      "A loop cannot contain the same audio twice",
      ErrorCode.CLIENT_ERROR,
    );
  }

  const accessible = await findAccessibleAudio(
    audioIds,
    jamId.data,
    userId,
    supabase,
  );

  if (accessible.error) {
    return { error: accessible.error };
  }

  if (accessible.data.length !== audioIds.length) {
    return err(
      "audio_not_found",
      "All audio must be uploaded to this jam by you before committing",
      ErrorCode.CLIENT_ERROR,
    );
  }

  const inserted = await insertLoop(
    jamId.data,
    userId,
    loop.parentId ?? null,
    supabase,
  );

  if (inserted.error) {
    return { error: inserted.error };
  }

  const tracks = await insertLoopAudio(inserted.data.id, loop.audio, supabase);

  if (tracks.error) {
    // Avoid leaving a visible empty loop behind
    await softDeleteLoop(inserted.data.id, supabase);
    return { error: tracks.error };
  }

  return ok({
    id: inserted.data.id,
    jamId: inserted.data.jam_id,
    createdAt: inserted.data.created_at,
  });
}
