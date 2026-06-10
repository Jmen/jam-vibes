import { z } from "zod";

export const audioResponseSchema = z.object({
  id: z.string(),
  jamId: z.string().nullable(),
  fileName: z.string().nullable(),
  url: z.string(),
  createdAt: z.string(),
});

export type AudioView = z.infer<typeof audioResponseSchema>;

export const audioListResponseSchema = z.array(audioResponseSchema);

export const listAudioQuerySchema = z.object({
  jamId: z.string(),
});

export type ListAudioQuery = z.infer<typeof listAudioQuerySchema>;
