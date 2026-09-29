// One rule for phone numbers, used by the server, the staff app, the website form and the scripts.
// Stored form: digits only with the country code, e.g. 96555123456. Kuwaiti numbers are 8 digits:
// 2xxxxxxx landline, 4/5/6/9xxxxxxx mobile. Foreign numbers are accepted only with an explicit + or 00 prefix.

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

/** Arabic-Indic (٠١٢…) and Persian (۰۱۲…) digits → 0-9. */
export const latinDigits = (s: string) =>
  s.replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));

export type PhoneResult = { ok: true; phone: string; kuwait: boolean; mobile: boolean } | { ok: false; error: string };

export function parsePhone(input: unknown): PhoneResult {
  const raw = latinDigits(String(input ?? '')).trim();
  if (!raw) return { ok: false, error: 'اكتب رقم الموبايل' };
  const explicitIntl = /^(\+|00)/.test(raw);
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Kuwaiti: 8 digits, optionally after 965, tolerating a stray leading 0.
  let local: string | null = null;
  if (digits.startsWith('965') && digits.length >= 11) local = digits.slice(3).replace(/^0(?=\d{8}$)/, '');
  else if (!explicitIntl && /^\d{8}$/.test(digits)) local = digits;
  else if (!explicitIntl && /^0\d{8}$/.test(digits)) local = digits.slice(1);

  if (local !== null) {
    if (!/^\d{8}$/.test(local)) return { ok: false, error: 'الرقم الكويتي لازم يكون 8 أرقام' };
    if (!/^[24569]/.test(local)) return { ok: false, error: 'الرقم الكويتي يبدأ بـ 2 أو 4 أو 5 أو 6 أو 9' };
    return { ok: true, phone: '965' + local, kuwait: true, mobile: local[0] !== '2' };
  }
  if (explicitIntl) {
    if (!/^[1-9]\d{8,13}$/.test(digits)) return { ok: false, error: 'الرقم الدولي غلط. اكتبه مع مفتاح الدولة، مثل +20…' };
    return { ok: true, phone: digits, kuwait: false, mobile: true };
  }
  return { ok: false, error: 'الرقم غلط. اكتب 8 أرقام كويتية، أو رقم دولي يبدأ بـ + ومفتاح الدولة' };
}

/** For the username field: digits only (Arabic digits converted), a leading + allowed, no spaces or other characters. */
export const cleanPhoneInput = (v: string) => {
  const s = latinDigits(v);
  return (s.trimStart().startsWith('+') ? '+' : '') + s.replace(/\D/g, '').slice(0, 15);
};

/** Stored form or null (for places that only need yes/no). */
export const normalizePhone = (input: unknown): string | null => {
  const r = parsePhone(input);
  return r.ok ? r.phone : null;
};

/** For search boxes: Arabic digits → Latin, spaces and dashes removed, 965/00 prefix dropped. */
export const searchDigits = (q: string) => latinDigits(q).replace(/\D/g, '').replace(/^00/, '').replace(/^965(?=\d{8})/, '');

/** 96555123456 → +965 5512 3456 */
export const formatPhone = (p?: string | null) =>
  !p ? '' : p.startsWith('965') && p.length === 11 ? `+965 ${p.slice(3, 7)} ${p.slice(7)}` : '+' + p;
