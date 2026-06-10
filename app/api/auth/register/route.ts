import { NextRequest } from "next/server";
import { ApiHandlerBuilder, Context } from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { getTypedBody } from "../../wrappers/withValidation";
import { createCookieClient } from "@/lib/supabase/clients/server";
import { registerSchema } from "../schema";
import { registerCommand } from "../commands";

export const POST = new ApiHandlerBuilder()
  .validateBody(registerSchema)
  .build(async (req: NextRequest, context: Context) => {
    const body = getTypedBody(context, registerSchema);

    const supabase = await createCookieClient();

    const result = await registerCommand(body, supabase);

    return createResponse(result, "register user", { successStatus: 201 });
  });
