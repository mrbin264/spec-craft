/**
 * Monitoring and logging utilities for SpecCraft
 */

export interface LogContext {
  userId?: string;
  specId?: string;
  action?: string;
  [key: string]: any;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  context?: LogContext;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  code?: string;
  timestamp: Date;
  context?: LogContext;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private formatMessage(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      context: this.context,
      ...data,
    };

    return JSON.stringify(logData);
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, error?: Error | any, data?: any) {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    console.error(this.formatMessage('ERROR', message, errorData));
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }
}

export const logger = new Logger();

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private startTime: number;
  private name: string;
  private context?: LogContext;

  constructor(name: string, context?: LogContext) {
    this.name = name;
    this.context = context;
    this.startTime = Date.now();
  }

  end() {
    const duration = Date.now() - this.startTime;
    const metric: PerformanceMetric = {
      name: this.name,
      duration,
      timestamp: new Date(),
      context: this.context,
    };

    logger.info(`Performance: ${this.name}`, {
      duration: `${duration}ms`,
      ...this.context,
    });

    return metric;
  }
}

/**
 * Track API request performance
 */
export function trackApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  logger.info('API Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });

  // Track to Application Insights in production
  if (process.env.NODE_ENV === 'production') {
    import('./app-insights').then(({ trackApiRequestToInsights }) => {
      trackApiRequestToInsights(method, path, statusCode, duration, userId);
    });
  }
}

/**
 * Track AI usage
 */
export function trackAiUsage(
  action: string,
  model: string,
  tokensUsed: number,
  cost: number,
  userId: string,
  specId?: string
) {
  logger.info('AI Usage', {
    action,
    model,
    tokensUsed,
    cost: `$${cost.toFixed(4)}`,
    userId,
    specId,
  });

  // Track to Application Insights in production
  if (process.env.NODE_ENV === 'production') {
    import('./app-insights').then(({ trackAiUsageToInsights }) => {
      trackAiUsageToInsights(action, model, tokensUsed, cost, userId, specId);
    });
  }
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  collection: string,
  operation: string,
  duration: number,
  recordCount?: number
) {
  logger.info('Database Query', {
    collection,
    operation,
    duration: `${duration}ms`,
    recordCount,
  });

  // Warn if query is slow
  if (duration > 1000) {
    logger.warn('Slow database query detected', {
      collection,
      operation,
      duration: `${duration}ms`,
    });
  }

  // Track to Application Insights in production
  if (process.env.NODE_ENV === 'production') {
    import('./app-insights').then(({ trackDatabaseQueryToInsights }) => {
      trackDatabaseQueryToInsights(collection, operation, duration, recordCount);
    });
  }
}

/**
 * Track errors
 */
export function trackError(
  message: string,
  error: Error | any,
  context?: LogContext
) {
  const errorLog: ErrorLog = {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    code: error.code,
    timestamp: new Date(),
    context,
  };

  logger.error(message, error, context);

  // Track to Application Insights in production
  if (process.env.NODE_ENV === 'production') {
    import('./app-insights').then(({ trackErrorToInsights }) => {
      trackErrorToInsights(message, error, context);
    });
  }
}

/**
 * Middleware to track API request performance
 */
export function createApiMonitoringMiddleware() {
  return async (
    handler: (req: any, res: any) => Promise<any>,
    req: any,
    res: any
  ) => {
    const startTime = Date.now();
    const path = req.url || req.nextUrl?.pathname || 'unknown';
    const method = req.method || 'unknown';

    try {
      const result = await handler(req, res);
      const duration = Date.now() - startTime;
      const statusCode = result?.status || 200;

      trackApiRequest(method, path, statusCode, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiRequest(method, path, 500, duration);
      trackError('API request failed', error, { method, path });
      throw error;
    }
  };
}
