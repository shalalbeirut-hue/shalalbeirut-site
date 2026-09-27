// Quote → signed work order → invoice → paid. Item picker, signature and finish modals.
import { useState } from 'preact/hooks';
import { api, kd, fmtDateTime, PAY, PAY_METHOD, openWa } from '../lib';
import { useLoad, Loading, ErrorBox, Field, Btn, Modal, useAction, SignaturePad, Icon } from '../ui';

export const DOC: Record<string, { label: string; tone: string }> = {
  quote: { label: 'عرض سعر', tone: 'warn' },
  work_order: { label: 'أمر عمل (موقّع)', tone: 'info' },
  invoice: { label: 'فاتورة', tone: 'bad' },
  paid: { label: 'فاتورة مسددة', tone: 'good' },
};
const ORDER = ['quote', 'work_order', 'invoice', 'paid'];

export function DocSteps({ status }: { status?: string | null }) {
  const at = status ? ORDER.indexOf(status) : -1;
  const names = ['عرض سعر', 'توقيع العميل', 'فاتورة', 'مسددة'];
  return (
    <div class="doc-steps" aria-label="مراحل المستند">
      {names.map((n, i) => <>{i > 0 && <i>←</i>}<span class={i < at || (i === at && status === 'paid') ? 'done' : i === at ? 'now' : ''}>{n}</span></>)}
    </div>
  );
}

export type Line = { description: string; qty: number; unit_kd: string; kind: 'labour' | 'part' | 'other'; price_item_id?: number };

export const linesFromDoc = (doc: any): Line[] =>
  (doc?.items ?? []).map((i: any) => ({ description: i.description, qty: i.qty, unit_kd: (i.unit_fils / 1000).toFixed(3), kind: i.kind, price_item_id: i.price_item_id ?? undefined }));

