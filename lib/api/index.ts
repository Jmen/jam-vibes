import { request, requestMultipart, RequestOptions } from "./client";
import {
  credentialsSchema,
  registerSchema,
  sessionResponseSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  okResponseSchema,
  Credentials,
  Register,
  ForgotPassword,
  ResetPassword,
} from "@/app/api/auth/schema";
import {
  profileResponseSchema,
  updateProfileSchema,
  UpdateProfile,
} from "@/app/api/my/profile/schema";
import {
  createJamSchema,
  jamSummarySchema,
  jamListResponseSchema,
  CreateJam,
} from "@/app/api/jams/schema";
import {
  getJamResponseSchema,
  updateJamSchema,
  UpdateJam,
} from "@/app/api/jams/[id]/schema";
import {
  audioResponseSchema,
  audioListResponseSchema,
} from "@/app/api/audio/schema";
import {
  addLoopSchema,
  addLoopResponseSchema,
  AddLoop,
} from "@/app/api/jams/[id]/loops/schema";
import {
  createInviteSchema,
  inviteResponseSchema,
  inviteListResponseSchema,
  CreateInvite,
} from "@/app/api/jams/[id]/invites/schema";
import {
  acceptInviteSchema,
  acceptInviteResponseSchema,
  AcceptInvite,
} from "@/app/api/invites/accept/schema";

export { ApiError } from "./client";
export type { RequestOptions } from "./client";

// One typed surface for everything that talks to the API: the website,
// component tests (mocked), and the acceptance test driver (real HTTP).
// Methods parse responses with the same zod schemas the server validates
// against, so a contract drift fails loudly on both sides.
export class ApiClient {
  constructor(private readonly options: RequestOptions = {}) {}

  auth = {
    register: (registration: Register) =>
      request(
        sessionResponseSchema,
        "/api/auth/register",
        { method: "POST", body: registerSchema.parse(registration) },
        this.options,
      ),

    signIn: (credentials: Credentials) =>
      request(
        sessionResponseSchema,
        "/api/auth/sign-in",
        { method: "POST", body: credentialsSchema.parse(credentials) },
        this.options,
      ),

    signOut: () =>
      request(
        okResponseSchema,
        "/api/auth/sign-out",
        { method: "POST" },
        this.options,
      ),

    forgotPassword: (input: ForgotPassword) =>
      request(
        okResponseSchema,
        "/api/auth/forgot-password",
        { method: "POST", body: forgotPasswordSchema.parse(input) },
        this.options,
      ),

    resetPassword: (input: ResetPassword) =>
      request(
        sessionResponseSchema,
        "/api/auth/reset-password",
        { method: "POST", body: resetPasswordSchema.parse(input) },
        this.options,
      ),
  };

  my = {
    profile: {
      get: () =>
        request(profileResponseSchema, "/api/my/profile", {}, this.options),

      update: (input: UpdateProfile) =>
        request(
          profileResponseSchema,
          "/api/my/profile",
          { method: "PUT", body: updateProfileSchema.parse(input) },
          this.options,
        ),

      uploadAvatar: (file: Blob, fileName = "avatar.png") => {
        const formData = new FormData();
        formData.append("file", file, fileName);

        return requestMultipart(
          profileResponseSchema,
          "/api/my/profile/avatar",
          formData,
          this.options,
        );
      },
    },
  };

  jams = {
    create: (input: CreateJam) =>
      request(
        jamSummarySchema,
        "/api/jams",
        { method: "POST", body: createJamSchema.parse(input) },
        this.options,
      ),

    listMine: () =>
      request(jamListResponseSchema, "/api/jams", {}, this.options),

    listPublic: () =>
      request(jamListResponseSchema, "/api/jams/public", {}, this.options),

    get: (idOrHumanId: string) =>
      request(
        getJamResponseSchema,
        `/api/jams/${idOrHumanId}`,
        {},
        this.options,
      ),

    update: (idOrHumanId: string, input: UpdateJam) =>
      request(
        getJamResponseSchema,
        `/api/jams/${idOrHumanId}`,
        { method: "PATCH", body: updateJamSchema.parse(input) },
        this.options,
      ),

    uploadPhoto: (idOrHumanId: string, file: Blob, fileName = "photo.png") => {
      const formData = new FormData();
      formData.append("file", file, fileName);

      return requestMultipart(
        getJamResponseSchema,
        `/api/jams/${idOrHumanId}/photo`,
        formData,
        this.options,
      );
    },

    addLoop: (idOrHumanId: string, input: AddLoop) =>
      request(
        addLoopResponseSchema,
        `/api/jams/${idOrHumanId}/loops`,
        { method: "POST", body: addLoopSchema.parse(input) },
        this.options,
      ),

    createInvite: (idOrHumanId: string, input: CreateInvite) =>
      request(
        inviteResponseSchema,
        `/api/jams/${idOrHumanId}/invites`,
        { method: "POST", body: createInviteSchema.parse(input) },
        this.options,
      ),

    listInvites: (idOrHumanId: string) =>
      request(
        inviteListResponseSchema,
        `/api/jams/${idOrHumanId}/invites`,
        {},
        this.options,
      ),
  };

  invites = {
    accept: (input: AcceptInvite) =>
      request(
        acceptInviteResponseSchema,
        "/api/invites/accept",
        { method: "POST", body: acceptInviteSchema.parse(input) },
        this.options,
      ),
  };

  audio = {
    upload: (jamId: string, file: Blob, fileName = "track.wav") => {
      const formData = new FormData();
      formData.append("file", file, fileName);
      formData.append("jamId", jamId);

      return requestMultipart(
        audioResponseSchema,
        "/api/audio",
        formData,
        this.options,
      );
    },

    listMine: (jamId: string) =>
      request(
        audioListResponseSchema,
        `/api/audio?jamId=${encodeURIComponent(jamId)}`,
        {},
        this.options,
      ),
  };
}

// The website's client: relative URLs, cookie auth
export const apiClient = new ApiClient();
