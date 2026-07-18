import pino from "pino";
import type { Logger, LoggerOptions } from "pino";
import { ZodError, prettifyError } from "zod";

type LogRecord = Record<string, unknown>;
type BrowserLogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

const MAX_DEPTH = 8;
const MAX_KEYS = 100;
const MAX_ARRAY_LENGTH = 100;
const MAX_STRING_LENGTH = 8000;
const MAX_TEXT_LENGTH = 30_000;
const REDACTED = "[已脱敏]";
const loggedErrors = new WeakSet<object>();

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.replaceAll(/[-_]/g, "").toLowerCase();
  return [
    "authorization",
    "cookie",
    "setcookie",
    "password",
    "passwd",
    "secret",
    "token",
    "accesstoken",
    "refreshtoken",
    "clientsecret",
    "apikey",
  ].includes(normalized);
}

function truncate(value: string, limit = MAX_STRING_LENGTH): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n...[已截断 ${value.length - limit} 个字符]`;
}

function errorStatus(error: Error): number | undefined {
  for (const key of ["statusCode", "status"] as const) {
    const value = (error as Error & Record<string, unknown>)[key];
    if (typeof value === "number") return value;
  }
  return undefined;
}

function errorSource(stack: string | undefined): string | undefined {
  return stack
    ?.split("\n")
    .map((line) => line.trim().replace(/^at\s+/, ""))
    .find(
      (line) =>
        (line.includes("/src/") || line.includes("/apps/website/src/")) &&
        !line.includes("/src/lib/logger.ts"),
    );
}

function sanitizeLogValue(value: unknown, seen: WeakSet<object>, depth = 0, key?: string): unknown {
  if (key && isSensitiveKey(key)) return REDACTED;
  if (value == null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return truncate(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "symbol" || typeof value === "function") return String(value);
  if (!isObject(value)) return "[无法序列化的值]";
  if (seen.has(value)) return "[循环引用]";
  if (depth >= MAX_DEPTH) return `[已省略：超过 ${MAX_DEPTH} 层]`;

  seen.add(value);

  if (value instanceof Date) return value.toISOString();
  if (value instanceof URL) return value.toString();
  if (value instanceof Error) {
    const result: LogRecord = {
      name: value.name,
      message: value instanceof ZodError ? "输入未通过 Zod 校验" : truncate(value.message),
    };
    const status = errorStatus(value);
    if (status != null) result.status = status;
    if (value.stack) result.stack = truncate(value.stack);
    const source = errorSource(value.stack);
    if (source) result.source = source;
    if (value.cause != null) {
      result.cause = sanitizeLogValue(value.cause, seen, depth + 1, "cause");
    }
    if (value instanceof ZodError) {
      result.details = prettifyError(value);
      result.issues = sanitizeLogValue(value.issues, seen, depth + 1, "issues");
    }
    return result;
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeLogValue(item, seen, depth + 1));
    if (value.length > MAX_ARRAY_LENGTH) {
      items.push(`[还有 ${value.length - MAX_ARRAY_LENGTH} 项未显示]`);
    }
    return items;
  }

  if (value instanceof Map) {
    return sanitizeLogValue(Object.fromEntries(value), seen, depth + 1);
  }
  if (value instanceof Set) {
    return sanitizeLogValue([...value], seen, depth + 1);
  }

  const result: LogRecord = {};
  const keys = Object.keys(value).slice(0, MAX_KEYS);
  for (const objectKey of keys) {
    try {
      result[objectKey] = sanitizeLogValue(
        (value as Record<string, unknown>)[objectKey],
        seen,
        depth + 1,
        objectKey,
      );
    } catch (error) {
      result[objectKey] = `[读取失败：${error instanceof Error ? error.message : String(error)}]`;
    }
  }
  if (Object.keys(value).length > MAX_KEYS) {
    result["[其余字段]"] = `还有 ${Object.keys(value).length - MAX_KEYS} 个字段未显示`;
  }
  return result;
}

function withoutDisplayFields(record: LogRecord): LogRecord {
  const context = { ...record };
  for (const key of ["time", "level", "scope", "msg", "caller"]) delete context[key];

  if (isObject(context.err) && !Array.isArray(context.err)) {
    const error = { ...(context.err as LogRecord) };
    delete error.details;
    context.err = error;
  }
  return context;
}

export function formatBrowserLog(record: LogRecord): { text: string; data: LogRecord } {
  const data = sanitizeLogValue(record, new WeakSet()) as LogRecord;
  const time = typeof data.time === "number" ? new Date(data.time).toISOString() : "未知时间";
  const level = typeof data.level === "string" ? data.level.toUpperCase() : String(data.level);
  const scope = typeof data.scope === "string" ? ` [${data.scope}]` : "";
  const message = typeof data.msg === "string" ? data.msg : "无日志消息";
  const lines = [`${time} ${level}${scope} ${message}`];

  const errorDetails =
    isObject(data.err) &&
    !Array.isArray(data.err) &&
    typeof (data.err as LogRecord).details === "string"
      ? ((data.err as LogRecord).details as string)
      : undefined;
  const source =
    isObject(data.err) &&
    !Array.isArray(data.err) &&
    typeof (data.err as LogRecord).source === "string"
      ? ((data.err as LogRecord).source as string)
      : undefined;
  if (errorDetails) lines.push(errorDetails);
  if (source) lines.push(`错误位置：${source}`);
  if (typeof data.caller === "string" && !data.caller.includes("/src/lib/logger.ts")) {
    lines.push(`日志调用点：${data.caller}`);
  }

  const context = withoutDisplayFields(data);
  if (Object.keys(context).length > 0) {
    lines.push(`上下文：\n${JSON.stringify(context, null, 2)}`);
  }

  return { text: truncate(lines.join("\n"), MAX_TEXT_LENGTH), data };
}

function writeBrowserLog(record: object, level: BrowserLogLevel): void {
  const { text, data } = formatBrowserLog(record as LogRecord);
  if (level === "fatal" || level === "error") {
    console.error(text, data);
    return;
  }
  if (level === "warn") {
    console.warn(text, data);
    return;
  }
  if (level === "info") {
    console.info(text, data);
    return;
  }
  console.debug(text, data);
}

const loggerOptions: LoggerOptions = {
  level: import.meta.env.PROD ? "warn" : "debug",
  browser: {
    reportCaller: import.meta.env.DEV,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    write: {
      fatal: (record) => writeBrowserLog(record, "fatal"),
      error: (record) => writeBrowserLog(record, "error"),
      warn: (record) => writeBrowserLog(record, "warn"),
      info: (record) => writeBrowserLog(record, "info"),
      debug: (record) => writeBrowserLog(record, "debug"),
      trace: (record) => writeBrowserLog(record, "trace"),
    },
  },
};

const logger = pino(loggerOptions);

export function createLogger(scope: string): Logger {
  return logger.child({ scope });
}

export function logErrorOnce(
  scopedLogger: Logger,
  error: unknown,
  message: string,
  context: LogRecord = {},
): void {
  if (isObject(error)) {
    if (loggedErrors.has(error)) return;
    loggedErrors.add(error);
  }
  scopedLogger.error({ ...context, err: error }, message);
}
