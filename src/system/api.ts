// Operations API: staff (/api/*), customers (/api/my/*) and public token pages (/api/public/*).
import { Hono } from 'hono';
import {
  type Env, type Vars, type C, type StaffUser,
  nowIso, addHours, addMonths, normalizePhone, parsePhone, searchDigits, kd, toFils, randomToken, sha256, nextCounter,
  logActivity, notify, emit, siteUrl, waLink, HttpError, bad, notFound, forbidden, str, int,
} from './lib';
import {
  hashPassword, verifyPassword, validatePassword, rateLimit, clearAttempts, startStaffSession, startCustomerSession,
  endSession, sameOrigin, loadStaff, loadCustomer, requireStaff, requireCustomer, MANAGERS, OFFICE,
} from './auth';

export const api = new Hono<{ Bindings: Env; Variables: Vars }>().basePath('/api');

api.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as 400);
  console.error(err);
  return c.json({ error: 'صار خطأ في السيرفر. جرّب مرة ثانية.' }, 500);
});
api.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
});
api.use('*', sameOrigin, loadStaff, loadCustomer);

const me = (c: C) => c.get('user') as StaffUser;
const body = async (c: C) => (await c.req.json().catch(() => ({}))) as Record<string, any>;
const photos = (c: C) => { if (!c.env.PHOTOS) throw bad('تخزين الصور باقي ما تفعّل (R2).'); return c.env.PHOTOS; };
const ip = (c: C) => c.req.header('cf-connecting-ip') || 'local';

const STATUS_AR: Record<string, string> = {
  new: 'جديد', assigned: 'مسند', on_the_way: 'الفني بالطريق', in_progress: 'جاري الشغل',
  done: 'تم', closed: 'مغلق', reopened: 'أعيد فتحه', cancelled: 'ملغي',
};

// ---------------------------------------------------------------- Auth

api.post('/auth/login', async (c) => {
  const b = await body(c);
  // Same rule as everywhere; the raw digits are a fallback for older or demo accounts stored before the rule.
  const raw = searchDigits(String(b.phone ?? ''));
  const phone = normalizePhone(b.phone) ?? (raw.length === 8 ? '965' + raw : raw || null);
  if (!phone || !b.password) throw bad('اكتب رقم الموبايل وكلمة السر');
  await rateLimit(c.env, 'ip:' + ip(c), 20, 15);
  await rateLimit(c.env, 'staff:' + phone, 6, 15);
  const u = await c.env.DB.prepare('SELECT id, pass_hash, pass_salt, active FROM users WHERE phone = ?1').bind(phone).first<any>();
  if (!u || !u.active || !(await verifyPassword(String(b.password), u.pass_hash, u.pass_salt, c.env))) {
    throw new HttpError(401, 'الرقم أو كلمة السر غلط');
  }
  await clearAttempts(c.env, 'staff:' + phone);
  await startStaffSession(c, u.id);
  return c.json({ ok: true });
});

api.post('/auth/logout', async (c) => {
  await endSession(c, 'staff');
  return c.json({ ok: true });
});

api.get('/auth/me', requireStaff(), (c) => c.json({ user: me(c) }));

