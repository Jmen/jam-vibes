import { NextRequest } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireAuth,
  requireSupabase,
} from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { getTypedBody } from "../../wrappers/withValidation";
import { updateProfileSchema } from "./schema";
import { getMyProfileCommand, updateMyProfileCommand } from "./commands";

export const GET = new ApiHandlerBuilder()
  .auth()
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);

    const result = await getMyProfileCommand(
      auth.userId,
      auth.email ?? "",
      supabase,
    );

    return createResponse(result, "get my profile");
  });

export const PUT = new ApiHandlerBuilder()
  .auth()
  .validateBody(updateProfileSchema)
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);
    const body = getTypedBody(context, updateProfileSchema);

    const result = await updateMyProfileCommand(
      auth.userId,
      auth.email ?? "",
      body,
      supabase,
    );

    return createResponse(result, "update my profile");
  });
