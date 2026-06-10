import { z } from "zod";

export const profileResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export type Profile = z.infer<typeof profileResponseSchema>;

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username may only contain letters, numbers, hyphens and underscores",
    ),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