api.post('/auth/password', requireStaff(), async (c) => {
  const b = await body(c);
  const u = await c.env.DB.prepare('SELECT pass_hash, pass_salt FROM users WHERE id = ?1').bind(me(c).id).first<any>();
  if (!(await verifyPassword(String(b.current ?? ''), u.pass_hash, u.pass_salt, c.env))) throw bad('كلمة السر الحالية غلط');
  const err = validatePassword(b.next);
  if (err) throw bad(err);
  const h = await hashPassword(String(b.next), c.env);
  await c.env.DB.prepare('UPDATE users SET pass_hash = ?1, pass_salt = ?2, must_change_pass = 0 WHERE id = ?3').bind(h.hash, h.salt, me(c).id).run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- Users (staff accounts)

api.get('/users', requireStaff(...OFFICE), async (c) => {
  const role = c.req.query('role');
  const rows = await c.env.DB.prepare(
    `SELECT id, name, phone, role, active, created_at FROM users ${role ? 'WHERE role = ?1' : ''} ORDER BY active DESC, role, name`,
  ).bind(...(role ? [role] : [])).all();
  return c.json({ users: rows.results });
});

api.post('/users', requireStaff(...MANAGERS), async (c) => {
  const b = await body(c);
  const name = str(b.name, 80);
  const pr = parsePhone(b.phone);
  const role = String(b.role);
  if (!name) throw bad('الاسم مطلوب');
  if (!pr.ok) throw bad(pr.error);
  if (!pr.kuwait) throw bad('حسابات الفريق لازم تكون بأرقام كويتية');
  const phone = pr.phone;
  if (!['manager', 'cs', 'tech', 'admin'].includes(role)) throw bad('الدور غلط');
  if (role === 'admin' && me(c).role !== 'admin') throw forbidden();
  const err = validatePassword(b.password);
  if (err) throw bad(err);
  const h = await hashPassword(String(b.password), c.env);
  const r = await c.env.DB.prepare('INSERT INTO users (name, phone, role, pass_hash, pass_salt) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id')
    .bind(name, phone, role, h.hash, h.salt).first<{ id: number }>().catch(() => { throw bad('الرقم مسجّل من قبل'); });
  await logActivity(c.env, me(c).id, 'user', r!.id, 'created', { role });
  return c.json({ id: r!.id });
});

api.patch('/users/:id', requireStaff(...MANAGERS), async (c) => {
  const id = int(c.req.param('id'))!;
  const b = await body(c);
  const target = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?1').bind(id).first<{ role: string }>();
  if (!target) throw notFound();
  if ((target.role === 'admin' || b.role === 'admin') && me(c).role !== 'admin') throw forbidden();
  if (b.name !== undefined) await c.env.DB.prepare('UPDATE users SET name = ?1 WHERE id = ?2').bind(str(b.name, 80), id).run();
  if (b.role !== undefined) await c.env.DB.prepare('UPDATE users SET role = ?1 WHERE id = ?2').bind(b.role, id).run();
  if (b.active !== undefined) {
    await c.env.DB.prepare('UPDATE users SET active = ?1 WHERE id = ?2').bind(b.active ? 1 : 0, id).run();
    if (!b.active) await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(id).run();
  }
  if (b.password !== undefined) {
    const err = validatePassword(b.password);
    if (err) throw bad(err);
    const h = await hashPassword(String(b.password), c.env);
    await c.env.DB.prepare('UPDATE users SET pass_hash = ?1, pass_salt = ?2, must_change_pass = 1 WHERE id = ?3').bind(h.hash, h.salt, id).run();
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(id).run();
  }
  await logActivity(c.env, me(c).id, 'user', id, 'updated', { ...b, password: b.password ? '***' : undefined });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- Services and prices

api.get('/services', requireStaff(), async (c) => {
  const [services, items] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT * FROM services ORDER BY sort, id'),
    c.env.DB.prepare('SELECT * FROM price_items ORDER BY sort, id'),
  ]);
  const list = (services.results as any[]).map((s) => ({ ...s, items: (items.results as any[]).filter((i) => i.service_id === s.id) }));
  return c.json({ services: list });
});

api.post('/services', requireStaff(...MANAGERS), async (c) => {
  const b = await body(c);
  if (!str(b.name_ar) || !str(b.slug)) throw bad('الاسم والرابط مطلوبين');
  const r = await c.env.DB.prepare('INSERT INTO services (slug, name_ar, name_en, default_warranty_months, sort) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id')
    .bind(str(b.slug, 60), str(b.name_ar, 120), str(b.name_en, 120) ?? '', int(b.default_warranty_months), int(b.sort) ?? 0).first<{ id: number }>();
  return c.json({ id: r!.id });
});

api.patch('/services/:id', requireStaff(...MANAGERS), async (c) => {
  const b = await body(c);
  await c.env.DB.prepare(
    `UPDATE services SET name_ar = COALESCE(?1, name_ar), name_en = COALESCE(?2, name_en),
     default_warranty_months = CASE WHEN ?3 = 1 THEN ?4 ELSE default_warranty_months END,
     active = COALESCE(?5, active), sort = COALESCE(?6, sort) WHERE id = ?7`,
  ).bind(str(b.name_ar, 120), str(b.name_en, 120), 'default_warranty_months' in b ? 1 : 0, int(b.default_warranty_months),
    b.active === undefined ? null : b.active ? 1 : 0, int(b.sort), int(c.req.param('id'))).run();
  return c.json({ ok: true });
});

api.post('/price-items', requireStaff(...MANAGERS), async (c) => {
  const b = await body(c);
  if (!int(b.service_id) || !str(b.name_ar)) throw bad('الخدمة والاسم مطلوبين');
  const price = b.price_kd === '' || b.price_kd == null ? null : toFils(b.price_kd);
  const r = await c.env.DB.prepare('INSERT INTO price_items (service_id, name_ar, name_en, price_fils, sort, kind) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id')
    .bind(int(b.service_id), str(b.name_ar, 160), str(b.name_en, 160) ?? '', price, int(b.sort) ?? 0, b.kind === 'part' ? 'part' : 'labour').first<{ id: number }>();
  return c.json({ id: r!.id });
});

api.patch('/price-items/:id', requireStaff(...MANAGERS), async (c) => {
  const b = await body(c);
  const price = 'price_kd' in b ? (b.price_kd === '' || b.price_kd == null ? null : toFils(b.price_kd)) : undefined;
  await c.env.DB.prepare(
    `UPDATE price_items SET name_ar = COALESCE(?1, name_ar), name_en = COALESCE(?2, name_en),
     price_fils = CASE WHEN ?3 = 1 THEN ?4 ELSE price_fils END, active = COALESCE(?5, active), kind = COALESCE(?7, kind) WHERE id = ?6`,
  ).bind(str(b.name_ar, 160), str(b.name_en, 160), price === undefined ? 0 : 1, price ?? null,
    b.active === undefined ? null : b.active ? 1 : 0, int(c.req.param('id')), b.kind === 'part' || b.kind === 'labour' ? b.kind : null).run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- Customers

api.get('/customers', requireStaff(...OFFICE), async (c) => {
  const q = str(c.req.query('q'), 60);
  const digits = q ? searchDigits(q) : '';
  const rows = await c.env.DB.prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders_count
     FROM customers c ${q ? 'WHERE c.name LIKE ?1 OR c.phone LIKE ?2' : ''} ORDER BY c.id DESC LIMIT 50`,
  ).bind(...(q ? [`%${q}%`, `%${digits || q}%`] : [])).all();
  return c.json({ customers: rows.results });
});

api.get('/customers/by-phone/:phone', requireStaff(...OFFICE), async (c) => {
  const phone = normalizePhone(c.req.param('phone'));
  if (!phone) return c.json({ customer: null });
  const cust = await c.env.DB.prepare('SELECT * FROM customers WHERE phone = ?1').bind(phone).first<any>();
  if (!cust) return c.json({ customer: null });
  const addrs = await c.env.DB.prepare('SELECT * FROM addresses WHERE customer_id = ?1 ORDER BY id DESC').bind(cust.id).all();
  return c.json({ customer: { ...cust, addresses: addrs.results } });
});

api.get('/customers/:id', requireStaff(...OFFICE), async (c) => {
  const id = int(c.req.param('id'));
  const cust = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?1').bind(id).first();
  if (!cust) throw notFound();
  const [addrs, orders, invoices, warranties] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT * FROM addresses WHERE customer_id = ?1 ORDER BY id DESC').bind(id),
    c.env.DB.prepare(`SELECT o.id, o.code, o.status, o.created_at, o.finished_at, (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service, u.name AS tech
      FROM orders o LEFT JOIN services s ON s.id = o.service_id LEFT JOIN users u ON u.id = o.tech_id
      WHERE o.customer_id = ?1 ORDER BY o.id DESC`).bind(id),
    c.env.DB.prepare(`SELECT id, number, doc_status, issued_at, total_fils, payment_status, order_id FROM invoices WHERE customer_id = ?1 AND doc_status != 'cancelled' ORDER BY id DESC`).bind(id),
    c.env.DB.prepare('SELECT w.*, o.code FROM warranties w JOIN orders o ON o.id = w.order_id WHERE w.customer_id = ?1 ORDER BY w.ends_at DESC').bind(id),
  ]);
  return c.json({ customer: cust, addresses: addrs.results, orders: orders.results, invoices: invoices.results, warranties: warranties.results });
});

async function upsertCustomer(c: C, b: Record<string, any>): Promise<number> {
  if (int(b.id)) return int(b.id)!;
  const pr = parsePhone(b.phone);
  const name = str(b.name, 80);
  if (!pr.ok) throw bad(pr.error);
  const phone = pr.phone;
  const existing = await c.env.DB.prepare('SELECT id FROM customers WHERE phone = ?1').bind(phone).first<{ id: number }>();
  if (existing) return existing.id;
  if (!name) throw bad('اسم العميل مطلوب');
  const r = await c.env.DB.prepare('INSERT INTO customers (name, phone, phone2, notes) VALUES (?1, ?2, ?3, ?4) RETURNING id')
    .bind(name, phone, normalizePhone(b.phone2), str(b.notes, 500)).first<{ id: number }>();
  return r!.id;
}

async function insertAddress(c: C, customerId: number, a: Record<string, any>): Promise<number> {
  if (!str(a.governorate) || !str(a.area)) throw bad('المحافظة والمنطقة مطلوبة');
  const r = await c.env.DB.prepare(
    `INSERT INTO addresses (customer_id, label, governorate, area, block, street, avenue, building, floor, flat, lat, lng, maps_url, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14) RETURNING id`,
  ).bind(customerId, str(a.label, 40), str(a.governorate, 40), str(a.area, 60), str(a.block, 20), str(a.street, 60), str(a.avenue, 20),
    str(a.building, 20), str(a.floor, 10), str(a.flat, 10), a.lat ?? null, a.lng ?? null, str(a.maps_url, 500), str(a.notes, 300)).first<{ id: number }>();
  return r!.id;
}

api.post('/customers', requireStaff(...OFFICE), async (c) => {
  const b = await body(c);
  const id = await upsertCustomer(c, { ...b, id: undefined });
  if (b.address) await insertAddress(c, id, b.address);
  return c.json({ id });
});

api.patch('/customers/:id', requireStaff(...OFFICE), async (c) => {
  const b = await body(c);
  const pr = b.phone !== undefined ? parsePhone(b.phone) : undefined;
  if (pr && !pr.ok) throw bad(pr.error);
  const phone = pr?.ok ? pr.phone : undefined;
  await c.env.DB.prepare('UPDATE customers SET name = COALESCE(?1, name), phone = COALESCE(?2, phone), phone2 = COALESCE(?3, phone2), notes = COALESCE(?4, notes) WHERE id = ?5')
    .bind(str(b.name, 80), phone ?? null, normalizePhone(b.phone2), str(b.notes, 500), int(c.req.param('id'))).run();
  return c.json({ ok: true });
});

api.post('/customers/:id/addresses', requireStaff(...OFFICE), async (c) => {
  const id = await insertAddress(c, int(c.req.param('id'))!, await body(c));
  return c.json({ id });
});

/** Creates a login link for the customer's account and the WhatsApp message to send it. */
async function customerLink(c: C, customerId: number) {
  const token = randomToken(24);
  await c.env.DB.prepare('INSERT INTO customer_links (token_hash, customer_id, created_by, expires_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(await sha256(token), customerId, c.get('user')?.id ?? null, addHours(24 * 60)).run();
  return `${siteUrl(c)}/my/login/${token}`;
}

api.post('/customers/:id/link', requireStaff(...OFFICE), async (c) => {
  const cust = await c.env.DB.prepare('SELECT id, name, phone FROM customers WHERE id = ?1').bind(int(c.req.param('id'))).first<any>();
  if (!cust) throw notFound();
  const url = await customerLink(c, cust.id);
  const text = `هلا ${cust.name}، هذا رابط حسابك في شلال بيروت. تقدر تشوف فيه فواتيرك وخدماتك وكفالاتك:\n${url}`;
  return c.json({ url, wa: waLink(cust.phone, text) });
});

// ---------------------------------------------------------------- Orders

const ORDER_LIST_SQL = `
  SELECT o.id, o.code, o.status, o.priority, o.source, o.description, o.preferred_time, o.scheduled_at, o.created_at,
         o.started_at, o.finished_at, o.tech_id,
         c.name AS customer_name, c.phone AS customer_phone,
         a.governorate, a.area, a.block,
         (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service, u.name AS tech_name,
         i.number AS doc_number, i.doc_status, i.total_fils, i.paid_fils, i.payment_status, i.invoiced_at,
         (SELECT w.months FROM warranties w WHERE w.order_id = o.id ORDER BY w.id DESC LIMIT 1) AS warranty_months,
         (SELECT sv.rating_overall FROM surveys sv WHERE sv.order_id = o.id) AS rating
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  LEFT JOIN addresses a ON a.id = o.address_id
  LEFT JOIN users u ON u.id = o.tech_id
  LEFT JOIN invoices i ON i.id = (SELECT id FROM invoices WHERE order_id = o.id AND doc_status != 'cancelled' ORDER BY id DESC LIMIT 1)`;

/**
 * Filters shared by the orders list and reports.
 * q (code, name or phone), code, customer, phone, tech, unassigned, status, service, gov, area,
 * doc (quote|work_order|invoice|paid|none), pay (paid|partial|unpaid), date_by (visit|created|finished|invoiced), from, to (Kuwait days).
 */
function orderFilters(c: C) {
  const user = me(c);
  const where: string[] = [];
  const args: unknown[] = [];
  const add = (sql: string, v: unknown) => { args.push(v); where.push(sql.split('?').join(`?${args.length}`)); };
  const qv = (k: string, max = 60) => str(c.req.query(k), max);
  if (user.role === 'tech') add('o.tech_id = ?', user.id);
  const status = c.req.query('status');
  if (status === 'open') where.push(`o.status IN ('new','assigned','on_the_way','in_progress','reopened')`);
  else if (status) add('o.status = ?', status);
  if (int(c.req.query('tech'))) add('o.tech_id = ?', int(c.req.query('tech')));
  if (c.req.query('unassigned')) where.push('o.tech_id IS NULL');
  const q = qv('q');
  if (q) {
    const qd = searchDigits(q);
    args.push(`%${q}%`, `%${qd.length >= 4 ? qd : q}%`);
    where.push(`(o.code LIKE ?${args.length - 1} OR c.name LIKE ?${args.length - 1} OR c.phone LIKE ?${args.length})`);
  }
  const code = qv('code', 30);
  if (code) add('o.code LIKE ?', `%${code}%`);
  const customer = qv('customer');
  if (customer) add('c.name LIKE ?', `%${customer}%`);
  const phone = searchDigits(qv('phone', 30) ?? '');
  if (phone) add('(c.phone LIKE ? OR c.phone2 LIKE ?)', `%${phone}%`);
  const gov = qv('gov', 40);
  if (gov) add('a.governorate = ?', gov);
  const area = qv('area');
  if (area) add('a.area = ?', area);
  if (int(c.req.query('service'))) add('EXISTS (SELECT 1 FROM order_services osf WHERE osf.order_id = o.id AND osf.service_id = ?)', int(c.req.query('service')));
  const doc = c.req.query('doc');
  if (doc === 'none') where.push('i.id IS NULL');
  else if (['quote', 'work_order', 'invoice', 'paid'].includes(doc ?? '')) add('i.doc_status = ?', doc);
  const pay = c.req.query('pay');
  if (['paid', 'partial', 'unpaid'].includes(pay ?? '')) { add('i.payment_status = ?', pay); where.push(`i.doc_status IN ('invoice','paid')`); }
  const DATE_COLS: Record<string, string> = { visit: 'o.scheduled_at', created: 'o.created_at', finished: 'o.finished_at', invoiced: 'i.invoiced_at' };
  const dateCol = DATE_COLS[c.req.query('date_by') ?? ''] ?? 'o.scheduled_at';
  const day = (v: string | undefined, end = false) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T${end ? '24:00' : '00:00'}:00+03:00`).toISOString() : null);
  const from = day(c.req.query('from'));
  const to = day(c.req.query('to'), true);
  if (from) add(`${dateCol} >= ?`, from);
  if (to) add(`${dateCol} < ?`, to);
  const SORTS: Record<string, string> = {
    visit_asc: 'o.scheduled_at IS NULL, o.scheduled_at ASC',
    visit_desc: 'o.scheduled_at IS NULL, o.scheduled_at DESC',
    created_desc: 'o.created_at DESC',
    created_asc: 'o.created_at ASC',
    total_desc: 'i.total_fils IS NULL, i.total_fils DESC',
  };
  const order = SORTS[c.req.query('sort') ?? ''] ?? `CASE o.status WHEN 'new' THEN 0 WHEN 'reopened' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'on_the_way' THEN 3 WHEN 'assigned' THEN 4 ELSE 5 END,
    COALESCE(o.scheduled_at, o.created_at) ${user.role === 'tech' ? 'ASC' : 'DESC'}`;
  return { where: where.length ? 'WHERE ' + where.join(' AND ') : '', args, order };
}

api.get('/orders', requireStaff(), async (c) => {
  const f = orderFilters(c);
  const rows = await c.env.DB.prepare(`${ORDER_LIST_SQL} ${f.where} ORDER BY ${f.order} LIMIT 300`).bind(...f.args).all();
  return c.json({ orders: rows.results });
});

/** Reports: the same filters, more rows, with totals and breakdowns by technician, service and governorate. */
api.get('/reports', requireStaff(...OFFICE), async (c) => {
  const f = orderFilters(c);
  const rows = (await c.env.DB.prepare(`${ORDER_LIST_SQL} ${f.where} ORDER BY ${f.order} LIMIT 2000`).bind(...f.args).all<any>()).results;
  const billed = (r: any) => r.doc_status === 'invoice' || r.doc_status === 'paid';
  const group = (key: (r: any) => string[]) => {
    const m = new Map<string, { name: string; orders: number; done: number; billed_fils: number; paid_fils: number; ratings: number[] }>();
    for (const r of rows) for (const k of key(r)) {
      const g = m.get(k) ?? { name: k, orders: 0, done: 0, billed_fils: 0, paid_fils: 0, ratings: [] };
      g.orders++;
      if (['done', 'closed'].includes(r.status)) g.done++;
      if (billed(r)) { g.billed_fils += r.total_fils ?? 0; g.paid_fils += r.paid_fils ?? 0; }
      if (r.rating) g.ratings.push(r.rating);
      m.set(k, g);
    }
    return [...m.values()].map(({ ratings, ...g }) => ({ ...g, rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null }))
      .sort((a, b) => b.orders - a.orders);
  };
  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  const ratings = rows.map((r) => r.rating).filter(Boolean);
  const summary = {
    orders: rows.length,
    by_status: byStatus,
    billed_fils: rows.filter(billed).reduce((s, r) => s + (r.total_fils ?? 0), 0),
    paid_fils: rows.filter(billed).reduce((s, r) => s + (r.paid_fils ?? 0), 0),
    quotes_fils: rows.filter((r) => r.doc_status === 'quote' || r.doc_status === 'work_order').reduce((s, r) => s + (r.total_fils ?? 0), 0),
    invoices: rows.filter(billed).length,
    rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
    truncated: rows.length === 2000,
  };
  return c.json({
    summary,
    by_tech: group((r) => [r.tech_name ?? 'ما انسند']),
    by_service: group((r) => (r.service ? String(r.service).split('، ') : ['بدون خدمة'])),
    by_gov: group((r) => [r.governorate ?? 'بدون عنوان']),
    rows,
  });
});

async function getOrderFor(c: C, id: number) {
  const o = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(id).first<any>();
  if (!o) throw notFound('الطلب مو موجود');
  const user = me(c);
  if (user.role === 'tech' && o.tech_id !== user.id) throw forbidden('هذا الطلب مو مسند لك');
  return o;
}

api.get('/orders/:id', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  const [cust, addr, svc, tech, photos, invoice, warranty, survey, followups, activity] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, name, phone, phone2, notes FROM customers WHERE id = ?1').bind(o.customer_id),
    c.env.DB.prepare('SELECT * FROM addresses WHERE id = ?1').bind(o.address_id),
    c.env.DB.prepare('SELECT s.* FROM order_services os JOIN services s ON s.id = os.service_id WHERE os.order_id = ?1 ORDER BY s.sort').bind(o.id),
    c.env.DB.prepare('SELECT id, name, phone FROM users WHERE id = ?1').bind(o.tech_id),
    c.env.DB.prepare('SELECT id, kind, created_at FROM order_photos WHERE order_id = ?1 ORDER BY id').bind(o.id),
    c.env.DB.prepare('SELECT * FROM invoices WHERE order_id = ?1 ORDER BY id DESC LIMIT 1').bind(o.id),
    c.env.DB.prepare('SELECT * FROM warranties WHERE order_id = ?1 ORDER BY id DESC LIMIT 1').bind(o.id),
    c.env.DB.prepare('SELECT * FROM surveys WHERE order_id = ?1').bind(o.id),
    c.env.DB.prepare('SELECT f.*, u.name AS done_by_name FROM followups f LEFT JOIN users u ON u.id = f.done_by WHERE order_id = ?1 ORDER BY id').bind(o.id),
    c.env.DB.prepare(`SELECT a.action, a.data, a.created_at, u.name AS actor FROM activity_log a LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.entity = 'order' AND a.entity_id = ?1 ORDER BY a.id`).bind(o.id),
  ]);
  const inv = invoice.results[0] as any;
  const items = inv ? (await c.env.DB.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?1 ORDER BY id').bind(inv.id).all()).results : [];
  return c.json({
    order: o, customer: cust.results[0], address: addr.results[0] ?? null, service: svc.results[0] ?? null, services: svc.results, tech: tech.results[0] ?? null,
    photos: photos.results, invoice: inv ? { ...inv, items } : null, warranty: warranty.results[0] ?? null,
    survey: survey.results[0] ?? null, followups: followups.results, activity: activity.results,
  });
});

/** Service ids from a request: accepts service_ids (array) or a single service_id. */
function serviceIds(b: Record<string, any>): number[] {
  const raw: unknown[] = Array.isArray(b.service_ids) ? b.service_ids : b.service_id ? [b.service_id] : [];
  const ids = raw.map((v) => int(v)).filter((v): v is number => v !== null && v > 0);
  return [...new Set(ids)].slice(0, 10);
}

async function setOrderServices(c: C, orderId: number, ids: number[]) {
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM order_services WHERE order_id = ?1').bind(orderId),
    ...ids.map((sid) => c.env.DB.prepare('INSERT INTO order_services (order_id, service_id) SELECT ?1, id FROM services WHERE id = ?2').bind(orderId, sid)),
    c.env.DB.prepare('UPDATE orders SET service_id = ?1 WHERE id = ?2').bind(ids[0] ?? null, orderId),
  ]);
}

async function createOrder(c: C, b: Record<string, any>, source: string, actorId: number | null) {
  const customerId = await upsertCustomer(c, b.customer ?? {});
  let addressId = int(b.address_id);
  if (!addressId && b.address) addressId = await insertAddress(c, customerId, b.address);
  const year = new Date().getUTCFullYear() % 100;
  const seq = await nextCounter(c.env, `order-${year}`);
  const code = `SB-${year}${String(seq).padStart(4, '0')}`;
  const r = await c.env.DB.prepare(
    `INSERT INTO orders (code, customer_id, address_id, service_id, source, description, priority, preferred_time, scheduled_at, created_by)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10) RETURNING id`,
  ).bind(code, customerId, addressId, serviceIds(b)[0] ?? null, source, str(b.description, 2000), b.priority === 'urgent' ? 'urgent' : 'normal',
    str(b.preferred_time, 60), str(b.scheduled_at, 40), actorId).first<{ id: number }>();
  const id = r!.id;
  const ids = serviceIds(b);
  if (ids.length) await setOrderServices(c, id, ids);
  await logActivity(c.env, actorId, 'order', id, 'created', { source });
  if (source === 'website') {
    await notify(c.env, { role: 'cs' }, 'order.new', `طلب جديد من الموقع ${code}`, id);
    await notify(c.env, { role: 'manager' }, 'order.new', `طلب جديد من الموقع ${code}`, id);
  }
  emit(c, 'order.created', { order_id: id, code, source });
  return { id, code, customerId };
}

api.post('/orders', requireStaff(...OFFICE), async (c) => {
  const b = await body(c);
  const src = ['whatsapp', 'phone', 'walkin', 'contract', 'website'].includes(b.source) ? b.source : 'phone';
  const res = await createOrder(c, b, src, me(c).id);
  if (int(b.tech_id)) await assign(c, res.id, int(b.tech_id)!, str(b.scheduled_at, 40));
  return c.json(res);
});

api.patch('/orders/:id', requireStaff(...OFFICE), async (c) => {
  const id = int(c.req.param('id'))!;
  const b = await body(c);
  await c.env.DB.prepare(
    `UPDATE orders SET description = COALESCE(?1, description), priority = COALESCE(?2, priority),
     preferred_time = COALESCE(?3, preferred_time), address_id = COALESCE(?4, address_id), updated_at = ?5 WHERE id = ?6`,
  ).bind(str(b.description, 2000), b.priority === 'urgent' || b.priority === 'normal' ? b.priority : null,
    str(b.preferred_time, 60), int(b.address_id), nowIso(), id).run();
  if (Array.isArray(b.service_ids)) await setOrderServices(c, id, serviceIds(b));
  await logActivity(c.env, me(c).id, 'order', id, 'edited', b);
  return c.json({ ok: true });
});

async function assign(c: C, orderId: number, techId: number, scheduledAt: string | null) {
  const tech = await c.env.DB.prepare(`SELECT id, name FROM users WHERE id = ?1 AND role = 'tech' AND active = 1`).bind(techId).first<any>();
  if (!tech) throw bad('الفني مو موجود');
  const o = await c.env.DB.prepare('SELECT code, status FROM orders WHERE id = ?1').bind(orderId).first<any>();
  if (!o) throw notFound();
  if (['done', 'closed', 'cancelled'].includes(o.status)) throw bad('ما تقدر تسند طلب منتهي');
  await c.env.DB.prepare(
    `UPDATE orders SET tech_id = ?1, scheduled_at = COALESCE(?2, scheduled_at), assigned_at = ?3,
     status = CASE WHEN status IN ('new','reopened','assigned') THEN 'assigned' ELSE status END, updated_at = ?3 WHERE id = ?4`,
  ).bind(techId, scheduledAt, nowIso(), orderId).run();
  await notify(c.env, { userId: techId }, 'order.assigned', `انسند لك طلب ${o.code}`, orderId);
  await logActivity(c.env, c.get('user')?.id ?? null, 'order', orderId, 'assigned', { tech: tech.name, scheduled_at: scheduledAt });
}

api.post('/orders/:id/assign', requireStaff(...OFFICE), async (c) => {
  const b = await body(c);
  await assign(c, int(c.req.param('id'))!, int(b.tech_id)!, str(b.scheduled_at, 40));
  return c.json({ ok: true });
});

api.post('/orders/:id/on-the-way', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  if (!['assigned', 'reopened', 'on_the_way'].includes(o.status)) throw bad('الطلب مو جاهز لهالخطوة');
  await c.env.DB.prepare(`UPDATE orders SET status = 'on_the_way', on_way_at = ?1, updated_at = ?1 WHERE id = ?2`).bind(nowIso(), o.id).run();
  await logActivity(c.env, me(c).id, 'order', o.id, 'on_the_way');
  const cust = await c.env.DB.prepare('SELECT name, phone FROM customers WHERE id = ?1').bind(o.customer_id).first<any>();
  const text = `هلا ${cust.name}، معاك ${me(c).name} من شلال بيروت. أنا الحين بالطريق لك بخصوص الطلب ${o.code}. بوصل خلال شوي إن شاء الله.`;
  return c.json({ wa: waLink(cust.phone, text) });
});

