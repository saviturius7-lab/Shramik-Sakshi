/**
 * High-Performance In-Memory Sliding Window Rate Limiter
 * 
 * Protects endpoints from DDoS, credential stuffing, and attendance punch spam.
 */

import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs: number; // e.g. 60000 (1 minute)
  maxRequests: number; // e.g. 60
  endpointName?: string;
}) {
  const hits = new Map<string, RateLimitRecord>();

  // Automated cleanup routine to prevent memory leaks from inactive IPs
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter(ts => now - ts < options.windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, options.windowMs * 2);
  if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    // Identifier: Client IP + optional worker phone if provided
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const workerPhone = (req.headers['x-worker-phone'] as string) || '';
    const key = `${clientIp}:${workerPhone}:${options.endpointName || 'general'}`;

    let record = hits.get(key);
    if (!record) {
      record = { timestamps: [] };
      hits.set(key, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter(ts => now - ts < options.windowMs);

    if (record.timestamps.length >= options.maxRequests) {
      const oldestHit = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((options.windowMs - (now - oldestHit)) / 1000);

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);

      return res.status(429).json({
        error: 'Too Many Requests: Rate limit exceeded. Please retry shortly.',
        retryAfterSeconds,
      });
    }

    record.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', options.maxRequests - record.timestamps.length);
    next();
  };
}
