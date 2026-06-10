import { NextRequest } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireAuth,
  requireSupabase,
} from "../apiHandlerBuilder";
import { createResponse } from "../apiResponse";
import { getTypedBody } from "../wrappers/withValidation";
import { createJamSchema } from "./schema";
import { createJamCommand, listMyJamsCommand } from "./commands";

export const GET = new ApiHandlerBuilder()
  .auth()
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);

    const result = await listMyJamsCommand(auth.userId, supabase);

    return createResponse(result, "list my jams");
  });

export const POST = new ApiHandlerBuilder()
  .auth()
  .validateBody(createJamSchema)
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);
    const body = getTypedBody(context, createJamSchema);

    const result = await createJamCommand(auth.userId, body, supabase);

    return createResponse(result, "create jam", { successStatus: 201 });
  });
