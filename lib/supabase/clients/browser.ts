"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client shares the auth cookies set by the API routes, so realtime
// subscriptions carry the signed-in user's claims (RLS applies to channels).
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
