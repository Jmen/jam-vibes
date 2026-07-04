// ?next destinations are attacker-writable (they ride the whole OAuth
// round-trip in the query string), so they may only ever point back into
// the app. Resolving against a fixed origin canonicalizes the WHATWG
// quirks — backslashes count as slashes, "//host" is protocol-relative —
// before the origin check, rather than trying to enumerate them in
// string patterns.
const BASE = "https://in-app.invalid";

export function toInAppPath(next: string | null): string {
  if (!next) {
    return "/";
  }

  try {
    const url = new URL(next, BASE);

    if (url.origin !== BASE) {
      return "/";
    }

    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
