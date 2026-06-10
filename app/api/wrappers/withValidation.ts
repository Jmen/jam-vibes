import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Handler, Context } from "../apiHandlerBuilder";

export interface ValidationSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
}

function validationError(
  source: "body" | "query",
  error: z.ZodError,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "validation_error",
        message: `Invalid request ${source}`,
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
    { status: 400 },
  );
}

export function withValidation(schemas: ValidationSchemas) {
  return (handler: Handler): Handler => {
    return async (req: NextRequest, context: Context) => {
      if (schemas.body) {
        let json: unknown;

        try {
          json = await req.json();
        } catch {
          return NextResponse.json(
            {
              error: {
                code: "invalid_json",
                message: "Request body is not valid JSON",
              },
            },
            { status: 400 },
          );
        }

        const parsed = schemas.body.safeParse(json);

        if (!parsed.success) {
          return validationError("body", parsed.error);
        }

        context.validated = { ...context.validated, body: parsed.data };
      }

      if (schemas.query) {
        const query = Object.fromEntries(req.nextUrl.searchParams);

        const parsed = schemas.query.safeParse(query);

        if (!parsed.success) {
          return validationError("query", parsed.error);
        }

        context.validated = { ...context.validated, query: parsed.data };
      }

      return handler(req, context);
    };
  };
}

// The schema argument exists purely to infer the return type; validation
// already happened in the wrapper.
export function getTypedBody<S extends z.ZodType>(
  context: Context,
  schema: S,
): z.infer<S> {
  void schema;
  return context.validated?.body as z.infer<S>;
}

export function getTypedQuery<S extends z.ZodType>(
  context: Context,
  schema: S,
): z.infer<S> {
  void schema;
  return context.validated?.query as z.infer<S>;
}
