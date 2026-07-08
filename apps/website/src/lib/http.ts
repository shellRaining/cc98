import { ofetch, type FetchOptions, type $Fetch } from "ofetch";
import { createLogger } from "./logger";

const BASE_URL = "https://api-v2.cc98.org";

const TOKEN_STORAGE_KEY = "cc98:auth-token";
const httpLogger = createLogger("http");

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function loadToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
}

function saveToken(token: StoredToken | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export const authState = {
  load: loadToken,
  save: saveToken,
};

function describeRequest(request: RequestInfo | URL): string {
  if (typeof request === "string") {
    return request;
  }

  if (request instanceof URL) {
    return request.toString();
  }

  return request.url;
}

export const apiFetch = ofetch.create({
  baseURL: BASE_URL,
  retry: 1,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  onRequest({ options }) {
    const token = loadToken();
    if (token?.accessToken) {
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token.accessToken}`);
      options.headers = headers;
    }
  },
  onResponseError({ request, response }) {
    httpLogger.warn({ request: describeRequest(request), status: response.status }, "API 请求失败");
    if (response.status === 401) {
      saveToken(null);
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

export type ApiFetch = $Fetch;