api.post('/orders/:id/start', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  if (!['assigned', 'on_the_way', 'reopened'].includes(o.status)) throw bad('الطلب مو جاهز لهالخطوة');
  const b = await body(c);
  const lat = Number(b.lat), lng = Number(b.lng);
  const hasLoc = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  await c.env.DB.prepare(`UPDATE orders SET status = 'in_progress', started_at = ?1, start_lat = ?2, start_lng = ?3, start_accuracy = ?4, updated_at = ?1 WHERE id = ?5`)
    .bind(nowIso(), hasLoc ? lat : null, hasLoc ? lng : null, hasLoc ? Number(b.accuracy) || null : null, o.id).run();
  await logActivity(c.env, me(c).id, 'order', o.id, 'started', { location: hasLoc });
  await notify(c.env, { role: 'cs' }, 'order.started', `${me(c).name} بدأ الشغل في الطلب ${o.code}`, o.id);
  return c.json({ ok: true, location: hasLoc });
});

// Photos: raw body upload (the app compresses to JPEG/WebP first).
api.post('/orders/:id/photos', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  const kind = c.req.query('kind') === 'after' ? 'after' : 'before';
  const type = c.req.header('content-type') || '';
  if (!/^image\/(jpeg|png|webp)$/.test(type)) throw bad('نوع الصورة مو مدعوم');
  const buf = await c.req.arrayBuffer();
  if (buf.byteLength > 6 * 1024 * 1024) throw bad('الصورة كبيرة وايد');
  const count = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM order_photos WHERE order_id = ?1').bind(o.id).first<{ n: number }>();
  if ((count?.n ?? 0) >= 30) throw bad('وصلت الحد الأقصى للصور في هالطلب');
  const key = `orders/${o.code}/${kind}-${Date.now()}-${randomToken(6)}.${type.split('/')[1]}`;
  await photos(c).put(key, buf, { httpMetadata: { contentType: type } });
  const r = await c.env.DB.prepare('INSERT INTO order_photos (order_id, kind, r2_key, content_type, size, uploaded_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id')
    .bind(o.id, kind, key, type, buf.byteLength, me(c).id).first<{ id: number }>();
  await logActivity(c.env, me(c).id, 'order', o.id, 'photo', { kind });
  return c.json({ id: r!.id });
});

