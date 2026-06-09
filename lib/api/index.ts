import { request, requestMultipart, RequestOptions } from "./client";
import {
  credentialsSchema,
  sessionResponseSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  okResponseSchema,
  Credentials,
  ForgotPassword,
  ResetPassword,
} from "@/app/api/auth/schema";
import {
  profileResponseSchema,
  updateProfileSchema,
  UpdateProfile,
} from "@/app/api/my/profile/schema";

export { ApiError } from "./client";
export type { RequestOptions } from "./client";

// One typed surface for everything that talks to the API: the website,
// component tests (mocked), and the acceptance test driver (real HTTP).
// Methods parse responses with the same zod schemas the server validates
// against, so a contract drift fails loudly on both sides.
export class ApiClient {
  constructor(private readonly options: RequestOptions = {}) {}

  auth = {
    register: (credentials: Credentials) =>
      request(
        sessionResponseSchema,
        "/api/auth/register",
        { method: "POST", body: credentialsSchema.parse(credentials) },
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
}

// The website's client: relative URLs, cookie auth
export const apiClient = new ApiClient();
