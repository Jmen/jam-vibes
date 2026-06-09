import { NextRequest, NextResponse } from "next/server";
import { Handler, Context } from "../apiHandlerBuilder";
import { logger } from "@/lib/logger";

export function withErrorHandling(handler: Handler): Handler {
  return async (req: NextRequest, context: Context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      logger.error(
        { err: error, method: req.method, url: req.nextUrl.pathname },
        "unhandled error in api handler",
      );

      return NextResponse.json(
        { error: { code: "internal_error", message: "Internal Server Error" } },
        { status: 500 },
      );
    }
  };
}
