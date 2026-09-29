// Manager pages: team accounts, services and price list.
import { useState } from 'preact/hooks';
import { api, ROLE, phoneDisplay } from '../lib';
import { useLoad, Loading, ErrorBox, Field, Btn, Modal, useAction } from '../ui';
import { useApp } from './App';

export function Team() {
  const { user } = useApp();
  const { data, error, loading, reload } = useLoad(() => api('/users'));
  const [edit, setEdit] = useState<any | null>(null);
  const [pw, setPw] = useState<any | null>(null);
  const [done, setDone] = useState<string | null>(null);
  return (
    <div>
      <div class="page-head"><h1>الفريق</h1><Btn variant="primary" icon="plus" onClick={() => setEdit({})}>أضف شخص</Btn></div>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : (
        <div class="list">{data.users.map((u: any) => (
          <div class="item">
            <div class="top"><span class="title">{u.name}</span><span class="row" style="gap:6px"><span class="badge t-info">{ROLE[u.role]}</span>{!u.active && <span class="badge t-muted">موقوف</span>}</span></div>
            <div class="row between"><span class="small num">{phoneDisplay(u.phone)}</span>
              {(u.role !== 'admin' || user.role === 'admin') && (
                <span class="row" style="gap:6px">
                  {u.id === user.id
                    ? <a class="btn sm" href="/app/password/">تغيير كلمة المرور</a>
                    : <Btn variant="sm" icon="key" onClick={() => setPw(u)}>تغيير كلمة المرور</Btn>}
                  <Btn variant="sm" onClick={() => setEdit(u)}>تعديل</Btn>
                </span>
              )}
            </div>
          </div>
        ))}</div>
      )}
      {done && <div class="ok" style="margin-block:10px">{done}</div>}
      {pw && <PasswordModal u={pw} onClose={() => setPw(null)} onDone={() => { setDone(`تم تغيير كلمة المرور لـ ${pw.name}. عطه الكلمة الجديدة بنفسك، وبيطلب منه يغيّرها أول ما يدخل.`); setPw(null); }} />}
      {edit && <UserModal u={edit} canAdmin={user.role === 'admin'} onClose={() => setEdit(null)} onDone={() => { setEdit(null); reload(); }} />}
    </div>
  );
}

/** Sets a new temporary password for someone on the team. */
function PasswordModal({ u, onClose, onDone }: any) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const { busy, error, setError, run } = useAction();
  const save = () => {
    if (p1.length < 8) return setError('كلمة المرور لازم تكون 8 حروف أو أرقام على الأقل');
    if (p1 !== p2) return setError('كلمة المرور مو نفسها في الخانتين');
    run(async () => { await api(`/users/${u.id}`, { method: 'PATCH', body: { password: p1 } }); onDone(); });
  };
  return (
    <Modal title={`تغيير كلمة المرور: ${u.name}`} onClose={onClose}>
      <p class="muted small">بيطلع من كل الأجهزة، وأول ما يدخل بالكلمة الجديدة بيطلب منه يختار كلمة خاصة فيه.</p>
      <ErrorBox error={error} />
      <Field label="كلمة المرور الجديدة (مؤقتة)"><input id="pw-new" class="input" type="password" autoComplete="new-password" minLength={8} value={p1} onInput={(e) => setP1(e.currentTarget.value)} /></Field>
      <Field label="أكّد كلمة المرور"><input id="pw-new2" class="input" type="password" autoComplete="new-password" minLength={8} value={p2} onInput={(e) => setP2(e.currentTarget.value)} /></Field>
      <Btn variant="primary" icon="key" busy={busy} onClick={save}>غيّر كلمة المرور</Btn>
    </Modal>
  );
}

function UserModal({ u, canAdmin, onClose, onDone }: any) {
  const isNew = !u.id;
  const [name, setName] = useState(u.name ?? '');
  const [phone, setPhone] = useState(u.phone ? phoneDisplay(u.phone).replace(' ', '') : '');
  const [role, setRole] = useState(u.role ?? 'tech');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(u.active ?? 1);
  const { busy, error, run } = useAction();
  const save = () => run(async () => {
    if (isNew) await api('/users', { body: { name, phone, role, password } });
    else await api(`/users/${u.id}`, { method: 'PATCH', body: { name, role, active: !!active, ...(password ? { password } : {}) } });
    onDone();
  });
  return (
    <Modal title={isNew ? 'شخص جديد في الفريق' : `تعديل ${u.name}`} onClose={onClose}>
      <ErrorBox error={error} />
      <Field label="الاسم"><input id="um-name" class="input" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
      {isNew && <Field label="رقم الموبايل (هو اسم الدخول)"><input id="um-phone" class="input" type="tel" dir="ltr" value={phone} onInput={(e) => setPhone(e.currentTarget.value)} /></Field>}
      <Field label="الدور">
        <select id="um-role" class="input" value={role} onChange={(e) => setRole(e.currentTarget.value)}>
          <option value="tech">فني</option><option value="cs">خدمة العملاء</option><option value="manager">مدير</option>{canAdmin && <option value="admin">مدير النظام</option>}
        </select>
      </Field>
      <Field label={isNew ? 'كلمة سر مؤقتة' : 'كلمة سر مؤقتة جديدة (اختياري)'} hint="8 حروف أو أرقام على الأقل. بيطلب منه يغيّرها أول ما يدخل. عطه إياها بنفسك.">
        <input id="um-pass" class="input" type="text" autoComplete="off" value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
      </Field>
      {!isNew && <label class="check"><input type="checkbox" checked={!!active} onChange={(e) => setActive(e.currentTarget.checked ? 1 : 0)} />الحساب شغال</label>}
      <Btn variant="primary" busy={busy} onClick={save}>حفظ</Btn>
    </Modal>
  );
}

