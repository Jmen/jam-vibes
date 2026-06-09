import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { withAuth } from "./wrappers/withAuth";
import { withErrorHandling } from "./wrappers/withErrorHandling";
import { withValidation, ValidationSchemas } from "./wrappers/withValidation";

export interface AuthInfo {
  userId: string;
  email?: string;
}

export type RouteParams = Record<string, string | string[] | undefined>;

export interface Context {
  params: RouteParams;
  auth?: AuthInfo;
  supabase?: SupabaseClient;
  validated?: {
    body?: unknown;
    query?: unknown;
  };
}

export type Handler = (
  req: NextRequest,
  context: Context,
) => Promise<NextResponse>;

// Routes built with .auth() always have these set; the accessors keep
// handler code honest without optional-chaining everywhere.
export function requireAuth(context: Context): AuthInfo {
  if (!context.auth) {
    throw new Error("Handler requires auth but was built without .auth()");
  }
  return context.auth;
}

export function requireSupabase(context: Context): SupabaseClient {
  if (!context.supabase) {
    throw new Error("Handler requires auth but was built without .auth()");
  }
  return context.supabase;
}

interface NextRouteContext {
  params: Promise<RouteParams>;
}

type RouteHandler = (
  req: NextRequest,
  nextContext: NextRouteContext,
) => Promise<NextResponse>;

export class ApiHandlerBuilder {
  private _withAuth = false;
  private _validationSchemas: ValidationSchemas = {};

  auth(): ApiHandlerBuilder {
    this._withAuth = true;
    return this;
  }

  validateBody(schema: z.ZodType): ApiHandlerBuilder {
    this._validationSchemas.body = schema;
    return this;
  }

  validateQuery(schema: z.ZodType): ApiHandlerBuilder {
    this._validationSchemas.query = schema;
    return this;
  }

  build(handler: Handler): RouteHandler {
    let wrappedHandler = handler;

    if (this._validationSchemas.body || this._validationSchemas.query) {
      wrappedHandler = withValidation(this._validationSchemas)(wrappedHandler);
    }

    if (this._withAuth) {
      wrappedHandler = withAuth(wrappedHandler);
    }

    wrappedHandler = withErrorHandling(wrappedHandler);

    return async (req: NextRequest, nextContext: NextRouteContext) => {
      const context: Context = {
        params: nextContext?.params ? await nextContext.params : {},
      };

      return wrappedHandler(req, context);
    };
  }
}
