// Customer-facing pages: invoice (/i/:token), survey (/r/:token) and account (/my/).
import { useEffect, useState } from 'preact/hooks';
import { api, fmtDate, fmtDateTime, kd, PAY, PAY_METHOD, waHref } from '../lib';
import { useLoad, Loading, ErrorBox, Mark, Icon, Field, Btn, Modal, useAction, Stars } from '../ui';
import { SITE } from '../../config';

const tokenFrom = (prefix: string) => location.pathname.replace(prefix, '').replace(/\/+$/, '').split('/')[0];
const Brand = () => <a class="logo-head" href="/"><Mark />شلال بيروت</a>;
const bookHref = () => (SITE.whatsapp ? waHref(SITE.whatsapp, 'السلام عليكم، أبي أحجز خدمة') : '/#book');

const CUSTOMER_STATUS: Record<string, string> = {
  new: 'استلمنا طلبك', assigned: 'تم تحديد الفني', on_the_way: 'الفني بالطريق لك', in_progress: 'الفني يشتغل',
  done: 'خلص الشغل', closed: 'خلص الشغل', reopened: 'نتابع طلبك', cancelled: 'ملغي',
};

// ------------------------------------------------------------ Invoice

export function InvoicePage() {
  const token = tokenFrom('/i/');
  const { data, error, loading } = useLoad(() => api(`/public/invoice/${token}`));
  if (loading) return <div class="center-page"><Loading /></div>;
  if (error) return <div class="center-page"><div class="box"><Brand /><ErrorBox error={error} /></div></div>;
  const i = data.invoice;
  const active = i.ends_at && new Date(i.ends_at) > new Date();
  return (
    <div class="center-page">
      <div class="invoice stack">
        <div class="inv-head">
          <div class="stack" style="gap:4px">
            <div class="logo-head" style="justify-content:flex-start"><Mark />شلال بيروت</div>
            <span class="small muted">{SITE.legalAr}</span>
            <span class="small muted">{SITE.shopAr}{SITE.phone ? ` · ${SITE.phone}` : ''}</span>
          </div>
          <div class="stack" style="gap:4px;text-align:end">
            <h1>فاتورة</h1>
            <span class="num">{i.number}</span>
            <span class="small muted">{fmtDate(i.issued_at)}</span>
          </div>
        </div>
        <dl class="kv">
          <dt>العميل</dt><dd>{i.customer_name}</dd>
          <dt>الطلب</dt><dd class="num">{i.code}</dd>
          {i.service && <><dt>الخدمة</dt><dd>{i.service}</dd></>}
          {i.area && <><dt>المنطقة</dt><dd>{i.governorate} - {i.area}</dd></>}
          {i.tech_name && <><dt>الفني</dt><dd>{i.tech_name}</dd></>}
        </dl>
        <div class="table-wrap"><table class="inv-items">
          <thead><tr><th>البند</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
          <tbody>{i.items.map((x: any) => <tr><td>{x.description}</td><td class="num">{x.qty}</td><td class="num">{kd(x.unit_fils)}</td><td class="num">{kd(x.total_fils)}</td></tr>)}</tbody>
        </table></div>
        <div class="totals">
          <span>المجموع</span><span class="num">{kd(i.subtotal_fils)}</span>
          {i.discount_fils > 0 && <><span>خصم</span><span class="num">- {kd(i.discount_fils)}</span></>}
          <span class="grand">الإجمالي</span><span class="grand num">{kd(i.total_fils)}</span>
          <span class="muted">الدفع</span><span>{PAY[i.payment_status]}{i.payment_method ? ` (${PAY_METHOD[i.payment_method]})` : ''}</span>
        </div>
        {i.months ? (
          <div class="warranty-box">
            <div class="seal">كفالة<br />{i.months} شهر</div>
            <div class="stack" style="gap:4px">
              <b>{active ? 'الكفالة سارية' : 'الكفالة انتهت'}</b>
              <span class="small">من {fmtDate(i.starts_at)} لين {fmtDate(i.ends_at)}</span>
              {i.covers && <span class="small muted">تشمل: {i.covers}</span>}
              <span class="small muted">إذا صار أي خلل في الشغل خلال الكفالة، طرّش لنا رقم الطلب على الواتساب ونجيك ببلاش.</span>
            </div>
          </div>
        ) : null}
        {i.notes && <p class="small muted">{i.notes}</p>}
        <p class="small muted" style="text-align:center">شكراً لثقتك. في الموعد.. وبالضمان</p>
        <div class="row no-print" style="justify-content:center">
          <button class="btn" onClick={() => window.print()}><Icon name="receipt" />اطبع أو احفظ PDF</button>
          <a class="btn" href="/my/"><Icon name="user" />حسابي</a>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Survey

function StarInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div class="stack" style="gap:4px">
      <b>{label}</b>
      <div class="stars" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => <button type="button" role="radio" aria-checked={value === n} aria-label={`${n} من 5`} class={n <= value ? 'on' : ''} onClick={() => onChange(n)}>★</button>)}
      </div>
    </div>
  );
}

