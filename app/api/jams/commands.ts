import { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok } from "../result";
import { CreateJam, JamSummary } from "./schema";
import { generateHumanId } from "./humanId";
import { JamRow, insertJam, listJamsForMember, listPublicJams } from "./db";
import { signJamPhotos } from "./[id]/signedUrls";

async function toSummaries(rows: JamRow[]): Promise<JamSummary[]> {
  const photoPaths = rows
    .map((row) => row.photo_path)
    .filter((path): path is string => path !== null);

  const photoUrls = await signJamPhotos(photoPaths);

  return rows.map((row) => ({
    id: row.id,
    humanId: row.human_id,
    name: row.name,
    description: row.description,
    access: row.access as JamSummary["access"],
    createdAt: row.created_at,
    ownerId: row.owner_id,
    ownerUsername: row.profiles.username,
    photoUrl: row.photo_path ? (photoUrls.get(row.photo_path) ?? null) : null,
    loopCount: row.loops?.[0]?.count ?? 0,
  }));
}

export async function createJamCommand(
  ownerId: string,
  jam: CreateJam,
  supabase: SupabaseClient,
): Promise<Result<JamSummary>> {
  let result = await insertJam(ownerId, generateHumanId(), jam, supabase);

  // Human ids are near-unique; one retry covers the rare collision
  if (result.error?.code === "human_id_collision") {
    result = await insertJam(ownerId, generateHumanId(), jam, supabase);
  }

  if (result.error) {
    return { error: result.error };
  }

  const summaries = await toSummaries([result.data]);

  return ok(summaries[0]);
}

export async function listMyJamsCommand(
  userId: string,
  supabase: SupabaseClient,
): Promise<Result<JamSummary[]>> {
  const rows = await listJamsForMember(userId, supabase);

  if (rows.error) {
    return { error: rows.error };
  }

  return ok(await toSummaries(rows.data));
}

export async function listPublicJamsCommand(
  supabase: SupabaseClient,
): Promise<Result<JamSummary[]>> {
  const rows = await listPublicJams(supabase);

  if (rows.error) {
    return { error: rows.error };
  }

  return ok(await toSummaries(rows.data));
}