api.delete('/photos/:id', requireStaff(), async (c) => {
  const p = await c.env.DB.prepare('SELECT * FROM order_photos WHERE id = ?1').bind(int(c.req.param('id'))).first<any>();
  if (!p) throw notFound();
  const o = await getOrderFor(c, p.order_id);
  if (me(c).role === 'tech' && ['done', 'closed'].includes(o.status)) throw forbidden('ما تقدر تمسح صور بعد ما خلص الطلب');
  await photos(c).delete(p.r2_key);
  await c.env.DB.prepare('DELETE FROM order_photos WHERE id = ?1').bind(p.id).run();
  await logActivity(c.env, me(c).id, 'order', o.id, 'photo_deleted', { kind: p.kind });
  return c.json({ ok: true });
});

api.get('/photos/:id', async (c) => {
  const p = await c.env.DB.prepare('SELECT p.*, o.customer_id, o.tech_id FROM order_photos p JOIN orders o ON o.id = p.order_id WHERE p.id = ?1')
    .bind(int(c.req.param('id'))).first<any>();
  if (!p) throw notFound();
  const user = c.get('user');
  const allowed = (user && (user.role !== 'tech' || p.tech_id === user.id)) || c.get('customerId') === p.customer_id;
  if (!allowed) throw forbidden();
  const obj = await photos(c).get(p.r2_key);
  if (!obj) throw notFound();
  return new Response(obj.body, { headers: { 'content-type': p.content_type, 'cache-control': 'private, max-age=86400' } });
});

type Item = { description: string; qty: number; unit_fils: number; kind: string; price_item_id: number | null };
function parseItems(raw: unknown): Item[] {
  if (!Array.isArray(raw) || !raw.length) throw bad('أضف بند واحد على الأقل');
  return raw.slice(0, 40).map((r: any) => {
    const description = str(r.description, 200);
    const qty = Number(r.qty ?? 1);
    const unit = toFils(r.unit_kd);
    if (!description || !(qty > 0) || unit === null) throw bad('في بند ناقص أو سعره غلط');
    return { description, qty, unit_fils: unit, kind: ['labour', 'part', 'other'].includes(r.kind) ? r.kind : 'labour', price_item_id: int(r.price_item_id) };
  });
}

// ---------------------------------------------------------------- Documents: quote -> work order -> invoice -> paid
// One record per order in `invoices`. `doc_status` moves forward; `number` is Q-… while a quote/work order, INV-… once invoiced.

export const DOC_AR: Record<string, string> = { quote: 'عرض سعر', work_order: 'أمر عمل', invoice: 'فاتورة', paid: 'فاتورة مسددة', cancelled: 'ملغي' };

const yearNo = async (c: C, prefix: string, counter: string) => {
  const y = new Date().getUTCFullYear();
  return `${prefix}-${y}-${String(await nextCounter(c.env, `${counter}-${y}`)).padStart(5, '0')}`;
};

const docOf = (c: C, orderId: number) =>
  c.env.DB.prepare(`SELECT * FROM invoices WHERE order_id = ?1 AND doc_status != 'cancelled' ORDER BY id DESC LIMIT 1`).bind(orderId).first<any>();