export function Services() {
  const { data, error, loading, reload } = useLoad(() => api('/services'));
  const act = useAction();
  const [newItem, setNewItem] = useState<Record<number, { name_ar: string; price: string; kind?: string }>>({});
  const saveItem = (id: number, body: any) => act.run(async () => { await api(`/price-items/${id}`, { method: 'PATCH', body }); reload(); });
  const saveService = (id: number, body: any) => act.run(async () => { await api(`/services/${id}`, { method: 'PATCH', body }); reload(); });
  const addItem = (sid: number) => act.run(async () => {
    const n = newItem[sid];
    if (!n?.name_ar) return;
    await api('/price-items', { body: { service_id: sid, name_ar: n.name_ar, price_kd: n.price, kind: n.kind ?? 'labour' } });
    setNewItem({ ...newItem, [sid]: { name_ar: '', price: '' } });
    reload();
  });
  if (loading && !data) return <Loading />;
  return (
    <div class="stack">
      <div class="page-head"><h1>الخدمات والأسعار</h1></div>
      <p class="muted">كل بند إما مصنعية أو قطعة غيار، ويطلع للفني في عرض السعر بضغطة. الأسعار هني هي "يبدأ من"، والفني يقدر يعدّلها. اترك السعر فاضي إذا يتحدد بعد المعاينة. التغيير ينحفظ لما تطلع من الخانة.</p>
      <ErrorBox error={error || act.error} />
      {data.services.map((s: any) => (
        <div class="card stack">
          <div class="row between">
            <h2>{s.name_ar}</h2>
            <div class="row small">
              <label class="row" style="gap:6px">كفالة افتراضية
                <select id={`sv-w-${s.id}`} class="input" style="width:auto;min-height:36px" value={s.default_warranty_months ?? ''} onChange={(e) => saveService(s.id, { default_warranty_months: e.currentTarget.value ? Number(e.currentTarget.value) : null })}>
                  <option value="">—</option>{[0, 1, 3, 6, 12, 24].map((m) => <option value={m}>{m} شهر</option>)}
                </select>
              </label>
              <label class="check"><input type="checkbox" checked={!!s.active} onChange={(e) => saveService(s.id, { active: e.currentTarget.checked })} />ظاهرة</label>
            </div>
          </div>
          <div class="table-wrap"><table>
            <thead><tr><th>البند</th><th>النوع</th><th>يبدأ من (د.ك)</th><th>ظاهر</th></tr></thead>
            <tbody>
              {s.items.map((i: any) => (
                <tr>
                  <td><input id={`pi-n-${i.id}`} class="input" defaultValue={i.name_ar} onBlur={(e) => e.currentTarget.value !== i.name_ar && saveItem(i.id, { name_ar: e.currentTarget.value })} /></td>
                  <td style="width:120px"><select id={`pi-k-${i.id}`} class="input" value={i.kind} onChange={(e) => saveItem(i.id, { kind: e.currentTarget.value })}><option value="labour">مصنعية</option><option value="part">قطعة غيار</option></select></td>
                  <td style="width:150px"><input id={`pi-p-${i.id}`} class="input" type="number" min="0" step="0.001" dir="ltr" placeholder="بعد المعاينة" defaultValue={i.price_fils != null ? (i.price_fils / 1000).toFixed(3) : ''} onBlur={(e) => saveItem(i.id, { price_kd: e.currentTarget.value })} /></td>
                  <td style="width:70px"><input type="checkbox" aria-label="ظاهر" checked={!!i.active} onChange={(e) => saveItem(i.id, { active: e.currentTarget.checked })} /></td>
                </tr>
              ))}
              <tr>
                <td><input id={`pi-new-n-${s.id}`} class="input" placeholder="بند جديد" value={newItem[s.id]?.name_ar ?? ''} onInput={(e) => setNewItem({ ...newItem, [s.id]: { ...(newItem[s.id] ?? { price: '' }), name_ar: e.currentTarget.value } })} /></td>
                <td><select id={`pi-new-k-${s.id}`} class="input" value={newItem[s.id]?.kind ?? 'labour'} onChange={(e) => setNewItem({ ...newItem, [s.id]: { ...(newItem[s.id] ?? { name_ar: '', price: '' }), kind: e.currentTarget.value } })}><option value="labour">مصنعية</option><option value="part">قطعة غيار</option></select></td>
                <td><input id={`pi-new-p-${s.id}`} class="input" type="number" min="0" step="0.001" dir="ltr" value={newItem[s.id]?.price ?? ''} onInput={(e) => setNewItem({ ...newItem, [s.id]: { ...(newItem[s.id] ?? { name_ar: '' }), price: e.currentTarget.value } })} /></td>
                <td><Btn variant="sm primary" busy={act.busy} onClick={() => addItem(s.id)}>أضف</Btn></td>
              </tr>
            </tbody>
          </table></div>
        </div>
      ))}
    </div>
  );
}
