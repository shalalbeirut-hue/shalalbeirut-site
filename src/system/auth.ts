// Passwords, sessions and access control for staff and customers.
import type { MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { type Env, type Vars, type Role, type StaffUser, randomToken, sha256, nowIso, addHours, forbidden, HttpError } from './lib';

type H = MiddlewareHandler<{ Bindings: Env; Variables: Vars }>;

const STAFF_COOKIE = 'sb_staff';
const CUSTOMER_COOKIE = 'sb_cust';
const STAFF_SESSION_HOURS = 24 * 30;
const CUSTOMER_SESSION_HOURS = 24 * 90;

const enc = new TextEncoder();
const toB64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));

export async function hashPassword(password: string, env: Env, saltB64?: string) {
  const salt = saltB64 ? fromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const iterations = Number(env.PBKDF2_ITERATIONS) || 100_000;
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return { hash: `${iterations}$${toB64(bits)}`, salt: toB64(salt) };
}

export async function verifyPassword(password: string, stored: string, saltB64: string, env: Env) {
  const [iterStr, expected] = stored.split('$');
  const salt = fromB64(saltB64);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: Number(iterStr) || Number(env.PBKDF2_ITERATIONS) || 100_000 }, key, 256);
  const got = toB64(bits);
  // Constant-time comparison.
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function validatePassword(p: unknown): string | null {
  const s = String(p ?? '');
  if (s.length < 8) return 'كلمة السر لازم تكون 8 حروف أو أرقام على الأقل';
  if (s.length > 128) return 'كلمة السر طويلة وايد';
  return null;
}

/** Allows at most `max` attempts per key in the window. Records this attempt. */
export async function rateLimit(env: Env, key: string, max: number, windowMinutes: number) {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key = ?1 AND at > ?2').bind(key, since).first<{ n: number }>();
  if ((row?.n ?? 0) >= max) throw new HttpError(429, 'محاولات وايد. جرّب بعد شوي.');
  await env.DB.prepare('INSERT INTO login_attempts (key) VALUES (?1)').bind(key).run();
}

export async function clearAttempts(env: Env, key: string) {
  await env.DB.prepare('DELETE FROM login_attempts WHERE key = ?1').bind(key).run();
}

const cookieOpts = (c: Parameters<H>[0], hours: number) => ({
  httpOnly: true,
  secure: new URL(c.req.url).protocol === 'https:',
  sameSite: 'Lax' as const,
  path: '/',
  maxAge: hours * 3600,
});

export async function startStaffSession(c: Parameters<H>[0], userId: number) {
  const token = randomToken();
  await c.env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)')
    .bind(await sha256(token), userId, addHours(STAFF_SESSION_HOURS)).run();
  setCookie(c, STAFF_COOKIE, token, cookieOpts(c, STAFF_SESSION_HOURS));
}

export async function startCustomerSession(c: Parameters<H>[0], customerId: number) {
  const token = randomToken();
  await c.env.DB.prepare('INSERT INTO sessions (token_hash, customer_id, expires_at) VALUES (?1, ?2, ?3)')
    .bind(await sha256(token), customerId, addHours(CUSTOMER_SESSION_HOURS)).run();
  setCookie(c, CUSTOMER_COOKIE, token, cookieOpts(c, CUSTOMER_SESSION_HOURS));
}

export async function endSession(c: Parameters<H>[0], kind: 'staff' | 'customer') {
  const name = kind === 'staff' ? STAFF_COOKIE : CUSTOMER_COOKIE;
  const token = getCookie(c, name);
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(await sha256(token)).run();
  deleteCookie(c, name, { path: '/' });
}

/** Rejects cross-site writes: mutating requests must come from our own origin. */
export const sameOrigin: H = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    const origin = c.req.header('origin');
    if (origin && origin !== new URL(c.req.url).origin) throw forbidden('طلب من مصدر غير معروف');
  }
  await next();
};

export const loadStaff: H = async (c, next) => {
  const token = getCookie(c, STAFF_COOKIE);
  if (token) {
    const user = await c.env.DB.prepare(
      `SELECT u.id, u.name, u.phone, u.role, u.must_change_pass FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?1 AND s.expires_at > ?2 AND u.active = 1`,
    ).bind(await sha256(token), nowIso()).first<StaffUser>();
    if (user) c.set('user', user);
  }
  await next();
};

export const loadCustomer: H = async (c, next) => {
  const token = getCookie(c, CUSTOMER_COOKIE);
  if (token) {
    const row = await c.env.DB.prepare('SELECT customer_id FROM sessions WHERE token_hash = ?1 AND expires_at > ?2 AND customer_id IS NOT NULL')
      .bind(await sha256(token), nowIso()).first<{ customer_id: number }>();
    if (row) c.set('customerId', row.customer_id);
  }
  await next();
};

export function requireStaff(...roles: Role[]): H {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) throw new HttpError(401, 'سجّل دخول أول');
    if (roles.length && !roles.includes(user.role)) throw forbidden();
    await next();
  };
}

export const requireCustomer: H = async (c, next) => {
  if (!c.get('customerId')) throw new HttpError(401, 'افتح الرابط اللي وصلك على الواتساب');
  await next();
};

export const MANAGERS: Role[] = ['admin', 'manager'];
export const OFFICE: Role[] = ['admin', 'manager', 'cs'];