/** Tap-to-add picker for labour and spare parts, with quantity steppers and a live total. */
export function ItemsEditor({ lines, setLines, discount, setDiscount, serviceId }: {
  lines: Line[]; setLines: (l: Line[]) => void; discount: string; setDiscount: (v: string) => void; serviceId?: number | null;
}) {
  const services = useLoad(() => api('/services'));
  const [tab, setTab] = useState<'labour' | 'part'>('labour');
  const [q, setQ] = useState('');
  const [showDiscount, setShowDiscount] = useState(!!Number(discount));

  const all = (services.data?.services ?? []).filter((s: any) => s.active)
    .flatMap((s: any) => s.items.filter((i: any) => i.active).map((i: any) => ({ ...i, mine: s.id === serviceId, svc: s.name_ar })));
  const list = all.filter((i: any) => i.kind === tab && (!q || i.name_ar.includes(q.trim())));
  const mine = list.filter((i: any) => i.mine);
  const others = list.filter((i: any) => !i.mine);

  const add = (p: any) => {
    const at = lines.findIndex((l) => l.price_item_id === p.id);
    if (at >= 0) return setLines(lines.map((l, i) => (i === at ? { ...l, qty: l.qty + 1 } : l)));
    setLines([...lines, { description: p.name_ar, qty: 1, unit_kd: p.price_fils != null ? (p.price_fils / 1000).toFixed(3) : '', kind: p.kind, price_item_id: p.id }]);
  };
  const upd = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const step = (i: number, d: number) => {
    const qty = Math.max(0, +(lines[i].qty + d).toFixed(2));
    setLines(qty === 0 ? lines.filter((_, j) => j !== i) : lines.map((l, j) => (j === i ? { ...l, qty } : l)));
  };
  const subtotal = lines.reduce((s, l) => s + l.qty * (Number(l.unit_kd) || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const chip = (p: any) => {
    const added = lines.some((l) => l.price_item_id === p.id);
    return (
      <button type="button" class={`chip-btn ${added ? 'added' : ''}`} onClick={() => add(p)}>
        <span>{p.name_ar}</span>
        <span class="p">{p.price_fils != null ? `${(p.price_fils / 1000).toFixed(3)} د.ك` : 'السعر عند الفني'}{added ? ' · ✓ مضاف' : ''}</span>
      </button>
    );
  };

  return (
    <div class="picker">
      <div class="seg" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'labour'} class={tab === 'labour' ? 'on' : ''} onClick={() => setTab('labour')}>مصنعيات</button>
        <button type="button" role="tab" aria-selected={tab === 'part'} class={tab === 'part' ? 'on' : ''} onClick={() => setTab('part')}>قطع غيار</button>
      </div>
      <input id="pick-q" class="input" placeholder={tab === 'labour' ? 'دوّر على مصنعية…' : 'دوّر على قطعة…'} value={q} onInput={(e) => setQ(e.currentTarget.value)} />
      {services.loading ? <Loading /> : (
        <div class="chips-grid">
          {mine.map(chip)}
          {others.length > 0 && mine.length > 0 && <div class="chips-sep">خدمات ثانية</div>}
          {others.map(chip)}
          {list.length === 0 && <div class="chips-sep">ما في شي بهالاسم. أضفه كبند يدوي تحت.</div>}
        </div>
      )}

      {lines.length > 0 && <h3 style="margin-top:6px">البنود ({lines.length})</h3>}
      <div class="lines">
        {lines.map((l, i) => (
          <div class="line">
            <input class="desc" aria-label="اسم البند" value={l.description} onInput={(e) => upd(i, { description: e.currentTarget.value })} placeholder="اكتب اسم البند" />
            <span class={`badge ${l.kind === 'part' ? 't-info' : 't-active'}`}>{l.kind === 'part' ? 'قطعة' : l.kind === 'labour' ? 'مصنعية' : 'أخرى'}</span>
            <div class="ctrl">
              <div class="stepper">
                <button type="button" aria-label="نقّص" onClick={() => step(i, -1)}>−</button>
                <input aria-label="الكمية" inputMode="decimal" dir="ltr" value={String(l.qty)} onInput={(e) => upd(i, { qty: Math.max(0, Number(e.currentTarget.value) || 0) })} />
                <button type="button" aria-label="زيّد" onClick={() => step(i, 1)}>+</button>
              </div>
              <span class="small muted">×</span>
              <input class={`price-in ${l.unit_kd === '' ? 'missing' : ''}`} aria-label="السعر بالدينار" inputMode="decimal" dir="ltr" placeholder="السعر" value={l.unit_kd} onInput={(e) => upd(i, { unit_kd: e.currentTarget.value })} />
              <span class="small muted">د.ك</span>
              <span class="grow" />
              <b class="num">{(l.qty * (Number(l.unit_kd) || 0)).toFixed(3)}</b>
            </div>
          </div>
        ))}
      </div>
      <div class="row">
        <Btn variant="sm" icon="plus" onClick={() => setLines([...lines, { description: '', qty: 1, unit_kd: '', kind: tab }])}>بند يدوي</Btn>
        {!showDiscount && <Btn variant="sm ghost" onClick={() => setShowDiscount(true)}>أضف خصم</Btn>}
      </div>
      {showDiscount && <Field label="خصم (د.ك)"><input id="pick-disc" class="input" inputMode="decimal" dir="ltr" value={discount} onInput={(e) => setDiscount(e.currentTarget.value)} /></Field>}
      <div class="total-bar"><span>الإجمالي{Number(discount) > 0 ? ` (بعد خصم ${Number(discount).toFixed(3)})` : ''}</span><b class="num">{total.toFixed(3)} د.ك</b></div>
    </div>
  );
}

const validLines = (lines: Line[]) => {
  if (!lines.length) return 'اختار بند واحد على الأقل';
  if (lines.some((l) => !l.description.trim())) return 'في بند بدون اسم';
  if (lines.some((l) => l.unit_kd === '' || !(Number(l.unit_kd) >= 0))) return 'حط سعر لكل بند (البند الأصفر ناقصه سعر)';
  return null;
};
const toBody = (lines: Line[]) => lines.map((l) => ({ description: l.description.trim(), qty: l.qty, unit_kd: l.unit_kd, kind: l.kind, price_item_id: l.price_item_id }));

/** Build or edit the quote. After saving, offer signing now or sending the link. */
export function QuoteModal({ order, doc, serviceId, onClose, onSaved }: any) {
  const [lines, setLines] = useState<Line[]>(linesFromDoc(doc));
  const [discount, setDiscount] = useState(doc?.discount_fils ? (doc.discount_fils / 1000).toFixed(3) : '');
  const [notes, setNotes] = useState(doc?.notes ?? '');
  const { busy, error, setError, run } = useAction();
  const save = () => {
    const err = validLines(lines);
    if (err) return setError(err);
    run(async () => { const r = await api(`/orders/${order.id}/quote`, { body: { items: toBody(lines), discount_kd: discount || 0, notes } }); onSaved(r); });
  };
  return (
    <Modal title={doc ? 'تعديل عرض السعر' : 'عرض سعر جديد'} onClose={onClose}>
      {doc?.doc_status === 'work_order' && <div class="note">العميل وقّع على هالعرض. أي تعديل يرجعه عرض سعر ويبيله توقيع جديد.</div>}
      <ErrorBox error={error} />
      <ItemsEditor lines={lines} setLines={setLines} discount={discount} setDiscount={setDiscount} serviceId={serviceId} />
      <Field label="ملاحظات للعميل (اختياري)"><input id="q-notes" class="input" placeholder="مثلاً: السعر يشمل التركيب والتجربة" value={notes} onInput={(e) => setNotes(e.currentTarget.value)} /></Field>
      <Btn variant="primary big" busy={busy} icon="check" onClick={save}>احفظ عرض السعر</Btn>
    </Modal>
  );
}

/** Customer signs on the technician's phone. */
export function SignModal({ order, doc, customerName, onClose, onDone }: any) {
  const [sig, setSig] = useState<string | null>(null);
  const [name, setName] = useState(customerName ?? '');
  const [agree, setAgree] = useState(false);
  const { busy, error, setError, run } = useAction();
  const submit = () => {
    if (!agree) return setError('لازم العميل يوافق على العرض');
    if (!sig) return setError('خل العميل يوقّع في المربع');
    run(async () => { await api(`/orders/${order.id}/sign`, { body: { signature: sig, name } }); onDone(); });
  };
  return (
    <Modal title="موافقة العميل وتوقيعه" onClose={onClose}>
      <ErrorBox error={error} />
      <div class="card stack" style="padding:12px">
        {doc.items.map((i: any) => <div class="row between small"><span>{i.description} × {i.qty}</span><span class="num">{kd(i.total_fils)}</span></div>)}
        <div class="row between"><b>الإجمالي</b><b class="num">{kd(doc.total_fils)}</b></div>
      </div>
      <label class="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.currentTarget.checked)} />أوافق على عرض السعر والشغل المذكور فوق</label>
      <Field label="اسم الموقّع"><input id="sg-name" class="input" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
      <SignaturePad onChange={setSig} />
      <Btn variant="primary big" busy={busy} icon="check" onClick={submit}>اعتمد التوقيع (يصير أمر عمل)</Btn>
    </Modal>
  );
}

/** Job done: warranty and payment. Items come from the work order; they can still be adjusted. */
export function FinishModal({ order, doc, serviceId, defaultMonths, onClose, onDone }: any) {
  const [editItems, setEditItems] = useState(!doc);
  const [lines, setLines] = useState<Line[]>(linesFromDoc(doc));
  const [discount, setDiscount] = useState(doc?.discount_fils ? (doc.discount_fils / 1000).toFixed(3) : '');
  const [months, setMonths] = useState(String(defaultMonths ?? 3));
  const [covers, setCovers] = useState('');
  const [notes, setNotes] = useState('');
  const [pay, setPay] = useState('unpaid');
  const [method, setMethod] = useState('cash');
  const [paid, setPaid] = useState('');
  const { busy, error, setError, run } = useAction();
  const submit = () => {
    if (editItems) { const err = validLines(lines); if (err) return setError(err); }
    run(async () => {
      const r = await api(`/orders/${order.id}/finish`, {
        body: {
          ...(editItems ? { items: toBody(lines), discount_kd: discount || 0 } : {}),
          warranty_months: Number(months), warranty_covers: covers, notes, payment_status: pay, payment_method: pay === 'unpaid' ? null : method, paid_kd: paid,
        },
      });
      onDone({ wa: r.wa, number: r.number });
    });
  };
  return (
    <Modal title="خلّصت الشغل: الفاتورة والكفالة" onClose={onClose}>
      <ErrorBox error={error} />
      {doc && !editItems && (
        <div class="card stack" style="padding:12px">
          <div class="row between"><b>{doc.doc_status === 'work_order' ? 'من أمر العمل الموقّع' : 'من عرض السعر'}</b><button class="btn sm ghost" onClick={() => setEditItems(true)}>عدّل البنود</button></div>
          {doc.items.map((i: any) => <div class="row between small"><span>{i.description} × {i.qty}</span><span class="num">{kd(i.total_fils)}</span></div>)}
          <div class="row between"><b>الإجمالي</b><b class="num">{kd(doc.total_fils)}</b></div>
          {doc.doc_status === 'quote' && <p class="small note">العميل باقي ما وقّع على العرض.</p>}
        </div>
      )}
      {editItems && <ItemsEditor lines={lines} setLines={setLines} discount={discount} setDiscount={setDiscount} serviceId={serviceId} />}
      <Field label="مدة الكفالة">
        <div class="tabs" style="margin:0">
          {['0', '1', '3', '6', '12', '24'].map((m) => <button type="button" class={months === m ? 'on' : ''} onClick={() => setMonths(m)}>{m === '0' ? 'بدون' : `${m} شهر`}</button>)}
        </div>
      </Field>
      {months !== '0' && <Field label="الكفالة تشمل (اختياري)"><input id="fn-covers" class="input" placeholder="مثلاً: الهيتر والتوصيلات" value={covers} onInput={(e) => setCovers(e.currentTarget.value)} /></Field>}
      <Field label="الدفع">
        <div class="tabs" style="margin:0">{Object.entries(PAY).map(([k, v]) => <button type="button" class={pay === k ? 'on' : ''} onClick={() => setPay(k)}>{v}</button>)}</div>
      </Field>
      {pay !== 'unpaid' && <div class="tabs" style="margin:0">{Object.entries(PAY_METHOD).map(([k, v]) => <button type="button" class={method === k ? 'on' : ''} onClick={() => setMethod(k)}>{v}</button>)}</div>}
      {pay === 'partial' && <Field label="المبلغ المدفوع (د.ك)"><input id="fn-paid" class="input" inputMode="decimal" dir="ltr" value={paid} onInput={(e) => setPaid(e.currentTarget.value)} /></Field>}
      <Field label="ملاحظات الفني (داخلية)"><textarea id="fn-notes" class="input" value={notes} onInput={(e) => setNotes(e.currentTarget.value)} /></Field>
      <Btn variant="primary big" busy={busy} icon="check" onClick={submit}>{pay === 'paid' ? 'اعمل فاتورة مسددة' : 'اعمل الفاتورة'}</Btn>
    </Modal>
  );
}

/** The document card on the order page, with the next action for its status. */
export function DocCard({ order, doc, customer, service, canEdit, onChanged, onPayment }: any) {
  const [modal, setModal] = useState<null | 'quote' | 'sign'>(null);
  const act = useAction();
  const st = doc?.doc_status;
  const sendQuote = () => act.run(async () => { const r = await api(`/orders/${order.id}/quote/send`, { method: 'POST' }); openWa(r.wa); });
  const sendInvoice = () => act.run(async () => { const r = await api(`/invoices/${doc.id}/send`, { method: 'POST' }); openWa(r.wa); onChanged(); });
  const editable = canEdit && (!st || st === 'quote' || st === 'work_order') && !['closed', 'cancelled'].includes(order.status);

  return (
    <div class="card stack">
      <div class="row between">
        <h2>{st ? DOC[st].label : 'عرض السعر والفاتورة'}{doc && <span class="num muted" style="font-size:.85rem;margin-inline-start:8px">{doc.number}</span>}</h2>
        {st === 'paid' && <span class="stamp-paid">مسددة</span>}
      </div>
      <DocSteps status={st} />
      <ErrorBox error={act.error} />
      {!doc ? (
        <>
          <p class="muted">بعد المعاينة، اعمل عرض سعر بالمصنعيات والقطع، وخل العميل يوقّع عليه قبل ما تبدأ.</p>
          {editable && <Btn variant="primary" icon="receipt" onClick={() => setModal('quote')}>اعمل عرض سعر</Btn>}
        </>
      ) : (
        <>
          <div class="stack" style="gap:6px">
            {doc.items.map((i: any) => (
              <div class="row between small"><span>{i.kind === 'part' ? '🔩 ' : '🛠️ '}{i.description} <span class="muted">× {i.qty}</span></span><span class="num">{kd(i.total_fils)}</span></div>
            ))}
            {doc.discount_fils > 0 && <div class="row between small muted"><span>خصم</span><span class="num">- {kd(doc.discount_fils)}</span></div>}
            <div class="row between"><b>الإجمالي</b><b class="num">{kd(doc.total_fils)}</b></div>
          </div>
          {doc.signed_at && (
            <div class="row" style="align-items:flex-end">
              <img class="sig-img" src={doc.signature} alt="توقيع العميل" />
              <span class="small muted">وقّع {doc.signed_name ?? ''} · {fmtDateTime(doc.signed_at)} · {doc.signed_via === 'link' ? 'من الرابط' : 'عند الفني'}</span>
            </div>
          )}
          {(st === 'invoice' || st === 'paid') && (
            <span class="small muted">{PAY[doc.payment_status]}{doc.payment_method ? ` · ${PAY_METHOD[doc.payment_method]}` : ''}{doc.sent_at ? ` · انرسلت ${fmtDateTime(doc.sent_at)}` : ' · ما انرسلت للعميل'}</span>
          )}
          <div class="row">
            {st === 'quote' && editable && <Btn variant="primary" icon="check" onClick={() => setModal('sign')}>العميل يوقّع الحين</Btn>}
            {st === 'quote' && <Btn icon="wa" busy={act.busy} onClick={sendQuote}>أرسل العرض يوقّع من الواتساب</Btn>}
            {editable && <Btn variant="sm ghost" onClick={() => setModal('quote')}>عدّل البنود</Btn>}
            {(st === 'invoice' || st === 'paid') && <Btn variant="primary" icon="wa" busy={act.busy} onClick={sendInvoice}>{doc.sent_at ? 'أرسل الفاتورة مرة ثانية' : 'أرسل الفاتورة على الواتساب'}</Btn>}
            {st === 'invoice' && onPayment && <Btn icon="check" onClick={onPayment}>سجّل الدفع (مسددة)</Btn>}
            <a class="btn sm" href={`/i/${doc.public_token}`} target="_blank" rel="noopener"><Icon name="receipt" />شكله عند العميل</a>
          </div>
        </>
      )}
      {modal === 'quote' && <QuoteModal order={order} doc={doc} serviceId={service?.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); onChanged(); }} />}
      {modal === 'sign' && <SignModal order={order} doc={doc} customerName={customer?.name} onClose={() => setModal(null)} onDone={() => { setModal(null); onChanged(); }} />}
    </div>
  );
}
