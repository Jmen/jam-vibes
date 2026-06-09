import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const sessionResponseSchema = z.object({
  userId: z.string(),
  email: z.email(),
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type Session = z.infer<typeof sessionResponseSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  tokenHash: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPassword = z.infer<typeof resetPasswordSchema>;

export const okResponseSchema = z.object({
  ok: z.literal(true),
});

export type Ok = z.infer<typeof okResponseSchema>;
