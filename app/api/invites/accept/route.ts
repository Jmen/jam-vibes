import { NextRequest } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireAuth,
} from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { getTypedBody } from "../../wrappers/withValidation";
import { acceptInviteSchema } from "./schema";
import { acceptInviteCommand } from "./commands";

export const POST = new ApiHandlerBuilder()
  .auth()
  .validateBody(acceptInviteSchema)
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const body = getTypedBody(context, acceptInviteSchema);

    const result = await acceptInviteCommand(body.token, auth.userId);

    return createResponse(result, "accept invite");
  });
