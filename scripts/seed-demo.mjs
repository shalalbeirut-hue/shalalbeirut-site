// Demo data for trying the system: staff, customers, orders in every state, quotes, signatures, invoices, surveys, photos.
// Everything is marked as demo (codes *-DEMO-*, phones 9650000xxxx) and can be removed with scripts/clear-demo.sql.
//
//   node scripts/seed-demo.mjs --env preview      (or --env dev for the local database)
//
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

const env = process.argv.includes('--env') ? process.argv[process.argv.indexOf('--env') + 1] : 'dev';
if (!['dev', 'preview'].includes(env)) { console.error('Demo data is only for --env dev or --env preview.'); process.exit(1); }
const REMOTE = env === 'preview';
const DB = env === 'preview' ? 'shalalbeirut-ops-preview' : 'shalalbeirut-ops-dev';
const BUCKET = env === 'preview' ? 'shalalbeirut-photos-preview' : 'shalalbeirut-photos-dev';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const wr = (args) => execFileSync(npx, ['wrangler', ...args, '--env', env, ...(REMOTE ? ['--remote'] : ['--local'])], { stdio: 'pipe', shell: process.platform === 'win32' });

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const ins = (table, row) => `INSERT INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(q).join(', ')});`;
const tok = (n = 18) => randomBytes(n).toString('base64url');
const H = 3600_000, D = 24 * H;
const t = (ms) => new Date(Date.now() + ms).toISOString();
const monthsLater = (iso, m) => { const d = new Date(iso); d.setUTCMonth(d.getUTCMonth() + m); return d.toISOString(); };

const sql = [];

// ---- Staff. Random, unknown passwords: nobody can log in until the admin sets one from "الفريق".
const staff = [
  { id: 1001, name: 'أحمد (فني ديمو)', phone: '96500000101', role: 'tech' },
  { id: 1002, name: 'محمود (فني ديمو)', phone: '96500000102', role: 'tech' },
  { id: 1003, name: 'رامي (فني ديمو)', phone: '96500000103', role: 'tech' },
  { id: 1004, name: 'سارة (خدمة عملاء ديمو)', phone: '96500000104', role: 'cs' },
];
for (const s of staff) sql.push(ins('users', { ...s, pass_hash: `100000$${randomBytes(32).toString('base64')}`, pass_salt: randomBytes(16).toString('base64'), must_change_pass: 1, active: 1 }));

// ---- Customers and addresses
const customers = [
  ['أبو فهد العنزي', 'حولي', 'السالمية', '10', '5', '14'],
  ['أم خالد', 'الأحمدي', 'الفحيحيل', '3', '12', '7'],
  ['يوسف المطيري', 'الجهراء', 'سعد العبدالله', '6', '601', '22'],
  ['نورة الشمري', 'الفروانية', 'خيطان', '4', '15', '9'],
  ['عبدالله الرشيدي', 'مبارك الكبير', 'صباح السالم', '2', '10', '31'],
  ['مكتب الريادة (شركة)', 'العاصمة', 'شرق', '1', 'خالد بن الوليد', 'برج 3'],
  ['أبو ناصر', 'حولي', 'الجابرية', '9', '3', '18'],
  ['مريم الكندري', 'العاصمة', 'كيفان', '5', '52', '6'],
  ['حسين بهبهاني', 'الأحمدي', 'المنقف', '1', '4', '40'],
  ['مسجد الفردوس', 'الفروانية', 'الفردوس', '3', '1', 'مسجد'],
];
customers.forEach(([name, gov, area, block, street, building], i) => {
  const id = 1001 + i;
  sql.push(ins('customers', { id, name, phone: `965000002${String(i + 1).padStart(2, '0')}`, notes: 'بيانات تجريبية (ديمو)' }));
  sql.push(ins('addresses', { id, customer_id: id, governorate: gov, area, block, street, building, maps_url: 'https://maps.google.com/?q=29.3375,48.0636' }));
});

// ---- Signature (a drawn scribble as PNG data URL)
const sigPng = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120"><path d="M20 80 C40 20 70 20 80 70 S120 110 140 50 S190 20 200 75 S250 100 270 60 S320 40 340 70" fill="none" stroke="#14211b" stroke-width="4" stroke-linecap="round"/><path d="M60 95 L300 92" stroke="#14211b" stroke-width="2"/></svg>`)).png().toBuffer();
const signature = 'data:image/png;base64,' + sigPng.toString('base64');

