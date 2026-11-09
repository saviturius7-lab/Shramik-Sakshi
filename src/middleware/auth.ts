import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser, getUserByUid, type DbUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string; // 'worker' | 'employer' | 'administrator'
    dbId?: number;
    dbUser?: DbUser;
    phoneNumber?: string;
  };
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'shramik-sakshi-secure-session-auth-2026-v1';

export interface SessionTokenPayload {
  uid: string;
  email: string;
  role: string;
  phoneNumber?: string;
  name?: string;
  exp: number; // UNIX timestamp ms
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Valid for 7 days.
 */
export function createAppSessionToken(payload: Omit<SessionTokenPayload, 'exp'>, expiresInMs: number = 7 * 24 * 60 * 60 * 1000): string {
  const fullPayload: SessionTokenPayload = {
    ...payload,
    exp: Date.now() + expiresInMs,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `shk_${body}.${signature}`;
}

/**
 * Verifies a signed HMAC-SHA256 session token.
 * Returns null if signature is invalid or token is expired.
 */
export function verifyAppSessionToken(token: string): SessionTokenPayload | null {
  try {
    if (!token.startsWith('shk_')) return null;
    const raw = token.slice(4);
    const [body, signature] = raw.split('.');
    if (!body || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionTokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Strict Authentication Middleware
 * Strictly requires a valid Bearer token (Firebase ID token or signed HMAC session token).
 * NEVER falls back to guest or demo users.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized: Authentication required. Please provide a valid Bearer token in the Authorization header.' 
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty bearer token provided.' });
  }

  // 1. Check if token is a valid signed session token
  const sessionPayload = verifyAppSessionToken(token);
  if (sessionPayload) {
    try {
      const dbUser = await getOrCreateUser(
        sessionPayload.uid,
        sessionPayload.email,
        sessionPayload.name || 'User',
        sessionPayload.role,
        sessionPayload.phoneNumber
      );
      req.user = {
        uid: sessionPayload.uid,
        email: sessionPayload.email,
        role: sessionPayload.role,
        phoneNumber: sessionPayload.phoneNumber,
        dbId: dbUser.id,
        dbUser,
      };
      return next();
    } catch (dbErr) {
      // In file/memory mode where users table might be unconfigured, populate user directly from verified token
      req.user = {
        uid: sessionPayload.uid,
        email: sessionPayload.email,
        role: sessionPayload.role,
        phoneNumber: sessionPayload.phoneNumber,
      };
      return next();
    }
  }

  // 2. Check if token is a Firebase ID Token
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = (decodedToken.role as string) || (decodedToken.email?.includes('admin') ? 'administrator' : 'worker');
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || `${decodedToken.uid}@shramik.local`,
      decodedToken.name || 'Registered User',
      role
    );

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: dbUser.role,
      dbId: dbUser.id,
      dbUser,
    };
    return next();
  } catch (firebaseErr: any) {
    // Both session token and Firebase ID token failed
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid or expired authentication token. Please sign in again.' 
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role. Current role is '${req.user.role}'.` 
      });
    }
    next();
  };
};
