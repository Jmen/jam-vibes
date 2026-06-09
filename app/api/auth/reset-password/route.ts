import { NextRequest } from "next/server";
import { ApiHandlerBuilder, Context } from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { getTypedBody } from "../../wrappers/withValidation";
import { createCookieClient } from "@/lib/supabase/clients/server";
import { resetPasswordSchema } from "../schema";
import { resetPasswordCommand } from "../commands";

export const POST = new ApiHandlerBuilder()
  .validateBody(resetPasswordSchema)
  .build(async (req: NextRequest, context: Context) => {
    const body = getTypedBody(context, resetPasswordSchema);

    const supabase = await createCookieClient();

    const result = await resetPasswordCommand(body, supabase);

    return createResponse(result, "reset password");
  });
