// Clean printouts: builds a dedicated A4 page in a hidden frame (logo, title, filters, table) and prints it.
// Used instead of printing the app screen, so menus and buttons never end up on paper.
import { fmtDateTime, fmtDate, kd, phoneDisplay, STATUS } from './lib';

export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));

const MARK = `<svg viewBox="10 1 100 110" width="34" height="38" aria-hidden="true"><path d="M60 4C60 4 54 11 54 14.5A6 6 0 0 0 66 14.5C66 11 60 4 60 4Z" fill="#1B8CC4"/><g fill="none" stroke="#17583A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M60 25V92"/><path d="M49 38V36Q49 30 55 30H65Q71 30 71 36V38"/><path d="M40 53V50Q40 44 46 44H74Q80 44 80 50V53"/><path d="M31 68V64Q31 58 37 58H83Q89 58 89 64V68"/><path d="M22 83V78Q22 72 28 72H92Q98 72 98 78V83"/></g><path d="M14 104q11.5-7 23 0t23 0t23 0t23 0" fill="none" stroke="#1B8CC4" stroke-width="6" stroke-linecap="round"/></svg>`;

const CSS = (landscape: boolean) => `
@page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'IBM Plex Sans Arabic', Tahoma, sans-serif; color: #14211b; font-size: 10pt; line-height: 1.45; }
h1, h2, h3 { font-family: 'Readex Pro', 'IBM Plex Sans Arabic', sans-serif; margin: 0; }
.head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #17583A; padding-bottom: 8px; margin-bottom: 10px; }
.brand { display: flex; align-items: center; gap: 8px; }
.brand b { font-family: 'Readex Pro', sans-serif; font-size: 15pt; color: #17583A; }
.title { text-align: left; }
.title h1 { font-size: 14pt; }
.meta { font-size: 8.5pt; color: #56665e; }
.filters { background: #f2f6f3; border-radius: 6px; padding: 5px 8px; font-size: 8.5pt; color: #3f5147; margin-bottom: 10px; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
th { background: #17583A; color: #fff; font-weight: 600; font-size: 8.5pt; padding: 5px 6px; text-align: start; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
td { border-bottom: 1px solid #d8e1db; padding: 5px 6px; vertical-align: top; font-size: 9pt; }
tr { break-inside: avoid; }
tbody tr:nth-child(even) td { background: #f7faf8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.num { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; white-space: nowrap; }
.muted { color: #56665e; font-size: 8pt; }
.date { white-space: nowrap; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px; margin-bottom: 10px; }
.tile { border: 1px solid #d8e1db; border-radius: 6px; padding: 6px 8px; }
.tile b { display: block; font-family: 'Readex Pro', sans-serif; font-size: 12pt; color: #17583A; }
.section { margin: 12px 0 6px; font-size: 11pt; color: #17583A; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.box { border: 1px solid #d8e1db; border-radius: 8px; padding: 8px 10px; break-inside: avoid; }
.box .l { font-size: 8pt; color: #56665e; font-weight: 600; }
.lines { height: 90px; background: repeating-linear-gradient(transparent 0 21px, #c7d3cc 21px 22px); }
.sign { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 18px; }
.sign div { border-top: 1px solid #14211b; padding-top: 4px; font-size: 8.5pt; color: #56665e; }
.foot { margin-top: 12px; font-size: 8pt; color: #8fa89a; display: flex; justify-content: space-between; }
`;

