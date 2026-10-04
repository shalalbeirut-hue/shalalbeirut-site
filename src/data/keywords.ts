// Search phrases people type when they need us. Shown on the home page as visible links
// (Google only counts text that people can see) and listed in the keywords meta and JSON-LD.
// Spelling variants (ة/ه، ي/ى) are on purpose: people search both ways.
import type { Lang } from '../i18n';
import { AREAS } from './areas';

type Kw = { t: string; to: string };
type Group = { title: string; items: Kw[] };
const s = (slug: string) => `/services/${slug}/`;
const g = (to: string, phrases: string[]) => phrases.map((t) => ({ t, to }));

const AR: Group[] = [
  {
    title: 'فني صحي وسباك',
    items: [
      ...g('/services/', ['فني صحي', 'فنى صحى', 'صحي', 'فني صحي الكويت', 'افضل فني صحي', 'فني صحي شاطر', 'معلم صحي', 'فني صحي عربي', 'فني صحي ٢٤ ساعة', 'فني صحي طوارئ', 'فني صحي متنقل', 'فني صحي قريب مني', 'فني صحي رخيص', 'رقم فني صحي', 'فني صحي واتساب', 'صيانة صحية', 'صيانه صحيه', 'اعمال صحية', 'شركة صيانة صحية', 'مقاول صحي']),
      ...g(s('plumbing'), ['سباك', 'سباكة', 'سباكه', 'سباك الكويت', 'سباك عربي', 'سباك قريب مني', 'سباك طوارئ', 'سباك ٢٤ ساعة', 'معلم سباكة', 'اعمال سباكة', 'خدمات السباكة', 'صيانة سباكة']),
    ],
  },
  {
    title: 'تسربات وعزل',
    items: g(s('leak-detection'), ['كشف تسربات', 'كشف تسربات المياه', 'كشف تسريب المياه بالاجهزة', 'كشف تسربات بدون تكسير', 'تسريب ماي', 'تسريب مياه', 'تسربات الحمام', 'تسريب سقف', 'رطوبة الجدران', 'تهريب ماي', 'عزل ضد التسريب', 'عزل حمامات', 'عزل سطح', 'سيل تانكي', 'فاتورة الماي عالية']),
  },
  {
    title: 'مجاري وبلاليع',
    items: g(s('drain-cleaning'), ['تسليك مجاري', 'تسليك مجارى', 'تسليك بلاعات', 'تسليك بلاليع', 'بلاعة', 'بلوعة', 'انسداد المجاري', 'تسليك حمام', 'تسليك مغسلة', 'تسليك مطبخ', 'تسليك كرسي حمام', 'ريحة المجاري', 'شفط مجاري', 'مناهيل', 'منهول', 'تنظيف مناهيل', 'منهول مسدود', 'غطاء منهول', 'تنظيف مجاري', 'تسليك بالضغط']),
  },
  {
    title: 'مواسير ومحابس',
    items: g(s('plumbing'), ['مواسير', 'مواسير مياه', 'تمديد مواسير', 'تمديدات صحية', 'تصليح مواسير', 'تبديل مواسير', 'مواسير بي بي ار', 'مواسير PPR', 'مواسير بلاستيك', 'محابس', 'محبس', 'تغيير محابس', 'محبس رئيسي', 'محبس زاوية', 'عوامة', 'تبديل عوامة', 'ضغط الماي ضعيف', 'صوت بالمواسير']),
  },
  {
    title: 'حنفيات ومغاسل وحمامات',
    items: g(s('sanitary-ware'), ['حنفيات', 'حنفية', 'حنفيه', 'تركيب حنفيات', 'تصليح حنفية', 'خلاطات', 'خلاط', 'خلاطات حمام', 'خلاطات مطبخ', 'خلاطات مغاسل', 'خلاطات شاور', 'خلاطات دفن', 'خلاط مخفي', 'خلاط حار بارد', 'تركيب خلاطات', 'تصليح خلاطات', 'تبديل خلاط', 'خلاط يهرب', 'خلاط مطبخ', 'خلاط شاور', 'مغسلة', 'مغسله', 'مغاسل', 'تركيب مغاسل', 'مغسلة مطبخ', 'مجلى', 'كرسي حمام', 'كرسي افرنجي', 'كرسي عربي', 'تركيب كرسي حمام', 'سيفون', 'تصليح سيفون', 'شطاف', 'شطافات', 'بانيو', 'شاور', 'دش', 'تجديد حمامات', 'ادوات صحية', 'أدوات صحية', 'محل ادوات صحية', 'ادوات صحية الكويت', 'اكسسوارات حمامات']),
  },
  {
    title: 'سخانات',
    items: g(s('water-heaters'), ['سخانات', 'سخان', 'تصليح سخان', 'تصليح سخانات', 'تركيب سخان', 'تبديل سخان', 'سخان ما يسخن', 'سخان يهرب', 'هيتر سخان', 'ثرموستات سخان', 'سخان مركزي', 'سخانات مركزي', 'سخانات مركزية', 'تركيب سخان مركزي', 'صيانة سخانات مركزية', 'سخان مركزي للبيت', 'سخان مركزي للعمارة', 'سخانات كهربائية', 'سخان ٥٠ لتر', 'سخان ١٠٠ لتر', 'سخان شمسي', 'سخان فوري']),
  },
  {
    title: 'خزانات ومضخات',
    items: g(s('tanks-pumps'), ['خزان ماي', 'خزانات مياه', 'تنظيف خزانات', 'تعقيم خزانات', 'غسيل خزانات', 'تنظيف تانكي', 'تانكي', 'خزان ارضي', 'خزان علوي', 'مضخة ماي', 'مضخات', 'مضخات مياه', 'تصليح مضخات', 'ماطور ماي', 'ماطور', 'تصليح ماطور', 'تركيب مضخة', 'دينمو ماي', 'مضخة ضغط']),
  },
  {
    title: 'برادات وفلاتر',
    items: g(s('water-coolers'), ['برادات ماي', 'برادات مياه', 'برادة ماي', 'برادة مياه', 'برادات ماي حار بارد', 'برادة مكتب', 'برادة مسجد', 'برادات ستانلس', 'تصليح برادة', 'تصليح برادات ماي', 'صيانة برادات ماي', 'برادة ما تبرد', 'برادة تهرب', 'فلاتر ماي', 'فلاتر مياه', 'فلاتر مياه الشرب', 'فلتر ماي', 'فلتر ٧ مراحل', 'فلتر تحلية', 'فلتر RO', 'شمعات فلتر', 'تبديل شمعات الفلتر', 'فلتر خزان', 'فلتر شاور', 'فلتر برادة', 'فلتر سيل', 'تركيب فلتر', 'تبديل فلاتر', 'فلتر مطبخ', 'فلتر سنترال', 'ماي شرب']),
  },
  {
    title: 'ماركات نركّبها ونصلّحها',
    items: [
      ...g(s('plumbing'), ['مواسير عدساني', 'بايبات عدساني', 'عدساني', 'مواسير PPR', 'بايبات']),
      ...g(s('sanitary-ware'), ['خلاطات جروهي', 'جروهي', 'هانزجروهي', 'ايديال ستاندرد', 'روكا', 'ديورافيت', 'كوهلر', 'توتو', 'رأس الخيمة للسيراميك', 'جيبرت سيفون مخفي']),
      ...g(s('water-heaters'), ['سخان اريستون', 'سخان فيرولي', 'سخان ريم', 'سخان سوبر جنرال']),
      ...g(s('tanks-pumps'), ['مضخة بيدرولو', 'مضخة جراندفوس', 'مضخة لوارا', 'مضخة داب', 'مضخة ويلو']),
    ],
  },
  {
    title: 'شركات وعماير',
    items: g('/contracts/', ['عقود صيانة', 'عقود صيانة عمارات', 'صيانة عمارات', 'صيانة شاليهات', 'صيانة مكاتب', 'صيانة مطاعم', 'صيانة مدارس', 'صيانة دورية']),
  },
  {
    title: 'ضمان وأسعار',
    items: [
      ...g('/warranty/', ['فني صحي بالضمان', 'صيانة مع ضمان', 'ضمان مكتوب']),
      ...g('/prices/', ['اسعار فني صحي', 'اسعار السباكة', 'اسعار تسليك المجاري', 'اسعار كشف التسربات', 'كشف مجاني']),
    ],
  },
];

