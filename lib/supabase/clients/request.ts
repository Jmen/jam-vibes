import { createClient } from "@supabase/supabase-js";

// RLS-scoped client for API routes authenticated with a bearer token.
// Native clients (e.g. mobile apps) send Authorization: Bearer <access_token>.
export function createBearerClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

// Anonymous client: RLS exposes only public content (public jams, their loops)
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
