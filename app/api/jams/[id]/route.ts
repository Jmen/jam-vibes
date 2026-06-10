import { NextRequest } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireSupabase,
} from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { getTypedBody } from "../../wrappers/withValidation";
import { updateJamSchema } from "./schema";
import { getJamCommand, updateJamCommand } from "./commands";

export const GET = new ApiHandlerBuilder()
  .optionalAuth()
  .build(async (req: NextRequest, context: Context) => {
    const supabase = requireSupabase(context);
    const id = context.params.id as string;

    const result = await getJamCommand(id, supabase, context.auth?.userId);

    return createResponse(result, "get jam");
  });

export const PATCH = new ApiHandlerBuilder()
  .auth()
  .validateBody(updateJamSchema)
  .build(async (req: NextRequest, context: Context) => {
    const supabase = requireSupabase(context);
    const id = context.params.id as string;
    const body = getTypedBody(context, updateJamSchema);

    const result = await updateJamCommand(
      id,
      body,
      supabase,
      context.auth?.userId,
    );

    return createResponse(result, "update jam");
  });
