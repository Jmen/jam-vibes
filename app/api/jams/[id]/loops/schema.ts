import { z } from "zod";

export const addLoopSchema = z.object({
  parentId: z.string().optional(),
  audio: z
    .array(
      z.object({
        audioId: z.string(),
        volume: z.number().min(0).max(1).default(1),
      }),
    )
    .min(1, "A loop needs at least one audio track")
    .max(8, "A loop can hold at most 8 audio tracks"),
});

export type AddLoop = z.infer<typeof addLoopSchema>;

export const addLoopResponseSchema = z.object({
  id: z.string(),
  jamId: z.string(),
  createdAt: z.string(),
});

export type AddLoopResponse = z.infer<typeof addLoopResponseSchema>;
