/**
 * Monitoring and Alerting Utilities
 * Provides structured logging and alerting for critical system events
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Alert categories for different system components
 */
export enum AlertCategory {
  DATABASE = "database",
  AUTHENTICATION = "authentication",
  VOTING = "voting",
  RATE_LIMIT = "rate_limit",
  CACHE = "cache",
  SECURITY = "security",
  PERFORMANCE = "performance",
}

interface AlertOptions {
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  email?: string;
}

/**
 * Send structured alert to monitoring system (Sentry)
 */
export function sendAlert(options: AlertOptions): void {
  const { category, severity, message, details, userId, email } = options;

  // Set Sentry context
  Sentry.setContext("alert", {
    category,
    severity,
    ...details,
  });

  if (userId) {
    Sentry.setUser({ id: userId, email });
  }

  // Send to Sentry based on severity
  switch (severity) {
    case AlertSeverity.INFO:
      Sentry.captureMessage(message, "info");
      break;
    case AlertSeverity.WARNING:
      Sentry.captureMessage(message, "warning");
      break;
    case AlertSeverity.ERROR:
      Sentry.captureMessage(message, "error");
      break;
    case AlertSeverity.CRITICAL:
      Sentry.captureException(new Error(message), {
        level: "fatal",
        tags: { category, alert: "critical" },
      });
      break;
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[${severity.toUpperCase()}] [${category}] ${message}`, details);
  }
}

/**
 * Monitor database query performance
 */
export function monitorDatabaseQuery(
  queryName: string,
  duration: number,
  threshold: number = 1000 // 1 second default threshold
): void {
  if (duration > threshold) {
    sendAlert({
      category: AlertCategory.DATABASE,
      severity: AlertSeverity.WARNING,
      message: `Slow database query detected: ${queryName}`,
      details: {
        queryName,
        duration,
        threshold,
      },
    });
  }
}

/**
 * Monitor API endpoint performance
 */
export function monitorApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
): void {
  // Alert on slow requests (>3 seconds)
  if (duration > 3000) {
    sendAlert({
      category: AlertCategory.PERFORMANCE,
      severity: AlertSeverity.WARNING,
      message: `Slow API response: ${method} ${endpoint}`,
      details: {
        endpoint,
        method,
        duration,
        statusCode,
      },
    });
  }

  // Alert on server errors
  if (statusCode >= 500) {
    sendAlert({
      category: AlertCategory.PERFORMANCE,
      severity: AlertSeverity.ERROR,
      message: `API server error: ${method} ${endpoint}`,
      details: {
        endpoint,
        method,
        statusCode,
      },
    });
  }
}

/**
 * Monitor authentication failures
 */
export function monitorAuthFailure(
  reason: string,
  email?: string,
  ip?: string
): void {
  sendAlert({
    category: AlertCategory.AUTHENTICATION,
    severity: AlertSeverity.WARNING,
    message: "Authentication failure",
    details: {
      reason,
      email,
      ip,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Monitor suspicious voting activity
 */
export function monitorSuspiciousVoting(
  userId: string,
  email: string,
  reason: string,
  details?: Record<string, any>
): void {
  sendAlert({
    category: AlertCategory.VOTING,
    severity: AlertSeverity.ERROR,
    message: "Suspicious voting activity detected",
    details: {
      reason,
      ...details,
    },
    userId,
    email,
  });
}

/**
 * Monitor rate limit hits
 */
export function monitorRateLimitHit(
  endpoint: string,
  ip: string,
  limitType: string
): void {
  sendAlert({
    category: AlertCategory.RATE_LIMIT,
    severity: AlertSeverity.INFO,
    message: "Rate limit hit",
    details: {
      endpoint,
      ip,
      limitType,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Monitor cache failures
 */
export function monitorCacheFailure(
  operation: string,
  key: string,
  error: string
): void {
  sendAlert({
    category: AlertCategory.CACHE,
    severity: AlertSeverity.WARNING,
    message: "Cache operation failed",
    details: {
      operation,
      key,
      error,
    },
  });
}

/**
 * Monitor security events
 */
export function monitorSecurityEvent(
  eventType: string,
  severity: AlertSeverity,
  details: Record<string, any>
): void {
  sendAlert({
    category: AlertCategory.SECURITY,
    severity,
    message: `Security event: ${eventType}`,
    details: {
      eventType,
      ...details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Monitor database connection pool health
 */
export function monitorDatabasePoolHealth(metrics: {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
}): void {
  const { totalConnections, idleConnections, waitingClients } = metrics;

  // Alert if connection pool is exhausted
  if (waitingClients > 0) {
    sendAlert({
      category: AlertCategory.DATABASE,
      severity: AlertSeverity.CRITICAL,
      message: "Database connection pool exhausted",
      details: metrics,
    });
  }

  // Alert if too few idle connections
  if (idleConnections === 0 && totalConnections > 5) {
    sendAlert({
      category: AlertCategory.DATABASE,
      severity: AlertSeverity.WARNING,
      message: "Low database connection pool availability",
      details: metrics,
    });
  }
}

/**
 * Performance timing wrapper
 * Automatically monitors function execution time
 * 
 * @example
 * const result = await withPerformanceMonitoring(
 *   'fetchElections',
 *   () => prisma.election.findMany()
 * );
 */
export async function withPerformanceMonitoring<T>(
  operationName: string,
  fn: () => Promise<T>,
  threshold: number = 1000
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    if (duration > threshold) {
      sendAlert({
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.WARNING,
        message: `Slow operation: ${operationName}`,
        details: {
          operationName,
          duration,
          threshold,
        },
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    sendAlert({
      category: AlertCategory.PERFORMANCE,
      severity: AlertSeverity.ERROR,
      message: `Operation failed: ${operationName}`,
      details: {
        operationName,
        duration,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    
    throw error;
  }
}
