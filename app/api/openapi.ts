import { z } from "zod";
import { createDocument } from "zod-openapi";
import type { ZodOpenApiResponsesObject } from "zod-openapi";
import {
  credentialsSchema,
  registerSchema,
  sessionResponseSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  okResponseSchema,
} from "./auth/schema";
import {
  profileResponseSchema,
  updateProfileSchema,
} from "./my/profile/schema";
import {
  createJamSchema,
  jamSummarySchema,
  jamListResponseSchema,
} from "./jams/schema";
import { getJamResponseSchema, updateJamSchema } from "./jams/[id]/schema";
import { audioResponseSchema, audioListResponseSchema } from "./audio/schema";
import { addLoopSchema, addLoopResponseSchema } from "./jams/[id]/loops/schema";
import {
  createInviteSchema,
  inviteResponseSchema,
  inviteListResponseSchema,
} from "./jams/[id]/invites/schema";
import {
  acceptInviteSchema,
  acceptInviteResponseSchema,
} from "./invites/accept/schema";

// Single source of truth: the same zod schemas that validate requests and
// type the client also describe the API for external consumers.
function dataOf<S extends z.ZodType>(schema: S) {
  return z.object({ data: schema });
}

const errorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

function jsonBody<S extends z.ZodType>(schema: S) {
  return { content: { "application/json": { schema } } };
}

function responses(
  status: "200" | "201",
  description: string,
  schema: z.ZodType,
): ZodOpenApiResponsesObject {
  return {
    [status]: { description, ...jsonBody(dataOf(schema)) },
    "400": { description: "Invalid request", ...jsonBody(errorResponse) },
  };
}

const idParam = {
  requestParams: { path: z.object({ id: z.string() }) },
};

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Jam Vibes API",
    version: "0.1.0",
    description:
      "Collaborative music loops. The website is one client of this API; " +
      "native apps authenticate with Authorization: Bearer <accessToken> " +
      "from the register/sign-in responses.",
  },
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register a new account, optionally choosing a username",
        requestBody: jsonBody(registerSchema),
        responses: responses("201", "Registered", sessionResponseSchema),
      },
    },
    "/api/auth/sign-in": {
      post: {
        summary: "Sign in with email and password",
        requestBody: jsonBody(credentialsSchema),
        responses: responses("200", "Signed in", sessionResponseSchema),
      },
    },
    "/api/auth/sign-out": {
      post: {
        summary: "Sign out",
        responses: responses("200", "Signed out", okResponseSchema),
      },
    },
    "/api/auth/forgot-password": {
      post: {
        summary: "Send a password reset email",
        requestBody: jsonBody(forgotPasswordSchema),
        responses: responses("200", "Reset email sent", okResponseSchema),
      },
    },
    "/api/auth/reset-password": {
      post: {
        summary: "Reset password with the emailed token",
        requestBody: jsonBody(resetPasswordSchema),
        responses: responses("200", "Password reset", sessionResponseSchema),
      },
    },
    "/api/my/profile": {
      get: {
        summary: "Get my profile",
        responses: responses("200", "Profile", profileResponseSchema),
      },
      put: {
        summary: "Update my username",
        requestBody: jsonBody(updateProfileSchema),
        responses: responses("200", "Updated profile", profileResponseSchema),
      },
    },
    "/api/my/profile/avatar": {
      post: {
        summary: "Upload my profile photo (multipart field: file)",
        responses: responses("200", "Updated profile", profileResponseSchema),
      },
    },
    "/api/jams": {
      get: {
        summary: "List jams I own or joined",
        responses: responses("200", "My jams", jamListResponseSchema),
      },
      post: {
        summary: "Create a jam",
        requestBody: jsonBody(createJamSchema),
        responses: responses("201", "Created jam", jamSummarySchema),
      },
    },
    "/api/jams/public": {
      get: {
        summary: "List public jams (no auth required)",
        responses: responses("200", "Public jams", jamListResponseSchema),
      },
    },
    "/api/jams/{id}": {
      get: {
        summary: "Get a jam with its loops and playable audio URLs",
        ...idParam,
        responses: responses("200", "Jam detail", getJamResponseSchema),
      },
      patch: {
        summary: "Update a jam (owner only)",
        ...idParam,
        requestBody: jsonBody(updateJamSchema),
        responses: responses("200", "Updated jam", getJamResponseSchema),
      },
    },
    "/api/jams/{id}/photo": {
      post: {
        summary: "Upload a jam photo (owner only, multipart field: file)",
        ...idParam,
        responses: responses("200", "Updated jam", getJamResponseSchema),
      },
    },
    "/api/jams/{id}/loops": {
      post: {
        summary: "Commit a loop of uploaded audio (members only)",
        ...idParam,
        requestBody: jsonBody(addLoopSchema),
        responses: responses("201", "Committed loop", addLoopResponseSchema),
      },
    },
    "/api/jams/{id}/invites": {
      get: {
        summary: "List invites for a jam (owner only)",
        ...idParam,
        responses: responses("200", "Invites", inviteListResponseSchema),
      },
      post: {
        summary: "Invite someone to a jam (owner only)",
        ...idParam,
        requestBody: jsonBody(createInviteSchema),
        responses: responses("201", "Created invite", inviteResponseSchema),
      },
    },
    "/api/invites/accept": {
      post: {
        summary: "Accept an invite token and join the jam",
        requestBody: jsonBody(acceptInviteSchema),
        responses: responses("200", "Joined jam", acceptInviteResponseSchema),
      },
    },
    "/api/audio": {
      get: {
        summary: "List my uploaded audio for a jam",
        requestParams: { query: z.object({ jamId: z.string() }) },
        responses: responses("200", "My audio", audioListResponseSchema),
      },
      post: {
        summary: "Upload audio to a jam (multipart fields: file, jamId)",
        responses: responses("201", "Uploaded audio", audioResponseSchema),
      },
    },
  },
});
