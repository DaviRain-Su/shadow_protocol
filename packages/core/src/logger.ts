/**
 * @px402/core - Structured Logger
 *
 * Provides consistent logging across all Px402 packages.
 */

// ============ Types ============

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Component name */
  component: string;
  /** Log message */
  message: string;
  /** Additional context data */
  data?: Record<string, unknown>;
  /** Error if applicable */
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level?: LogLevel;
  /** Component name */
  component: string;
  /** Enable JSON output format */
  json?: boolean;
  /** Enable colored output (for terminal) */
  colors?: boolean;
  /** Custom output function */
  output?: (entry: LogEntry) => void;
}

// ============ Constants ============

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

// ============ Logger Class ============

/**
 * Structured logger
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private levelValue: number;

  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level || 'info',
      component: config.component,
      json: config.json ?? false,
      colors: config.colors ?? true,
      output: config.output || this.defaultOutput.bind(this),
    };
    this.levelValue = LOG_LEVELS[this.config.level];
  }

  /**
   * Log at debug level
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  /**
   * Log at info level
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  /**
   * Log at warn level
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, data);
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.output(entry);
  }

  /**
   * Create a child logger with additional context
   */
  child(component: string): Logger {
    return new Logger({
      ...this.config,
      component: `${this.config.component}:${component}`,
    });
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.levelValue = LOG_LEVELS[level];
  }

  // ============ Private Methods ============

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < this.levelValue) {
      return;
    }
    const entry = this.createEntry(level, message, data);
    this.output(entry);
  }

  private createEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      component: this.config.component,
      message,
      data,
    };
  }

  private output(entry: LogEntry): void {
    this.config.output(entry);
  }

  private defaultOutput(entry: LogEntry): void {
    if (this.config.json) {
      console.log(JSON.stringify(entry));
    } else {
      const prefix = this.config.colors
        ? `${COLORS[entry.level]}[${entry.level.toUpperCase()}]${RESET}`
        : `[${entry.level.toUpperCase()}]`;
      const component = `[${entry.component}]`;
      const time = entry.timestamp.split('T')[1].split('.')[0];

      let line = `${time} ${prefix} ${component} ${entry.message}`;

      if (entry.data && Object.keys(entry.data).length > 0) {
        line += ` ${JSON.stringify(entry.data)}`;
      }

      if (entry.error) {
        line += `\n  Error: ${entry.error.message}`;
        if (entry.error.stack) {
          line += `\n  ${entry.error.stack}`;
        }
      }

      console.log(line);
    }
  }
}

// ============ Factory Functions ============

/**
 * Create a logger instance
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

/**
 * Create a logger for a specific package
 */
export function createPackageLogger(
  packageName: string,
  config?: Partial<LoggerConfig>
): Logger {
  return new Logger({
    component: packageName,
    ...config,
  });
}

// ============ Global Logger ============

let globalLogger: Logger | undefined;

/**
 * Get or create global logger
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createLogger({
      component: 'px402',
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      json: process.env.LOG_FORMAT === 'json',
    });
  }
  return globalLogger;
}

/**
 * Set global logger
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}