// ---- Demo photos (drawn, not real jobs)
async function photo(kind, label) {
  const bg = kind === 'before' ? '#6d4c3d' : '#dfeee6';
  const pipe = kind === 'before' ? '#8a8a8a' : '#c9d3cf';
  const water = kind === 'before' ? `<path d="M520 260 q-40 90 -10 160 q30 60 -20 120" stroke="#3f7fa8" stroke-width="26" fill="none" stroke-linecap="round" opacity=".8"/><ellipse cx="480" cy="640" rx="200" ry="40" fill="#3f7fa8" opacity=".5"/>` : `<circle cx="520" cy="260" r="34" fill="#1B8CC4"/><path d="M505 262l12 12 22-26" stroke="#fff" stroke-width="8" fill="none"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <rect width="1200" height="900" fill="${bg}"/>
    <rect x="0" y="700" width="1200" height="200" fill="${kind === 'before' ? '#4f3a2e' : '#f5f8f6'}"/>
    <rect x="160" y="220" width="820" height="60" rx="30" fill="${pipe}"/>
    <rect x="480" y="220" width="80" height="80" rx="12" fill="${kind === 'before' ? '#6f6f6f' : '#17583A'}"/>
    <rect x="880" y="220" width="60" height="420" rx="30" fill="${pipe}"/>
    ${water}
    <rect x="40" y="40" width="360" height="90" rx="16" fill="rgba(0,0,0,.55)"/>
    <text x="220" y="100" font-family="Arial" font-size="48" font-weight="700" fill="#fff" text-anchor="middle">${kind.toUpperCase()} · DEMO</text>
    <text x="1160" y="870" font-family="Arial" font-size="28" fill="${kind === 'before' ? '#e8d9cf' : '#56665e'}" text-anchor="end">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 78 }).toBuffer();
}

// ---- Orders
// [n, customer#, service_id, status, tech, scheduledOffset, doc, items, discountKd, months, pay, survey]
const L = (d, qty, kd, kind = 'labour') => ({ d, qty, kd, kind });
const orders = [
  { n: 1, c: 1, s: 1, status: 'new', desc: 'تسريب ماي تحت مغسلة المطبخ والخشب منتفخ', src: 'website', pref: 'بكرة العصر' },
  { n: 2, c: 4, s: 2, status: 'new', desc: 'البلاعة في الحمام ترجع ماي', src: 'whatsapp', urgent: true },
  { n: 3, c: 2, s: 4, status: 'assigned', tech: 1001, at: 3 * H, desc: 'السخان يطفي الكهربا' },
  { n: 4, c: 5, s: 5, status: 'assigned', tech: 1002, at: D + 2 * H, desc: 'تنظيف خزان سطح + فحص المضخة' },
  { n: 5, c: 7, s: 7, s2: [3], status: 'on_the_way', tech: 1003, at: 30 * 60_000, desc: 'تركيب خلاط مغسلة وشطاف', doc: 'quote',
    items: [L('تركيب خلاط', 1, 5), L('تركيب شطاف', 1, 3), L('خلاط مغسلة', 1, 18, 'part'), L('شطاف', 1, 6, 'part')] },
  { n: 6, c: 3, s: 4, s2: [1], status: 'in_progress', tech: 1001, at: -2 * H, desc: 'ماي السخان ما تحر', doc: 'work_order', photos: ['before'],
    items: [L('تبديل هيتر', 1, 8), L('هيتر سخان', 1, 6.5, 'part'), L('ثرموستات سخان', 1, 4.5, 'part')] },
  { n: 7, c: 8, s: 1, status: 'done', tech: 1002, at: -26 * H, desc: 'رطوبة في جدار الحمام', doc: 'invoice', photos: ['before', 'after'], months: 6, pay: 'unpaid', followupDue: -2 * H,
    items: [L('كشف تسربات', 1, 15), L('إصلاح تسريب ماسورة', 1, 12), L('كوع / وصلة', 3, 1.5, 'part')] },
  { n: 8, c: 9, s: 2, status: 'done', tech: 1003, at: -30 * H, desc: 'انسداد خط رئيسي', doc: 'invoice', months: 3, pay: 'partial', paid: 10, followupDue: -6 * H,
    items: [L('تسليك خط رئيسي', 1, 20)] },
  { n: 9, c: 1, s: 7, status: 'closed', tech: 1001, at: -9 * D, desc: 'تركيب كرسي حمام معلق', doc: 'paid', photos: ['before', 'after'], months: 12, pay: 'paid',
    survey: { o: 5, t: 5, p: 5, c: 'شغل نظيف جداً ووصلوا بالموعد بالضبط. مشكورين', consent: 1, publish: 'approved' },
    items: [L('تركيب كرسي حمام', 1, 15), L('سيفون كرسي', 1, 22, 'part'), L('ليّ مرن (هوز)', 2, 1.5, 'part')] },
  { n: 10, c: 6, s: 6, status: 'closed', tech: 1002, at: -15 * D, desc: 'صيانة برادات المكتب', doc: 'paid', months: 3, pay: 'paid', discount: 5,
    survey: { o: 4, t: 5, p: 4, c: 'الخدمة ممتازة، تأخروا ربع ساعة بس', consent: 1, publish: 'pending' },
    items: [L('صيانة براد مياه', 4, 7), L('فلتر براد', 4, 3.5, 'part')] },
  { n: 11, c: 10, s: 5, status: 'closed', tech: 1003, at: -190 * D, desc: 'تنظيف وتعقيم خزانات المسجد', doc: 'paid', months: 1, pay: 'paid',
    survey: { o: 5, t: 4, p: 5, c: null, consent: 0, publish: 'none' },
    items: [L('تنظيف وتعقيم خزان', 2, 25)] },
  { n: 12, c: 2, s: 3, status: 'reopened', tech: 1001, at: -4 * D, desc: 'تبديل محبس رئيسي، رجع يسرّب', doc: 'invoice', months: 3, pay: 'paid',
    survey: { o: 2, t: 3, p: 4, c: 'المحبس رجع يقطر بعد يومين', consent: 0, publish: 'none' },
    items: [L('تبديل محبس', 1, 6), L('محبس', 1, 4, 'part')] },
];

const photoFiles = [];
let photoId = 1001;
for (const o of orders) {
  const id = 1000 + o.n;
  const code = `SB-DEMO-${String(o.n).padStart(2, '0')}`;
  const sched = o.at !== undefined ? t(o.at) : null;
  const created = t((o.at ?? -3 * H) - 20 * H);
  const started = ['in_progress', 'done', 'closed', 'reopened'].includes(o.status) ? t((o.at ?? 0) + 10 * 60_000) : null;
  const finished = ['done', 'closed', 'reopened'].includes(o.status) ? t((o.at ?? 0) + 2 * H) : null;
  sql.push(ins('orders', {
    id, code, customer_id: 1000 + o.c, address_id: 1000 + o.c, service_id: o.s, source: o.src ?? 'phone', description: o.desc,
    status: o.status, priority: o.urgent ? 'urgent' : 'normal', preferred_time: o.pref ?? null, scheduled_at: sched, tech_id: o.tech ?? null,
    assigned_at: o.tech ? created : null, on_way_at: ['on_the_way', 'in_progress', 'done', 'closed', 'reopened'].includes(o.status) ? t((o.at ?? 0) - 25 * 60_000) : null,
    started_at: started, start_lat: started ? 29.3375 : null, start_lng: started ? 48.0636 : null, finished_at: finished,
    closed_at: o.status === 'closed' ? t((o.at ?? 0) + 26 * H) : null, created_at: created, updated_at: finished ?? created,
  }));
  for (const sid of [o.s, ...(o.s2 ?? [])]) sql.push(ins('order_services', { order_id: id, service_id: sid }));
  sql.push(ins('activity_log', { entity: 'order', entity_id: id, action: 'created', data: '{"source":"demo"}', created_at: created }));

  if (o.doc) {
    const docId = id;
    const items = o.items.map((i) => ({ ...i, unit: Math.round(i.kd * 1000), total: Math.round(i.kd * 1000 * i.qty) }));
    const sub = items.reduce((s, i) => s + i.total, 0);
    const disc = Math.round((o.discount ?? 0) * 1000);
    const total = sub - disc;
    const isInv = o.doc === 'invoice' || o.doc === 'paid';
    const paid = o.pay === 'paid' ? total : o.pay === 'partial' ? Math.round(o.paid * 1000) : 0;
    const signed = o.doc !== 'quote';
    sql.push(ins('invoices', {
      id: docId, number: isInv ? `INV-DEMO-${String(o.n).padStart(3, '0')}` : `Q-DEMO-${String(o.n).padStart(3, '0')}`, quote_number: `Q-DEMO-${String(o.n).padStart(3, '0')}`,
      order_id: id, customer_id: 1000 + o.c, issued_at: started ?? created, subtotal_fils: sub, discount_fils: disc, total_fils: total,
      payment_status: isInv ? o.pay : 'unpaid', paid_fils: paid, payment_method: paid ? 'knet' : null, public_token: tok(),
      doc_status: o.doc, signature: signed ? signature : null, signed_name: signed ? customers[o.c - 1][0] : null, signed_at: signed ? started : null,
      signed_via: signed ? 'onsite' : null, invoiced_at: isInv ? finished : null, paid_at: o.pay === 'paid' && isInv ? finished : null,
      sent_at: isInv ? finished : null, created_by: o.tech ?? null,
    }));
    for (const i of items) sql.push(ins('invoice_items', { invoice_id: docId, description: i.d, qty: i.qty, unit_fils: i.unit, total_fils: i.total, kind: i.kind }));
    if (isInv && o.months) sql.push(ins('warranties', { order_id: id, customer_id: 1000 + o.c, invoice_id: docId, months: o.months, starts_at: finished, ends_at: monthsLater(finished, o.months), covers: 'الشغل والقطع المركّبة' }));
    if (isInv) {
      const sv = o.survey;
      sql.push(ins('surveys', {
        order_id: id, token: tok(12), sent_at: finished, submitted_at: sv ? t((o.at ?? 0) + 5 * H) : null,
        rating_overall: sv?.o ?? null, rating_tech: sv?.t ?? null, rating_punctuality: sv?.p ?? null, comment: sv?.c ?? null,
        consent_publish: sv?.consent ?? 0, publish_status: sv?.publish ?? 'none',
      }));
      const due = o.followupDue !== undefined ? t(o.followupDue) : t((o.at ?? 0) + 26 * H);
      const done = o.status === 'closed' ? { done_at: t((o.at ?? 0) + 26 * H), done_by: 1004, result: 'resolved', notes: 'العميل مرتاح' }
        : o.status === 'reopened' ? { done_at: t((o.at ?? 0) + 30 * H), done_by: 1004, result: 'not_resolved', notes: 'يقول المحبس رجع يقطر' } : {};
      sql.push(ins('followups', { order_id: id, due_at: due, ...done }));
    }
  }
  for (const kind of o.photos ?? []) {
    for (let k = 0; k < 2; k++) {
      const key = `orders/${code}/${kind}-demo-${k + 1}.jpg`;
      const buf = await photo(kind, code);
      photoFiles.push({ key, buf });
      sql.push(ins('order_photos', { id: photoId++, order_id: id, kind, r2_key: key, content_type: 'image/jpeg', size: buf.length, uploaded_by: o.tech ?? null }));
    }
  }
}

// Notifications so the bell has something to show.
sql.push(ins('notifications', { role: 'cs', type: 'order.new', order_id: 1001, message: 'طلب جديد من الموقع SB-DEMO-01' }));
sql.push(ins('notifications', { role: 'manager', type: 'survey.low', order_id: 1012, message: 'تقييم منخفض (2/5) على الطلب SB-DEMO-12' }));
sql.push(ins('notifications', { role: 'manager', type: 'followup.not_resolved', order_id: 1012, message: 'العميل يقول العطل ما انحل في الطلب SB-DEMO-12' }));

// ---- Run
const dir = mkdtempSync(join(tmpdir(), 'sb-demo-'));
try {
  const file = join(dir, 'demo.sql');
  writeFileSync(file, sql.join('\n'));
  console.log(`Inserting ${sql.length} rows into ${DB}…`);
  wr(['d1', 'execute', DB, '--file', file, '--yes']);
  console.log(`Uploading ${photoFiles.length} demo photos to ${BUCKET}…`);
  for (const p of photoFiles) {
    const f = join(dir, 'p.jpg');
    writeFileSync(f, p.buf);
    wr(['r2', 'object', 'put', `${BUCKET}/${p.key}`, '--file', f, '--content-type', 'image/jpeg']);
  }
  console.log('Demo data ready.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
