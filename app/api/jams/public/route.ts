import { NextRequest } from "next/server";
import { ApiHandlerBuilder, Context } from "../../apiHandlerBuilder";
import { createResponse } from "../../apiResponse";
import { createAnonClient } from "@/lib/supabase/clients/request";
import { listPublicJamsCommand } from "../commands";

// The home page feed: works signed-out, so it always queries as anon —
// RLS only exposes public jams to the anon role anyway.
export const GET = new ApiHandlerBuilder().build(
  async (req: NextRequest, context: Context) => {
    void context;

    const result = await listPublicJamsCommand(createAnonClient());

    return createResponse(result, "list public jams");
  },
);