export function SurveyPage() {
  const token = tokenFrom('/r/');
  const { data, error, loading } = useLoad(() => api(`/public/survey/${token}`));
  const [overall, setOverall] = useState(0);
  const [tech, setTech] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState<null | { ask_google: boolean }>(null);
  const act = useAction();
  if (loading) return <div class="center-page"><Loading /></div>;
  const s = data?.survey;
  const submit = (e: Event) => {
    e.preventDefault();
    if (!overall || !tech || !punctuality) return act.setError('اختار عدد النجوم في الأسئلة الثلاثة');
    act.run(async () => setDone(await api(`/public/survey/${token}`, { body: { overall, tech, punctuality, comment, consent } })));
  };
  return (
    <div class="center-page">
      <div class="box">
        <Brand />
        {error && <ErrorBox error={error} />}
        {s && (s.submitted_at || done) ? (
          <div class="card stack" style="text-align:center">
            <h1>شكراً لك! 🌿</h1>
            <p>وصلنا تقييمك، ويفرق معانا وايد.</p>
            {done?.ask_google && SITE.googleReviewUrl && <><p>إذا عجبتك الخدمة، ساعدنا وقيّمنا على جوجل:</p><a class="btn primary" href={SITE.googleReviewUrl} target="_blank" rel="noopener"><Icon name="star" />قيّمنا على جوجل</a></>}
            <a class="btn" href="/my/">حسابي</a>
          </div>
        ) : s && (
          <form class="card stack" onSubmit={submit}>
            <h1>شلون كانت الخدمة يا {s.customer_name}؟</h1>
            <p class="muted small">طلب <span class="num">{s.code}</span>{s.service ? ` · ${s.service}` : ''}{s.tech_name ? ` · الفني ${s.tech_name}` : ''}</p>
            <ErrorBox error={act.error} />
            <StarInput label="الخدمة بشكل عام" value={overall} onChange={setOverall} />
            <StarInput label={s.tech_name ? `الفني ${s.tech_name}` : 'الفني'} value={tech} onChange={setTech} />
            <StarInput label="الالتزام بالموعد" value={punctuality} onChange={setPunctuality} />
            <Field label="تبي تقول لنا شي؟ (اختياري)"><textarea id="sv-comment" class="input" value={comment} onInput={(e) => setComment(e.currentTarget.value)} /></Field>
            <label class="check small"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.currentTarget.checked)} />أوافق تنشرون رأيي في موقعكم باسمي الأول والمنطقة</label>
            <Btn variant="primary big" busy={act.busy} type="submit">أرسل التقييم</Btn>
          </form>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Customer account

export function MyPage() {
  const [state, setState] = useState<'login' | 'loading' | 'in' | 'out'>(location.pathname.startsWith('/my/login/') ? 'login' : 'loading');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (state !== 'login') return;
    const token = tokenFrom('/my/login/');
    api('/my/login', { body: { token } })
      .then(() => { history.replaceState(null, '', '/my/'); setState('loading'); })
      .catch((e) => { setError(e.message); history.replaceState(null, '', '/my/'); setState('out'); });
  }, [state]);
  if (state === 'login') return <div class="center-page"><Loading /></div>;
  return <Account key={state} onOut={() => setState('out')} initialError={error} forceOut={state === 'out'} />;
}

