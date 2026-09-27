// Customer service and office pages: follow-ups, surveys, invoices, customers.
import { useState } from 'preact/hooks';
import { api, fmtDateTime, fmtDate, kd, phoneDisplay, telHref, waHref, PAY, openWa, GOVERNORATES } from '../lib';
import { useLoad, Loading, ErrorBox, StatusBadge, Stars, Icon, Field, Btn, Modal, useAction, AreaPicker } from '../ui';
import { useApp } from './App';
import { DOC } from './Docs';

export function Followups() {
  const { refreshCounts } = useApp();
  const [all, setAll] = useState(false);
  const { data, error, loading, reload } = useLoad(() => api(`/followups${all ? '?all=1' : ''}`), [all]);
  const [open, setOpen] = useState<any | null>(null);
  return (
    <div>
      <div class="page-head"><h1>المتابعة مع العملاء</h1><Btn icon="refresh" variant="ghost" onClick={reload}>تحديث</Btn></div>
      <p class="muted" style="margin-bottom:12px">بعد كل زيارة بـ 24 ساعة، اتصل على العميل وتأكد إن العطل انحل.</p>
      <div class="tabs"><button class={!all ? 'on' : ''} onClick={() => setAll(false)}>مستحقة الحين</button><button class={all ? 'on' : ''} onClick={() => setAll(true)}>كل المفتوحة</button></div>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data.followups.length === 0 ? <div class="empty">ما في متابعات مستحقة. 👍</div> : (
        <div class="list">{data.followups.map((f: any) => (
          <div class="item">
            <div class="top"><span class="title">{f.customer_name} <a class="small num" href={`/app/orders/${f.order_id}/`}>{f.code}</a></span>{f.rating_overall ? <Stars n={f.rating_overall} /> : <span class="badge t-muted">ما قيّم</span>}</div>
            <div class="small muted">{f.service ?? ''} · الفني: {f.tech_name ?? '—'} · خلص {fmtDateTime(f.finished_at)} · مستحقة {fmtDateTime(f.due_at)}</div>
            <div class="row">
              <a class="btn sm" href={telHref(f.customer_phone)}><Icon name="phone" /><span class="num">{phoneDisplay(f.customer_phone)}</span></a>
              <a class="btn sm" href={waHref(f.customer_phone, `هلا ${f.customer_name}، معاك خدمة العملاء في شلال بيروت. حبينا نتطمن إن العطل انحل بعد زيارة أمس (طلب ${f.code}). كل شي تمام؟`)} target="_blank" rel="noopener"><Icon name="wa" />واتساب</a>
              <Btn variant="primary sm" icon="check" onClick={() => setOpen(f)}>سجّل النتيجة</Btn>
            </div>
          </div>
        ))}</div>
      )}
      {open && <FollowupModal f={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); refreshCounts(); }} />}
    </div>
  );
}

function FollowupModal({ f, onClose, onDone }: any) {
  const [result, setResult] = useState('resolved');
  const [notes, setNotes] = useState('');
  const { busy, error, run } = useAction();
  return (
    <Modal title={`متابعة ${f.customer_name}`} onClose={onClose}>
      <ErrorBox error={error} />
      <div class="stack">
        {[['resolved', 'العطل انحل، العميل راضي'], ['not_resolved', 'العطل ما انحل (يرجع الطلب للمدير)'], ['no_answer', 'ما رد (نذكّرك بعد 4 ساعات)']].map(([k, l]) => (
          <label class="check card" style="padding:12px"><input type="radio" name="fu" checked={result === k} onChange={() => setResult(k)} />{l}</label>
        ))}
      </div>
      <Field label="ملاحظات"><textarea id="fu-notes" class="input" value={notes} onInput={(e) => setNotes(e.currentTarget.value)} /></Field>
      <Btn variant="primary" busy={busy} onClick={() => run(async () => { await api(`/followups/${f.id}`, { body: { result, notes } }); onDone(); })}>حفظ</Btn>
    </Modal>
  );
}

