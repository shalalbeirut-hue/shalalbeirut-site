import { useState, useEffect } from 'preact/hooks';
import { api, fmtDateTime, fmtTime, phoneDisplay, SOURCE, GOVERNORATES, kuwaitLocalToIso, parsePhone } from '../lib';
import { useLoad, Loading, ErrorBox, StatusBadge, Icon, Field, Btn, useAction, ServiceChips, AreaPicker } from '../ui';
import { useApp } from './App';
import { printOrders } from '../print';

const TABS: [string, string][] = [['open', 'المفتوحة'], ['new', 'جديدة'], ['reopened', 'أعيد فتحها'], ['done', 'تنتظر المتابعة'], ['closed', 'مغلقة'], ['', 'الكل']];

const kwDay = (offsetDays = 0) => new Date(Date.now() + 3 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
const FILTERS_KEY = 'sb-order-filters';
type Filters = { status: string; q: string; gov: string; area: string; tech: string; service: string; date_by: string; from: string; to: string; sort: string };
const EMPTY: Filters = { status: 'open', q: '', gov: '', area: '', tech: '', service: '', date_by: 'visit', from: '', to: '', sort: '' };
const loadFilters = (): Filters => {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}') }; } catch { return EMPTY; }
};

export function Orders(_: { techHome?: boolean }) {
  const { user } = useApp();
  return user.role === 'tech' ? <TechVisits /> : <OfficeOrders />;
}

