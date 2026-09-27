import { SITE } from './config';

export type Lang = 'ar' | 'en';
export const LANGS: Lang[] = ['ar', 'en'];

/** Path for a page in a given language. `p` is the language-neutral path, e.g. '/services/'. */
export const href = (lang: Lang, p = '/') => (lang === 'ar' ? p : '/en' + p);

export const dir = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

export const waLink = (text: string) =>
  SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}` : '#request';

export const telLink = () => (SITE.phone ? `tel:+${SITE.phone}` : '#request');

export const displayPhone = (lang: Lang) =>
  SITE.phone ? '+' + SITE.phone.replace(/^(\d{3})(\d{4})(\d+)$/, '$1 $2 $3') : lang === 'ar' ? '[رقم الاتصال]' : '[Phone number]';

export const UI = {
  ar: {
    siteName: SITE.nameAr,
    tagline: 'في الموعد.. وبالضمان',
    nav: { services: 'الخدمات', prices: 'الأسعار', areas: 'المناطق', reviews: 'آراء العملاء', contracts: 'عقود الشركات', contact: 'تواصل معنا' },
    bookWa: 'احجز على الواتساب',
    call: 'اتصل علينا',
    orderThis: 'اطلب الخدمة',
    learnMore: 'التفاصيل',
    langSwitch: 'English',
    home: 'الرئيسية',
    fromPrice: 'يبدأ من',
    kd: 'د.ك',
    priceOnVisit: 'بعد المعاينة',
    offer: 'عرض الافتتاح: الكشف ببلاش طول الشهر الأول',
    trust: ['ضمان مكتوب', 'السعر قبل الشغل', 'قطع أصلية من محلنا'],
    waHello: 'السلام عليكم، أبي أحجز خدمة',
    footerAbout: 'نصون ونركّب كل شي يخص الماي في البيت والمكتب والشركة، بفنيين محترفين وقطع أصلية من محلنا.',
    rights: 'جميع الحقوق محفوظة',
    placeholderNote: 'نسخة تجريبية: الأرقام والأسعار باقي ما انضافت.',
  },
  en: {
    siteName: SITE.nameEn,
    tagline: 'On time. Guaranteed.',
    nav: { services: 'Services', prices: 'Prices', areas: 'Areas', reviews: 'Reviews', contracts: 'Business contracts', contact: 'Contact' },
    bookWa: 'Book on WhatsApp',
    call: 'Call us',
    orderThis: 'Request this service',
    learnMore: 'Details',
    langSwitch: 'العربية',
    home: 'Home',
    fromPrice: 'From',
    kd: 'KD',
    priceOnVisit: 'After inspection',
    offer: 'Opening offer: free inspection for the whole first month',
    trust: ['Written warranty', 'Price before work', 'Genuine parts from our shop'],
    waHello: 'Hello, I would like to book a service',
    footerAbout: 'Installation and maintenance for everything water-related in homes, offices and companies, by trained technicians with genuine parts from our own shop.',
    rights: 'All rights reserved',
    placeholderNote: 'Preview build: phone numbers and prices are still being added.',
  },
} as const;
