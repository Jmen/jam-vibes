import { NextRequest } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireAuth,
  requireSupabase,
} from "../../../apiHandlerBuilder";
import { createResponse } from "../../../apiResponse";
import { getTypedBody } from "../../../wrappers/withValidation";
import { addLoopSchema } from "./schema";
import { addLoopToJamCommand } from "./commands";

export const POST = new ApiHandlerBuilder()
  .auth()
  .validateBody(addLoopSchema)
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);
    const id = context.params.id as string;
    const body = getTypedBody(context, addLoopSchema);

    const result = await addLoopToJamCommand(id, auth.userId, body, supabase);

    return createResponse(result, "add loop to jam", { successStatus: 201 });
  });