const EN: Group[] = [
  {
    title: 'Plumbers',
    items: [
      ...g('/services/', ['Plumber', 'Plumber in Kuwait', 'Plumber Kuwait', 'Best plumber Kuwait', 'Plumber near me', 'Emergency plumber', '24 hour plumber', 'Arabic plumber', 'Sanitary technician', 'Sanitary works', 'Plumbing company Kuwait', 'Plumbing contractor', 'Cheap plumber', 'Plumber WhatsApp']),
      ...g(s('plumbing'), ['Plumbing', 'Plumbing services', 'Plumbing repair', 'Plumbing maintenance', 'Handyman plumbing']),
    ],
  },
  {
    title: 'Leaks',
    items: g(s('leak-detection'), ['Leak detection', 'Water leak detection', 'Leak detection without breaking', 'Leak repair', 'Bathroom leak', 'Ceiling leak', 'Wall dampness', 'Waterproofing', 'Bathroom waterproofing', 'Roof waterproofing', 'Tank sealant', 'High water bill']),
  },
  {
    title: 'Drains',
    items: g(s('drain-cleaning'), ['Drain cleaning', 'Blocked drain', 'Drain unclogging', 'Clogged toilet', 'Clogged sink', 'Kitchen drain', 'Sewer cleaning', 'Manhole', 'Manhole cleaning', 'Sewage smell', 'High pressure jetting']),
  },
  {
    title: 'Pipes & valves',
    items: g(s('plumbing'), ['Pipes', 'Water pipes', 'Pipe repair', 'Pipe replacement', 'Pipe installation', 'PPR pipes', 'Valves', 'Valve replacement', 'Main valve', 'Angle valve', 'Float valve', 'Low water pressure']),
  },
  {
    title: 'Taps, sinks & bathrooms',
    items: g(s('sanitary-ware'), ['Taps', 'Tap repair', 'Faucets', 'Faucet installation', 'Mixer taps', 'Mixers', 'Bathroom mixer', 'Basin mixer', 'Kitchen mixer', 'Shower mixer', 'Concealed mixer', 'Mixer installation', 'Mixer repair', 'Sinks', 'Kitchen sink', 'Wash basin', 'Wash basin installation', 'Toilet', 'Toilet repair', 'Toilet installation', 'Flush tank repair', 'Bidet sprayer', 'Shattaf', 'Bathtub', 'Shower', 'Bathroom renovation', 'Sanitary ware', 'Sanitary ware shop Kuwait', 'Bathroom fittings', 'Bathroom accessories']),
  },
  {
    title: 'Water heaters',
    items: g(s('water-heaters'), ['Water heater repair', 'Water heater installation', 'Water heater replacement', 'Geyser repair', 'Boiler repair', 'Heater element', 'Heater thermostat', 'Instant water heater', 'Central water heater', 'Central water heater installation', 'Central water heater maintenance', 'Electric water heater', 'Solar water heater']),
  },
  {
    title: 'Tanks & pumps',
    items: g(s('tanks-pumps'), ['Water tank cleaning', 'Tank disinfection', 'Water tank', 'Underground tank', 'Roof tank', 'Water pump', 'Pumps', 'Water pump repair', 'Pump installation', 'Booster pump', 'Water motor']),
  },
  {
    title: 'Coolers & filters',
    items: g(s('water-coolers'), ['Water coolers', 'Water dispenser', 'Hot and cold water cooler', 'Office water cooler', 'Water cooler repair', 'Water cooler maintenance', 'Water filters', 'RO water filter', '7 stage water filter', 'Filter cartridges', 'Shower filter', 'Water filter installation', 'Filter replacement', 'Drinking water filter', 'Central water filter']),
  },
  {
    title: 'Brands we install & service',
    items: [
      ...g(s('plumbing'), ['Adsani pipes', 'PPR pipes Kuwait']),
      ...g(s('sanitary-ware'), ['Grohe', 'Grohe mixers', 'Hansgrohe', 'Ideal Standard', 'Roca', 'Duravit', 'Kohler', 'TOTO', 'RAK Ceramics', 'Geberit concealed cistern']),
      ...g(s('water-heaters'), ['Ariston water heater', 'Ferroli water heater', 'Rheem water heater', 'Super General water heater']),
      ...g(s('tanks-pumps'), ['Pedrollo pump', 'Grundfos pump', 'Lowara pump', 'DAB pump', 'Wilo pump']),
    ],
  },
  {
    title: 'Business & pricing',
    items: [
      ...g('/contracts/', ['Maintenance contracts', 'Building maintenance', 'Chalet maintenance', 'Office maintenance', 'Restaurant plumbing']),
      ...g('/warranty/', ['Plumbing warranty', 'Written warranty']),
      ...g('/prices/', ['Plumber prices Kuwait', 'Plumbing rates', 'Free inspection']),
    ],
  },
];

/** "فني صحي السالمية", "Plumber Salmiya"… for every place we list, linked to its governorate page. */
const areaGroups = (lang: Lang): Group[] =>
  AREAS.map((a) => ({
    title: lang === 'ar' ? `فني صحي ${a.ar.name}` : `Plumber in ${a.en.name}`,
    items: g(`/areas/${a.slug}/`, a[lang].places.map((p) => (lang === 'ar' ? `فني صحي ${p}` : `Plumber ${p}`))),
  }));

export const KEYWORD_GROUPS: Record<Lang, Group[]> = { ar: AR, en: EN };
export const AREA_KEYWORDS = areaGroups;

/** Core phrases in both languages (no per-place ones), for the keywords meta and the business JSON-LD. */
export const keywordList = (lang: Lang) =>
  [...KEYWORD_GROUPS[lang], ...KEYWORD_GROUPS[lang === 'ar' ? 'en' : 'ar']].flatMap((grp) => grp.items.map((k) => k.t));
