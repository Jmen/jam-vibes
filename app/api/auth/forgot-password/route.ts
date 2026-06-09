import { NextRequest } from "next/server";
import { ApiHandlerBuilder, Context } from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { getTypedBody } from "../../wrappers/withValidation";
import { createAnonClient } from "@/lib/supabase/clients/request";
import { forgotPasswordSchema } from "../schema";
import { forgotPasswordCommand } from "../commands";

export const POST = new ApiHandlerBuilder()
  .validateBody(forgotPasswordSchema)
  .build(async (req: NextRequest, context: Context) => {
    const body = getTypedBody(context, forgotPasswordSchema);

    const supabase = createAnonClient();

    const redirectTo = `${req.nextUrl.origin}/auth/reset-password`;

    const result = await forgotPasswordCommand(body, supabase, redirectTo);

    return createResponse(result, "send password reset email");
  });
