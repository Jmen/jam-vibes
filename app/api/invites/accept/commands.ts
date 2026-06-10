import { ErrorCode, Result, ok, err } from "../../result";
import { AcceptInviteResponse } from "./schema";
import { createAdminClient } from "@/lib/supabase/clients/admin";

// The token IS the capability: whoever holds the link may join, the email is
// informational. Runs with the admin client because the invitee can neither
// see the invite row nor insert their own membership under RLS — the token
// check here is the gate.
export async function acceptInviteCommand(
  token: string,
  userId: string,
): Promise<Result<AcceptInviteResponse>> {
  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("invites")
    .select("id, jam_id, accepted_at, jams ( id, human_id, deleted )")
    .eq("token", token)
    .maybeSingle();

  if (inviteError) {
    return err("lookup_failed", inviteError.message, ErrorCode.SERVER_ERROR);
  }

  const jam = invite?.jams as unknown as {
    id: string;
    human_id: string;
    deleted: boolean;
  } | null;

  if (!invite || !jam || jam.deleted) {
    return err(
      "invalid_invite",
      "This invite link is not valid",
      ErrorCode.NOT_FOUND,
    );
  }

  if (invite.accepted_at) {
    return err(
      "invite_already_used",
      "This invite has already been used",
      ErrorCode.CLIENT_ERROR,
    );
  }

  const { error: memberError } = await admin.from("jam_members").upsert(
    {
      jam_id: invite.jam_id,
      user_id: userId,
      role: "member",
    },
    { onConflict: "jam_id,user_id", ignoreDuplicates: true },
  );

  if (memberError) {
    return err("join_failed", memberError.message, ErrorCode.SERVER_ERROR);
  }

  const { error: updateError } = await admin
    .from("invites")
    .update({
      accepted_by: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (updateError) {
    return err("update_failed", updateError.message, ErrorCode.SERVER_ERROR);
  }

  return ok({ jamId: invite.jam_id, humanId: jam.human_id });
}
