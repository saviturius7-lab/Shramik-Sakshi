/**
 * Financial & Attendance Transaction Idempotency Middleware
 * 
 * Complies with Stripe / Razorpay style idempotency guarantees.
 * Prevents duplicate wage claims and double muster bookings caused by
 * flaky mobile network retries.
 */

import type { Request, Response, NextFunction } from 'express';

interface CachedResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  timestamp: number;
}

const idempotencyCache = new Map<string, CachedResponse>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Periodic cache cleanup
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only apply to state-modifying requests (POST, PUT, PATCH)
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const key = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string;
  if (!key) {
    // If client didn't supply key, proceed normally
    return next();
  }

  const cached = idempotencyCache.get(key);
  if (cached) {
    res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
    res.setHeader('X-Original-Timestamp', new Date(cached.timestamp).toISOString());
    return res.status(cached.statusCode).json(cached.body);
  }

  // Intercept response to cache it
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(key, {
        statusCode: res.statusCode,
        body,
        headers: { 'content-type': 'application/json' },
        timestamp: Date.now(),
      });
    }
    res.setHeader('X-Cache-Lookup', 'MISS');
    return originalJson(body);
  };

  next();
};