/** Office view: filters, sorting and a table with visit and registration dates. */
function OfficeOrders() {
  const { go } = useApp();
  const [f, setF] = useState<Filters>(loadFilters);
  const [q, setQ] = useState(f.q);
  const [showFilters, setShowFilters] = useState(!!(f.gov || f.tech || f.service || f.from || f.to));
  const techs = useLoad(() => api('/users?role=tech'));
  const services = useLoad(() => api('/services'));
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== '') as [string, string][]).toString();
  const { data, error, loading, reload } = useLoad(() => api(`/orders?${qs}`), [qs]);
  const set = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };
  const sortBy = (col: 'visit' | 'created') => {
    const cur = f.sort;
    set({ sort: col === 'visit' ? (cur === 'visit_asc' ? 'visit_desc' : 'visit_asc') : (cur === 'created_desc' ? 'created_asc' : 'created_desc') });
  };
  const arrow = (col: 'visit' | 'created') => (f.sort === col + '_asc' ? ' ↑' : f.sort === col + '_desc' ? ' ↓' : '');
  const active = [f.gov, f.area, f.tech, f.service, f.from, f.to].filter(Boolean).length;
  const preset = (by: string, d: string) => f.date_by === by && f.from === d && f.to === d;
  const filtersText = () => [
    TABS.find(([k]) => k === f.status)?.[1],
    f.q && `بحث: ${f.q}`,
    f.gov && `${f.gov}${f.area ? ' - ' + f.area : ''}`,
    f.tech && `الفني: ${techs.data?.users.find((u: any) => String(u.id) === f.tech)?.name ?? ''}`,
    f.service && `الخدمة: ${services.data?.services.find((s: any) => String(s.id) === f.service)?.name_ar ?? ''}`,
    (f.from || f.to) && `${f.date_by === 'created' ? 'التسجيل' : 'الزيارة'}: ${f.from || '…'} إلى ${f.to || '…'}`,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      <div class="page-head">
        <h1>الطلبات {data && <span class="muted small">({data.orders.length})</span>}</h1>
        <div class="row">
          <Btn icon="refresh" variant="ghost" onClick={reload}>تحديث</Btn>
          {data?.orders.length > 0 && <Btn icon="receipt" onClick={() => printOrders(data.orders, filtersText())}>اطبع القائمة</Btn>}
          <a class="btn primary" href="/app/orders/new/"><Icon name="plus" />طلب جديد</a>
        </div>
      </div>

      <form class="row no-print" style="margin-bottom:10px" onSubmit={(e) => { e.preventDefault(); set({ q }); }}>
        <input id="orders-q" class="input grow" placeholder="ابحث برقم الطلب أو اسم العميل أو رقمه" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        <button class="btn" type="submit"><Icon name="search" />بحث</button>
        <button type="button" class={`btn ${active ? 'water' : ''}`} onClick={() => setShowFilters(!showFilters)}>فلترة{active ? ` (${active})` : ''}</button>
      </form>

      <div class="tabs no-print" role="tablist">
        {TABS.map(([k, l]) => <button role="tab" aria-selected={f.status === k} class={f.status === k ? 'on' : ''} onClick={() => set({ status: k })}>{l}</button>)}
      </div>

      <div class="tabs no-print">
        <button class={preset('visit', kwDay()) ? 'on' : ''} onClick={() => set({ date_by: 'visit', from: kwDay(), to: kwDay(), sort: 'visit_asc' })}>زيارات اليوم</button>
        <button class={preset('visit', kwDay(1)) ? 'on' : ''} onClick={() => set({ date_by: 'visit', from: kwDay(1), to: kwDay(1), sort: 'visit_asc' })}>زيارات بكرة</button>
        <button class={preset('created', kwDay()) ? 'on' : ''} onClick={() => set({ date_by: 'created', from: kwDay(), to: kwDay(), sort: 'created_desc' })}>انسجلت اليوم</button>
        {(active > 0 || f.sort) && <button onClick={() => set({ ...EMPTY, status: f.status, q: f.q })}>امسح الفلاتر ✕</button>}
      </div>

      {showFilters && (
        <div class="card no-print" style="margin-bottom:12px">
          <div class="grid2">
            <AreaPicker idPrefix="of" gov={f.gov} area={f.area} allowAny onChange={(gov, area) => set({ gov, area })} />
            <Field label="الفني">
              <select id="of-tech" class="input" value={f.tech} onChange={(e) => set({ tech: e.currentTarget.value })}>
                <option value="">كل الفنيين</option>
                {techs.data?.users.map((u: any) => <option value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="الخدمة">
              <select id="of-svc" class="input" value={f.service} onChange={(e) => set({ service: e.currentTarget.value })}>
                <option value="">كل الخدمات</option>
                {services.data?.services.map((s: any) => <option value={s.id}>{s.name_ar}</option>)}
              </select>
            </Field>
            <Field label="التاريخ حسب">
              <select id="of-dateby" class="input" value={f.date_by} onChange={(e) => set({ date_by: e.currentTarget.value })}>
                <option value="visit">تاريخ الزيارة</option>
                <option value="created">تاريخ التسجيل (الاتصال)</option>
              </select>
            </Field>
            <Field label="من"><input id="of-from" class="input" type="date" value={f.from} onInput={(e) => set({ from: e.currentTarget.value })} /></Field>
            <Field label="إلى"><input id="of-to" class="input" type="date" value={f.to} onInput={(e) => set({ to: e.currentTarget.value })} /></Field>
            <Field label="الترتيب">
              <select id="of-sort" class="input" value={f.sort} onChange={(e) => set({ sort: e.currentTarget.value })}>
                <option value="">الأهم أول (الجديد والمفتوح)</option>
                <option value="visit_asc">تاريخ الزيارة: الأقدم أول</option>
                <option value="visit_desc">تاريخ الزيارة: الأحدث أول</option>
                <option value="created_desc">تاريخ التسجيل: الأحدث أول</option>
                <option value="created_asc">تاريخ التسجيل: الأقدم أول</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      <div class="print-only print-head">
        <b>شلال بيروت · قائمة الطلبات ({data?.orders.length ?? 0})</b>
        <span>{TABS.find(([k]) => k === f.status)?.[1]}{f.q ? ` · بحث: ${f.q}` : ''}{f.gov ? ` · ${f.gov}${f.area ? ' - ' + f.area : ''}` : ''}{f.from || f.to ? ` · ${f.date_by === 'created' ? 'التسجيل' : 'الزيارة'}: ${f.from || '…'} إلى ${f.to || '…'}` : ''}</span>
        <span>طُبع: {fmtDateTime(new Date().toISOString())}</span>
      </div>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data?.orders.length === 0 ? <div class="empty">ما في طلبات بهالفلترة.</div> : (
        <div class="table-wrap">
          <table class="orders-table">
            <thead><tr>
              <th>الطلب</th><th>العميل</th><th>الخدمات</th><th>المنطقة</th><th>الفني</th>
              <th><button class="th-sort" onClick={() => sortBy('visit')}>تاريخ الزيارة{arrow('visit')}</button></th>
              <th><button class="th-sort" onClick={() => sortBy('created')}>تاريخ التسجيل{arrow('created')}</button></th>
              <th>الحالة</th>
            </tr></thead>
            <tbody>{data?.orders.map((o: any) => (
              <tr class="clickable" onClick={() => go(`/orders/${o.id}`)}>
                <td><a class="num" href={`/app/orders/${o.id}/`} onClick={(e) => e.stopPropagation()}>{o.code}</a>{o.priority === 'urgent' && <span class="badge urgent" style="margin-inline-start:6px">مستعجل</span>}</td>
                <td><b>{o.customer_name}</b><div class="small muted num">{phoneDisplay(o.customer_phone)}</div></td>
                <td class="small">{o.service ?? '—'}</td>
                <td class="small">{o.area ? <>{o.area}<div class="muted">{o.governorate}</div></> : '—'}</td>
                <td class="small">{o.tech_name ?? <span class="badge t-warn">ما انسند</span>}</td>
                <td class="small">{o.scheduled_at ? fmtDateTime(o.scheduled_at) : o.preferred_time ? <span class="muted">يفضّل: {o.preferred_time}</span> : '—'}</td>
                <td class="small">{fmtDateTime(o.created_at)}<div class="muted">{SOURCE[o.source] ?? o.source}</div></td>
                <td><StatusBadge status={o.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Technician view: simple cards, nearest visit first. */
function TechVisits() {
  const [tab, setTab] = useState('open');
  const { data, error, loading, reload } = useLoad(() => api(`/orders?status=${tab}&sort=${tab === 'open' ? 'visit_asc' : 'visit_desc'}`), [tab]);
  return (
    <div>
      <div class="page-head"><h1>زياراتي</h1><Btn icon="refresh" variant="ghost" onClick={reload}>تحديث</Btn></div>
      <div class="tabs" role="tablist">
        {([['open', 'الحالية'], ['done', 'خلصت'], ['closed', 'مغلقة']] as [string, string][]).map(([k, l]) => (
          <button role="tab" aria-selected={tab === k} class={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data?.orders.length === 0 ? <div class="empty">ما في زيارات هني.</div> : (
        <div class="list">{data?.orders.map((o: any) => (
          <a class="item" href={`/app/orders/${o.id}/`}>
            <div class="top">
              <span class="title">{o.customer_name} <span class="muted small num">{o.code}</span></span>
              <span class="row" style="gap:6px">{o.priority === 'urgent' && <span class="badge urgent">مستعجل</span>}<StatusBadge status={o.status} /></span>
            </div>
            <div class="small">{o.service ?? 'خدمة غير محددة'}{o.area ? ` · ${o.governorate ?? ''} - ${o.area}${o.block ? ' ق' + o.block : ''}` : ''}</div>
            {o.scheduled_at && <div class="small"><b>الموعد: {fmtTime(o.scheduled_at)}</b> · {fmtDateTime(o.scheduled_at)}</div>}
          </a>
        ))}</div>
      )}
    </div>
  );
}

/** Live feedback while typing a customer number. */
function phoneHint(input: string, found: any) {
  if (!input.trim()) return 'اكتب الرقم ونطلع لك بياناته لو مسجّل';
  const pr = parsePhone(input);
  if (!pr.ok) return input.replace(/\D/g, '').length < 8 ? 'كمّل الرقم…' : '⚠ ' + pr.error;
  const saved = pr.kuwait ? `+965 ${pr.phone.slice(3, 7)} ${pr.phone.slice(7)}` : '+' + pr.phone;
  const who = found ? `عميل مسجّل: ${found.name}` : 'عميل جديد';
  return `${who} · يتسجّل ${saved}${pr.mobile ? '' : ' · ⚠ رقم أرضي، ما عليه واتساب'}`;
}

export function NewOrder() {
  const { go } = useApp();
  const services = useLoad(() => api('/services'));
  const techs = useLoad(() => api('/users?role=tech'));
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [addressId, setAddressId] = useState<string>('new');
  const [addr, setAddr] = useState<any>({ governorate: GOVERNORATES[1], area: '', block: '', street: '', avenue: '', building: '', floor: '', flat: '', maps_url: '', notes: '' });
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [f, setF] = useState<any>({ description: '', source: 'whatsapp', priority: 'normal', preferred_time: '', scheduled_at: '', tech_id: '' });
  const { busy, error, run } = useAction();

  useEffect(() => {
    const pr = parsePhone(phone);
    if (!pr.ok) { setFound(null); return; }
    const t = setTimeout(() => api(`/customers/by-phone/${pr.phone}`).then((d) => {
      setFound(d.customer);
      if (d.customer) { setName(d.customer.name); setAddressId(d.customer.addresses[0] ? String(d.customer.addresses[0].id) : 'new'); }
    }).catch(() => {}), 400);
    return () => clearTimeout(t);
  }, [phone]);

  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.currentTarget.value });
  const setA = (k: string) => (e: any) => setAddr({ ...addr, [k]: e.currentTarget.value });

  const submit = (e: Event) => {
    e.preventDefault();
    run(async () => {
      const res = await api('/orders', {
        body: {
          customer: found ? { id: found.id } : { name, phone },
          address_id: addressId !== 'new' ? Number(addressId) : undefined,
          address: addressId === 'new' ? addr : undefined,
          service_ids: serviceIds,
          description: f.description, source: f.source, priority: f.priority, preferred_time: f.preferred_time,
          scheduled_at: kuwaitLocalToIso(f.scheduled_at), tech_id: f.tech_id ? Number(f.tech_id) : undefined,
        },
      });
      go(`/orders/${res.id}`);
    });
  };

  return (
    <form class="stack" onSubmit={submit}>
      <div class="page-head"><h1>طلب جديد</h1></div>
      <ErrorBox error={error} />
      <div class="card stack">
        <h2>العميل</h2>
        <div class="grid2">
          <Field label="رقم الموبايل" hint={phoneHint(phone, found)}>
            <input id="no-phone" class="input" type="tel" dir="ltr" inputMode="tel" value={phone} onInput={(e) => setPhone(e.currentTarget.value)} required />
          </Field>
          <Field label="الاسم"><input id="no-name" class="input" value={name} onInput={(e) => setName(e.currentTarget.value)} disabled={!!found} required /></Field>
        </div>
      </div>

      <div class="card stack">
        <h2>العنوان</h2>
        {found?.addresses?.length > 0 && (
          <Field label="اختار عنوان">
            <select id="no-addr" class="input" value={addressId} onChange={(e) => setAddressId(e.currentTarget.value)}>
              {found.addresses.map((a: any) => <option value={a.id}>{[a.label, a.governorate, a.area, a.block && 'ق' + a.block, a.street && 'ش' + a.street, a.building && 'م' + a.building].filter(Boolean).join(' - ')}</option>)}
              <option value="new">+ عنوان جديد</option>
            </select>
          </Field>
        )}
        {addressId === 'new' && (
          <div class="grid2">
            <AreaPicker idPrefix="no" gov={addr.governorate} area={addr.area} onChange={(governorate, area) => setAddr({ ...addr, governorate, area })} />
            <Field label="القطعة"><input id="no-block" class="input" value={addr.block} onInput={setA('block')} /></Field>
            <Field label="الشارع"><input id="no-street" class="input" value={addr.street} onInput={setA('street')} /></Field>
            <Field label="الجادة"><input id="no-avenue" class="input" value={addr.avenue} onInput={setA('avenue')} /></Field>
            <Field label="المنزل / المبنى"><input id="no-building" class="input" value={addr.building} onInput={setA('building')} /></Field>
            <Field label="الدور"><input id="no-floor" class="input" value={addr.floor} onInput={setA('floor')} /></Field>
            <Field label="الشقة"><input id="no-flat" class="input" value={addr.flat} onInput={setA('flat')} /></Field>
            <Field label="لوكيشن (رابط جوجل ماب)"><input id="no-maps" class="input" dir="ltr" value={addr.maps_url} onInput={setA('maps_url')} /></Field>
            <Field label="ملاحظات العنوان"><input id="no-anotes" class="input" value={addr.notes} onInput={setA('notes')} /></Field>
          </div>
        )}
      </div>

      <div class="card stack">
        <h2>الطلب</h2>
        <div class="grid2">
          <Field label="مصدر الطلب"><select id="no-source" class="input" value={f.source} onChange={set('source')}>{Object.entries(SOURCE).map(([k, v]) => <option value={k}>{v}</option>)}</select></Field>
          <Field label="الأولوية"><select id="no-priority" class="input" value={f.priority} onChange={set('priority')}><option value="normal">عادي</option><option value="urgent">مستعجل</option></select></Field>
          <Field label="الوقت اللي يناسب العميل"><input id="no-pref" class="input" placeholder="مثلاً: بكرة العصر" value={f.preferred_time} onInput={set('preferred_time')} /></Field>
        </div>
        <Field label="الخدمات المطلوبة" hint="تقدر تختار أكثر من خدمة">
          <ServiceChips services={services.data?.services ?? []} value={serviceIds} onChange={setServiceIds} />
        </Field>
        <Field label="شنو المشكلة؟"><textarea id="no-desc" class="input" value={f.description} onInput={set('description')} /></Field>
      </div>

      <div class="card stack">
        <h2>الإسناد (اختياري)</h2>
        <div class="grid2">
          <Field label="الفني"><select id="no-tech" class="input" value={f.tech_id} onChange={set('tech_id')}><option value="">بعدين</option>{techs.data?.users.filter((u: any) => u.active).map((u: any) => <option value={u.id}>{u.name}</option>)}</select></Field>
          <Field label="موعد الزيارة"><input id="no-when" class="input" type="datetime-local" value={f.scheduled_at} onInput={set('scheduled_at')} /></Field>
        </div>
      </div>
      <Btn variant="primary big" busy={busy} type="submit" icon="check">حفظ الطلب</Btn>
    </form>
  );
}
