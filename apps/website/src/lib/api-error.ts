import { FetchError } from "ofetch";
import { ZodError } from "zod";
import { createLogger, logErrorOnce } from "./logger";

const errorLogger = createLogger("api-error");

type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "server"
  | "validation"
  | "unknown";

export interface NormalizedApiError {
  kind: ApiErrorKind;
  status?: number;
  message: string;
  cause?: unknown;
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof FetchError) {
    return error.statusCode ?? error.status ?? error.response?.status;
  }
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

export function normalizeApiError(
  error: unknown,
  options?: { forbiddenMessage?: string },
): NormalizedApiError {
  if (error instanceof ZodError) {
    logErrorOnce(errorLogger, error, "响应数据校验失败");
    return {
      kind: "validation",
      message: "服务器返回的数据格式异常",
      cause: error,
    };
  }

  const status = statusOf(error);

  if (status === 401) {
    return { kind: "unauthorized", status, message: "需要登录后才能查看", cause: error };
  }
  if (status === 403) {
    return {
      kind: "forbidden",
      status,
      message: options?.forbiddenMessage ?? "没有权限查看该内容",
      cause: error,
    };
  }
  if (status === 404) {
    return { kind: "not-found", status, message: "内容不存在或已删除", cause: error };
  }
  if (status != null && status >= 500) {
    return { kind: "server", status, message: "服务器暂时不可用，请稍后重试", cause: error };
  }

  if (error instanceof Error && error.message) {
    return { kind: "unknown", status, message: error.message, cause: error };
  }

  return { kind: "unknown", status, message: "加载失败，请稍后重试", cause: error };
}