function totals(items: Item[], discountKd: unknown) {
  const subtotal = items.reduce((s, i) => s + Math.round(i.qty * i.unit_fils), 0);
  const discount = Math.min(toFils(discountKd ?? 0) ?? 0, subtotal);
  return { subtotal, discount, total: subtotal - discount };
}

function itemStmts(c: C, docId: number, items: Item[]) {
  return [
    c.env.DB.prepare('DELETE FROM invoice_items WHERE invoice_id = ?1').bind(docId),
    ...items.map((i) => c.env.DB.prepare(
      'INSERT INTO invoice_items (invoice_id, description, qty, unit_fils, total_fils, kind, price_item_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
    ).bind(docId, i.description, i.qty, i.unit_fils, Math.round(i.qty * i.unit_fils), i.kind, i.price_item_id)),
  ];
}

/** A signature is a PNG data URL drawn on screen; keep it small. */
function parseSignature(v: unknown) {
  const s = String(v ?? '');
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s)) throw bad('التوقيع ناقص. خل العميل يوقّع في المربع.');
  if (s.length > 300_000) throw bad('التوقيع كبير وايد. امسحه ووقّع مرة ثانية.');
  return s;
}

/** Creates or updates the quote for an order. Editing a signed work order returns it to a quote. */
api.post('/orders/:id/quote', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  if (['closed', 'cancelled'].includes(o.status)) throw bad('الطلب مغلق');
  const b = await body(c);
  const items = parseItems(b.items);
  const t = totals(items, b.discount_kd);
  let doc = await docOf(c, o.id);
  if (doc && ['invoice', 'paid'].includes(doc.doc_status)) throw bad('انعملت فاتورة لهالطلب. عدّل من الفاتورة.');
  const wasSigned = doc?.doc_status === 'work_order';
  if (!doc) {
    const number = await yearNo(c, 'Q', 'quote');
    doc = await c.env.DB.prepare(
      `INSERT INTO invoices (number, quote_number, order_id, customer_id, subtotal_fils, discount_fils, total_fils, public_token, notes, created_by, doc_status)
       VALUES (?1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'quote') RETURNING *`,
    ).bind(number, o.id, o.customer_id, t.subtotal, t.discount, t.total, randomToken(18), str(b.notes, 500), me(c).id).first<any>();
  } else {
    await c.env.DB.prepare(
      `UPDATE invoices SET subtotal_fils = ?1, discount_fils = ?2, total_fils = ?3, notes = ?4, doc_status = 'quote',
       signature = NULL, signed_name = NULL, signed_at = NULL, signed_via = NULL WHERE id = ?5`,
    ).bind(t.subtotal, t.discount, t.total, str(b.notes, 500), doc.id).run();
  }
  await c.env.DB.batch(itemStmts(c, doc.id, items));
  await logActivity(c.env, me(c).id, 'order', o.id, wasSigned ? 'quote_changed_after_sign' : 'quote_saved', { total: kd(t.total) });
  return c.json({ id: doc.id, number: doc.number, doc_status: 'quote', resign_needed: wasSigned });
});

/** WhatsApp message with the quote link so the customer can approve and sign remotely. */
api.post('/orders/:id/quote/send', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  const doc = await docOf(c, o.id);
  if (!doc || doc.doc_status !== 'quote') throw bad('ما في عرض سعر ينتظر التوقيع');
  const cust = await c.env.DB.prepare('SELECT name, phone FROM customers WHERE id = ?1').bind(o.customer_id).first<any>();
  const text = [
    `هلا ${cust.name}، هذا عرض السعر من شلال بيروت للطلب ${o.code}.`,
    `الإجمالي: ${kd(doc.total_fils)} د.ك`,
    `تقدر تشوف التفاصيل وتوافق وتوقّع من هني:`,
    `${siteUrl(c)}/i/${doc.public_token}`,
  ].join('\n');
  await logActivity(c.env, me(c).id, 'order', o.id, 'quote_sent');
  return c.json({ wa: waLink(cust.phone, text) });
});

async function signDoc(c: C, doc: any, signature: string, name: string | null, via: 'onsite' | 'link') {
  if (doc.doc_status !== 'quote') throw bad(doc.doc_status === 'work_order' ? 'العرض موقّع من قبل' : 'هالمستند مو عرض سعر');
  await c.env.DB.prepare(`UPDATE invoices SET doc_status = 'work_order', signature = ?1, signed_name = ?2, signed_at = ?3, signed_via = ?4 WHERE id = ?5`)
    .bind(signature, name, nowIso(), via, doc.id).run();
  const o = await c.env.DB.prepare('SELECT id, code, tech_id FROM orders WHERE id = ?1').bind(doc.order_id).first<any>();
  await logActivity(c.env, c.get('user')?.id ?? null, 'order', o.id, 'signed', { via, name });
  if (via === 'link') {
    if (o.tech_id) await notify(c.env, { userId: o.tech_id }, 'quote.signed', `العميل وافق ووقّع على عرض السعر ${o.code}. تقدر تبدأ الشغل.`, o.id);
    await notify(c.env, { role: 'cs' }, 'quote.signed', `العميل وقّع على عرض السعر ${o.code}`, o.id);
  }
  emit(c, 'quote.signed', { order_id: o.id, code: o.code, via });
}

api.post('/orders/:id/sign', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  const doc = await docOf(c, o.id);
  if (!doc) throw bad('اعمل عرض سعر أول');
  const b = await body(c);
  await signDoc(c, doc, parseSignature(b.signature), str(b.name, 80), 'onsite');
  return c.json({ ok: true, doc_status: 'work_order' });
});

api.post('/public/doc/:token/sign', async (c) => {
  await rateLimit(c.env, 'sign:' + ip(c), 20, 60);
  const doc = await c.env.DB.prepare('SELECT * FROM invoices WHERE public_token = ?1').bind(c.req.param('token')).first<any>();
  if (!doc) throw notFound('المستند مو موجود');
  const b = await body(c);
  await signDoc(c, doc, parseSignature(b.signature), str(b.name, 80), 'link');
  return c.json({ ok: true });
});

/** WhatsApp message for the invoice: invoice + warranty, survey and account links. */
async function invoiceMessage(c: C, invoiceId: number) {
  const inv = await c.env.DB.prepare(
    `SELECT i.*, c.name, c.phone, o.code, s.token AS survey_token, w.months, w.ends_at
     FROM invoices i JOIN customers c ON c.id = i.customer_id JOIN orders o ON o.id = i.order_id
     LEFT JOIN surveys s ON s.order_id = o.id LEFT JOIN warranties w ON w.invoice_id = i.id WHERE i.id = ?1`,
  ).bind(invoiceId).first<any>();
  if (!inv) throw notFound();
  const base = siteUrl(c);
  const account = await customerLink(c, inv.customer_id);
  const paid = inv.doc_status === 'paid';
  const lines = [
    `هلا ${inv.name}، شكراً لثقتك في شلال بيروت 🌿`,
    `${paid ? 'فاتورة مسددة' : 'فاتورة'} رقم ${inv.number} للطلب ${inv.code}`,
    `المبلغ: ${kd(inv.total_fils)} د.ك${paid ? ' (مدفوع، شكراً لك)' : ''}`,
    inv.months ? `الكفالة: ${inv.months} شهر، لين ${new Date(inv.ends_at).toLocaleDateString('ar-KW-u-nu-latn', { timeZone: 'Asia/Kuwait' })}` : null,
    `الفاتورة والكفالة: ${base}/i/${inv.public_token}`,
    inv.survey_token ? `شلون كانت الخدمة؟ قيّمنا بدقيقة: ${base}/r/${inv.survey_token}` : null,
    `حسابك (فواتيرك وكفالاتك): ${account}`,
  ].filter(Boolean);
  return { wa: waLink(inv.phone, lines.join('\n')), phone: inv.phone };
}

/**
 * Job done: turns the work order (or quote, or nothing) into an invoice, adds warranty, survey and follow-up.
 * Items are optional when a quote already exists.
 */
