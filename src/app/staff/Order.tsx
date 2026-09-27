// Order detail: everything about one visit, with the actions each role can take.
import { useState } from 'preact/hooks';
import {
  api, fmtDateTime, fmtDate, kd, phoneDisplay, telHref, waHref, SOURCE, PAY, PAY_METHOD,
  kuwaitLocalToIso, isoToKuwaitLocal, compressImage, getLocation, openWa,
} from '../lib';
import { useLoad, Loading, ErrorBox, StatusBadge, Stars, Icon, Field, Btn, Modal, useAction, ServiceChips } from '../ui';
import { useApp } from './App';
import { DocCard, FinishModal } from './Docs';

const ACTION_AR: Record<string, string> = {
  created: 'انضاف الطلب', assigned: 'انسند', on_the_way: 'الفني طلع بالطريق', started: 'بدأ الشغل', photo: 'انضافت صورة',
  photo_deleted: 'انمسحت صورة', finished: 'خلص الشغل وطلعت الفاتورة', invoice_sent: 'انرسلت الفاتورة', payment: 'تحديث الدفع',
  followup: 'متابعة', survey: 'العميل قيّم', cancelled: 'انلغى', reopened: 'انفتح من جديد', edited: 'تعديل',
};

export function OrderView({ id }: { id: number }) {
  const { user } = useApp();
  const { data, error, loading, reload } = useLoad(() => api(`/orders/${id}`), [id]);
  const [modal, setModal] = useState<null | 'assign' | 'finish' | 'cancel' | 'reopen' | 'payment' | 'services'>(null);
  const [sent, setSent] = useState<{ wa: string; number?: string } | null>(null);
  const act = useAction();
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { order: o, customer: c, address: a, service, services, tech, photos, invoice, warranty, survey, followups, activity } = data;
  const office = user.role !== 'tech';
  const manager = user.role === 'admin' || user.role === 'manager';
  const active = !['done', 'closed', 'cancelled'].includes(o.status);

  const onTheWay = () => act.run(async () => { const r = await api(`/orders/${id}/on-the-way`, { method: 'POST' }); openWa(r.wa); reload(); });
  const start = () => act.run(async () => {
    const pos = await getLocation();
    const r = await api(`/orders/${id}/start`, { body: pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } : {} });
    if (!r.location) act.setError('بدأ الشغل، بس ما قدرنا ناخذ لوكيشنك. فعّل خدمة الموقع للمتصفح المرة الجاية.');
    reload();
  });
  const sendInvoice = () => act.run(async () => { const r = await api(`/invoices/${invoice.id}/send`, { method: 'POST' }); openWa(r.wa); reload(); });

  const addrLine = a ? [a.governorate, a.area, a.block && `ق ${a.block}`, a.street && `ش ${a.street}`, a.avenue && `ج ${a.avenue}`, a.building && `م ${a.building}`, a.floor && `د ${a.floor}`, a.flat && `شقة ${a.flat}`].filter(Boolean).join(' - ') : null;
  const mapHref = a?.maps_url || (a?.lat ? `https://maps.google.com/?q=${a.lat},${a.lng}` : null);

  return (
    <div class="stack">
      <div class="page-head">
        <div class="stack" style="gap:4px">
          <a class="small" href={office ? '/app/orders/' : '/app/'}>← {office ? 'الطلبات' : 'زياراتي'}</a>
          <h1>{c.name} <span class="muted num" style="font-size:1rem">{o.code}</span></h1>
        </div>
        <span class="row">{o.priority === 'urgent' && <span class="badge urgent">مستعجل</span>}<StatusBadge status={o.status} /></span>
      </div>
      <ErrorBox error={act.error} />

      {/* Technician flow */}
      {active && (user.role === 'tech' || office) && o.tech_id && (
        <div class="card stack">
          <h2>خطوات الزيارة</h2>
          {['assigned', 'reopened'].includes(o.status) && <Btn variant="water big block" icon="truck" busy={act.busy} onClick={onTheWay}>أنا بالطريق (يرسل رسالة للعميل)</Btn>}
          {['assigned', 'on_the_way', 'reopened'].includes(o.status) && <Btn variant="primary big block" icon="play" busy={act.busy} onClick={start}>بدأت الشغل مع {c.name}</Btn>}
          {o.status === 'in_progress' && <Btn variant="primary big block" icon="check" onClick={() => setModal('finish')}>خلّصت الشغل: الفاتورة والكفالة</Btn>}
          {['in_progress', 'on_the_way', 'assigned'].includes(o.status) && (!invoice || invoice.doc_status === 'quote') && <p class="note small">{!invoice ? 'بعد المعاينة: اعمل عرض السعر تحت وخل العميل يوقّع قبل ما تبدأ.' : 'عرض السعر ينتظر توقيع العميل (تحت).'}</p>}
          {o.status === 'in_progress' && <p class="small muted">لا تنسى تصوّر قبل وبعد الشغل.</p>}
        </div>
      )}

      {sent && (
        <div class="ok stack">
          <b>انحفظت الفاتورة {sent.number}.</b>
          <Btn variant="primary" icon="wa" onClick={() => { openWa(sent.wa); setSent(null); }}>أرسل الفاتورة للعميل على الواتساب</Btn>
        </div>
      )}

      <div class="grid2">
        <div class="card stack">
          <h2>العميل</h2>
          <div class="row between"><b>{c.name}</b>{office && <a class="small" href={`/app/customers/${c.id}/`}>ملف العميل</a>}</div>
          <div class="row">
            <a class="btn sm" href={telHref(c.phone)}><Icon name="phone" /><span class="num">{phoneDisplay(c.phone)}</span></a>
            <a class="btn sm" href={waHref(c.phone)} target="_blank" rel="noopener"><Icon name="wa" />واتساب</a>
          </div>
          {addrLine && <p>{addrLine}</p>}
          {a?.notes && <p class="small muted">{a.notes}</p>}
          {mapHref && <a class="btn sm" href={mapHref} target="_blank" rel="noopener"><Icon name="pin" />افتح اللوكيشن</a>}
          {c.notes && <p class="note small">{c.notes}</p>}
        </div>
        <div class="card stack">
          <h2>الطلب</h2>
          <dl class="kv">
            <dt>{services.length > 1 ? 'الخدمات' : 'الخدمة'}</dt><dd>{services.length ? services.map((s: any) => s.name_ar).join('، ') : '—'}</dd>
            <dt>المصدر</dt><dd>{SOURCE[o.source] ?? o.source}</dd>
            {o.preferred_time && <><dt>يناسبه</dt><dd>{o.preferred_time}</dd></>}
            <dt>الموعد</dt><dd>{fmtDateTime(o.scheduled_at)}</dd>
            <dt>الفني</dt><dd>{tech?.name ?? 'ما انسند'}</dd>
            {o.started_at && <><dt>بدأ</dt><dd>{fmtDateTime(o.started_at)} {o.start_lat && <a href={`https://maps.google.com/?q=${o.start_lat},${o.start_lng}`} target="_blank" rel="noopener">(موقع الفني)</a>}</dd></>}
            {o.finished_at && <><dt>خلص</dt><dd>{fmtDateTime(o.finished_at)}</dd></>}
          </dl>
          {o.description && <p style="white-space:pre-line">{o.description}</p>}
          {o.tech_notes && <p class="note small" style="white-space:pre-line">ملاحظات الفني: {o.tech_notes}</p>}
          {office && (
            <div class="row">
              {active && <Btn variant="sm" icon="tag" onClick={() => setModal('services')}>عدّل الخدمات</Btn>}
              {active && <Btn variant="sm" icon="users" onClick={() => setModal('assign')}>{o.tech_id ? 'غيّر الفني أو الموعد' : 'اسند لفني'}</Btn>}
              {active && <Btn variant="sm danger" onClick={() => setModal('cancel')}>إلغاء الطلب</Btn>}
              {['done', 'closed'].includes(o.status) && <Btn variant="sm" icon="refresh" onClick={() => setModal('reopen')}>افتح الطلب من جديد</Btn>}
            </div>
          )}
        </div>
      </div>

      <Photos orderId={id} photos={photos} canEdit={office || active} reload={reload} />

      <DocCard order={o} doc={invoice} customer={c} serviceIds={services.map((s: any) => s.id)} canEdit={user.role !== 'tech' || o.tech_id === user.id} onChanged={reload} onPayment={office ? () => setModal('payment') : undefined} />

      {warranty && (
        <div class="card row">
          <Icon name="shield" class="" />
          <div class="grow"><b>كفالة {warranty.months} شهر</b><div class="small muted">من {fmtDate(warranty.starts_at)} لين {fmtDate(warranty.ends_at)}{warranty.covers ? ` · ${warranty.covers}` : ''}</div></div>
          <span class={`badge ${new Date(warranty.ends_at) > new Date() ? 't-good' : 't-muted'}`}>{new Date(warranty.ends_at) > new Date() ? 'سارية' : 'منتهية'}</span>
        </div>
      )}

      {survey && (
        <div class="card stack">
          <h2>تقييم العميل</h2>
          {!survey.submitted_at ? <p class="muted">العميل باقي ما قيّم.{survey.sent_at ? ` انرسل له ${fmtDateTime(survey.sent_at)}.` : ''}</p> : (
            <>
              <dl class="kv"><dt>الخدمة ككل</dt><dd><Stars n={survey.rating_overall} /></dd><dt>الفني</dt><dd><Stars n={survey.rating_tech} /></dd><dt>الالتزام بالموعد</dt><dd><Stars n={survey.rating_punctuality} /></dd></dl>
              {survey.comment && <p style="white-space:pre-line">"{survey.comment}"</p>}
              <div class="row small muted">
                <span>{survey.consent_publish ? 'وافق على نشر رأيه' : 'ما وافق على النشر'}</span>
                {survey.publish_status === 'approved' && <span class="badge t-good">منشور في الموقع</span>}
                {survey.publish_status === 'rejected' && <span class="badge t-muted">مرفوض للنشر</span>}
              </div>
              {manager && survey.publish_status === 'pending' && (
                <div class="row">
                  <Btn variant="primary sm" busy={act.busy} onClick={() => act.run(async () => { await api(`/surveys/${survey.id}/review`, { body: { status: 'approved' } }); reload(); })}>انشر في الموقع</Btn>
                  <Btn variant="sm" busy={act.busy} onClick={() => act.run(async () => { await api(`/surveys/${survey.id}/review`, { body: { status: 'rejected' } }); reload(); })}>لا تنشر</Btn>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {office && followups.length > 0 && (
        <div class="card stack">
          <h2>المتابعة</h2>
          <ul class="timeline">{followups.map((f: any) => (
            <li>{f.done_at ? `${fmtDateTime(f.done_at)} · ${f.done_by_name ?? ''}: ${f.result === 'resolved' ? 'العطل انحل' : f.result === 'not_resolved' ? 'العطل ما انحل' : 'ما رد'}${f.notes ? ` (${f.notes})` : ''}` : `مستحقة ${fmtDateTime(f.due_at)}`}</li>
          ))}</ul>
        </div>
      )}

      {office && (
        <div class="card stack">
          <h2>سجل الطلب</h2>
          <ul class="timeline">{activity.map((x: any) => <li><span class="muted small">{fmtDateTime(x.created_at)}</span> · {ACTION_AR[x.action] ?? x.action}{x.actor ? ` · ${x.actor}` : ''}</li>)}</ul>
        </div>
      )}

      {modal === 'assign' && <AssignModal order={o} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {modal === 'services' && <ServicesModal order={o} current={services.map((s: any) => s.id)} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {modal === 'finish' && <FinishModal order={o} doc={invoice} serviceIds={services.map((s: any) => s.id)} defaultMonths={services.reduce((m: number | null, s: any) => (s.default_warranty_months != null && (m == null || s.default_warranty_months > m) ? s.default_warranty_months : m), null)} onClose={() => setModal(null)} onDone={(r: { wa: string; number: string }) => { setModal(null); setSent(r); reload(); }} />}
      {modal === 'payment' && invoice && <PaymentModal invoice={invoice} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {(modal === 'cancel' || modal === 'reopen') && <ReasonModal kind={modal} orderId={id} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
    </div>
  );
}

function Photos({ orderId, photos, canEdit, reload }: { orderId: number; photos: any[]; canEdit: boolean; reload: () => void }) {
  const { busy, error, run } = useAction();
  const upload = (kind: 'before' | 'after') => (e: any) => {
    const files: File[] = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = '';
    run(async () => {
      for (const file of files) {
        const blob = await compressImage(file);
        await api(`/orders/${orderId}/photos?kind=${kind}`, { raw: blob, type: 'image/jpeg' });
      }
      reload();
    });
  };
  const del = (pid: number) => run(async () => { await api(`/photos/${pid}`, { method: 'DELETE' }); reload(); });
  const section = (kind: 'before' | 'after', title: string) => (
    <div class="stack" style="gap:8px">
      <h3>{title}</h3>
      <div class="photos">
        {photos.filter((p) => p.kind === kind).map((p) => (
          <div class="ph"><a href={`/api/photos/${p.id}`} target="_blank" rel="noopener"><img src={`/api/photos/${p.id}`} alt={title} loading="lazy" /></a>
            {canEdit && <button class="del" aria-label="امسح الصورة" onClick={() => del(p.id)}>×</button>}</div>
        ))}
        {canEdit && (
          <label class="upload"><input type="file" accept="image/*" capture="environment" multiple onChange={upload(kind)} disabled={busy} />
            <span><Icon name="camera" /><br />{busy ? 'جاري الرفع…' : 'صوّر / أضف'}</span></label>
        )}
      </div>
    </div>
  );
  return (
    <div class="card stack">
      <h2>الصور</h2>
      <ErrorBox error={error} />
      <div class="grid2">{section('before', 'قبل')}{section('after', 'بعد')}</div>
    </div>
  );
}

function ServicesModal({ order, current, onClose, onDone }: any) {
  const all = useLoad(() => api('/services'));
  const [ids, setIds] = useState<number[]>(current);
  const { busy, error, run } = useAction();
  return (
    <Modal title="خدمات الطلب" onClose={onClose}>
      <ErrorBox error={error} />
      {all.loading ? <Loading /> : <ServiceChips services={all.data.services} value={ids} onChange={setIds} />}
      <Btn variant="primary" busy={busy} disabled={!ids.length} onClick={() => run(async () => { await api(`/orders/${order.id}`, { method: 'PATCH', body: { service_ids: ids } }); onDone(); })}>حفظ</Btn>
    </Modal>
  );
}

function AssignModal({ order, onClose, onDone }: any) {
  const techs = useLoad(() => api('/users?role=tech'));
  const [techId, setTechId] = useState(order.tech_id ? String(order.tech_id) : '');
  const [when, setWhen] = useState(isoToKuwaitLocal(order.scheduled_at));
  const { busy, error, run } = useAction();
  return (
    <Modal title="إسناد الطلب" onClose={onClose}>
      <ErrorBox error={error} />
      <Field label="الفني"><select id="as-tech" class="input" value={techId} onChange={(e) => setTechId(e.currentTarget.value)}><option value="">اختار</option>{techs.data?.users.filter((u: any) => u.active).map((u: any) => <option value={u.id}>{u.name}</option>)}</select></Field>
      <Field label="موعد الزيارة"><input id="as-when" class="input" type="datetime-local" value={when} onInput={(e) => setWhen(e.currentTarget.value)} /></Field>
      <Btn variant="primary" busy={busy} disabled={!techId} onClick={() => run(async () => { await api(`/orders/${order.id}/assign`, { body: { tech_id: Number(techId), scheduled_at: kuwaitLocalToIso(when) } }); onDone(); })}>حفظ</Btn>
    </Modal>
  );
}

function PaymentModal({ invoice, onClose, onDone }: any) {
  const [pay, setPay] = useState(invoice.payment_status);
  const [method, setMethod] = useState(invoice.payment_method ?? 'cash');
  const [paid, setPaid] = useState(invoice.paid_fils ? (invoice.paid_fils / 1000).toFixed(3) : '');
  const { busy, error, run } = useAction();
  return (
    <Modal title="تحديث الدفع" onClose={onClose}>
      <ErrorBox error={error} />
      <Field label="الحالة"><select id="pm-status" class="input" value={pay} onChange={(e) => setPay(e.currentTarget.value)}>{Object.entries(PAY).map(([k, v]) => <option value={k}>{v}</option>)}</select></Field>
      {pay !== 'unpaid' && <Field label="طريقة الدفع"><select id="pm-method" class="input" value={method} onChange={(e) => setMethod(e.currentTarget.value)}>{Object.entries(PAY_METHOD).map(([k, v]) => <option value={k}>{v}</option>)}</select></Field>}
      {pay === 'partial' && <Field label="المدفوع (د.ك)"><input id="pm-paid" class="input" type="number" step="0.001" dir="ltr" value={paid} onInput={(e) => setPaid(e.currentTarget.value)} /></Field>}
      <Btn variant="primary" busy={busy} onClick={() => run(async () => { await api(`/invoices/${invoice.id}/payment`, { method: 'PATCH', body: { payment_status: pay, payment_method: method, paid_kd: paid } }); onDone(); })}>حفظ</Btn>
    </Modal>
  );
}

function ReasonModal({ kind, orderId, onClose, onDone }: any) {
  const [reason, setReason] = useState('');
  const { busy, error, run } = useAction();
  return (
    <Modal title={kind === 'cancel' ? 'إلغاء الطلب' : 'فتح الطلب من جديد'} onClose={onClose}>
      <ErrorBox error={error} />
      <Field label="السبب"><textarea id="rsn" class="input" value={reason} onInput={(e) => setReason(e.currentTarget.value)} /></Field>
      <Btn variant={kind === 'cancel' ? 'danger' : 'primary'} busy={busy} onClick={() => run(async () => { await api(`/orders/${orderId}/${kind}`, { body: { reason } }); onDone(); })}>{kind === 'cancel' ? 'ألغِ الطلب' : 'افتح الطلب'}</Btn>
    </Modal>
  );
}
