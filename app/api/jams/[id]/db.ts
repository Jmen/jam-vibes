import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../../result";
import { isUuid } from "../humanId";
import { Jam, LoopRecord } from "./domain";
import { UpdateJam } from "./schema";

interface JamDetailRow {
  id: string;
  human_id: string;
  name: string;
  description: string;
  access: string;
  owner_id: string;
  photo_path: string | null;
  created_at: string;
  profiles: { username: string | null } | null;
  loops: {
    id: string;
    parent_id: string | null;
    created_at: string;
    profiles: { username: string | null } | null;
    loop_audio: {
      id: string;
      position: number;
      volume: number;
      audio: {
        id: string;
        file_path: string;
        file_name: string | null;
      } | null;
    }[];
  }[];
}

const DETAIL_SELECT = `
  id, human_id, name, description, access, owner_id, photo_path, created_at,
  profiles:profiles!jams_owner_id_profiles_fkey ( username ),
  loops (
    id, parent_id, created_at,
    profiles:profiles!loops_owner_id_profiles_fkey ( username ),
    loop_audio (
      id, position, volume,
      audio ( id, file_path, file_name )
    )
  )
`;

export async function getJam(
  idOrHumanId: string,
  supabase: SupabaseClient,
): Promise<Result<Jam>> {
  const column = isUuid(idOrHumanId) ? "id" : "human_id";

  const { data, error } = await supabase
    .from("jams")
    .select(DETAIL_SELECT)
    .eq(column, idOrHumanId)
    .eq("deleted", false)
    .order("created_at", { referencedTable: "loops", ascending: true })
    .maybeSingle();

  if (error) {
    return err("get_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  if (!data) {
    return err("jam_not_found", "Jam not found", ErrorCode.NOT_FOUND);
  }

  const row = data as unknown as JamDetailRow;

  const loops: LoopRecord[] = row.loops.map((loop) => ({
    id: loop.id,
    createdAt: loop.created_at,
    parentId: loop.parent_id,
    ownerUsername: loop.profiles?.username ?? null,
    audio: loop.loop_audio
      .filter((loopAudio) => loopAudio.audio !== null)
      .map((loopAudio) => ({
        id: loopAudio.id,
        position: loopAudio.position,
        volume: loopAudio.volume,
        audio: {
          id: loopAudio.audio!.id,
          filePath: loopAudio.audio!.file_path,
          fileName: loopAudio.audio!.file_name,
        },
      })),
  }));

  return ok(
    new Jam({
      id: row.id,
      humanId: row.human_id,
      name: row.name,
      description: row.description,
      access: row.access,
      createdAt: row.created_at,
      ownerId: row.owner_id,
      ownerUsername: row.profiles?.username ?? null,
      photoPath: row.photo_path,
      loops,
    }),
  );
}

export async function updateJam(
  jamId: string,
  update: UpdateJam,
  supabase: SupabaseClient,
): Promise<Result<{ id: string }>> {
  const { data, error } = await supabase
    .from("jams")
    .update(update)
    .eq("id", jamId)
    .eq("deleted", false)
    .select("id")
    .maybeSingle();

  if (error) {
    return err("update_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  if (!data) {
    // RLS hides jams the user cannot update
    return err(
      "jam_not_found",
      "Jam not found or not owned by you",
      ErrorCode.NOT_FOUND,
    );
  }

  return ok(data);
}

export async function setJamPhotoPath(
  jamId: string,
  photoPath: string,
  supabase: SupabaseClient,
): Promise<Result<{ id: string }>> {
  const { data, error } = await supabase
    .from("jams")
    .update({ photo_path: photoPath })
    .eq("id", jamId)
    .select("id")
    .maybeSingle();

  if (error) {
    return err("update_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  if (!data) {
    return err(
      "jam_not_found",
      "Jam not found or not owned by you",
      ErrorCode.NOT_FOUND,
    );
  }

  return ok(data);
}
