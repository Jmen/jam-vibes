import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  // Absolute base for node clients (acceptance tests); browser uses relative paths
  baseUrl?: string;
  // Bearer auth for native/API clients; browser relies on session cookies
  accessToken?: string;
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

export async function request<S extends z.ZodType>(
  responseSchema: S,
  path: string,
  init: { method?: string; body?: unknown } = {},
  options: RequestOptions = {},
): Promise<z.infer<S>> {
  const headers: Record<string, string> = {};

  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${options.baseUrl ?? ""}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  return parseResponse(responseSchema, response);
}

export async function requestMultipart<S extends z.ZodType>(
  responseSchema: S,
  path: string,
  formData: FormData,
  options: RequestOptions = {},
): Promise<z.infer<S>> {
  const headers: Record<string, string> = {};

  if (options.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${options.baseUrl ?? ""}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return parseResponse(responseSchema, response);
}

async function parseResponse<S extends z.ZodType>(
  responseSchema: S,
  response: Response,
): Promise<z.infer<S>> {
  let json: unknown;

  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "invalid_response",
      "Response was not valid JSON",
    );
  }

  if (!response.ok) {
    const envelope = json as ErrorEnvelope;
    throw new ApiError(
      response.status,
      envelope.error?.code ?? "unknown_error",
      envelope.error?.message ?? "Request failed",
    );
  }

  const data = (json as { data: unknown }).data;

  return responseSchema.parse(data);
}