function Account({ onOut, initialError, forceOut }: { onOut: () => void; initialError: string | null; forceOut: boolean }) {
  const { data, error, loading } = useLoad(() => (forceOut ? Promise.reject(new Error('out')) : api('/my/summary')));
  const [tab, setTab] = useState<'orders' | 'invoices' | 'warranties'>('orders');
  const [photosFor, setPhotosFor] = useState<number | null>(null);
  if (loading) return <div class="center-page"><Loading /></div>;
  if (error || !data) return <RequestLink error={initialError} />;
  const { customer, orders, invoices, warranties } = data;
  const logout = async () => { await api('/my/logout', { method: 'POST' }).catch(() => {}); onOut(); };
  const pending = orders.filter((o: any) => o.survey_token && !o.survey_done);
  return (
    <div class="center-page">
      <div class="box" style="max-width:640px">
        <div class="row between"><Brand /><button class="btn sm ghost" onClick={logout}><Icon name="logout" />خروج</button></div>
        <div class="card stack">
          <h1>هلا {String(customer.name).split(' ')[0]} 👋</h1>
          <p class="muted">هني تلقى كل طلباتك وفواتيرك وكفالاتك ويانا.</p>
          <a class="btn primary" href={bookHref()} target={SITE.whatsapp ? '_blank' : undefined} rel="noopener"><Icon name="wa" />اطلب خدمة جديدة</a>
        </div>
        {pending.length > 0 && (
          <div class="note stack">
            <b>عندك تقييم باقي ما سويته</b>
            {pending.map((o: any) => <a href={`/r/${o.survey_token}`}>قيّم طلب {o.code} ({o.service ?? 'خدمة'}) ←</a>)}
          </div>
        )}
        <div class="tabs">
          <button class={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>طلباتي ({orders.length})</button>
          <button class={tab === 'invoices' ? 'on' : ''} onClick={() => setTab('invoices')}>فواتيري ({invoices.length})</button>
          <button class={tab === 'warranties' ? 'on' : ''} onClick={() => setTab('warranties')}>كفالاتي ({warranties.length})</button>
        </div>
        {tab === 'orders' && (orders.length === 0 ? <div class="empty">ما عندك طلبات.</div> : (
          <div class="list">{orders.map((o: any) => (
            <div class="item">
              <div class="top"><span class="title">{o.service ?? 'خدمة'}</span><span class="badge t-info">{CUSTOMER_STATUS[o.status] ?? o.status}</span></div>
              <span class="small muted"><span class="num">{o.code}</span> · {fmtDate(o.created_at)}{o.area ? ` · ${o.area}` : ''}{o.tech_name ? ` · الفني ${String(o.tech_name).split(' ')[0]}` : ''}</span>
              {o.scheduled_at && !['done', 'closed'].includes(o.status) && <span class="small">الموعد: {fmtDateTime(o.scheduled_at)}</span>}
              {o.photos > 0 && <button class="btn sm" style="align-self:flex-start" onClick={() => setPhotosFor(o.id)}><Icon name="camera" />صور قبل وبعد ({o.photos})</button>}
            </div>
          ))}</div>
        ))}
        {tab === 'invoices' && (invoices.length === 0 ? <div class="empty">ما عندك فواتير.</div> : (
          <div class="list">{invoices.map((i: any) => (
            <a class="item" href={`/i/${i.public_token}`}>
              <div class="top"><span class="title num">{i.number}</span><span class="num">{kd(i.total_fils)}</span></div>
              <span class="small muted">{fmtDate(i.issued_at)} · طلب <span class="num">{i.code}</span> · {PAY[i.payment_status]}</span>
            </a>
          ))}</div>
        ))}
        {tab === 'warranties' && (warranties.length === 0 ? <div class="empty">ما عندك كفالات.</div> : (
          <div class="list">{warranties.map((w: any) => {
            const days = Math.ceil((new Date(w.ends_at).getTime() - Date.now()) / 86400_000);
            return (
              <div class="item">
                <div class="top"><span class="title">{w.service ?? 'خدمة'} · {w.months} شهر</span><span class={`badge ${days > 0 ? 't-good' : 't-muted'}`}>{days > 0 ? `باقي ${days} يوم` : 'انتهت'}</span></div>
                <span class="small muted">طلب <span class="num">{w.code}</span> · لين {fmtDate(w.ends_at)}</span>
                {w.covers && <span class="small">تشمل: {w.covers}</span>}
              </div>
            );
          })}</div>
        ))}
      </div>
      {photosFor && <PhotosModal orderId={photosFor} onClose={() => setPhotosFor(null)} />}
    </div>
  );
}

function PhotosModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data, loading } = useLoad(() => api(`/my/orders/${orderId}/photos`));
  return (
    <Modal title="صور قبل وبعد" onClose={onClose}>
      {loading ? <Loading /> : (['before', 'after'] as const).map((k) => (
        <div class="stack" style="gap:6px">
          <h3>{k === 'before' ? 'قبل' : 'بعد'}</h3>
          <div class="photos">{data.photos.filter((p: any) => p.kind === k).map((p: any) => <div class="ph"><a href={`/api/photos/${p.id}`} target="_blank" rel="noopener"><img src={`/api/photos/${p.id}`} alt="" loading="lazy" /></a></div>)}</div>
        </div>
      ))}
    </Modal>
  );
}

function RequestLink({ error }: { error: string | null }) {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const act = useAction();
  return (
    <div class="center-page">
      <form class="box card stack" onSubmit={(e) => { e.preventDefault(); act.run(async () => { await api('/my/request-link', { body: { phone } }); setSent(true); }); }}>
        <Brand />
        <h1>حسابي في شلال بيروت</h1>
        {error && <div class="note">{error}</div>}
        <p class="muted">حسابك يفتح من الرابط اللي يوصلك على الواتساب مع كل فاتورة. ما عندك الرابط؟ اكتب رقمك ونطرشه لك.</p>
        <ErrorBox error={act.error} />
        {sent ? <div class="ok">وصلنا طلبك. إذا رقمك مسجّل عندنا، بنطرش لك الرابط على الواتساب قريب.</div> : <>
          <Field label="رقم موبايلك"><input id="my-phone" class="input" type="tel" dir="ltr" inputMode="tel" value={phone} onInput={(e) => setPhone(e.currentTarget.value)} required /></Field>
          <Btn variant="primary" busy={act.busy} type="submit">طرّش لي الرابط</Btn>
        </>}
      </form>
    </div>
  );
}
