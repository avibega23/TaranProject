import type { FieldError, Pagination } from "@/types";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: FieldError[];

  constructor(status: number, code: string, message: string, details?: FieldError[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Envelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  details?: FieldError[];
  pagination?: Pagination;
};

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "/backend";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<{ data: T; pagination?: Pagination }> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "The server could not be reached. Check that the API is running.");
  }
  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !body?.success) {
    throw new ApiError(
      response.status,
      body?.code || "REQUEST_FAILED",
      body?.message || "The request could not be completed.",
      body?.details,
    );
  }
  return { data: body.data as T, pagination: body.pagination };
}

export function serverApiOrigin(): string {
  return process.env.API_PROXY_TARGET || "http://localhost:4000";
}
