import { ofetch, type FetchOptions, type $Fetch } from "ofetch";
import { createLogger } from "./logger";
import { ensureValidAccessToken, clearAuth } from "./auth";

const BASE_URL = "https://api-v2.cc98.org";
const httpLogger = createLogger("http");

function describeRequest(request: RequestInfo | URL): string {
  if (typeof request === "string") return request;
  if (request instanceof URL) return request.toString();
  return request.url;
}

const apiFetch: $Fetch = ofetch.create({
  baseURL: BASE_URL,
  retry: 1,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  async onRequest({ options }) {
    const token = await ensureValidAccessToken();
    if (token) {
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token}`);
      options.headers = headers;
    }
  },
  onResponseError({ request, response }) {
    httpLogger.warn({ request: describeRequest(request), status: response.status }, "API 请求失败");
    if (response.status === 401) {
      clearAuth();
    }
  },
});

export function typedGet<T>(url: string, opts?: FetchOptions<"json">): Promise<T> {
  return apiFetch<T>(url, opts);
}

export function typedPost<T>(
  url: string,
  body?: Record<string, unknown>,
  opts?: FetchOptions<"json">,
): Promise<T> {
  return apiFetch<T>(url, { method: "POST", body, ...opts });
}

export function typedPut<T>(
  url: string,
  body?: Record<string, unknown>,
  opts?: FetchOptions<"json">,
): Promise<T> {
  return apiFetch<T>(url, { method: "PUT", body, ...opts });
}

export function typedDelete<T>(url: string, opts?: FetchOptions<"json">): Promise<T> {
  return apiFetch<T>(url, { method: "DELETE", ...opts });
}
