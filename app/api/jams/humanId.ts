import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

// e.g. "brave-magenta-walrus-x4f2" — readable, URL-friendly, near-unique;
// the random suffix plus a retry on collision covers the rest
export function generateHumanId(): string {
  const words = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
  });

  const suffix = Math.random().toString(36).slice(2, 6);

  return `${words}-${suffix}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
