import { NextResponse } from "next/server";
import { ErrorCode, Result } from "./result";
import { logger } from "@/lib/logger";

const statusByErrorType: Record<ErrorCode, number> = {
  [ErrorCode.CLIENT_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.SERVER_ERROR]: 500,
};

export function createResponse<T>(
  result: Result<T>,
  action: string,
  options: { successStatus?: number } = {},
): NextResponse {
  if (result.error) {
    const status = statusByErrorType[result.error.type] ?? 500;

    logger.warn({ action, error: result.error, status }, `failed to ${action}`);

    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status },
    );
  }

  return NextResponse.json(
    { data: result.data },
    { status: options.successStatus ?? 200 },
  );
}
