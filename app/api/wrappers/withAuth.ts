import { NextRequest, NextResponse } from "next/server";
import { Handler, Context } from "../apiHandlerBuilder";
import { createBearerClient } from "@/lib/supabase/clients/request";
import { createCookieClient } from "@/lib/supabase/clients/server";

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: { code: "unauthorized", message: "Not signed in" } },
    { status: 401 },
  );
}

// Two auth protocols against the same API:
// - Authorization: Bearer <access_token> (native/mobile clients, acceptance tests)
// - Supabase session cookies (the website)
export function withAuth(handler: Handler): Handler {
  return async (req: NextRequest, context: Context) => {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice("Bearer ".length);
      const supabase = createBearerClient(accessToken);

      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        return unauthorized();
      }

      context.auth = {
        userId: data.user.id,
        email: data.user.email,
      };
      context.supabase = supabase;

      return handler(req, context);
    }

    const supabase = await createCookieClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return unauthorized();
    }

    context.auth = {
      userId: data.user.id,
      email: data.user.email,
    };
    context.supabase = supabase;

    return handler(req, context);
  };
}
