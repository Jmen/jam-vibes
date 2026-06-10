import { NextRequest } from "next/server";
import { Handler, Context } from "../apiHandlerBuilder";
import {
  createBearerClient,
  createAnonClient,
} from "@/lib/supabase/clients/request";
import { createCookieClient } from "@/lib/supabase/clients/server";

// For endpoints that serve both signed-in users and anonymous visitors
// (e.g. public jams). Sets auth context when credentials are valid,
// otherwise falls back to an anonymous client — RLS decides what's visible.
export function withOptionalAuth(handler: Handler): Handler {
  return async (req: NextRequest, context: Context) => {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice("Bearer ".length);
      const supabase = createBearerClient(accessToken);

      const { data, error } = await supabase.auth.getUser(accessToken);

      if (!error && data.user) {
        context.auth = { userId: data.user.id, email: data.user.email };
        context.supabase = supabase;
        return handler(req, context);
      }
    } else {
      const supabase = await createCookieClient();

      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        context.auth = { userId: data.user.id, email: data.user.email };
        context.supabase = supabase;
        return handler(req, context);
      }
    }

    context.supabase = createAnonClient();

    return handler(req, context);
  };
}
