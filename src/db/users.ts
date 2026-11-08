import { db, isPostgresConfigured } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  phoneNumber: string | null;
  name: string;
  role: string;
  isDemo: boolean;
  createdAt: Date;
}

const memoryUsers = new Map<string, DbUser>([
  ['demo-admin-uid', { id: 1, uid: 'demo-admin-uid', email: 'admin@shramik-sakshi.gov.in', name: 'Chief Labor Inspector', role: 'administrator', phoneNumber: '+919811122233', isDemo: true, createdAt: new Date() }],
  ['demo-employer-uid', { id: 2, uid: 'demo-employer-uid', email: 'contractor.singh@infra.local', name: 'Mukadam Singh Enterprises', role: 'employer', phoneNumber: '+919811122233', isDemo: true, createdAt: new Date() }],
  ['demo-worker-1', { id: 3, uid: 'demo-worker-1', email: 'rameshwar@labor.local', name: 'Rameshwar Yadav', role: 'worker', phoneNumber: '+919876543210', isDemo: true, createdAt: new Date() }],
  ['demo-worker-2', { id: 4, uid: 'demo-worker-2', email: 'bablu@labor.local', name: 'Bablu Kumar', role: 'worker', phoneNumber: '+919811234567', isDemo: true, createdAt: new Date() }],
  ['demo-worker-3', { id: 5, uid: 'demo-worker-3', email: 'suresh@labor.local', name: 'Suresh Paswan', role: 'worker', phoneNumber: '+919822012345', isDemo: true, createdAt: new Date() }],
  ['demo-worker-default', { id: 6, uid: 'demo-worker-default', email: 'demo.worker@shramik-sakshi.local', name: 'Demonstration Worker', role: 'worker', phoneNumber: '+919876543210', isDemo: true, createdAt: new Date() }],
  ['demo-worker', { id: 7, uid: 'demo-worker', email: 'worker@shramik-sakshi.local', name: 'Site Worker', role: 'worker', phoneNumber: '+919876543210', isDemo: true, createdAt: new Date() }],
  ['demo-employer', { id: 8, uid: 'demo-employer', email: 'employer@shramik-sakshi.local', name: 'Mukadam Contractor', role: 'employer', phoneNumber: '+919811122233', isDemo: true, createdAt: new Date() }],
  ['demo-administrator', { id: 9, uid: 'demo-administrator', email: 'administrator@shramik-sakshi.local', name: 'Site Administrator', role: 'administrator', phoneNumber: '+919811122233', isDemo: true, createdAt: new Date() }],
]);

let nextUserId = 10;

export async function getOrCreateUser(
  uid: string, 
  email: string, 
  name: string = 'User', 
  role: string = 'worker',
  phoneNumber?: string
): Promise<DbUser> {
  if (isPostgresConfigured && db) {
    try {
      const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (existing.length > 0) {
        return existing[0];
      }

      const inserted = await db.insert(users)
        .values({
          uid,
          email,
          name,
          role,
          phoneNumber: phoneNumber || null,
          isDemo: false,
        })
        .returning();

      if (inserted && inserted.length > 0) {
        return inserted[0];
      }
    } catch (err) {
      console.warn('[Users DB] PostgreSQL query failed, using resilient memory store:', (err as Error).message);
    }
  }

  const existingMemory = memoryUsers.get(uid);
  if (existingMemory) {
    return existingMemory;
  }

  const newUser: DbUser = {
    id: nextUserId++,
    uid,
    email,
    name,
    role,
    phoneNumber: phoneNumber || null,
    isDemo: false,
    createdAt: new Date(),
  };
  memoryUsers.set(uid, newUser);
  return newUser;
}

export async function getUserByUid(uid: string): Promise<DbUser | null> {
  if (isPostgresConfigured && db) {
    try {
      const res = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (res.length > 0) return res[0];
    } catch (err) {
      console.warn('[Users DB] PostgreSQL getUserByUid failed, using resilient memory store:', (err as Error).message);
    }
  }
  return memoryUsers.get(uid) || null;
}

export async function getUserByPhone(phone: string): Promise<DbUser | null> {
  if (isPostgresConfigured && db) {
    try {
      const res = await db.select().from(users).where(eq(users.phoneNumber, phone)).limit(1);
      if (res.length > 0) return res[0];
    } catch (err) {
      console.warn('[Users DB] PostgreSQL getUserByPhone failed, using resilient memory store:', (err as Error).message);
    }
  }
  for (const user of memoryUsers.values()) {
    if (user.phoneNumber === phone) {
      return user;
    }
  }
  return null;
}

