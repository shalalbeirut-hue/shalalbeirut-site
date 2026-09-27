import { useState, useEffect } from 'preact/hooks';
import { api, fmtDateTime, fmtTime, phoneDisplay, SOURCE, GOVERNORATES, kuwaitLocalToIso } from '../lib';
import { useLoad, Loading, ErrorBox, StatusBadge, Icon, Field, Btn, useAction } from '../ui';
import { useApp } from './App';

const TABS: [string, string][] = [['open', 'المفتوحة'], ['new', 'جديدة'], ['reopened', 'أعيد فتحها'], ['done', 'تنتظر المتابعة'], ['closed', 'مغلقة'], ['', 'الكل']];

export function Orders({ techHome }: { techHome?: boolean }) {
  const { user } = useApp();
  const [tab, setTab] = useState(techHome ? 'open' : 'open');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const { data, error, loading, reload } = useLoad(() => api(`/orders?status=${tab}&q=${encodeURIComponent(query)}`), [tab, query]);
  const tech = user.role === 'tech';
  return (
    <div>
      <div class="page-head">
        <h1>{tech ? 'زياراتي' : 'الطلبات'}</h1>
        <div class="row">
          <Btn icon="refresh" variant="ghost" onClick={reload} aria-label="تحديث">تحديث</Btn>
          {!tech && <a class="btn primary" href="/app/orders/new/"><Icon name="plus" />طلب جديد</a>}
        </div>
      </div>
      {!tech && (
        <form class="row" style="margin-bottom:12px" onSubmit={(e) => { e.preventDefault(); setQuery(q); }}>
          <input id="orders-q" class="input grow" placeholder="ابحث برقم الطلب أو اسم العميل أو رقمه" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
          <button class="btn" type="submit"><Icon name="search" />بحث</button>
        </form>
      )}
      <div class="tabs" role="tablist">
        {(tech ? [['open', 'الحالية'], ['done', 'خلصت'], ['closed', 'مغلقة']] as [string, string][] : TABS).map(([k, l]) => (
          <button role="tab" aria-selected={tab === k} class={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data?.orders.length === 0 ? <div class="empty">ما في طلبات هني.</div> : (
        <div class="list">{data?.orders.map((o: any) => (
          <a class="item" href={`/app/orders/${o.id}/`}>
            <div class="top">
              <span class="title">{o.customer_name} <span class="muted small num">{o.code}</span></span>
              <span class="row" style="gap:6px">{o.priority === 'urgent' && <span class="badge urgent">مستعجل</span>}<StatusBadge status={o.status} /></span>
            </div>
            <div class="small">{o.service ?? 'خدمة غير محددة'}{o.area ? ` · ${o.governorate ?? ''} - ${o.area}${o.block ? ' ق' + o.block : ''}` : ''}</div>
            <div class="row small muted">
              {o.scheduled_at ? <span><Icon name="truck" class="" /> الموعد: {tech ? fmtTime(o.scheduled_at) + ' · ' : ''}{fmtDateTime(o.scheduled_at)}</span> : o.preferred_time ? <span>يفضّل: {o.preferred_time}</span> : null}
              {!tech && <span>{o.tech_name ? `الفني: ${o.tech_name}` : 'ما انسند'}</span>}
              {!tech && <span>{SOURCE[o.source] ?? o.source}</span>}
              {!tech && <span class="num">{phoneDisplay(o.customer_phone)}</span>}
            </div>
          </a>
        ))}</div>
      )}
    </div>
  );
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
  const [f, setF] = useState<any>({ service_id: '', description: '', source: 'whatsapp', priority: 'normal', preferred_time: '', scheduled_at: '', tech_id: '' });
  const { busy, error, run } = useAction();

  useEffect(() => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) { setFound(null); return; }
    const t = setTimeout(() => api(`/customers/by-phone/${digits}`).then((d) => {
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
          service_id: f.service_id ? Number(f.service_id) : undefined,
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
          <Field label="رقم الموبايل" hint={found ? `عميل مسجّل: ${found.name}` : phone.replace(/\D/g, '').length >= 8 ? 'عميل جديد' : 'اكتب الرقم ونطلع لك بياناته لو مسجّل'}>
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
            <Field label="المحافظة"><select id="no-gov" class="input" value={addr.governorate} onChange={setA('governorate')}>{GOVERNORATES.map((g) => <option>{g}</option>)}</select></Field>
            <Field label="المنطقة"><input id="no-area" class="input" value={addr.area} onInput={setA('area')} required /></Field>
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
          <Field label="الخدمة">
            <select id="no-service" class="input" value={f.service_id} onChange={set('service_id')}>
              <option value="">اختار الخدمة</option>
              {services.data?.services.filter((s: any) => s.active).map((s: any) => <option value={s.id}>{s.name_ar}</option>)}
            </select>
          </Field>
          <Field label="مصدر الطلب"><select id="no-source" class="input" value={f.source} onChange={set('source')}>{Object.entries(SOURCE).map(([k, v]) => <option value={k}>{v}</option>)}</select></Field>
          <Field label="الأولوية"><select id="no-priority" class="input" value={f.priority} onChange={set('priority')}><option value="normal">عادي</option><option value="urgent">مستعجل</option></select></Field>
          <Field label="الوقت اللي يناسب العميل"><input id="no-pref" class="input" placeholder="مثلاً: بكرة العصر" value={f.preferred_time} onInput={set('preferred_time')} /></Field>
        </div>
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
