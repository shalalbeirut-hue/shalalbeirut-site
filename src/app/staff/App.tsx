// Staff app shell: session, routing, navigation by role.
import { useEffect, useState } from 'preact/hooks';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { api, ROLE } from '../lib';
import { Icon, Mark, Loading, ErrorBox, Field, Btn, useAction } from '../ui';
import { Dashboard } from './Dashboard';
import { Orders, NewOrder } from './Orders';
import { OrderView } from './Order';
import { Followups, Surveys, Invoices, Customers, CustomerView } from './Office';
import { Team, Services } from './Admin';
import { Notifications } from './Notifications';

export type User = { id: number; name: string; phone: string; role: 'admin' | 'manager' | 'cs' | 'tech'; must_change_pass: number };
type Ctx = { user: User; go: (path: string) => void; counts: { unread: number; followups_due: number }; refreshCounts: () => void };
export const AppCtx = createContext<Ctx>(null as any);
export const useApp = () => useContext(AppCtx);

const BASE = '/app';
const currentPath = () => location.pathname.replace(/^\/app/, '').replace(/\/+$/, '') || '/';

type NavItem = { path: string; label: string; icon: string; roles: User['role'][]; badge?: 'followups' | 'unread' };
const NAV: NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: 'chart', roles: ['admin', 'manager'] },
  { path: '/', label: 'زياراتي', icon: 'truck', roles: ['tech'] },
  { path: '/followups', label: 'المتابعة', icon: 'headset', roles: ['admin', 'manager', 'cs'], badge: 'followups' },
  { path: '/orders', label: 'الطلبات', icon: 'list', roles: ['admin', 'manager', 'cs'] },
  { path: '/customers', label: 'العملاء', icon: 'user', roles: ['admin', 'manager', 'cs'] },
  { path: '/invoices', label: 'الفواتير', icon: 'receipt', roles: ['admin', 'manager', 'cs'] },
  { path: '/surveys', label: 'الاستبيانات', icon: 'star', roles: ['admin', 'manager', 'cs'] },
  { path: '/team', label: 'الفريق', icon: 'users', roles: ['admin', 'manager'] },
  { path: '/services', label: 'الخدمات والأسعار', icon: 'tag', roles: ['admin', 'manager'] },
  { path: '/notifications', label: 'التنبيهات', icon: 'bell', roles: ['tech'], badge: 'unread' },
];

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [path, setPath] = useState(currentPath());
  const [counts, setCounts] = useState({ unread: 0, followups_due: 0 });

  const go = (p: string) => {
    history.pushState(null, '', BASE + (p === '/' ? '/' : p + '/'));
    setPath(p);
    window.scrollTo(0, 0);
  };
  const loadMe = () => api('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null));
  const refreshCounts = () => api('/notifications').then((d) => setCounts({ unread: d.unread, followups_due: d.followups_due })).catch(() => {});

  useEffect(() => {
    loadMe();
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    // Keep in-app links client-side.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith(BASE + '/')) { e.preventDefault(); go(href.slice(BASE.length).replace(/\/+$/, '') || '/'); }
    };
    document.addEventListener('click', onClick);
    return () => { window.removeEventListener('popstate', onPop); document.removeEventListener('click', onClick); };
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshCounts();
    const t = setInterval(refreshCounts, 60_000);
    return () => clearInterval(t);
  }, [user?.id]);

  if (user === undefined) return <Loading />;
  if (user === null) return <Login onDone={loadMe} />;
  if (user.must_change_pass) return <ChangePassword forced onDone={loadMe} />;

  const nav = NAV.filter((n) => n.roles.includes(user.role));
  const badge = (n: NavItem) => (n.badge === 'followups' ? counts.followups_due : n.badge === 'unread' ? counts.unread : 0);
  const isOn = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
  const seg = path.split('/').filter(Boolean);

  let page;
  if (path === '/') page = user.role === 'tech' ? <Orders techHome /> : user.role === 'cs' ? <Followups /> : <Dashboard />;
  else if (seg[0] === 'orders' && seg[1] === 'new') page = <NewOrder />;
  else if (seg[0] === 'orders' && seg[1]) page = <OrderView id={Number(seg[1])} />;
  else if (seg[0] === 'orders') page = <Orders />;
  else if (seg[0] === 'followups') page = <Followups />;
  else if (seg[0] === 'surveys') page = <Surveys />;
  else if (seg[0] === 'invoices') page = <Invoices />;
  else if (seg[0] === 'customers' && seg[1]) page = <CustomerView id={Number(seg[1])} />;
  else if (seg[0] === 'customers') page = <Customers />;
  else if (seg[0] === 'team') page = <Team />;
  else if (seg[0] === 'services') page = <Services />;
  else if (seg[0] === 'notifications') page = <Notifications />;
  else if (seg[0] === 'password') page = <ChangePassword onDone={() => go('/')} />;
  else page = <div class="empty">الصفحة مو موجودة. <a href="/app/">ارجع للرئيسية</a></div>;

  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); };

  return (
    <AppCtx.Provider value={{ user, go, counts, refreshCounts }}>
      <div class="shell">
        <header class="topbar">
          <a class="brand" href="/app/"><Mark pipe="#fff" water="#62C0EA" />شلال بيروت</a>
          <span class="spacer" />
          <a class="icon-btn" href="/app/notifications" aria-label="التنبيهات" style="color:#fff">
            <Icon name="bell" />{counts.unread > 0 && <span class="dot">{counts.unread > 99 ? '99+' : counts.unread}</span>}
          </a>
          <a class="icon-btn" href="/app/password" aria-label="كلمة السر" title={`${user.name} · ${ROLE[user.role]}`} style="color:#fff"><Icon name="key" /></a>
          <button class="icon-btn" onClick={logout} aria-label="تسجيل خروج"><Icon name="logout" /></button>
        </header>
        <div class="layout">
          <nav class="sidenav" aria-label="القائمة">
            <div class="small muted" style="padding:4px 12px 10px">{user.name} · {ROLE[user.role]}</div>
            {nav.map((n) => (
              <a href={BASE + (n.path === '/' ? '/' : n.path + '/')} class={isOn(n.path) ? 'on' : ''}>
                <Icon name={n.icon} />{n.label}{badge(n) > 0 && <span class="badge t-warn">{badge(n)}</span>}
              </a>
            ))}
            {user.role !== 'tech' && <a href="/app/notifications/" class={isOn('/notifications') ? 'on' : ''}><Icon name="bell" />التنبيهات{counts.unread > 0 && <span class="badge t-warn">{counts.unread}</span>}</a>}
          </nav>
          <main class="main">{page}</main>
        </div>
        <nav class="bottomnav" aria-label="القائمة">
          {nav.slice(0, 5).map((n) => (
            <a href={BASE + (n.path === '/' ? '/' : n.path + '/')} class={isOn(n.path) ? 'on' : ''}>
              <Icon name={n.icon} />{n.label}{badge(n) > 0 && <span class="dot">{badge(n)}</span>}
            </a>
          ))}
        </nav>
      </div>
    </AppCtx.Provider>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAction();
  const submit = (e: Event) => {
    e.preventDefault();
    run(async () => { await api('/auth/login', { body: { phone, password } }); onDone(); });
  };
  return (
    <div class="center-page">
      <form class="box card" onSubmit={submit} style="gap:16px;display:flex;flex-direction:column">
        <div class="logo-head"><Mark />شلال بيروت</div>
        <h1 style="text-align:center">دخول الفريق</h1>
        <ErrorBox error={error} />
        <Field label="رقم الموبايل"><input id="login-phone" class="input" type="tel" inputMode="tel" dir="ltr" autoComplete="username" value={phone} onInput={(e) => setPhone(e.currentTarget.value)} required /></Field>
        <Field label="كلمة السر"><input id="login-pass" class="input" type="password" autoComplete="current-password" value={password} onInput={(e) => setPassword(e.currentTarget.value)} required /></Field>
        <button class="btn primary big block" disabled={busy}>{busy ? 'لحظة…' : 'دخول'}</button>
        <p class="small muted" style="text-align:center">نسيت كلمة السر؟ كلّم المدير يسوي لك وحدة جديدة.</p>
      </form>
    </div>
  );
}

