// Shared helpers for the operations API.
import type { Context } from 'hono';

export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  SITE_URL?: string; // e.g. https://shalalbeirut.com (falls back to the request origin)
  ZAPIER_WEBHOOK_URL?: string;
  ZAPIER_SECRET?: string;
  PBKDF2_ITERATIONS?: string;
}

export type Role = 'admin' | 'manager' | 'cs' | 'tech';
export interface StaffUser { id: number; name: string; phone: string; role: Role; must_change_pass: number }
export type Vars = { user?: StaffUser; customerId?: number };
export type C = Context<{ Bindings: Env; Variables: Vars }>;

export const nowIso = () => new Date().toISOString();
export const addHours = (h: number, from = new Date()) => new Date(from.getTime() + h * 3600_000).toISOString();
export const addMonths = (m: number, from = new Date()) => {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + m);
  return d.toISOString();
};

/** Kuwait mobile numbers: accepts 8 local digits, 965XXXXXXXX, +965 or 00965 prefixes. */
export function normalizePhone(input: unknown): string | null {
  const digits = String(input ?? '').replace(/\D/g, '').replace(/^00/, '');
  if (/^\d{8}$/.test(digits)) return '965' + digits;
  if (/^965\d{8}$/.test(digits)) return digits;
  if (/^\d{10,15}$/.test(digits)) return digits; // other international numbers
  return null;
}

export const kd = (fils: number) => (fils / 1000).toFixed(3);
export const toFils = (kdValue: unknown) => {
  const n = Number(kdValue);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1000) : null;
};

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return b64url(a);
}

export async function sha256(text: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return b64url(new Uint8Array(d));
}

/** Next value of a named counter, atomically. */
export async function nextCounter(env: Env, name: string): Promise<number> {
  const row = await env.DB.prepare(
    'INSERT INTO counters (name, value) VALUES (?1, 1) ON CONFLICT(name) DO UPDATE SET value = value + 1 RETURNING value',
  ).bind(name).first<{ value: number }>();
  return row!.value;
}

export async function logActivity(env: Env, actorId: number | null, entity: string, entityId: number, action: string, data?: unknown) {
  await env.DB.prepare('INSERT INTO activity_log (actor_id, entity, entity_id, action, data) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(actorId, entity, entityId, action, data === undefined ? null : JSON.stringify(data)).run();
}

/** Notify one user, or everyone with a role ('cs', 'manager'; managers also covers admins). */
export async function notify(env: Env, target: { userId?: number; role?: 'cs' | 'manager' | 'tech' }, type: string, message: string, orderId?: number) {
  await env.DB.prepare('INSERT INTO notifications (user_id, role, type, order_id, message) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(target.userId ?? null, target.role ?? null, type, orderId ?? null, message).run();
}

/** Fire-and-forget event for Zapier. Signed with HMAC-SHA256 when ZAPIER_SECRET is set. */
export function emit(c: C, event: string, payload: Record<string, unknown>) {
  const url = c.env.ZAPIER_WEBHOOK_URL;
  if (!url) return;
  const body = JSON.stringify({ event, at: nowIso(), ...payload });
  const send = async () => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (c.env.ZAPIER_SECRET) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(c.env.ZAPIER_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
      headers['x-shalal-signature'] = b64url(new Uint8Array(sig));
    }
    await fetch(url, { method: 'POST', headers, body }).catch(() => {});
  };
  c.executionCtx.waitUntil(send());
}

export const siteUrl = (c: C) => c.env.SITE_URL || new URL(c.req.url).origin;

export const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const bad = (msg: string) => new HttpError(400, msg);
export const notFound = (msg = 'مو موجود') => new HttpError(404, msg);
export const forbidden = (msg = 'ما عندك صلاحية') => new HttpError(403, msg);

export function str(v: unknown, max = 500): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}
export function int(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}
