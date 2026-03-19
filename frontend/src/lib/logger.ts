/**
 * Centralized logging utility for frontend.
 * Provides environment-aware console wrappers with timestamps in development.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  showTimestamps: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor() {
    const isProduction = process.env.NODE_ENV === "production";

    this.config = {
      enabled: true,
      showTimestamps: !isProduction,
      minLevel: isProduction ? "warn" : "debug",
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, ...args: unknown[]): unknown[] {
    if (!this.config.showTimestamps) {
      return args;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, ...args];
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.log(...this.formatMessage("debug", ...args));
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage("info", ...args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("warn", ...args));
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(...this.formatMessage("error", ...args));
    }
  }

  /**
   * Log a group of related messages.
   */
  group(label: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.group(...this.formatMessage("info", label));
      args.forEach((arg) => console.log(arg));
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// For backward compatibility, also export as default
export default logger;
