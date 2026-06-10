import { z } from "zod";

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

export type AcceptInvite = z.infer<typeof acceptInviteSchema>;

export const acceptInviteResponseSchema = z.object({
  jamId: z.string(),
  humanId: z.string(),
});

export type AcceptInviteResponse = z.infer<typeof acceptInviteResponseSchema>;
