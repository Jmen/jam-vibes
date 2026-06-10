"use client";

// Sign-in state lives in httpOnly cookies, so client components cannot read
// it directly. Components that mutate auth announce it; the nav listens.
const AUTH_CHANGED = "jam-vibes:auth-changed";

export function emitAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

export function onAuthChanged(listener: () => void): () => void {
  window.addEventListener(AUTH_CHANGED, listener);
  return () => window.removeEventListener(AUTH_CHANGED, listener);
}
