import { NextRequest } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireSupabase,
} from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { signOutCommand } from "../commands";

export const POST = new ApiHandlerBuilder()
  .auth()
  .build(async (req: NextRequest, context: Context) => {
    const supabase = requireSupabase(context);

    const result = await signOutCommand(supabase);

    return createResponse(result, "sign out user");
  });