/** Prints the given HTML body on a clean page. */
export async function printHtml(title: string, body: string, opts: { landscape?: boolean } = {}) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600&family=Readex+Pro:wght@600;700&display=swap">
    <style>${CSS(!!opts.landscape)}</style></head><body>${body}
    <div class="foot"><span>شلال بيروت للأدوات الصحية وصيانتها · shalalbeirut.com</span><span>طُبع ${esc(fmtDateTime(new Date().toISOString()))}</span></div>
    </body></html>`);
  doc.close();
  await new Promise((r) => (frame.contentWindow!.document.readyState === 'complete' ? r(null) : frame.addEventListener('load', r, { once: true })));
  await Promise.race([doc.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]);
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 60_000);
}

const header = (title: string, sub = '') =>
  `<div class="head"><div class="brand">${MARK}<b>شلال بيروت</b></div><div class="title"><h1>${esc(title)}</h1>${sub ? `<div class="meta">${esc(sub)}</div>` : ''}</div></div>`;

/** Orders exactly as filtered on screen. */
export function printOrders(rows: any[], filters: string) {
  const body = `${header('قائمة الطلبات', `${rows.length} طلب`)}
    <div class="filters">${esc(filters || 'بدون فلترة')}</div>
    <table><thead><tr><th>#</th><th>الطلب</th><th>العميل</th><th>الموبايل</th><th>الخدمات</th><th>المنطقة</th><th>الفني</th><th>الزيارة</th><th>التسجيل</th><th>الحالة</th></tr></thead>
    <tbody>${rows.map((o, i) => `<tr>
      <td class="num">${i + 1}</td><td class="num">${esc(o.code)}${o.priority === 'urgent' ? ' <b>(مستعجل)</b>' : ''}</td>
      <td>${esc(o.customer_name)}</td><td class="num">${esc(phoneDisplay(o.customer_phone))}</td><td>${esc(o.service ?? '—')}</td>
      <td>${esc(o.area ? `${o.governorate ?? ''} - ${o.area}${o.block ? ' ق' + o.block : ''}` : '—')}</td><td>${esc(o.tech_name ?? 'ما انسند')}</td>
      <td class="date">${esc(o.scheduled_at ? fmtDateTime(o.scheduled_at) : o.preferred_time ? 'يفضّل: ' + o.preferred_time : '—')}</td>
      <td class="date">${esc(fmtDateTime(o.created_at))}</td><td>${esc(STATUS[o.status]?.label ?? o.status)}</td></tr>`).join('')}</tbody></table>`;
  return printHtml('قائمة الطلبات', body, { landscape: true });
}

/** Report: totals, breakdowns and details. */
export function printReport(data: any, filters: string, docLabel: (s: string) => string) {
  const s = data.summary;
  const tile = (label: string, value: string) => `<div class="tile"><b class="num">${esc(value)}</b>${esc(label)}</div>`;
  const breakdown = (title: string, list: any[]) => `<h3 class="section">${esc(title)}</h3>
    <table><thead><tr><th>الاسم</th><th>الطلبات</th><th>خلصت</th><th>المفوتر</th><th>المحصّل</th><th>التقييم</th></tr></thead>
    <tbody>${list.map((g) => `<tr><td>${esc(g.name)}</td><td class="num">${g.orders}</td><td class="num">${g.done}</td><td class="num">${esc(kd(g.billed_fils))}</td><td class="num">${esc(kd(g.paid_fils))}</td><td class="num">${g.rating ? g.rating.toFixed(1) : '—'}</td></tr>`).join('')}</tbody></table>`;
  const body = `${header('تقرير الطلبات', `${s.orders} طلب`)}
    <div class="filters">${esc(filters)}</div>
    <div class="tiles">
      ${tile('طلب', String(s.orders))}${tile('فاتورة', String(s.invoices))}${tile('المفوتر', kd(s.billed_fils))}${tile('المحصّل', kd(s.paid_fils))}
      ${tile('باقي ما انحصّل', kd(s.billed_fils - s.paid_fils))}${tile('عروض وأوامر مفتوحة', kd(s.quotes_fils))}${tile('متوسط التقييم', s.rating ? s.rating.toFixed(1) : '—')}
    </div>
    <div class="grid2"><div>${breakdown('حسب الفني', data.by_tech)}</div><div>${breakdown('حسب الخدمة', data.by_service)}</div></div>
    ${breakdown('حسب المحافظة', data.by_gov)}
    <h3 class="section">التفاصيل (${data.rows.length})</h3>
    <table><thead><tr><th>الطلب</th><th>التسجيل</th><th>الزيارة</th><th>العميل</th><th>الموبايل</th><th>المنطقة</th><th>الخدمات</th><th>الفني</th><th>الحالة</th><th>المستند</th><th>الإجمالي</th><th>المدفوع</th></tr></thead>
    <tbody>${data.rows.map((r: any) => `<tr>
      <td class="num">${esc(r.code)}</td><td class="date">${esc(fmtDate(r.created_at))}</td><td class="date">${esc(r.scheduled_at ? fmtDate(r.scheduled_at) : '—')}</td>
      <td>${esc(r.customer_name)}</td><td class="num">${esc(phoneDisplay(r.customer_phone))}</td><td>${esc(r.area ?? '—')}</td><td>${esc(r.service ?? '—')}</td>
      <td>${esc(r.tech_name ?? '—')}</td><td>${esc(STATUS[r.status]?.label ?? r.status)}</td>
      <td>${esc(r.doc_status ? `${docLabel(r.doc_status)} ${r.doc_number ?? ''}` : '—')}</td>
      <td class="num">${esc(r.total_fils != null ? kd(r.total_fils) : '—')}</td><td class="num">${esc(r.paid_fils ? kd(r.paid_fils) : '—')}</td></tr>`).join('')}</tbody></table>`;
  return printHtml('تقرير الطلبات', body, { landscape: true });
}

/** Job sheet for one order: what the technician needs on paper. */
export function printOrder(d: any, docLabel: (s: string) => string) {
  const { order: o, customer: c, address: a, services, tech, invoice } = d;
  const addr = a ? [a.governorate, a.area, a.block && `قطعة ${a.block}`, a.street && `شارع ${a.street}`, a.avenue && `جادة ${a.avenue}`, a.building && `منزل/مبنى ${a.building}`, a.floor && `دور ${a.floor}`, a.flat && `شقة ${a.flat}`].filter(Boolean).join(' - ') : '—';
  const items = invoice?.items?.length
    ? `<h3 class="section">${esc(docLabel(invoice.doc_status))} ${esc(invoice.number)}</h3>
       <table><thead><tr><th>البند</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
       <tbody>${invoice.items.map((i: any) => `<tr><td>${esc(i.description)}</td><td class="num">${i.qty}</td><td class="num">${esc(kd(i.unit_fils))}</td><td class="num">${esc(kd(i.total_fils))}</td></tr>`).join('')}
       <tr><td colspan="3"><b>الإجمالي</b></td><td class="num"><b>${esc(kd(invoice.total_fils))}</b></td></tr></tbody></table>`
    : '';
  const body = `${header(`أمر زيارة ${o.code}`, `${STATUS[o.status]?.label ?? o.status}${o.priority === 'urgent' ? ' · مستعجل' : ''}`)}
    <div class="grid2">
      <div class="box"><div class="l">العميل</div><b>${esc(c.name)}</b><div class="num">${esc(phoneDisplay(c.phone))}${c.phone2 ? ' / ' + esc(phoneDisplay(c.phone2)) : ''}</div>${c.notes ? `<div class="muted">${esc(c.notes)}</div>` : ''}</div>
      <div class="box"><div class="l">الموعد والفني</div><b>${esc(o.scheduled_at ? fmtDateTime(o.scheduled_at) : o.preferred_time ? 'يفضّل: ' + o.preferred_time : 'بدون موعد')}</b><div>${esc(tech?.name ?? 'ما انسند')}</div></div>
    </div>
    <div class="box" style="margin-top:10px"><div class="l">العنوان</div>${esc(addr)}${a?.notes ? `<div class="muted">${esc(a.notes)}</div>` : ''}${a?.maps_url ? `<div class="muted num">${esc(a.maps_url)}</div>` : ''}</div>
    <div class="box" style="margin-top:10px"><div class="l">الخدمات المطلوبة</div><b>${esc(services.map((s: any) => s.name_ar).join('، ') || '—')}</b>${o.description ? `<div style="white-space:pre-line;margin-top:4px">${esc(o.description)}</div>` : ''}</div>
    ${items}
    <h3 class="section">ملاحظات الفني</h3><div class="lines"></div>
    <div class="sign"><div>توقيع العميل بالاستلام</div><div>توقيع الفني</div></div>`;
  return printHtml(`أمر زيارة ${o.code}`, body);
}
