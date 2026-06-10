import { NextRequest } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireAuth,
  requireSupabase,
} from "../../../apiHandlerBuilder";
import { createResponse } from "../../../apiResponse";
import { getTypedBody } from "../../../wrappers/withValidation";
import { createInviteSchema } from "./schema";
import { createInviteCommand, listInvitesCommand } from "./commands";

export const POST = new ApiHandlerBuilder()
  .auth()
  .validateBody(createInviteSchema)
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);
    const id = context.params.id as string;
    const body = getTypedBody(context, createInviteSchema);

    const result = await createInviteCommand(id, auth.userId, body, supabase);

    return createResponse(result, "create invite", { successStatus: 201 });
  });

export const GET = new ApiHandlerBuilder()
  .auth()
  .build(async (req: NextRequest, context: Context) => {
    const supabase = requireSupabase(context);
    const id = context.params.id as string;

    const result = await listInvitesCommand(id, supabase);

    return createResponse(result, "list invites");
  });
