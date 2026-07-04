import { z } from "zod";

// The username concept: a person's public identity on jams and loops.
// The same rules are enforced at the database boundary by the
// profiles_username_check constraint and the unique index on
// lower(username), so the database stays authoritative (see ADR 0001).
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username may only contain letters, numbers, hyphens and underscores",
  )
  .brand<"Username">();

// Only parsing produces a Username, so code holding one may assume the
// rules above hold
export type Username = z.infer<typeof usernameSchema>;
