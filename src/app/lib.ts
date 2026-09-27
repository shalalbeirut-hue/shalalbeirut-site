// Client helpers shared by the staff app, customer account and public token pages.

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; raw?: Blob; type?: string } = {}): Promise<T> {
  const init: RequestInit = { method: opts.method ?? (opts.body || opts.raw ? 'POST' : 'GET'), credentials: 'same-origin', headers: {} };
  if (opts.raw) {
    init.body = opts.raw;
    (init.headers as Record<string, string>)['content-type'] = opts.type ?? opts.raw.type;
  } else if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    (init.headers as Record<string, string>)['content-type'] = 'application/json';
  }
  let res: Response;
  try {
    res = await fetch('/api' + path, init);
  } catch {
    throw new ApiError(0, 'ما في اتصال بالإنترنت. شيّك على الشبكة وجرّب مرة ثانية.');
  }
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'صار خطأ. جرّب مرة ثانية.');
  return data as T;
}

const TZ = 'Asia/Kuwait';
const LOCALE = 'ar-KW-u-nu-latn';
export const fmtDate = (iso?: string | null) => (iso ? new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—');
export const fmtDateTime = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : '—';
export const fmtTime = (iso?: string | null) => (iso ? new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : '—');
export const kd = (fils?: number | null) => (fils == null ? '—' : `${(fils / 1000).toFixed(3)} د.ك`);

/** <input type="datetime-local"> value (Kuwait time) → UTC ISO string. */
export const kuwaitLocalToIso = (v: string) => (v ? new Date(v + ':00+03:00').toISOString() : null);
/** UTC ISO → datetime-local value in Kuwait time. */
export const isoToKuwaitLocal = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 3 * 3600_000);
  return d.toISOString().slice(0, 16);
};

export const phoneDisplay = (p?: string | null) => (p ? (p.startsWith('965') ? p.slice(3).replace(/(\d{4})(\d{4})/, '$1 $2') : p) : '');
export const telHref = (p: string) => `tel:+${p}`;
export const waHref = (p: string, text = '') => `https://wa.me/${p}${text ? '?text=' + encodeURIComponent(text) : ''}`;

export const STATUS: Record<string, { label: string; tone: string }> = {
  new: { label: 'جديد', tone: 'warn' },
  assigned: { label: 'مسند', tone: 'info' },
  on_the_way: { label: 'الفني بالطريق', tone: 'info' },
  in_progress: { label: 'جاري الشغل', tone: 'active' },
  done: { label: 'تم، ينتظر المتابعة', tone: 'good' },
  closed: { label: 'مغلق', tone: 'muted' },
  reopened: { label: 'أعيد فتحه', tone: 'bad' },
  cancelled: { label: 'ملغي', tone: 'muted' },
};
export const ROLE: Record<string, string> = { admin: 'مدير النظام', manager: 'مدير', cs: 'خدمة العملاء', tech: 'فني' };
export const SOURCE: Record<string, string> = { website: 'الموقع', whatsapp: 'واتساب', phone: 'اتصال', walkin: 'المحل', contract: 'عقد' };
export const PAY: Record<string, string> = { paid: 'مدفوعة', partial: 'مدفوعة جزئياً', unpaid: 'غير مدفوعة' };
export const PAY_METHOD: Record<string, string> = { cash: 'كاش', knet: 'كي نت', link: 'رابط دفع', transfer: 'تحويل' };
export const GOVERNORATES = ['العاصمة', 'حولي', 'الفروانية', 'الأحمدي', 'الجهراء', 'مبارك الكبير'];

/** Resizes a photo on the device before upload (max 1600px, JPEG ~80%). */
export async function compressImage(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('compress failed'))), 'image/jpeg', quality));
}

export function getLocation(timeoutMs = 12000): Promise<GeolocationPosition | null> {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition((p) => res(p), () => res(null), { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 });
  });
}

export const openWa = (url: string) => { window.open(url, '_blank', 'noopener'); };
