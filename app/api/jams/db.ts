import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../result";
import { CreateJam } from "./schema";

export interface JamRow {
  id: string;
  human_id: string;
  name: string;
  description: string;
  access: string;
  owner_id: string;
  photo_path: string | null;
  created_at: string;
  profiles?: { username: string | null } | null;
  loops?: { count: number }[];
}

const SUMMARY_SELECT = `
  id, human_id, name, description, access, owner_id, photo_path, created_at,
  profiles:profiles!jams_owner_id_profiles_fkey ( username ),
  loops ( count )
`;

export async function insertJam(
  ownerId: string,
  humanId: string,
  jam: CreateJam,
  supabase: SupabaseClient,
): Promise<Result<JamRow>> {
  const { data, error } = await supabase
    .from("jams")
    .insert({
      owner_id: ownerId,
      human_id: humanId,
      name: jam.name,
      description: jam.description,
      access: jam.access,
    })
    .select(SUMMARY_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return err(
        "human_id_collision",
        "Generated id collided, retry",
        ErrorCode.SERVER_ERROR,
      );
    }

    return err("create_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(data as JamRow);
}

export async function listJamsForMember(
  userId: string,
  supabase: SupabaseClient,
): Promise<Result<JamRow[]>> {
  const { data, error } = await supabase
    .from("jams")
    .select(`${SUMMARY_SELECT}, jam_members!inner ( user_id )`)
    .eq("jam_members.user_id", userId)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return err("list_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok((data ?? []) as JamRow[]);
}

export async function listPublicJams(
  supabase: SupabaseClient,
): Promise<Result<JamRow[]>> {
  const { data, error } = await supabase
    .from("jams")
    .select(SUMMARY_SELECT)
    .eq("access", "public")
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return err("list_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok((data ?? []) as JamRow[]);
}
