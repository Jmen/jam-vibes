import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode, Result, ok, err } from "../../../result";
import { CreateInvite, InviteView } from "./schema";
import { resolveJamId } from "../commands";

interface InviteRow {
  id: string;
  jam_id: string;
  email: string;
  token: string;
  created_at: string;
  accepted_at: string | null;
}

function toView(row: InviteRow): InviteView {
  return {
    id: row.id,
    jamId: row.jam_id,
    email: row.email,
    token: row.token,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
  };
}

export async function createInviteCommand(
  jamIdOrHumanId: string,
  userId: string,
  invite: CreateInvite,
  supabase: SupabaseClient,
): Promise<Result<InviteView>> {
  const jamId = await resolveJamId(jamIdOrHumanId, supabase);

  if (jamId.error) {
    return { error: jamId.error };
  }

  const { data, error } = await supabase
    .from("invites")
    .insert({
      jam_id: jamId.data,
      email: invite.email,
      created_by: userId,
    })
    .select("id, jam_id, email, token, created_at, accepted_at")
    .single();

  if (error) {
    if (error.code === "42501") {
      return err(
        "not_the_owner",
        "Only the jam owner can send invites",
        ErrorCode.FORBIDDEN,
      );
    }

    return err("create_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok(toView(data));
}

export async function listInvitesCommand(
  jamIdOrHumanId: string,
  supabase: SupabaseClient,
): Promise<Result<InviteView[]>> {
  const jamId = await resolveJamId(jamIdOrHumanId, supabase);

  if (jamId.error) {
    return { error: jamId.error };
  }

  const { data, error } = await supabase
    .from("invites")
    .select("id, jam_id, email, token, created_at, accepted_at")
    .eq("jam_id", jamId.data)
    .order("created_at", { ascending: false });

  if (error) {
    return err("list_failed", error.message, ErrorCode.SERVER_ERROR);
  }

  return ok((data ?? []).map(toView));
}