api.post('/orders/:id/finish', requireStaff(), async (c) => {
  const o = await getOrderFor(c, int(c.req.param('id'))!);
  if (!['in_progress', 'on_the_way', 'assigned', 'reopened'].includes(o.status)) throw bad('الطلب مو جاري');
  const b = await body(c);
  let doc = await docOf(c, o.id);
  if (doc && ['invoice', 'paid'].includes(doc.doc_status)) throw bad('الفاتورة معمولة من قبل');
  const months = int(b.warranty_months) ?? 0;
  if (months < 0 || months > 60) throw bad('مدة الكفالة غلط');

  const now = nowIso();
  const stmts: D1PreparedStatement[] = [];
  if (!doc || b.items) {
    const items = parseItems(b.items);
    const t = totals(items, b.discount_kd);
    if (!doc) {
      doc = await c.env.DB.prepare(
        `INSERT INTO invoices (number, order_id, customer_id, subtotal_fils, discount_fils, total_fils, public_token, created_by, doc_status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'quote') RETURNING *`,
      ).bind('TMP-' + randomToken(6), o.id, o.customer_id, t.subtotal, t.discount, t.total, randomToken(18), me(c).id).first<any>();
    } else {
      stmts.push(c.env.DB.prepare('UPDATE invoices SET subtotal_fils = ?1, discount_fils = ?2, total_fils = ?3 WHERE id = ?4').bind(t.subtotal, t.discount, t.total, doc.id));
    }
    stmts.push(...itemStmts(c, doc.id, items));
    doc.total_fils = t.total;
  }
  const total = doc.total_fils;
  const payStatus = ['paid', 'partial', 'unpaid'].includes(b.payment_status) ? b.payment_status : 'unpaid';
  const paid = payStatus === 'paid' ? total : payStatus === 'partial' ? Math.min(toFils(b.paid_kd) ?? 0, total) : 0;
  const method = ['cash', 'knet', 'link', 'transfer'].includes(b.payment_method) ? b.payment_method : null;
  const invNo = await yearNo(c, 'INV', 'invoice');

  stmts.push(c.env.DB.prepare(
    `UPDATE invoices SET number = ?1, doc_status = ?2, invoiced_at = ?3, issued_at = ?3, payment_status = ?4, paid_fils = ?5, payment_method = ?6,
     paid_at = CASE WHEN ?2 = 'paid' THEN ?3 ELSE NULL END, notes = COALESCE(?7, notes) WHERE id = ?8`,
  ).bind(invNo, payStatus === 'paid' ? 'paid' : 'invoice', now, payStatus, paid, method, str(b.invoice_notes, 500), doc.id));
  if (months > 0) {
    stmts.push(c.env.DB.prepare('INSERT INTO warranties (order_id, customer_id, invoice_id, months, starts_at, ends_at, covers) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
      .bind(o.id, o.customer_id, doc.id, months, now, addMonths(months), str(b.warranty_covers, 300)));
  }
  stmts.push(
    c.env.DB.prepare(`UPDATE orders SET status = 'done', finished_at = ?1, tech_notes = COALESCE(?2, tech_notes), updated_at = ?1 WHERE id = ?3`).bind(now, str(b.notes, 2000), o.id),
    c.env.DB.prepare('INSERT INTO surveys (order_id, token) VALUES (?1, ?2) ON CONFLICT(order_id) DO NOTHING').bind(o.id, randomToken(16)),
    c.env.DB.prepare('INSERT INTO followups (order_id, due_at) VALUES (?1, ?2)').bind(o.id, addHours(24)),
  );
  await c.env.DB.batch(stmts);
  await logActivity(c.env, me(c).id, 'order', o.id, 'finished', { invoice: invNo, total: kd(total), warranty_months: months, signed: !!doc.signed_at });
  await notify(c.env, { role: 'cs' }, 'order.done', `خلص الطلب ${o.code}، المتابعة مستحقة بعد 24 ساعة`, o.id);
  emit(c, 'order.done', { order_id: o.id, code: o.code, invoice: invNo, total_kd: kd(total), warranty_months: months });
  return c.json({ invoice_id: doc.id, number: invNo, ...(await invoiceMessage(c, doc.id)) });
});

api.post('/orders/:id/cancel', requireStaff(...OFFICE), async (c) => {
  const id = int(c.req.param('id'))!;
  const b = await body(c);
  await c.env.DB.prepare(`UPDATE orders SET status = 'cancelled', updated_at = ?1 WHERE id = ?2 AND status NOT IN ('done','closed')`).bind(nowIso(), id).run();
  await logActivity(c.env, me(c).id, 'order', id, 'cancelled', { reason: str(b.reason, 300) });
  return c.json({ ok: true });
});

api.post('/orders/:id/reopen', requireStaff(...OFFICE), async (c) => {
  const id = int(c.req.param('id'))!;
  const b = await body(c);
  await c.env.DB.prepare(`UPDATE orders SET status = 'reopened', closed_at = NULL, updated_at = ?1 WHERE id = ?2`).bind(nowIso(), id).run();
  await logActivity(c.env, me(c).id, 'order', id, 'reopened', { reason: str(b.reason, 300) });
  await notify(c.env, { role: 'manager' }, 'order.reopened', `انفتح الطلب من جديد: ${str(b.reason, 120) ?? ''}`, id);
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- Invoices

api.get('/invoices', requireStaff(...OFFICE), async (c) => {
  const doc = c.req.query('doc');
  const valid = ['quote', 'work_order', 'invoice', 'paid'].includes(doc ?? '');
  const rows = await c.env.DB.prepare(
    `SELECT i.id, i.number, i.quote_number, i.doc_status, i.issued_at, i.total_fils, i.paid_fils, i.payment_status, i.sent_at, i.signed_at,
            o.code, o.id AS order_id, c.name AS customer_name, c.phone AS customer_phone
     FROM invoices i JOIN orders o ON o.id = i.order_id JOIN customers c ON c.id = i.customer_id
     WHERE i.doc_status != 'cancelled' ${valid ? 'AND i.doc_status = ?1' : ''} ORDER BY i.id DESC LIMIT 200`,
  ).bind(...(valid ? [doc] : [])).all();
  return c.json({ invoices: rows.results });
});

api.post('/invoices/:id/send', requireStaff(), async (c) => {
  const id = int(c.req.param('id'))!;
  const inv = await c.env.DB.prepare('SELECT order_id, doc_status FROM invoices WHERE id = ?1').bind(id).first<any>();
  if (!inv) throw notFound();
  await getOrderFor(c, inv.order_id);
  if (!['invoice', 'paid'].includes(inv.doc_status)) throw bad('هذا عرض سعر، مو فاتورة. أرسل عرض السعر من صفحة الطلب.');
  const msg = await invoiceMessage(c, id);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE invoices SET sent_at = ?1 WHERE id = ?2').bind(nowIso(), id),
    c.env.DB.prepare('UPDATE surveys SET sent_at = COALESCE(sent_at, ?1) WHERE order_id = ?2').bind(nowIso(), inv.order_id),
  ]);
  await logActivity(c.env, me(c).id, 'order', inv.order_id, 'invoice_sent');
  return c.json(msg);
});

api.patch('/invoices/:id/payment', requireStaff(...OFFICE), async (c) => {
  const id = int(c.req.param('id'))!;
  const b = await body(c);
  const inv = await c.env.DB.prepare('SELECT total_fils, order_id, doc_status FROM invoices WHERE id = ?1').bind(id).first<any>();
  if (!inv) throw notFound();
  if (!['invoice', 'paid'].includes(inv.doc_status)) throw bad('الدفع يتسجل على الفاتورة بعد ما يخلص الشغل');
  const status = ['paid', 'partial', 'unpaid'].includes(b.payment_status) ? b.payment_status : 'unpaid';
  const paid = status === 'paid' ? inv.total_fils : status === 'partial' ? Math.min(toFils(b.paid_kd) ?? 0, inv.total_fils) : 0;
  await c.env.DB.prepare(
    `UPDATE invoices SET payment_status = ?1, paid_fils = ?2, payment_method = ?3,
     doc_status = CASE WHEN ?1 = 'paid' THEN 'paid' ELSE 'invoice' END,
     paid_at = CASE WHEN ?1 = 'paid' THEN COALESCE(paid_at, ?5) ELSE NULL END WHERE id = ?4`,
  ).bind(status, paid, ['cash', 'knet', 'link', 'transfer'].includes(b.payment_method) ? b.payment_method : null, id, nowIso()).run();
  if (status === 'paid') emit(c, 'invoice.paid', { order_id: inv.order_id, total_kd: kd(inv.total_fils) });
  await logActivity(c.env, me(c).id, 'order', inv.order_id, 'payment', { status, paid: kd(paid) });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- Follow-ups (customer service)

api.get('/followups', requireStaff(...OFFICE), async (c) => {
  const due = c.req.query('all') ? '' : 'AND f.due_at <= ?1';
  const rows = await c.env.DB.prepare(
    `SELECT f.id, f.due_at, f.order_id, o.code, o.finished_at, c.name AS customer_name, c.phone AS customer_phone,
            (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service, u.name AS tech_name, sv.rating_overall, sv.submitted_at AS survey_at
     FROM followups f JOIN orders o ON o.id = f.order_id JOIN customers c ON c.id = o.customer_id
     LEFT JOIN services s ON s.id = o.service_id LEFT JOIN users u ON u.id = o.tech_id LEFT JOIN surveys sv ON sv.order_id = o.id
     WHERE f.done_at IS NULL ${due} ORDER BY f.due_at LIMIT 200`,
  ).bind(...(due ? [nowIso()] : [])).all();
  return c.json({ followups: rows.results });
});

api.post('/followups/:id', requireStaff(...OFFICE), async (c) => {
  const id = int(c.req.param('id'))!;
  const b = await body(c);
  const f = await c.env.DB.prepare('SELECT f.*, o.code FROM followups f JOIN orders o ON o.id = f.order_id WHERE f.id = ?1').bind(id).first<any>();
  if (!f || f.done_at) throw notFound();
  const result = String(b.result);
  if (!['resolved', 'not_resolved', 'no_answer'].includes(result)) throw bad('اختار نتيجة المكالمة');
  const now = nowIso();
  await c.env.DB.prepare('UPDATE followups SET done_at = ?1, done_by = ?2, result = ?3, notes = ?4 WHERE id = ?5').bind(now, me(c).id, result, str(b.notes, 500), id).run();
  if (result === 'resolved') {
    await c.env.DB.prepare(`UPDATE orders SET status = 'closed', closed_at = ?1, updated_at = ?1 WHERE id = ?2`).bind(now, f.order_id).run();
  } else if (result === 'not_resolved') {
    await c.env.DB.prepare(`UPDATE orders SET status = 'reopened', updated_at = ?1 WHERE id = ?2`).bind(now, f.order_id).run();
    await notify(c.env, { role: 'manager' }, 'followup.not_resolved', `العميل يقول العطل ما انحل في الطلب ${f.code}`, f.order_id);
    emit(c, 'followup.not_resolved', { order_id: f.order_id, code: f.code });
  } else {
    await c.env.DB.prepare('INSERT INTO followups (order_id, due_at) VALUES (?1, ?2)').bind(f.order_id, addHours(4)).run();
  }
  await logActivity(c.env, me(c).id, 'order', f.order_id, 'followup', { result, notes: str(b.notes, 500) });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- Surveys

api.get('/surveys', requireStaff(...OFFICE), async (c) => {
  const where: string[] = ['s.submitted_at IS NOT NULL'];
  const args: unknown[] = [];
  const tech = int(c.req.query('tech'));
  if (tech) { args.push(tech); where.push(`o.tech_id = ?${args.length}`); }
  const max = int(c.req.query('max_rating'));
  if (max) { args.push(max); where.push(`s.rating_overall <= ?${args.length}`); }
  const from = str(c.req.query('from'), 30);
  if (from) { args.push(from); where.push(`s.submitted_at >= ?${args.length}`); }
  const pub = c.req.query('publish');
  if (pub) { args.push(pub); where.push(`s.publish_status = ?${args.length}`); }
  const w = 'WHERE ' + where.join(' AND ');
  const [rows, stats] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT s.*, o.code, c.name AS customer_name, c.phone AS customer_phone, u.name AS tech_name, (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service, a.area
      FROM surveys s JOIN orders o ON o.id = s.order_id JOIN customers c ON c.id = o.customer_id LEFT JOIN users u ON u.id = o.tech_id
      LEFT JOIN services sv ON sv.id = o.service_id LEFT JOIN addresses a ON a.id = o.address_id ${w} ORDER BY s.submitted_at DESC LIMIT 500`).bind(...args),
    c.env.DB.prepare(`SELECT COUNT(*) AS n, AVG(s.rating_overall) AS overall, AVG(s.rating_tech) AS tech, AVG(s.rating_punctuality) AS punctuality
      FROM surveys s JOIN orders o ON o.id = s.order_id ${w}`).bind(...args),
  ]);
  const sent = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM surveys WHERE sent_at IS NOT NULL').first<{ n: number }>();
  return c.json({ surveys: rows.results, stats: { ...(stats.results[0] as object), sent: sent?.n ?? 0 } });
});

api.post('/surveys/:id/review', requireStaff(...MANAGERS), async (c) => {
  const b = await body(c);
  const status = b.status === 'approved' ? 'approved' : 'rejected';
  const s = await c.env.DB.prepare('SELECT consent_publish FROM surveys WHERE id = ?1').bind(int(c.req.param('id'))).first<any>();
  if (!s) throw notFound();
  if (status === 'approved' && !s.consent_publish) throw bad('العميل ما وافق على النشر');
  await c.env.DB.prepare('UPDATE surveys SET publish_status = ?1, reviewed_by = ?2, reviewed_at = ?3 WHERE id = ?4')
    .bind(status, me(c).id, nowIso(), int(c.req.param('id'))).run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- Notifications & dashboard

const notifWhere = `(n.user_id = ?1 OR n.role = ?2 OR (?2 = 'admin' AND n.role = 'manager'))`;

api.get('/notifications', requireStaff(), async (c) => {
  const u = me(c);
  const [list, unread] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT n.* FROM notifications n WHERE ${notifWhere} ORDER BY n.id DESC LIMIT 40`).bind(u.id, u.role),
    c.env.DB.prepare(`SELECT COUNT(*) AS n FROM notifications n WHERE ${notifWhere} AND n.read_at IS NULL`).bind(u.id, u.role),
  ]);
  let followupsDue = 0;
  if (OFFICE.includes(u.role)) {
    followupsDue = (await c.env.DB.prepare('SELECT COUNT(*) AS n FROM followups WHERE done_at IS NULL AND due_at <= ?1').bind(nowIso()).first<{ n: number }>())?.n ?? 0;
  }
  return c.json({ notifications: list.results, unread: (unread.results[0] as any).n, followups_due: followupsDue });
});

api.post('/notifications/read', requireStaff(), async (c) => {
  const u = me(c);
  // Role notifications are shared; reading marks them for everyone in the role.
  await c.env.DB.prepare(`UPDATE notifications SET read_at = ?3 WHERE read_at IS NULL AND id IN (SELECT n.id FROM notifications n WHERE ${notifWhere})`)
    .bind(u.id, u.role, nowIso()).run();
  return c.json({ ok: true });
});

api.get('/dashboard', requireStaff(...OFFICE), async (c) => {
  const now = nowIso();
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [counts, techs, low] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT
        SUM(status = 'new') AS new_count,
        SUM(status = 'reopened') AS reopened,
        SUM(status IN ('assigned','on_the_way')) AS scheduled,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status IN ('assigned','on_the_way') AND scheduled_at IS NOT NULL AND scheduled_at < ?1) AS late,
        SUM(status IN ('done','closed') AND finished_at >= ?2) AS done_30d,
        (SELECT COUNT(*) FROM followups WHERE done_at IS NULL AND due_at <= ?1) AS followups_due,
        (SELECT COUNT(*) FROM warranties WHERE ends_at > ?1) AS active_warranties,
        (SELECT COALESCE(SUM(total_fils),0) FROM invoices WHERE doc_status IN ('invoice','paid') AND invoiced_at >= ?2) AS revenue_30d_fils,
        (SELECT COALESCE(SUM(total_fils - paid_fils),0) FROM invoices WHERE doc_status = 'invoice') AS unpaid_fils,
        (SELECT COUNT(*) FROM invoices WHERE doc_status = 'quote') AS open_quotes,
        (SELECT COUNT(*) FROM invoices WHERE doc_status = 'work_order') AS work_orders
      FROM orders`).bind(now, since30),
    c.env.DB.prepare(`SELECT u.id, u.name,
        (SELECT COUNT(*) FROM orders o WHERE o.tech_id = u.id AND o.finished_at >= ?1) AS visits,
        (SELECT COUNT(*) FROM orders o WHERE o.tech_id = u.id AND o.status IN ('assigned','on_the_way','in_progress')) AS open,
        (SELECT AVG(s.rating_overall) FROM surveys s JOIN orders o ON o.id = s.order_id WHERE o.tech_id = u.id AND s.submitted_at >= ?1) AS rating,
        (SELECT AVG(s.rating_punctuality) FROM surveys s JOIN orders o ON o.id = s.order_id WHERE o.tech_id = u.id AND s.submitted_at >= ?1) AS punctuality,
        (SELECT AVG(CASE WHEN o.started_at <= datetime(o.scheduled_at, '+30 minutes') THEN 1.0 ELSE 0 END) FROM orders o
          WHERE o.tech_id = u.id AND o.started_at IS NOT NULL AND o.scheduled_at IS NOT NULL AND o.started_at >= ?1) AS on_time
      FROM users u WHERE u.role = 'tech' AND u.active = 1 ORDER BY visits DESC`).bind(since30),
    c.env.DB.prepare(`SELECT s.id, s.rating_overall, s.comment, s.submitted_at, o.id AS order_id, o.code, c.name AS customer_name
      FROM surveys s JOIN orders o ON o.id = s.order_id JOIN customers c ON c.id = o.customer_id
      WHERE s.rating_overall <= 2 AND s.submitted_at >= ?1 ORDER BY s.submitted_at DESC LIMIT 10`).bind(since30),
  ]);
  return c.json({ counts: counts.results[0], techs: techs.results, low_ratings: low.results });
});

// ---------------------------------------------------------------- Customer account (/my)

api.post('/my/login', async (c) => {
  const b = await body(c);
  const token = str(b.token, 100);
  if (!token) throw bad('الرابط ناقص');
  await rateLimit(c.env, 'link:' + ip(c), 30, 15);
  const link = await c.env.DB.prepare('SELECT customer_id, expires_at FROM customer_links WHERE token_hash = ?1').bind(await sha256(token)).first<any>();
  if (!link || link.expires_at < nowIso()) throw new HttpError(401, 'الرابط انتهى. اطلب رابط جديد على الواتساب.');
  await c.env.DB.prepare('UPDATE customer_links SET used_at = ?1 WHERE token_hash = ?2').bind(nowIso(), await sha256(token)).run();
  await startCustomerSession(c, link.customer_id);
  return c.json({ ok: true });
});

api.post('/my/logout', async (c) => {
  await endSession(c, 'customer');
  return c.json({ ok: true });
});

/** Customer asks for a new login link; customer service sends it on WhatsApp. */
api.post('/my/request-link', async (c) => {
  const b = await body(c);
  const phone = normalizePhone(b.phone);
  if (!phone) throw bad('اكتب رقم موبايل صحيح');
  await rateLimit(c.env, 'reqlink:' + ip(c), 5, 60);
  const cust = await c.env.DB.prepare('SELECT id, name FROM customers WHERE phone = ?1').bind(phone).first<any>();
  // Same answer whether or not the number exists, so the form cannot be used to look up customers.
  if (cust) await notify(c.env, { role: 'cs' }, 'customer.link_request', `العميل ${cust.name} (${phone}) يبي رابط حسابه`);
  return c.json({ ok: true });
});

api.get('/my/summary', requireCustomer, async (c) => {
  const id = c.get('customerId')!;
  const [cust, orders, invoices, warranties] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT name, phone FROM customers WHERE id = ?1').bind(id),
    c.env.DB.prepare(`SELECT o.id, o.code, o.status, o.created_at, o.scheduled_at, o.finished_at, (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service, s.name_en AS service_en,
        a.area, u.name AS tech_name, sv.token AS survey_token, sv.submitted_at AS survey_done,
        (SELECT COUNT(*) FROM order_photos p WHERE p.order_id = o.id) AS photos
      FROM orders o LEFT JOIN services s ON s.id = o.service_id LEFT JOIN addresses a ON a.id = o.address_id
      LEFT JOIN users u ON u.id = o.tech_id LEFT JOIN surveys sv ON sv.order_id = o.id
      WHERE o.customer_id = ?1 AND o.status != 'cancelled' ORDER BY o.id DESC`).bind(id),
    c.env.DB.prepare(`SELECT i.number, i.doc_status, i.issued_at, i.total_fils, i.payment_status, i.public_token, o.code
      FROM invoices i JOIN orders o ON o.id = i.order_id WHERE i.customer_id = ?1 AND i.doc_status != 'cancelled' ORDER BY i.id DESC`).bind(id),
    c.env.DB.prepare(`SELECT w.months, w.starts_at, w.ends_at, w.covers, o.code, (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service
      FROM warranties w JOIN orders o ON o.id = w.order_id LEFT JOIN services s ON s.id = o.service_id
      WHERE w.customer_id = ?1 ORDER BY w.ends_at DESC`).bind(id),
  ]);
  return c.json({ customer: cust.results[0], orders: orders.results, invoices: invoices.results, warranties: warranties.results });
});

api.get('/my/orders/:id/photos', requireCustomer, async (c) => {
  const o = await c.env.DB.prepare('SELECT id FROM orders WHERE id = ?1 AND customer_id = ?2').bind(int(c.req.param('id')), c.get('customerId')).first();
  if (!o) throw notFound();
  const rows = await c.env.DB.prepare('SELECT id, kind FROM order_photos WHERE order_id = ?1 ORDER BY id').bind(int(c.req.param('id'))).all();
  return c.json({ photos: rows.results });
});

// ---------------------------------------------------------------- Public token pages

api.get('/public/invoice/:token', async (c) => {
  const inv = await c.env.DB.prepare(
    `SELECT i.id, i.number, i.quote_number, i.doc_status, i.signature, i.signed_name, i.signed_at, i.signed_via, i.invoiced_at, i.paid_at,
            i.issued_at, i.subtotal_fils, i.discount_fils, i.total_fils, i.payment_status, i.paid_fils, i.payment_method, i.notes,
            o.code, o.finished_at, c.name AS customer_name, (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service, u.name AS tech_name, a.governorate, a.area,
            w.months, w.starts_at, w.ends_at, w.covers
     FROM invoices i JOIN orders o ON o.id = i.order_id JOIN customers c ON c.id = i.customer_id
     LEFT JOIN services s ON s.id = o.service_id LEFT JOIN users u ON u.id = o.tech_id LEFT JOIN addresses a ON a.id = o.address_id
     LEFT JOIN warranties w ON w.invoice_id = i.id WHERE i.public_token = ?1`,
  ).bind(c.req.param('token')).first<any>();
  if (!inv || inv.doc_status === 'cancelled') throw notFound('المستند مو موجود');
  const items = await c.env.DB.prepare('SELECT description, qty, unit_fils, total_fils, kind FROM invoice_items WHERE invoice_id = ?1 ORDER BY id').bind(inv.id).all();
  delete inv.id;
  return c.json({ invoice: { ...inv, items: items.results } });
});

/** Before/after photos on the customer's document page, authorised by the document link. */
api.get('/public/doc/:token/photos', async (c) => {
  const doc = await c.env.DB.prepare('SELECT order_id FROM invoices WHERE public_token = ?1').bind(c.req.param('token')).first<any>();
  if (!doc) throw notFound();
  const rows = await c.env.DB.prepare('SELECT id, kind FROM order_photos WHERE order_id = ?1 ORDER BY id').bind(doc.order_id).all();
  return c.json({ photos: rows.results });
});

api.get('/public/doc/:token/photo/:id', async (c) => {
  const p = await c.env.DB.prepare(
    'SELECT p.r2_key, p.content_type FROM order_photos p JOIN invoices i ON i.order_id = p.order_id WHERE i.public_token = ?1 AND p.id = ?2',
  ).bind(c.req.param('token'), int(c.req.param('id'))).first<any>();
  if (!p) throw notFound();
  const obj = await photos(c).get(p.r2_key);
  if (!obj) throw notFound();
  return new Response(obj.body, { headers: { 'content-type': p.content_type, 'cache-control': 'private, max-age=86400' } });
});

api.get('/public/survey/:token', async (c) => {
  const s = await c.env.DB.prepare(
    `SELECT s.submitted_at, o.code, c.name AS customer_name, (SELECT GROUP_CONCAT(sx.name_ar, '، ') FROM order_services osx JOIN services sx ON sx.id = osx.service_id WHERE osx.order_id = o.id) AS service, u.name AS tech_name
     FROM surveys s JOIN orders o ON o.id = s.order_id JOIN customers c ON c.id = o.customer_id
     LEFT JOIN services sv ON sv.id = o.service_id LEFT JOIN users u ON u.id = o.tech_id WHERE s.token = ?1`,
  ).bind(c.req.param('token')).first<any>();
  if (!s) throw notFound('الاستبيان مو موجود');
  return c.json({ survey: { ...s, customer_name: String(s.customer_name).split(' ')[0] } });
});

api.post('/public/survey/:token', async (c) => {
  const b = await body(c);
  const r = (v: unknown) => { const n = int(v); if (!n || n < 1 || n > 5) throw bad('اختار تقييم من 1 إلى 5'); return n; };
  const overall = r(b.overall), tech = r(b.tech), punctuality = r(b.punctuality);
  const consent = b.consent ? 1 : 0;
  const s = await c.env.DB.prepare('SELECT s.id, s.submitted_at, o.id AS order_id, o.code FROM surveys s JOIN orders o ON o.id = s.order_id WHERE s.token = ?1')
    .bind(c.req.param('token')).first<any>();
  if (!s) throw notFound('الاستبيان مو موجود');
  if (s.submitted_at) throw bad('تم استلام تقييمك من قبل. شكراً لك!');
  await c.env.DB.prepare(
    `UPDATE surveys SET submitted_at = ?1, rating_overall = ?2, rating_tech = ?3, rating_punctuality = ?4, comment = ?5, consent_publish = ?6,
     publish_status = CASE WHEN ?6 = 1 THEN 'pending' ELSE 'none' END WHERE id = ?7`,
  ).bind(nowIso(), overall, tech, punctuality, str(b.comment, 1000), consent, s.id).run();
  await logActivity(c.env, null, 'order', s.order_id, 'survey', { overall, tech, punctuality });
  if (overall <= 2) {
    await notify(c.env, { role: 'manager' }, 'survey.low', `تقييم منخفض (${overall}/5) على الطلب ${s.code}`, s.order_id);
    await notify(c.env, { role: 'cs' }, 'survey.low', `تقييم منخفض (${overall}/5) على الطلب ${s.code}. تواصل مع العميل.`, s.order_id);
  }
  emit(c, 'survey.submitted', { order_id: s.order_id, code: s.code, overall, tech, punctuality, consent: !!consent });
  return c.json({ ok: true, ask_google: overall >= 4 });
});

/** Website request form. */
api.post('/public/request', async (c) => {
  const b = await body(c);
  await rateLimit(c.env, 'web:' + ip(c), 5, 60);
  if (str(b.website)) return c.json({ ok: true }); // honeypot
  const pr = parsePhone(b.phone);
  if (!str(b.name)) throw bad('اكتب اسمك');
  if (!pr.ok) throw bad(pr.error);
  const phone = pr.phone;
  const slugs = (Array.isArray(b.service_slugs) ? b.service_slugs : [b.service_slug]).map((v: unknown) => str(v, 60)).filter((v: string | null): v is string => !!v).slice(0, 10);
  const svcRows = slugs.length
    ? (await c.env.DB.prepare(`SELECT id FROM services WHERE slug IN (${slugs.map((_: string, i: number) => '?' + (i + 1)).join(',')})`).bind(...slugs).all<{ id: number }>()).results
    : [];
  const svc = svcRows[0] ?? null;
  const res = await createOrder(c, {
    customer: { name: b.name, phone },
    address: str(b.governorate) ? { governorate: b.governorate, area: str(b.area) ?? str(b.block) ?? '-', block: str(b.block, 20) } : undefined,
    service_ids: svcRows.map((r) => r.id),
    description: [str(b.description, 1500), str(b.service_name, 80) && !svc ? `الخدمة: ${b.service_name}` : null].filter(Boolean).join('\n'),
    preferred_time: b.preferred_time,
  }, 'website', null);
  return c.json({ ok: true, code: res.code });
});

/** Approved reviews for the website. */
api.get('/public/reviews', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT s.rating_overall AS rating, s.comment, s.submitted_at, c.name, a.area, sv.slug AS service
     FROM surveys s JOIN orders o ON o.id = s.order_id JOIN customers c ON c.id = o.customer_id
     LEFT JOIN addresses a ON a.id = o.address_id LEFT JOIN services sv ON sv.id = o.service_id
     WHERE s.publish_status = 'approved' AND s.consent_publish = 1 ORDER BY s.submitted_at DESC LIMIT 50`,
  ).all();
  const reviews = (rows.results as any[]).map((r) => ({ ...r, name: String(r.name).split(' ')[0] }));
  return c.json({ reviews });
});

api.all('*', () => { throw notFound('الرابط مو موجود'); });
export { STATUS_AR };
