/**
 * Azure Application Insights integration
 * 
 * This module provides integration with Azure Application Insights for
 * production monitoring, telemetry, and analytics.
 */

import { LogContext } from './monitoring';

interface AppInsightsConfig {
  connectionString?: string;
  enabled: boolean;
}

/**
 * Application Insights client wrapper
 */
class AppInsightsClient {
  private config: AppInsightsConfig;
  private client: any = null;

  constructor() {
    this.config = {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
      enabled: process.env.NODE_ENV === 'production' && !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    };

    if (this.config.enabled && typeof window === 'undefined') {
      // Server-side only - lazy load Application Insights
      this.initializeServerSide();
    }
  }

  private async initializeServerSide() {
    try {
      // Dynamically import Application Insights (server-side only)
      // Note: applicationinsights package must be installed for production use
      // npm install applicationinsights
      const appInsights = await import('applicationinsights' as any);
      
      if (this.config.connectionString) {
        appInsights.setup(this.config.connectionString)
          .setAutoDependencyCorrelation(true)
          .setAutoCollectRequests(true)
          .setAutoCollectPerformance(true, true)
          .setAutoCollectExceptions(true)
          .setAutoCollectDependencies(true)
          .setAutoCollectConsole(true)
          .setUseDiskRetryCaching(true)
          .setSendLiveMetrics(false)
          .start();

        this.client = appInsights.defaultClient;
      }
    } catch (error) {
      // Application Insights is optional - fail silently if not installed
      if (process.env.NODE_ENV === 'development') {
        console.log('Application Insights not available (install with: npm install applicationinsights)');
      }
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, properties?: Record<string, any>) {
    if (!this.config.enabled || !this.client) return;

    try {
      this.client.trackEvent({
        name,
        properties,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track a metric
   */
  trackMetric(name: string, value: number, properties?: Record<string, any>) {
    if (!this.config.enabled || !this.client) return;

    try {
      this.client.trackMetric({
        name,
        value,
        properties,
      });
    } catch (error) {
      console.error('Failed to track metric:', error);
    }
  }

  /**
   * Track an exception
   */
  trackException(error: Error, properties?: Record<string, any>) {
    if (!this.config.enabled || !this.client) return;

    try {
      this.client.trackException({
        exception: error,
        properties,
      });
    } catch (err) {
      console.error('Failed to track exception:', err);
    }
  }

  /**
   * Track a dependency (external service call)
   */
  trackDependency(
    name: string,
    type: string,
    duration: number,
    success: boolean,
    properties?: Record<string, any>
  ) {
    if (!this.config.enabled || !this.client) return;

    try {
      this.client.trackDependency({
        name,
        dependencyTypeName: type,
        duration,
        success,
        properties,
      });
    } catch (error) {
      console.error('Failed to track dependency:', error);
    }
  }

  /**
   * Track a request
   */
  trackRequest(
    name: string,
    url: string,
    duration: number,
    responseCode: number,
    success: boolean,
    properties?: Record<string, any>
  ) {
    if (!this.config.enabled || !this.client) return;

    try {
      this.client.trackRequest({
        name,
        url,
        duration,
        resultCode: responseCode,
        success,
        properties,
      });
    } catch (error) {
      console.error('Failed to track request:', error);
    }
  }

  /**
   * Flush all telemetry
   */
  flush() {
    if (!this.config.enabled || !this.client) return;

    try {
      this.client.flush();
    } catch (error) {
      console.error('Failed to flush telemetry:', error);
    }
  }
}

// Singleton instance
export const appInsights = new AppInsightsClient();

/**
 * Track API request to Application Insights
 */
export function trackApiRequestToInsights(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  appInsights.trackRequest(
    `${method} ${path}`,
    path,
    duration,
    statusCode,
    statusCode < 400,
    { method, userId }
  );
}

/**
 * Track AI usage to Application Insights
 */
export function trackAiUsageToInsights(
  action: string,
  model: string,
  tokensUsed: number,
  cost: number,
  userId: string,
  specId?: string
) {
  appInsights.trackEvent('AI_Usage', {
    action,
    model,
    tokensUsed: tokensUsed.toString(),
    cost: cost.toString(),
    userId,
    specId,
  });

  appInsights.trackMetric('AI_Tokens_Used', tokensUsed, {
    action,
    model,
    userId,
  });

  appInsights.trackMetric('AI_Cost', cost, {
    action,
    model,
    userId,
  });
}

/**
 * Track database query to Application Insights
 */
export function trackDatabaseQueryToInsights(
  collection: string,
  operation: string,
  duration: number,
  recordCount?: number
) {
  appInsights.trackDependency(
    `${collection}.${operation}`,
    'CosmosDB',
    duration,
    true,
    { collection, operation, recordCount: recordCount?.toString() }
  );

  if (duration > 1000) {
    appInsights.trackEvent('Slow_Database_Query', {
      collection,
      operation,
      duration: duration.toString(),
    });
  }
}

/**
 * Track error to Application Insights
 */
export function trackErrorToInsights(
  message: string,
  error: Error | any,
  context?: LogContext
) {
  if (error instanceof Error) {
    appInsights.trackException(error, { message, ...context });
  } else {
    appInsights.trackEvent('Error', {
      message,
      error: JSON.stringify(error),
      ...context,
    });
  }
}