export function Surveys() {
  const { user } = useApp();
  const [filter, setFilter] = useState('');
  const techs = useLoad(() => api('/users?role=tech'));
  const [tech, setTech] = useState('');
  const qs = new URLSearchParams();
  if (filter === 'low') qs.set('max_rating', '2');
  if (filter === 'pending') qs.set('publish', 'pending');
  if (tech) qs.set('tech', tech);
  const { data, error, loading, reload } = useLoad(() => api(`/surveys?${qs}`), [filter, tech]);
  const act = useAction();
  const manager = user.role === 'admin' || user.role === 'manager';
  const csv = () => {
    const rows = [['الطلب', 'العميل', 'الموبايل', 'الفني', 'الخدمة', 'التاريخ', 'الخدمة ككل', 'الفني', 'الالتزام', 'التعليق', 'موافقة النشر']];
    for (const s of data.surveys) rows.push([s.code, s.customer_name, s.customer_phone, s.tech_name ?? '', s.service ?? '', s.submitted_at, s.rating_overall, s.rating_tech, s.rating_punctuality, s.comment ?? '', s.consent_publish ? 'نعم' : 'لا']);
    const text = '﻿' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = `surveys-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const st = data?.stats;
  const avg = (v: number | null) => (v == null ? '—' : v.toFixed(1));
  return (
    <div>
      <div class="page-head"><h1>الاستبيانات</h1>{data?.surveys.length > 0 && <Btn icon="list" onClick={csv}>تصدير Excel (CSV)</Btn>}</div>
      {st && (
        <div class="stats">
          <div class="stat"><div class="v">{st.n}</div><div class="l">استبيان وصل (من {st.sent} انرسل)</div></div>
          <div class="stat"><div class="v">{avg(st.overall)}</div><div class="l">متوسط الخدمة ككل</div></div>
          <div class="stat"><div class="v">{avg(st.tech)}</div><div class="l">متوسط تقييم الفني</div></div>
          <div class="stat"><div class="v">{avg(st.punctuality)}</div><div class="l">متوسط الالتزام بالموعد</div></div>
        </div>
      )}
      <div class="row" style="margin-bottom:12px">
        <div class="tabs" style="margin:0">{[['', 'الكل'], ['low', 'تقييم منخفض'], ['pending', 'تنتظر موافقة النشر']].map(([k, l]) => <button class={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
        <select id="sv-tech" class="input" style="width:auto" value={tech} onChange={(e) => setTech(e.currentTarget.value)}><option value="">كل الفنيين</option>{techs.data?.users.map((u: any) => <option value={u.id}>{u.name}</option>)}</select>
      </div>
      <ErrorBox error={error || act.error} />
      {loading && !data ? <Loading /> : data.surveys.length === 0 ? <div class="empty">ما في استبيانات هني.</div> : (
        <div class="list">{data.surveys.map((s: any) => (
          <div class="item">
            <div class="top"><span class="title">{s.customer_name} <a class="small num" href={`/app/orders/${s.order_id}/`}>{s.code}</a></span><Stars n={s.rating_overall} /></div>
            <div class="small muted">{s.service ?? ''} · الفني: {s.tech_name ?? '—'} · {fmtDateTime(s.submitted_at)} · الفني <Stars n={s.rating_tech} /> · الالتزام <Stars n={s.rating_punctuality} /></div>
            {s.comment && <p>"{s.comment}"</p>}
            <div class="row small">
              {s.consent_publish ? <span class="badge t-info">وافق على النشر</span> : <span class="badge t-muted">خاص</span>}
              {s.publish_status === 'approved' && <span class="badge t-good">منشور</span>}
              {manager && s.publish_status === 'pending' && <>
                <Btn variant="primary sm" busy={act.busy} onClick={() => act.run(async () => { await api(`/surveys/${s.id}/review`, { body: { status: 'approved' } }); reload(); })}>انشر في الموقع</Btn>
                <Btn variant="sm" busy={act.busy} onClick={() => act.run(async () => { await api(`/surveys/${s.id}/review`, { body: { status: 'rejected' } }); reload(); })}>لا تنشر</Btn>
              </>}
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

export function Invoices() {
  const [doc, setDoc] = useState('');
  const { data, error, loading } = useLoad(() => api(`/invoices${doc ? '?doc=' + doc : ''}`), [doc]);
  return (
    <div>
      <div class="page-head"><h1>العروض والفواتير</h1></div>
      <div class="tabs">{[['', 'الكل'], ['quote', 'عروض أسعار'], ['work_order', 'أوامر عمل'], ['invoice', 'فواتير غير مسددة'], ['paid', 'مسددة']].map(([k, l]) => <button class={doc === k ? 'on' : ''} onClick={() => setDoc(k)}>{l}</button>)}</div>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data.invoices.length === 0 ? <div class="empty">ما في شي هني.</div> : (
        <div class="list">{data.invoices.map((i: any) => (
          <a class="item" href={`/app/orders/${i.order_id}/`}>
            <div class="top"><span class="title">{i.customer_name} <span class="num small muted">{i.number}</span></span><span class={`badge t-${DOC[i.doc_status]?.tone ?? 'muted'}`}>{DOC[i.doc_status]?.label ?? i.doc_status}</span></div>
            <div class="row between small"><span class="muted">طلب <span class="num">{i.code}</span> · {fmtDate(i.issued_at)}{i.doc_status === 'invoice' && !i.sent_at ? ' · ما انرسلت' : ''}</span><b class="num">{kd(i.total_fils)}</b></div>
          </a>
        ))}</div>
      )}
    </div>
  );
}

export function Customers() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const { data, error, loading } = useLoad(() => api(`/customers?q=${encodeURIComponent(query)}`), [query]);
  const [adding, setAdding] = useState(false);
  const { go } = useApp();
  return (
    <div>
      <div class="page-head"><h1>العملاء</h1><Btn variant="primary" icon="plus" onClick={() => setAdding(true)}>عميل جديد</Btn></div>
      <form class="row" style="margin-bottom:12px" onSubmit={(e) => { e.preventDefault(); setQuery(q); }}>
        <input id="cu-q" class="input grow" placeholder="ابحث بالاسم أو الرقم" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        <button class="btn" type="submit"><Icon name="search" />بحث</button>
      </form>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data.customers.length === 0 ? <div class="empty">ما في عملاء.</div> : (
        <div class="list">{data.customers.map((c: any) => (
          <a class="item" href={`/app/customers/${c.id}/`}>
            <div class="top"><span class="title">{c.name}</span><span class="small muted">{c.orders_count} طلب</span></div>
            <span class="small num">{phoneDisplay(c.phone)}</span>
          </a>
        ))}</div>
      )}
      {adding && <NewCustomerModal onClose={() => setAdding(false)} onDone={(id: number) => go(`/customers/${id}`)} />}
    </div>
  );
}

function NewCustomerModal({ onClose, onDone }: any) {
  const [f, setF] = useState<any>({ name: '', phone: '', notes: '', governorate: GOVERNORATES[1], area: '', block: '' });
  const { busy, error, run } = useAction();
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.currentTarget.value });
  return (
    <Modal title="عميل جديد" onClose={onClose}>
      <ErrorBox error={error} />
      <Field label="الاسم"><input id="nc-name" class="input" value={f.name} onInput={set('name')} /></Field>
      <Field label="رقم الموبايل"><input id="nc-phone" class="input" type="tel" dir="ltr" value={f.phone} onInput={set('phone')} /></Field>
      <div class="grid2"><AreaPicker idPrefix="nc" gov={f.governorate} area={f.area} onChange={(governorate, area) => setF({ ...f, governorate, area })} /></div>
      <Field label="ملاحظات"><textarea id="nc-notes" class="input" value={f.notes} onInput={set('notes')} /></Field>
      <Btn variant="primary" busy={busy} onClick={() => run(async () => {
        const r = await api('/customers', { body: { name: f.name, phone: f.phone, notes: f.notes, address: f.area ? { governorate: f.governorate, area: f.area, block: f.block } : undefined } });
        onDone(r.id);
      })}>حفظ</Btn>
    </Modal>
  );
}

export function CustomerView({ id }: { id: number }) {
  const { data, error, loading } = useLoad(() => api(`/customers/${id}`), [id]);
  const act = useAction();
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { customer: c, addresses, orders, invoices, warranties } = data;
  const sendLink = () => act.run(async () => { const r = await api(`/customers/${id}/link`, { method: 'POST' }); openWa(r.wa); });
  return (
    <div class="stack">
      <div class="page-head">
        <div><a class="small" href="/app/customers/">← العملاء</a><h1>{c.name}</h1></div>
        <div class="row">
          <a class="btn primary" href="/app/orders/new/"><Icon name="plus" />طلب جديد</a>
        </div>
      </div>
      <ErrorBox error={act.error} />
      <div class="card stack">
        <div class="row">
          <a class="btn sm" href={telHref(c.phone)}><Icon name="phone" /><span class="num">{phoneDisplay(c.phone)}</span></a>
          <a class="btn sm" href={waHref(c.phone)} target="_blank" rel="noopener"><Icon name="wa" />واتساب</a>
          <Btn variant="sm water" icon="key" busy={act.busy} onClick={sendLink}>أرسل رابط حسابه</Btn>
        </div>
        {c.notes && <p class="note small">{c.notes}</p>}
        {addresses.length > 0 && <div class="stack" style="gap:6px"><h3>العناوين</h3>{addresses.map((a: any) => <p class="small">{[a.label, a.governorate, a.area, a.block && 'ق ' + a.block, a.street && 'ش ' + a.street, a.building && 'م ' + a.building].filter(Boolean).join(' - ')}{a.maps_url && <> · <a href={a.maps_url} target="_blank" rel="noopener">اللوكيشن</a></>}</p>)}</div>}
      </div>
      <div class="card stack">
        <h2>الطلبات</h2>
        {orders.length === 0 ? <p class="muted">ما في طلبات.</p> : <div class="list">{orders.map((o: any) => (
          <a class="item" href={`/app/orders/${o.id}/`}><div class="top"><span class="title num">{o.code}</span><StatusBadge status={o.status} /></div><span class="small muted">{o.service ?? ''} · {fmtDate(o.created_at)}{o.tech ? ` · ${o.tech}` : ''}</span></a>
        ))}</div>}
      </div>
      <div class="grid2">
        <div class="card stack">
          <h2>العروض والفواتير</h2>
          {invoices.length === 0 ? <p class="muted">ما في فواتير.</p> : invoices.map((i: any) => (
            <div class="row between small"><a class="num" href={`/app/orders/${i.order_id}/`}>{i.number}</a><span class="num">{kd(i.total_fils)}</span><span class={`badge t-${DOC[i.doc_status]?.tone ?? 'muted'}`}>{DOC[i.doc_status]?.label ?? PAY[i.payment_status]}</span></div>
          ))}
        </div>
        <div class="card stack">
          <h2>الكفالات</h2>
          {warranties.length === 0 ? <p class="muted">ما في كفالات.</p> : warranties.map((w: any) => (
            <div class="row between small"><span class="num">{w.code}</span><span>{w.months} شهر، لين {fmtDate(w.ends_at)}</span><span class={`badge ${new Date(w.ends_at) > new Date() ? 't-good' : 't-muted'}`}>{new Date(w.ends_at) > new Date() ? 'سارية' : 'منتهية'}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
