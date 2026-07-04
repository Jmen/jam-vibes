import { z } from "zod";
import { usernameSchema } from "../../username/schema";

export const profileResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export type Profile = z.infer<typeof profileResponseSchema>;

export const updateProfileSchema = z.object({
  username: usernameSchema,
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
// What callers hand in before validation brands it
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
