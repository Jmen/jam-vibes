import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.email(),
});

export type CreateInvite = z.infer<typeof createInviteSchema>;

export const inviteResponseSchema = z.object({
  id: z.string(),
  jamId: z.string(),
  email: z.string(),
  token: z.string(),
  createdAt: z.string(),
  acceptedAt: z.string().nullable(),
});

export type InviteView = z.infer<typeof inviteResponseSchema>;

export const inviteListResponseSchema = z.array(inviteResponseSchema);