function ChangePassword({ forced, onDone }: { forced?: boolean; onDone: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const { busy, error, setError, run } = useAction();
  const [done, setDone] = useState(false);
  const submit = (e: Event) => {
    e.preventDefault();
    if (next !== again) return setError('كلمة السر الجديدة مو نفسها في الخانتين');
    run(async () => { await api('/auth/password', { body: { current, next } }); setDone(true); setTimeout(onDone, 800); });
  };
  const form = (
    <form class="card stack" onSubmit={submit} style="max-width:480px">
      <h1>{forced ? 'غيّر كلمة السر المؤقتة' : 'تغيير كلمة السر'}</h1>
      {forced && <p class="muted">هذي أول مرة تدخل. اختار كلمة سر خاصة فيك (8 حروف أو أرقام على الأقل).</p>}
      <ErrorBox error={error} />
      {done && <div class="ok">تم تغيير كلمة السر.</div>}
      <Field label="كلمة السر الحالية"><input id="pw-current" class="input" type="password" autoComplete="current-password" value={current} onInput={(e) => setCurrent(e.currentTarget.value)} required /></Field>
      <Field label="كلمة السر الجديدة"><input id="pw-next" class="input" type="password" autoComplete="new-password" minLength={8} value={next} onInput={(e) => setNext(e.currentTarget.value)} required /></Field>
      <Field label="أكّد كلمة السر الجديدة"><input id="pw-again" class="input" type="password" autoComplete="new-password" minLength={8} value={again} onInput={(e) => setAgain(e.currentTarget.value)} required /></Field>
      <Btn variant="primary" busy={busy} type="submit" icon="check">حفظ</Btn>
    </form>
  );
  return forced ? <div class="center-page"><div class="box">{form}</div></div> : form;
}
