// Shared Preact UI pieces.
import type { ComponentChildren } from 'preact';
import { useEffect, useState, useCallback, useRef } from 'preact/hooks';
import { STATUS } from './lib';

const P: Record<string, string> = {
  home: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5',
  list: 'M8 6h12M8 12h12M8 18h8M4 6h.01M4 12h.01M4 18h.01',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  wa: 'M4 20l1.3-3.9A8.5 8.5 0 1 1 8 19zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 9.5z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6M9 16h3',
  tag: 'M20 12l-8 8-9-9V3h8zM7.5 7.5h.01',
  headset: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1zM20 14h-3v6h2a1 1 0 0 0 1-1zM17 20a4 4 0 0 1-4 2h-1',
  plus: 'M12 5v14M5 12h14',
  pin: 'M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  camera: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  play: 'M7 4l13 8-13 8z',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  shield: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  back: 'M9 6l-6 6 6 6M3 12h18',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  key: 'M15 7a4 4 0 1 1-3.5 6H9v2H7v2H4v-3l6.5-6.5A4 4 0 0 1 15 7zM16 8h.01',
  refresh: 'M4 4v6h6M20 20v-6h-6M20 9A8 8 0 0 0 6 5.3L4 10M4 15a8 8 0 0 0 14 3.7L20 14',
};
export function Icon({ name, class: cls }: { name: string; class?: string }) {
  return (
    <svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.list} />
    </svg>
  );
}

export function Mark({ pipe = '#17583A', water = '#1B8CC4' }: { pipe?: string; water?: string }) {
  return (
    <svg viewBox="10 1 100 110" aria-hidden="true">
      <path d="M60 4C60 4 54 11 54 14.5A6 6 0 0 0 66 14.5C66 11 60 4 60 4Z" fill={water} />
      <g fill="none" stroke={pipe} stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M60 25V92" /><path d="M49 38V36Q49 30 55 30H65Q71 30 71 36V38" /><path d="M40 53V50Q40 44 46 44H74Q80 44 80 50V53" />
        <path d="M31 68V64Q31 58 37 58H83Q89 58 89 64V68" /><path d="M22 83V78Q22 72 28 72H92Q98 72 98 78V83" />
      </g>
      <path d="M14 104q11.5-7 23 0t23 0t23 0t23 0" fill="none" stroke={water} stroke-width="6" stroke-linecap="round" />
    </svg>
  );
}

export const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS[status] ?? { label: status, tone: 'muted' };
  return <span class={`badge t-${s.tone}`}>{s.label}</span>;
};

export const Stars = ({ n }: { n?: number | null }) =>
  n ? <span class="stars-static" aria-label={`${n} من 5`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span> : <span class="muted">—</span>;

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, []);
  return (
    <div class="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div class="head"><h2>{title}</h2><button class="icon-btn" style="color:var(--slate)" onClick={onClose} aria-label="إغلاق"><Icon name="x" /></button></div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ComponentChildren }) {
  return <div class="field"><label>{label}</label>{children}{hint && <span class="hint">{hint}</span>}</div>;
}

export const ErrorBox = ({ error }: { error?: string | null }) => (error ? <div class="error" role="alert">{error}</div> : null);

/** Loads data from the API and exposes reload. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    fn().then((d) => { setData(d); setError(null); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, deps);
  useEffect(reload, deps);
  return { data, error, loading, reload, setData };
}

/** Wraps an async action with busy + error state. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true); setError(null);
    try { return await fn(); } catch (e: any) { setError(e.message); return undefined; } finally { setBusy(false); }
  };
  return { busy, error, setError, run };
}

export const Loading = () => <div class="empty">جاري التحميل…</div>;

type BtnProps = { icon?: string; variant?: string; busy?: boolean; type?: 'button' | 'submit'; disabled?: boolean; onClick?: (e: MouseEvent) => unknown; class?: string; children?: ComponentChildren; [attr: string]: unknown };
export function Btn(props: BtnProps) {
  const { icon, variant = '', busy, children, class: cls, ...rest } = props as any;
  return (
    <button type="button" class={`btn ${variant} ${cls ?? ''}`} disabled={busy || rest.disabled} {...rest}>
      {icon && <Icon name={icon} />}{busy ? 'لحظة…' : children}
    </button>
  );
}

/** Finger/mouse signature on a canvas. Calls onChange with a PNG data URL, or null when cleared. */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    const el = ref.current!;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    el.width = el.clientWidth * ratio;
    el.height = el.clientHeight * ratio;
    const ctx = el.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#14211b';
    let drawing = false;
    const pos = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    el.onpointerdown = (e) => { drawing = true; el.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke(); };
    el.onpointermove = (e) => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); };
    el.onpointerup = el.onpointercancel = () => { if (!drawing) return; drawing = false; cb.current(el.toDataURL('image/png')); };
  }, []);
  const clear = () => {
    const el = ref.current!;
    el.getContext('2d')!.clearRect(0, 0, el.width, el.height);
    cb.current(null);
  };
  return (
    <div class="sigpad">
      <canvas ref={ref} aria-label="مكان توقيع العميل" />
      <div class="row between"><span class="small muted">وقّع بإصبعك داخل المربع</span><button type="button" class="btn sm ghost" onClick={clear}>امسح</button></div>
    </div>
  );
}

/** Tap-to-toggle service chips (an order can have several services). */
export function ServiceChips({ services, value, onChange }: { services: any[]; value: number[]; onChange: (ids: number[]) => void }) {
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div class="svc-chips" role="group" aria-label="الخدمات">
      {services.filter((s) => s.active).map((s) => (
        <button type="button" aria-pressed={value.includes(s.id)} class={value.includes(s.id) ? 'on' : ''} onClick={() => toggle(s.id)}>
          {value.includes(s.id) ? '✓ ' : ''}{s.name_ar}
        </button>
      ))}
    </div>
  );
}
