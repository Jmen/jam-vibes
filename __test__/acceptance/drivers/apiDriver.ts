import { ApiClient } from "@/lib/api";
import { Credentials, Register, Session } from "@/app/api/auth/schema";
import { config } from "../config";

// Protocol driver: converts DSL interactions into real HTTP against the
// system under test, using the same typed ApiClient the website uses.
export interface ApiContext {
  email: string;
  password: string;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
}

export class ApiDriver {
  constructor(private readonly baseUrl: string = config.baseUrl) {}

  client(context?: ApiContext): ApiClient {
    return new ApiClient({
      baseUrl: this.baseUrl,
      accessToken: context?.accessToken,
    });
  }

  private rememberSession(context: ApiContext, session: Session) {
    context.userId = session.userId;
    context.accessToken = session.accessToken;
    context.refreshToken = session.refreshToken;
  }

  auth = {
    register: async (
      context: ApiContext,
      username?: string,
    ): Promise<Session> => {
      const registration: Register = {
        email: context.email,
        password: context.password,
        ...(username === undefined ? {} : { username }),
      };

      const session = await this.client().auth.register(registration);

      this.rememberSession(context, session);

      return session;
    },

    signIn: async (context: ApiContext): Promise<Session> => {
      const credentials: Credentials = {
        email: context.email,
        password: context.password,
      };

      const session = await this.client().auth.signIn(credentials);

      this.rememberSession(context, session);

      return session;
    },

    signOut: async (context: ApiContext): Promise<void> => {
      await this.client(context).auth.signOut();

      context.accessToken = undefined;
      context.refreshToken = undefined;
    },

    forgotPassword: async (context: ApiContext): Promise<void> => {
      await this.client().auth.forgotPassword({ email: context.email });
    },

    resetPassword: async (
      context: ApiContext,
      tokenHash: string,
      newPassword: string,
    ): Promise<Session> => {
      const session = await this.client().auth.resetPassword({
        tokenHash,
        password: newPassword,
      });

      context.password = newPassword;
      this.rememberSession(context, session);

      return session;
    },
  };
}
