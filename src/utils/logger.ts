/**
 * Logger utility for structured logging
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    // In production MCP servers, only log errors to avoid interfering with protocol communication
    // In development, allow all logs if DEBUG_MCP is set
    const isDebugMode = process.env.DEBUG_MCP === 'true';
    
    if (level === LogLevel.ERROR || isDebugMode) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(data && { data })
      };
      console.error(JSON.stringify(entry));
    }
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
}

export const logger = new Logger(
  process.env.LOG_LEVEL as LogLevel || LogLevel.INFO
);