import pino from "pino";
import type { Logger, LoggerOptions } from "pino";

const loggerOptions: LoggerOptions = {
  level: import.meta.env.PROD ? "warn" : "debug",
  browser: {
    asObject: false,
  },
};

const logger = pino(loggerOptions);

export function createLogger(scope: string): Logger {
  return logger.child({ scope });
}
