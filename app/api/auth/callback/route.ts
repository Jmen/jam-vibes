import { NextRequest, NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { createCookieClient } from "@/lib/supabase/clients/server";
import { toInAppPath } from "@/lib/inAppPath";

// A session whose account was created moments ago can only be a sign-up;
// past this window the same redirect is a sign-in. Stateless on purpose:
// the username prompt is cosmetic (docs/adr/0001), so a missed or repeated
// prompt costs nothing. Math.abs absorbs clock skew against supabase.
const NEW_ACCOUNT_WINDOW_MS = 5 * 60 * 1000;

function isBrandNewAccount(user: User | null): boolean {
  if (!user?.created_at) {
    return false;
  }

  const ageMs = Date.now() - new Date(user.created_at).getTime();
  return Math.abs(ageMs) < NEW_ACCOUNT_WINDOW_MS;
}

// OAuth and email-link landing point: exchanges the auth code for a session
// cookie, then sends the user into the app.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = toInAppPath(req.nextUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createCookieClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (isBrandNewAccount(data.user)) {
        const prompt = new URL("/auth/username", req.nextUrl.origin);
        prompt.searchParams.set("next", next);
        return NextResponse.redirect(prompt);
      }

      return NextResponse.redirect(new URL(next, req.nextUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/auth?error=callback", req.nextUrl.origin),
  );
}
