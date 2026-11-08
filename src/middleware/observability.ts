/**
 * Production Observability, Correlation Tracking, and Metrics Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

export interface RequestMetrics {
  totalRequests: number;
  statusCodes: Record<string, number>;
  activeRequests: number;
  startedAt: number;
}

export const serverMetrics: RequestMetrics = {
  totalRequests: 0,
  statusCodes: {},
  activeRequests: 0,
  startedAt: Date.now(),
};

export const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Assign or propagate correlation ID
  const incomingId = req.headers['x-request-id'] as string;
  const requestId = incomingId || `req_${crypto.randomBytes(8).toString('hex')}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  // 2. Performance Tracking: Safely inject X-Response-Time before headers are written
  const startTime = process.hrtime();
  serverMetrics.totalRequests++;
  serverMetrics.activeRequests++;

  const originalEnd = res.end.bind(res);
  res.end = function (...args: any[]) {
    if (!res.headersSent) {
      const [s, ns] = process.hrtime(startTime);
      const ms = (s * 1000 + ns / 1e6).toFixed(2);
      try {
        res.setHeader('X-Response-Time', `${ms}ms`);
      } catch {}
    }
    return (originalEnd as any)(...args);
  };

  // 3. Response hook for logging and telemetry
  res.on('finish', () => {
    serverMetrics.activeRequests = Math.max(0, serverMetrics.activeRequests - 1);
    const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
    serverMetrics.statusCodes[statusGroup] = (serverMetrics.statusCodes[statusGroup] || 0) + 1;

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

    // Structured JSON log output (standard in CloudWatch / Datadog / Stackdriver)
    const logPayload = {
      level: res.statusCode >= 500 ? 'ERROR' : (res.statusCode >= 400 ? 'WARN' : 'INFO'),
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: parseFloat(durationMs),
      userAgent: req.headers['user-agent'] || 'unknown',
      clientIp: req.ip || req.socket.remoteAddress || 'unknown',
    };

    // Only log API routes to keep console crisp during dev
    if (req.url.startsWith('/api')) {
      if (res.statusCode >= 400) {
        console.warn(`[HTTP] ${JSON.stringify(logPayload)}`);
      } else {
        console.log(`[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${durationMs}ms) [${requestId}]`);
      }
    }
  });

  next();
};
