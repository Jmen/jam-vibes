import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../../../result";

export interface LoopRow {
  id: string;
  jam_id: string;
  created_at: string;
}

export async function insertLoop(
  jamId: string,
  ownerId: string,
  parentId: string | null,
  supabase: SupabaseClient,
): Promise<Result<LoopRow>> {
  const { data, error } = await supabase
    .from("loops")
    .insert({
      jam_id: jamId,
      owner_id: ownerId,
      parent_id: parentId,
    })
    .select("id, jam_id, created_at")
    .single();

  if (error) {
    if (error.code === "42501") {
      return err(
        "not_a_member",
        "You must be a member of the jam to commit loops",
        ErrorCode.FORBIDDEN,
      );
    }

    return err("insert_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data);
}

export async function insertLoopAudio(
  loopId: string,
  tracks: { audioId: string; volume: number }[],
  supabase: SupabaseClient,
): Promise<Result<{ count: number }>> {
  const rows = tracks.map((track, index) => ({
    loop_id: loopId,
    audio_id: track.audioId,
    position: index,
    volume: track.volume,
  }));

  const { error } = await supabase.from("loop_audio").insert(rows);

  if (error) {
    return err("insert_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok({ count: rows.length });
}

export async function softDeleteLoop(
  loopId: string,
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.from("loops").update({ deleted: true }).eq("id", loopId);
}
