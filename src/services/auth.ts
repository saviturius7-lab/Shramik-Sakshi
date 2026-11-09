import { UserRole } from '../types';

const TOKEN_KEY = 'shramik_sakshi_auth_token_v2';
const USER_KEY = 'shramik_sakshi_auth_user_v2';

export interface AuthSessionUser {
  uid: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  name?: string;
}

let activeToken: string | null = null;
let activeUser: AuthSessionUser | null = null;

export function getStoredAuthToken(): string | null {
  if (activeToken) return activeToken;
  if (typeof window !== 'undefined') {
    activeToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }
  return activeToken;
}

export function getStoredAuthUser(): AuthSessionUser | null {
  if (activeUser) return activeUser;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (raw) {
      try {
        activeUser = JSON.parse(raw);
      } catch {
        activeUser = null;
      }
    }
  }
  return activeUser;
}

export function saveAuthSession(token: string, user: AuthSessionUser): void {
  activeToken = token;
  activeUser = user;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession(): void {
  activeToken = null;
  activeUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

/**
 * Initializes or refreshes an authenticated session with the server.
 */
export async function obtainAuthSession(
  role: UserRole = 'worker',
  phoneNumber: string = '+919876543210',
  name?: string,
  idToken?: string
): Promise<{ token: string; user: AuthSessionUser }> {
  const payload: any = { role, phoneNumber, name };
  if (idToken) {
    payload.idToken = idToken;
  }

  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to authenticate session');
  }

  const data = await res.json();
  const token = data.token;
  const user: AuthSessionUser = {
    uid: data.user.uid,
    email: data.user.email,
    role: data.user.role as UserRole,
    phoneNumber: data.user.phoneNumber,
    name: data.user.name,
  };

  saveAuthSession(token, user);
  return { token, user };
}

/**
 * Robust fetch wrapper that guarantees an Authorization Bearer token is attached.
 * If token is missing, initializes session first. If 401 occurs, refreshes token and retries once.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getStoredAuthToken();

  if (!token) {
    try {
      const session = await obtainAuthSession();
      token = session.token;
    } catch (e) {
      console.warn('[Auth] Initial session creation error:', e);
    }
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  // If unauthorized (e.g. token expired), attempt a single refresh
  if (response.status === 401) {
    try {
      const currentUser = getStoredAuthUser();
      const session = await obtainAuthSession(
        currentUser?.role || 'worker',
        currentUser?.phoneNumber || '+919876543210',
        currentUser?.name
      );
      headers.set('Authorization', `Bearer ${session.token}`);
      response = await fetch(url, { ...options, headers });
    } catch {
      // Return the 401 if refresh fails
    }
  }

  return response;
}
