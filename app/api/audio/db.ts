import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../result";

export interface AudioRow {
  id: string;
  jam_id: string | null;
  file_path: string;
  file_name: string | null;
  created_at: string;
}

export async function insertAudio(
  ownerId: string,
  jamId: string,
  filePath: string,
  fileName: string | null,
  supabase: SupabaseClient,
): Promise<Result<AudioRow>> {
  const { data, error } = await supabase
    .from("audio")
    .insert({
      owner_id: ownerId,
      jam_id: jamId,
      file_path: filePath,
      file_name: fileName,
    })
    .select("id, jam_id, file_path, file_name, created_at")
    .single();

  if (error) {
    if (error.code === "42501") {
      return err(
        "not_a_member",
        "You must be a member of the jam to upload audio",
        ErrorCode.FORBIDDEN,
      );
    }

    return err("insert_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data);
}

export async function listMyAudioForJam(
  ownerId: string,
  jamId: string,
  supabase: SupabaseClient,
): Promise<Result<AudioRow[]>> {
  const { data, error } = await supabase
    .from("audio")
    .select("id, jam_id, file_path, file_name, created_at")
    .eq("owner_id", ownerId)
    .eq("jam_id", jamId)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return err("list_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data ?? []);
}

export async function findAccessibleAudio(
  audioIds: string[],
  jamId: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<Result<AudioRow[]>> {
  const { data, error } = await supabase
    .from("audio")
    .select("id, jam_id, file_path, file_name, created_at")
    .in("id", audioIds)
    .eq("jam_id", jamId)
    .eq("owner_id", userId)
    .eq("deleted", false);

  if (error) {
    return err("lookup_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data ?? []);
}
