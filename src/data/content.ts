// Shared page content: promises, steps, FAQ, reviews.
export const PRINCIPLES = {
  ar: [
    { icon: 'clock', t: 'نوصلك في موعدنا', d: 'نحدد لك وقت الوصول، ونطرش لك رسالة والفني بالطريق.' },
    { icon: 'receipt', t: 'السعر قبل الشغل', d: 'نشرح لك شنو المشكلة وكم تكلف، وما نبدأ إلا إذا وافقت.' },
    { icon: 'check', t: 'صح من أول مرة', d: 'نجرب كل شي قدامك قبل لا نطلع.' },
    { icon: 'home', t: 'بيتك يرجع أنظف', d: 'نلبس أغطية للجوتي، ونفرش الأرضية، وننظف المكان بعد الشغل.' },
    { icon: 'shield', t: 'قطع أصلية بكفالة', d: 'من محلنا على طول، وكل قطعة عليها ملصق ضمان.' },
    { icon: 'list', t: 'أسعار واضحة وعادلة', d: 'قائمة أسعار منشورة، ولا في رسوم تطلع لك فجأة.' },
  ],
  en: [
    { icon: 'clock', t: 'We arrive on time', d: 'You get a fixed arrival time and a message when the technician is on the way.' },
    { icon: 'receipt', t: 'Price before work', d: 'We explain the problem and the cost, and start only after you approve.' },
    { icon: 'check', t: 'Right the first time', d: 'We test everything in front of you before we leave.' },
    { icon: 'home', t: 'Your home, cleaner', d: 'Shoe covers, floor sheets, and a clean-up after the job.' },
    { icon: 'shield', t: 'Genuine parts, warranted', d: 'Straight from our shop, each part with a warranty sticker.' },
    { icon: 'list', t: 'Clear, fair prices', d: 'A published price list and no surprise fees.' },
  ],
};

export const STEPS = {
  ar: [
    { t: 'كلمنا', d: 'طرش لنا صورة أو فيديو للمشكلة على الواتساب، أو عبّي نموذج الطلب.' },
    { t: 'نثبّت موعدك', d: 'نعطيك وقت وصول محدد وسعر تقريبي قبل الزيارة.' },
    { t: 'نصلح ونضمن', d: 'وتوصلك الفاتورة والضمان المكتوب على الواتساب.' },
  ],
  en: [
    { t: 'Message us', d: 'Send a photo or video of the problem on WhatsApp, or fill in the request form.' },
    { t: 'We confirm a time', d: 'With a fixed arrival time and an estimate before the visit.' },
    { t: 'We fix and guarantee', d: 'You receive an invoice and a written warranty on WhatsApp.' },
  ],
};

export const FAQ = {
  ar: [
    { q: 'الضمان كم مدته؟', a: 'نعطيك ضمان مكتوب على الشغل، ومدته تختلف حسب نوع الخدمة، ونكتبها لك بالفاتورة. والقطع اللي من محلنا عليها بعد كفالة المصنع.' },
    { q: 'متى توصلون؟', a: 'نتفق وياك على وقت الوصول قبل الزيارة، ونطرش لك رسالة والفني بالطريق.' },
    { q: 'السعر ثابت ولا يتغير؟', a: 'نعطيك سعر تقريبي قبل الزيارة، والسعر النهائي بعد المعاينة وقبل لا نبدأ. وما نشتغل إلا إذا وافقت.' },
    { q: 'وين المناطق اللي تغطونها؟', a: 'كل محافظات الكويت: العاصمة، حولي، الفروانية، الأحمدي، الجهراء، ومبارك الكبير.' },
    { q: 'عندكم عقود للشركات والعماير؟', a: 'إي نعم، عقود صيانة سنوية بزيارات دورية للخزانات والمضخات والسخانات، وخدمة طوارئ.' },
    { q: 'أقدر أشتري قطع من محلكم؟', a: 'إي نعم، عندنا أدوات صحية أصلية بالمحل، وكل قطعة عليها ملصق ضمان.' },
  ],
  en: [
    { q: 'How long is the warranty?', a: 'Every job comes with a written warranty. The length depends on the service and is written on your invoice. Parts from our shop also carry the manufacturer warranty.' },
    { q: 'When will you arrive?', a: 'We agree an arrival time with you before the visit and message you when the technician is on the way.' },
    { q: 'Is the price fixed?', a: 'You get an estimate before the visit and the final price after inspection, before any work starts. We only proceed with your approval.' },
    { q: 'Which areas do you cover?', a: 'All six governorates of Kuwait: Capital, Hawalli, Farwaniya, Ahmadi, Jahra and Mubarak Al-Kabeer.' },
    { q: 'Do you offer contracts for companies and buildings?', a: 'Yes. Annual maintenance contracts with scheduled visits for tanks, pumps and heaters, plus emergency call-outs.' },
    { q: 'Can I buy parts from your shop?', a: 'Yes. We stock genuine sanitary ware, and every part carries a warranty sticker.' },
  ],
};

// Real customer reviews only, added with the customer's permission.
// { name: 'أبو محمد', area: 'السالمية', service: 'leak-detection', rating: 5, textAr: '...', textEn: '...' }
export type Review = { name: string; area: string; service: string; rating: number; textAr: string; textEn?: string };
export const REVIEWS: Review[] = [];

export const CONTRACTS = {
  ar: {
    title: 'عقود صيانة سنوية للشركات والعمارات | شلال بيروت',
    desc: 'عقود صيانة صحية سنوية للعمارات والمكاتب والمجمعات والمساجد في الكويت: زيارات دورية للخزانات والمضخات والسخانات، وخدمة طوارئ، وتقارير بعد كل زيارة.',
    h1: 'عقود صيانة سنوية للشركات والعمارات',
    intro: 'عندك عمارة أو مجمع أو مكاتب؟ بدال لا تنطر العطل، نجيك بزيارات دورية ونلحق على المشكلة قبل لا تصير. تقرير بعد كل زيارة، ورقم طوارئ خاص لك.',
    items: ['تنظيف وتعقيم الخزانات كل 6 شهور', 'فحص المضخات والعوامات', 'صيانة السخانات المركزية', 'كشف دوري للتسريبات', 'أولوية في الطوارئ', 'تقرير مكتوب بعد كل زيارة'],
    who: ['العمارات السكنية', 'المكاتب والأبراج', 'المجمعات التجارية', 'المساجد', 'المطاعم والفنادق', 'المدارس والحضانات'],
  },
  en: {
    title: 'Annual Plumbing Maintenance Contracts for Buildings | Shalal Beirut',
    desc: 'Annual plumbing maintenance contracts for buildings, offices, complexes and mosques in Kuwait: scheduled tank, pump and heater visits, emergency call-outs and a report after every visit.',
    h1: 'Annual maintenance contracts for companies and buildings',
    intro: 'Managing a building, a complex or offices? Instead of waiting for a breakdown, we visit on a schedule and catch problems early. You get a report after each visit and a dedicated emergency number.',
    items: ['Tank cleaning and disinfection every 6 months', 'Pump and float valve checks', 'Central water heater servicing', 'Routine leak checks', 'Priority emergency response', 'Written report after every visit'],
    who: ['Residential buildings', 'Offices and towers', 'Shopping complexes', 'Mosques', 'Restaurants and hotels', 'Schools and nurseries'],
  },
};
