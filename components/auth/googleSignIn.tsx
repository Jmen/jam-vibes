"use client";

import { Button } from "@/components/ui/button";

// Google OAuth is config-driven: the button only renders when the flag is on
// (requires GOOGLE_CLIENT_ID / SECRET configured in supabase config too).
// The flow goes browser → supabase → google → /api/auth/callback.
export function GoogleSignIn() {
  if (process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "true") {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const signIn = () => {
    const redirectTo = `${window.location.origin}/api/auth/callback`;
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  return (
    <Button variant="outline" className="w-full" onClick={signIn}>
      <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
