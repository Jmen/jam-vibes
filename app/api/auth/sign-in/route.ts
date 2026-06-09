import { NextRequest } from "next/server";
import { ApiHandlerBuilder, Context } from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { getTypedBody } from "../../wrappers/withValidation";
import { createCookieClient } from "@/lib/supabase/clients/server";
import { credentialsSchema } from "../schema";
import { signInCommand } from "../commands";

export const POST = new ApiHandlerBuilder()
  .validateBody(credentialsSchema)
  .build(async (req: NextRequest, context: Context) => {
    const body = getTypedBody(context, credentialsSchema);

    const supabase = await createCookieClient();

    const result = await signInCommand(body, supabase);

    return createResponse(result, "sign in user");
  });
