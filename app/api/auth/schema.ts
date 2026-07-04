import { z } from "zod";
import { usernameSchema } from "../username/schema";

export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

// Username is optional at the API: the form presents it as required, but
// the generated name from the signup trigger is the real safety net, so
// nothing blocks on choosing one (see ADR 0001)
export const registerSchema = credentialsSchema.extend({
  username: usernameSchema.optional(),
});

export type Register = z.infer<typeof registerSchema>;
// What callers hand in before validation brands the username
export type RegisterInput = z.input<typeof registerSchema>;

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
