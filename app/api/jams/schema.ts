import { z } from "zod";

export const jamAccessSchema = z.enum(["private", "public"]);

export type JamAccess = z.infer<typeof jamAccessSchema>;

export const createJamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).default(""),
  access: jamAccessSchema.default("private"),
});

export type CreateJam = z.infer<typeof createJamSchema>;

export const jamSummarySchema = z.object({
  id: z.string(),
  humanId: z.string(),
  name: z.string(),
  description: z.string(),
  access: jamAccessSchema,
  createdAt: z.string(),
  ownerId: z.string(),
  ownerUsername: z.string(),
  photoUrl: z.string().nullable(),
  loopCount: z.number(),
});

export type JamSummary = z.infer<typeof jamSummarySchema>;

export const jamListResponseSchema = z.array(jamSummarySchema);
