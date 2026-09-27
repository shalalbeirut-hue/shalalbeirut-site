// End-to-end check of the operations system against the local dev server (wrangler dev --env dev).
// Uses the local-only accounts in scripts/dev-accounts.local.json.
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const { accounts } = JSON.parse(readFileSync(new URL('./dev-accounts.local.json', import.meta.url)));
const acc = (role) => accounts.find((a) => a.role === role);

function client() {
  let cookie = '';
  return async (path, { method, body, raw, type } = {}) => {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let payload;
    if (raw) { payload = raw; headers['content-type'] = type; } else if (body !== undefined) { payload = JSON.stringify(body); headers['content-type'] = 'application/json'; }
    const res = await fetch(BASE + '/api' + path, { method: method ?? (payload ? 'POST' : 'GET'), headers, body: payload });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) { const kv = c.split(';')[0]; const [k] = kv.split('='); cookie = cookie.split('; ').filter((x) => x && !x.startsWith(k + '=')).concat(kv).join('; '); }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };
}

let failures = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!ok) failures++; };
const tokenFrom = (wa, prefix) => decodeURIComponent(wa).match(new RegExp(prefix + '([A-Za-z0-9_-]+)'))?.[1];

const anon = client();
const cs = client();
const tech = client();
const admin = client();

// Website request
let r = await anon('/public/request', { body: { name: 'عميل الموقع', phone: '99887766', governorate: 'حولي', block: '5', service_slug: 'leak-detection', description: 'تسريب بالحمام', preferred_time: 'العصر' } });
check('website request creates order', r.status === 200 && r.data.code?.startsWith('SB-'), r.data.code);

// Logins
r = await cs('/auth/login', { body: { phone: acc('cs').phone, password: acc('cs').password } });
check('cs login', r.status === 200);
r = await cs('/auth/login', { body: { phone: acc('cs').phone, password: 'wrong-password' } });
check('wrong password rejected', r.status === 401);
await tech('/auth/login', { body: { phone: acc('tech').phone, password: acc('tech').password } });
await admin('/auth/login', { body: { phone: acc('admin').phone, password: acc('admin').password } });
r = await anon('/orders');
check('anonymous cannot list orders', r.status === 401);

const techId = (await tech('/auth/me')).data.user.id;

// CS creates and assigns an order
r = await cs('/orders', { body: {
  customer: { name: 'أبو محمد', phone: '55112233' },
  address: { governorate: 'حولي', area: 'السالمية', block: '10', street: '5', building: '12' },
  service_id: 4, description: 'السخان ما يحر', source: 'whatsapp', priority: 'urgent',
  tech_id: techId, scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
} });
check('cs creates + assigns order', r.status === 200, r.data.code);
const orderId = r.data.id;

r = await tech('/orders?status=open');
check('tech sees assigned order', r.data.orders?.some((o) => o.id === orderId));
const other = (await cs('/orders', { body: { customer: { name: 'عميل آخر', phone: '66554433' }, address: { governorate: 'الجهراء', area: 'القصر' } } })).data.id;
r = await tech(`/orders/${other}`);
check('tech blocked from unassigned order', r.status === 403);

r = await tech(`/orders/${orderId}/on-the-way`, { method: 'POST' });
check('tech on the way -> WhatsApp link', r.status === 200 && r.data.wa?.startsWith('https://wa.me/96555112233'));
r = await tech(`/orders/${orderId}/start`, { body: { lat: 29.33, lng: 48.07, accuracy: 15 } });
check('tech starts with location', r.status === 200 && r.data.location === true);

// 1x1 JPEG
const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
r = await tech(`/orders/${orderId}/photos?kind=before`, { raw: jpeg, type: 'image/jpeg' });
check('upload before photo', r.status === 200, r.data.error ?? '');
r = await tech(`/orders/${orderId}/photos?kind=after`, { raw: jpeg, type: 'image/jpeg' });
const photoId = r.data.id;
check('upload after photo', r.status === 200);

r = await tech(`/orders/${orderId}/finish`, { body: {
  items: [{ description: 'تبديل هيتر', qty: 1, unit_kd: '8', kind: 'labour' }, { description: 'هيتر 3000 واط', qty: 1, unit_kd: '6.500', kind: 'part' }],
  discount_kd: '0.500', warranty_months: 6, warranty_covers: 'الهيتر والتوصيلات', payment_status: 'paid', payment_method: 'knet',
} });
check('tech finishes -> invoice + WhatsApp', r.status === 200 && /^INV-\d{4}-\d{5}$/.test(r.data.number), r.data.number);
const wa = r.data.wa ?? '';
const invToken = tokenFrom(wa, '/i/');
const surveyToken = tokenFrom(wa, '/r/');
const linkToken = tokenFrom(wa, '/my/login/');
check('WhatsApp message has invoice, survey and account links', !!(invToken && surveyToken && linkToken));

r = await anon(`/public/invoice/${invToken}`);
check('public invoice total 14.000 KD', r.data.invoice?.total_fils === 14000, String(r.data.invoice?.total_fils));
check('invoice shows 6-month warranty', r.data.invoice?.months === 6);

r = await anon(`/public/survey/${surveyToken}`, { body: { overall: 5, tech: 5, punctuality: 4, comment: 'شغل نظيف والفني محترم', consent: true } });
check('customer submits survey', r.status === 200 && r.data.ask_google === true);
r = await anon(`/public/survey/${surveyToken}`, { body: { overall: 1, tech: 1, punctuality: 1 } });
check('survey cannot be submitted twice', r.status === 400);

r = await cs('/followups?all=1');
const fu = r.data.followups?.find((f) => f.order_id === orderId);
check('follow-up created for finished order', !!fu);
r = await cs(`/followups/${fu.id}`, { body: { result: 'resolved', notes: 'العميل مرتاح' } });
r = await cs(`/orders/${orderId}`);
check('resolved follow-up closes order', r.data.order?.status === 'closed');

r = await admin('/surveys?publish=pending');
const sv = r.data.surveys?.find((s) => s.order_id === orderId);
r = await admin(`/surveys/${sv.id}/review`, { body: { status: 'approved' } });
r = await anon('/public/reviews');
check('approved review appears publicly (first name only)', r.data.reviews?.some((x) => x.name === 'أبو' && x.rating === 5));

// Customer account
const cust = client();
r = await cust('/my/summary');
check('customer account needs login', r.status === 401);
r = await cust('/my/login', { body: { token: linkToken } });
check('customer logs in from WhatsApp link', r.status === 200);
r = await cust('/my/summary');
check('customer sees invoice and warranty', r.data.invoices?.length === 1 && r.data.warranties?.[0]?.months === 6);
const photoRes = await fetch(`${BASE}/api/photos/${photoId}`);
check('photo blocked without login', photoRes.status === 403);

r = await admin('/dashboard');
check('dashboard loads', r.status === 200 && r.data.counts?.done_30d >= 1);
r = await tech('/dashboard');
check('tech cannot open dashboard', r.status === 403);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
