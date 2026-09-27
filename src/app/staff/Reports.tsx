// Reports: many filters, totals, breakdowns, detail table, print and Excel (CSV) export.
import { useState } from 'preact/hooks';
import { api, fmtDateTime, fmtDate, kd, phoneDisplay, STATUS, PAY } from '../lib';
import { useLoad, Loading, ErrorBox, StatusBadge, Field, Btn, AreaPicker } from '../ui';
import { DOC } from './Docs';
import { printReport } from '../print';

type F = Record<string, string>;
const EMPTY: F = { code: '', customer: '', phone: '', tech: '', status: '', service: '', gov: '', area: '', doc: '', pay: '', date_by: 'created', from: '', to: '', sort: 'created_desc' };
const kw = (d: Date) => new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
const DATE_BY: Record<string, string> = { created: 'تاريخ التسجيل', visit: 'تاريخ الزيارة', finished: 'تاريخ انتهاء الشغل', invoiced: 'تاريخ الفاتورة' };

export function Reports() {
  const [f, setF] = useState<F>(() => ({ ...EMPTY, from: kw(new Date(Date.now() - 29 * 86400_000)), to: kw(new Date()) }));
  const [applied, setApplied] = useState<F>(f);
  const techs = useLoad(() => api('/users?role=tech'));
  const services = useLoad(() => api('/services'));
  const qs = new URLSearchParams(Object.entries(applied).filter(([, v]) => v !== '') as [string, string][]).toString();
  const { data, error, loading } = useLoad(() => api(`/reports?${qs}`), [qs]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.currentTarget.value });
  const apply = (next = f) => { setF(next); setApplied(next); };
  const range = (days: number | 'month' | 'lastmonth') => {
    const now = new Date(Date.now() + 3 * 3600_000);
    let from: string, to = kw(new Date());
    if (days === 'month') from = `${now.toISOString().slice(0, 7)}-01`;
    else if (days === 'lastmonth') {
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      from = first.toISOString().slice(0, 10); to = last.toISOString().slice(0, 10);
    } else from = kw(new Date(Date.now() - (days - 1) * 86400_000));
    apply({ ...f, from, to });
  };

  const csv = () => {
    const head = ['رقم الطلب', 'تاريخ التسجيل', 'تاريخ الزيارة', 'العميل', 'الموبايل', 'المحافظة', 'المنطقة', 'الخدمات', 'الفني', 'الحالة', 'المستند', 'رقم المستند', 'الإجمالي (د.ك)', 'المدفوع (د.ك)', 'الدفع', 'الكفالة (شهر)', 'التقييم'];
    const lines = data.rows.map((r: any) => [
      r.code, fmtDateTime(r.created_at), r.scheduled_at ? fmtDateTime(r.scheduled_at) : '', r.customer_name, r.customer_phone, r.governorate ?? '', r.area ?? '',
      r.service ?? '', r.tech_name ?? '', STATUS[r.status]?.label ?? r.status, r.doc_status ? DOC[r.doc_status]?.label ?? '' : '', r.doc_number ?? '',
      r.total_fils != null ? (r.total_fils / 1000).toFixed(3) : '', r.paid_fils != null ? (r.paid_fils / 1000).toFixed(3) : '', r.payment_status ? PAY[r.payment_status] : '',
      r.warranty_months ?? '', r.rating ?? '',
    ]);
    const text = '﻿' + [head, ...lines].map((l) => l.map((v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = `تقرير-الطلبات-${applied.from || 'الكل'}-${applied.to || ''}.csv`;
    a.click();
  };

  const filterSummary = () => {
    const parts: string[] = [];
    if (applied.from || applied.to) parts.push(`${DATE_BY[applied.date_by]}: ${applied.from || '…'} إلى ${applied.to || '…'}`);
    if (applied.code) parts.push(`رقم الطلب: ${applied.code}`);
    if (applied.customer) parts.push(`العميل: ${applied.customer}`);
    if (applied.phone) parts.push(`الموبايل: ${applied.phone}`);
    if (applied.tech) parts.push(`الفني: ${applied.tech === 'none' ? 'ما انسند' : techs.data?.users.find((u: any) => String(u.id) === applied.tech)?.name ?? ''}`);
    if (applied.status) parts.push(`الحالة: ${applied.status === 'open' ? 'المفتوحة' : STATUS[applied.status]?.label}`);
    if (applied.service) parts.push(`الخدمة: ${services.data?.services.find((s: any) => String(s.id) === applied.service)?.name_ar ?? ''}`);
    if (applied.gov) parts.push(`المنطقة: ${applied.gov}${applied.area ? ' - ' + applied.area : ''}`);
    if (applied.doc) parts.push(`المستند: ${applied.doc === 'none' ? 'بدون' : DOC[applied.doc]?.label}`);
    if (applied.pay) parts.push(`الدفع: ${PAY[applied.pay]}`);
    return parts.join(' · ') || 'بدون فلترة';
  };

  const s = data?.summary;
  const Breakdown = ({ title, list }: { title: string; list: any[] }) => (
    <div class="card">
      <h2>{title}</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>الاسم</th><th>الطلبات</th><th>خلصت</th><th>المفوتر</th><th>المحصّل</th><th>التقييم</th></tr></thead>
        <tbody>{list.map((g) => <tr><td>{g.name}</td><td class="num">{g.orders}</td><td class="num">{g.done}</td><td class="num">{kd(g.billed_fils)}</td><td class="num">{kd(g.paid_fils)}</td><td class="num">{g.rating ? g.rating.toFixed(1) : '—'}</td></tr>)}</tbody>
      </table></div>
    </div>
  );

  return (
    <div>
      <div class="page-head no-print">
        <h1>التقارير</h1>
        <div class="row">
          {data?.rows.length > 0 && <Btn icon="list" onClick={csv}>Excel</Btn>}
          {data && <Btn icon="receipt" onClick={() => printReport(data, filterSummary(), (st) => DOC[st]?.label ?? st)}>اطبع</Btn>}
        </div>
      </div>

      <form class="card no-print" style="margin-bottom:14px" onSubmit={(e) => { e.preventDefault(); apply(); }}>
        <div class="tabs">
          <button type="button" onClick={() => range(1)}>اليوم</button>
          <button type="button" onClick={() => range(7)}>آخر 7 أيام</button>
          <button type="button" onClick={() => range('month')}>هالشهر</button>
          <button type="button" onClick={() => range('lastmonth')}>الشهر اللي طاف</button>
          <button type="button" onClick={() => range(365)}>آخر سنة</button>
        </div>
        <div class="grid2">
          <Field label="التاريخ حسب">
            <select id="rp-dateby" class="input" value={f.date_by} onChange={set('date_by')}>{Object.entries(DATE_BY).map(([k, v]) => <option value={k}>{v}</option>)}</select>
          </Field>
          <div class="row" style="align-items:flex-end;flex-wrap:nowrap">
            <Field label="من"><input id="rp-from" class="input" type="date" value={f.from} onInput={set('from')} /></Field>
            <Field label="إلى"><input id="rp-to" class="input" type="date" value={f.to} onInput={set('to')} /></Field>
          </div>
          <Field label="رقم الطلب"><input id="rp-code" class="input" dir="ltr" placeholder="SB-26…" value={f.code} onInput={set('code')} /></Field>
          <Field label="اسم العميل"><input id="rp-cust" class="input" value={f.customer} onInput={set('customer')} /></Field>
          <Field label="موبايل العميل"><input id="rp-phone" class="input" type="tel" dir="ltr" value={f.phone} onInput={set('phone')} /></Field>
          <Field label="الفني">
            <select id="rp-tech" class="input" value={f.tech} onChange={set('tech')}>
              <option value="">كل الفنيين</option>
              {techs.data?.users.map((u: any) => <option value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="حالة الطلب">
            <select id="rp-status" class="input" value={f.status} onChange={set('status')}>
              <option value="">كل الحالات</option><option value="open">المفتوحة</option>
              {Object.entries(STATUS).map(([k, v]) => <option value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="الخدمة">
            <select id="rp-svc" class="input" value={f.service} onChange={set('service')}>
              <option value="">كل الخدمات</option>
              {services.data?.services.map((x: any) => <option value={x.id}>{x.name_ar}</option>)}
            </select>
          </Field>
          <AreaPicker idPrefix="rp" gov={f.gov} area={f.area} allowAny onChange={(gov, area) => setF({ ...f, gov, area })} />
          <Field label="المستند">
            <select id="rp-doc" class="input" value={f.doc} onChange={set('doc')}>
              <option value="">الكل</option><option value="none">بدون عرض أو فاتورة</option>
              {Object.entries(DOC).map(([k, v]) => <option value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="الدفع">
            <select id="rp-pay" class="input" value={f.pay} onChange={set('pay')}>
              <option value="">الكل</option>{Object.entries(PAY).map(([k, v]) => <option value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="الترتيب">
            <select id="rp-sort" class="input" value={f.sort} onChange={set('sort')}>
              <option value="created_desc">التسجيل: الأحدث أول</option><option value="created_asc">التسجيل: الأقدم أول</option>
              <option value="visit_desc">الزيارة: الأحدث أول</option><option value="visit_asc">الزيارة: الأقدم أول</option>
              <option value="total_desc">المبلغ: الأعلى أول</option>
            </select>
          </Field>
        </div>
        <div class="row" style="margin-top:12px">
          <button class="btn primary" type="submit">اعرض التقرير</button>
          <button type="button" class="btn ghost" onClick={() => apply({ ...EMPTY })}>امسح الفلاتر</button>
        </div>
      </form>

      <div class="print-only print-head">
        <b>شلال بيروت · تقرير الطلبات</b>
        <span>{filterSummary()}</span>
        <span>طُبع: {fmtDateTime(new Date().toISOString())}</span>
      </div>

      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data && (
        <div class="stack">
          <p class="muted small no-print">{filterSummary()}</p>
          {s.truncated && <div class="note">النتائج كثيرة وايد، يطلع أول 2000 طلب بس. ضيّق الفترة.</div>}
          <div class="stats">
            <div class="stat"><div class="v">{s.orders}</div><div class="l">طلب</div></div>
            <div class="stat"><div class="v">{s.invoices}</div><div class="l">فاتورة</div></div>
            <div class="stat"><div class="v num" style="font-size:1.15rem">{kd(s.billed_fils)}</div><div class="l">المفوتر</div></div>
            <div class="stat"><div class="v num" style="font-size:1.15rem">{kd(s.paid_fils)}</div><div class="l">المحصّل</div></div>
            <div class={`stat ${s.billed_fils - s.paid_fils > 0 ? 'alert' : ''}`}><div class="v num" style="font-size:1.15rem">{kd(s.billed_fils - s.paid_fils)}</div><div class="l">باقي ما انحصّل</div></div>
            <div class="stat"><div class="v num" style="font-size:1.15rem">{kd(s.quotes_fils)}</div><div class="l">عروض وأوامر عمل مفتوحة</div></div>
            <div class="stat"><div class="v">{s.rating ? s.rating.toFixed(1) : '—'}</div><div class="l">متوسط التقييم</div></div>
          </div>
          <div class="card">
            <h2>حسب الحالة</h2>
            <div class="row">{Object.entries(s.by_status).map(([k, n]) => <span class="row" style="gap:6px"><StatusBadge status={k} /><b class="num">{n as number}</b></span>)}</div>
          </div>
          <div class="grid2">
            <Breakdown title="حسب الفني" list={data.by_tech} />
            <Breakdown title="حسب الخدمة" list={data.by_service} />
          </div>
          <Breakdown title="حسب المحافظة" list={data.by_gov} />
          <div class="card">
            <h2>التفاصيل ({data.rows.length})</h2>
            {data.rows.length === 0 ? <p class="muted">ما في طلبات بهالفلترة.</p> : (
              <div class="table-wrap"><table class="report-table">
                <thead><tr><th>الطلب</th><th>التسجيل</th><th>الزيارة</th><th>العميل</th><th>المنطقة</th><th>الخدمات</th><th>الفني</th><th>الحالة</th><th>المستند</th><th>الإجمالي</th><th>المدفوع</th></tr></thead>
                <tbody>{data.rows.map((r: any) => (
                  <tr>
                    <td><a class="num" href={`/app/orders/${r.id}/`}>{r.code}</a></td>
                    <td class="small">{fmtDate(r.created_at)}</td>
                    <td class="small">{r.scheduled_at ? fmtDate(r.scheduled_at) : '—'}</td>
                    <td class="small">{r.customer_name}<div class="muted num">{phoneDisplay(r.customer_phone)}</div></td>
                    <td class="small">{r.area ?? '—'}</td>
                    <td class="small">{r.service ?? '—'}</td>
                    <td class="small">{r.tech_name ?? '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td class="small">{r.doc_status ? <>{DOC[r.doc_status]?.label}<div class="muted num">{r.doc_number}</div></> : '—'}</td>
                    <td class="num">{r.total_fils != null ? kd(r.total_fils) : '—'}</td>
                    <td class="num">{r.paid_fils ? kd(r.paid_fils) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
