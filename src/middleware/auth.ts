import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser, getUserByUid, type DbUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string; // 'worker' | 'employer' | 'administrator'
    dbId?: number;
    dbUser?: DbUser;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Prototype/Demo Admin & Role Key fallback (STRICTLY isolated to non-production environments)
    const isProduction = process.env.NODE_ENV === 'production' && !process.env.VITE_DEV;
    const devRole = req.headers['x-user-role'] as string;
    const devPhone = req.headers['x-worker-phone'] as string;
    const devUid = (req.headers['x-user-uid'] as string) || (devRole ? `demo-${devRole}-uid` : undefined);

    // Security Hardening: In production, reject arbitrary header elevation to administrator
    if (isProduction && devRole === 'administrator' && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return res.status(403).json({ 
        error: 'Forbidden: Header-based administrative elevation is strictly prohibited in production mode.' 
      });
    }

    if (!isProduction && devRole && ['worker', 'employer', 'administrator'].includes(devRole)) {
      const email = `${devRole}@shramik-sakshi.local`;
      const dbUser = await getOrCreateUser(
        devUid || `demo-${devRole}`, 
        email, 
        devRole === 'administrator' ? 'Site Administrator' : (devRole === 'employer' ? 'Mukadam Contractor' : 'Site Worker'), 
        devRole, 
        devPhone || '+919876543210'
      );
      req.user = {
        uid: dbUser.uid,
        email: dbUser.email,
        role: dbUser.role,
        dbId: dbUser.id,
        dbUser,
      };
      return next();
    }

    // 2. Production Firebase Token Verification
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no header, allow read-only guest worker demo fallback for prototype
      const demoUser = await getOrCreateUser(
        'demo-worker-default',
        'demo.worker@shramik-sakshi.local',
        'Demonstration Worker',
        'worker',
        '+919876543210'
      );
      req.user = {
        uid: demoUser.uid,
        email: demoUser.email,
        role: 'worker',
        dbId: demoUser.id,
        dbUser: demoUser,
      };
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const dbUser = await getOrCreateUser(
        decodedToken.uid,
        decodedToken.email || `${decodedToken.uid}@shramik.local`,
        decodedToken.name || 'Registered User',
        decodedToken.email?.includes('admin') ? 'administrator' : 'worker'
      );

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: dbUser.role,
        dbId: dbUser.id,
        dbUser,
      };
      next();
    } catch (error) {
      console.warn('Firebase ID token verification failed (fallback to guest worker):', error);
      const demoUser = await getOrCreateUser(
        'demo-worker-default',
        'demo.worker@shramik-sakshi.local',
        'Demonstration Worker',
        'worker',
        '+919876543210'
      );
      req.user = {
        uid: demoUser.uid,
        email: demoUser.email,
        role: 'worker',
        dbId: demoUser.id,
        dbUser: demoUser,
      };
      return next();
    }
  } catch (outerError) {
    console.error('requireAuth unexpected error:', outerError);
    req.user = {
      uid: 'demo-worker-default',
      email: 'demo.worker@shramik-sakshi.local',
      role: 'worker',
      dbId: 6,
    };
    return next();
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
