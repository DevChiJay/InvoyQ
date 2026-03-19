/**
 * Centralized logging utility for mobile (React Native/Expo).
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
    // Use __DEV__ flag for React Native development mode detection
    const isDevelopment = typeof __DEV__ !== "undefined" ? __DEV__ : false;

    this.config = {
      enabled: true,
      showTimestamps: isDevelopment,
      minLevel: isDevelopment ? "debug" : "warn",
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
   * Note: React Native has limited support for console.group
   */
  group(label: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.log(...this.formatMessage("info", `--- ${label} ---`));
      args.forEach((arg) => console.log(arg));
      console.log(...this.formatMessage("info", `--- End ${label} ---`));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// For backward compatibility, also export as default
export default logger;
