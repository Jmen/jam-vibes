import { z } from "zod";
import { jamAccessSchema } from "../schema";

export const loopAudioViewSchema = z.object({
  id: z.string(),
  audioId: z.string(),
  url: z.string(),
  fileName: z.string().nullable(),
  position: z.number(),
  volume: z.number(),
});

export const loopViewSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  parentId: z.string().nullable(),
  ownerUsername: z.string(),
  audio: z.array(loopAudioViewSchema),
});

export type LoopView = z.infer<typeof loopViewSchema>;

export const viewerRoleSchema = z.enum(["owner", "member", "visitor"]);

export type ViewerRole = z.infer<typeof viewerRoleSchema>;

export const getJamResponseSchema = z.object({
  id: z.string(),
  humanId: z.string(),
  name: z.string(),
  description: z.string(),
  access: jamAccessSchema,
  createdAt: z.string(),
  ownerId: z.string(),
  ownerUsername: z.string(),
  photoUrl: z.string().nullable(),
  viewerRole: viewerRoleSchema,
  loops: z.array(loopViewSchema),
});

export type JamView = z.infer<typeof getJamResponseSchema>;

export const updateJamSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    access: jamAccessSchema,
  })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  );

export type UpdateJam = z.infer<typeof updateJamSchema>;
