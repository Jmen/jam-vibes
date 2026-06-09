export enum ErrorCode {
  CLIENT_ERROR = "client_error",
  UNAUTHORIZED = "unauthorized",
  FORBIDDEN = "forbidden",
  NOT_FOUND = "not_found",
  SERVER_ERROR = "server_error",
}

export interface ResultError {
  code: string;
  message: string;
  type: ErrorCode;
}

export type Result<T> =
  | { data: T; error?: never }
  | { data?: never; error: ResultError };

export function ok<T>(data: T): Result<T> {
  return { data };
}

export function err<T>(
  code: string,
  message: string,
  type: ErrorCode,
): Result<T> {
  return { error: { code, message, type } };
}
