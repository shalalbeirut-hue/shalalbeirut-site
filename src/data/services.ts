// Draft service list built from the flyer. The owner will confirm or edit it.
// Prices: `from` is in KD; null shows "after inspection" until real prices arrive.
export type PriceItem = { ar: string; en: string; from: number | null };
type Copy = {
  name: string;
  short: string;
  title: string; // <title>, targets the main search phrase
  desc: string; // meta description
  intro: string;
  includes: string[];
  signs: string[];
  faq: { q: string; a: string }[];
};
export type Service = { slug: string; icon: string; ar: Copy; en: Copy; prices: PriceItem[] };

export const SERVICES: Service[] = [
  {
    slug: 'leak-detection',
    icon: 'drop',
    ar: {
      name: 'كشف تسربات المياه',
      short: 'نحدد مكان التسريب بالأجهزة، ونصلحه بأقل تكسير ممكن.',
      title: 'كشف تسربات المياه بالكويت بدون تكسير | شلال بيروت',
      desc: 'كشف تسربات المياه في الحمامات والمطابخ والخزانات والأسطح بأجهزة حديثة، مع إصلاح بأقل تكسير، والسعر قبل الشغل، وضمان مكتوب.',
      intro: 'التسريب الصغير يكبر بسرعة: فاتورة مي عالية، رطوبة في الجدار، وبلاط يطبل. الفني يوصل في الموعد، ويحدد مكان التسريب بالأجهزة قبل أي تكسير، ويشرح لك المشكلة والتكلفة، وما نبدأ إلا بموافقتك.',
      includes: ['كشف تسربات الحمامات والمطابخ', 'كشف تسربات الخزانات الأرضية والعلوية', 'كشف تسربات مواسير الحار والبارد', 'فحص عزل الأسطح والحمامات', 'إصلاح التسريب وإرجاع المكان مثل ما كان'],
      signs: ['فاتورة الماء زادت بدون سبب', 'رطوبة أو بقع على الجدار أو السقف', 'صوت خرير مي والحنفيات مسكرة', 'بلاط يطبل أو ريحة عفن'],
      faq: [
        { q: 'هل لازم تكسرون عشان تلقون التسريب؟', a: 'لا. نحدد المكان بالأجهزة أولاً، والتكسير إن احتجناه يكون في نقطة التسريب بس.' },
        { q: 'كم يأخذ الكشف؟', a: 'أغلب الحالات تنتهي في زيارة وحدة. نبلغك بالوقت المتوقع قبل ما نبدأ.' },
      ],
    },
    en: {
      name: 'Water leak detection',
      short: 'We locate the leak with detection equipment and fix it with as little breaking as possible.',
      title: 'Water Leak Detection in Kuwait Without Breaking Tiles | Shalal Beirut',
      desc: 'Leak detection for bathrooms, kitchens, tanks and roofs with modern equipment. Minimal breaking, price agreed before work, and a written warranty.',
      intro: 'A small leak grows fast: a high water bill, damp walls and loose tiles. Our technician arrives on time, locates the leak with equipment before breaking anything, explains the problem and the cost, and starts only after you approve.',
      includes: ['Bathroom and kitchen leak detection', 'Ground and roof tank leak detection', 'Hot and cold water pipe leaks', 'Roof and bathroom waterproofing checks', 'Repair and restoring the area'],
      signs: ['Your water bill went up for no reason', 'Damp patches on walls or ceilings', 'Sound of running water with all taps closed', 'Hollow-sounding tiles or a musty smell'],
      faq: [
        { q: 'Do you have to break tiles to find the leak?', a: 'No. We locate it with equipment first, and only open the exact spot if a repair needs it.' },
        { q: 'How long does detection take?', a: 'Most cases are done in one visit. We tell you the expected time before we start.' },
      ],
    },
    prices: [
      { ar: 'كشف تسربات (شقة / بيت)', en: 'Leak inspection (flat / house)', from: null },
      { ar: 'إصلاح تسريب ماسورة', en: 'Pipe leak repair', from: null },
    ],
  },
  {
    slug: 'drain-cleaning',
    icon: 'drain',
    ar: {
      name: 'تسليك المجاري والبلاعات',
      short: 'تسليك المغاسل والمطابخ والحمامات والمجاري الرئيسية.',
      title: 'تسليك مجاري وبلاعات بالكويت | شلال بيروت',
      desc: 'تسليك المجاري والبلاعات والمغاسل والمطابخ بمعدات حديثة، مع نظافة المكان بعد الشغل وضمان على الخدمة.',
      intro: 'الانسداد ما ينتظر. نسلّك الخط بمعدات مناسبة لنوع الانسداد، ونفحص سببه عشان ما يرجع، ونسيب المكان أنظف من ما كان.',
      includes: ['تسليك مغاسل ومطابخ', 'تسليك كراسي الحمام', 'تسليك البلاعات والمجاري الرئيسية', 'تنظيف خطوط الصرف', 'فحص سبب الانسداد المتكرر'],
      signs: ['المي تنزل ببطء', 'ريحة مجاري في الحمام أو المطبخ', 'صوت قرقرة من البلاعة', 'المي ترجع من البلاعة'],
      faq: [
        { q: 'ليش الانسداد يرجع كل فترة؟', a: 'غالباً بسبب ميل غلط في الخط أو تراكم دهون. نفحص السبب ونقترح الحل قبل ما نطلع.' },
      ],
    },
    en: {
      name: 'Drain unclogging',
      short: 'Unclogging sinks, kitchens, bathrooms and main drains.',
      title: 'Drain Unclogging in Kuwait | Shalal Beirut',
      desc: 'Unclogging drains, sinks, kitchens and main sewer lines with proper equipment. We clean up after the job and guarantee the work.',
      intro: 'A blocked drain cannot wait. We clear the line with the right equipment for the blockage, check what caused it so it does not come back, and leave the area cleaner than we found it.',
      includes: ['Sink and kitchen drains', 'Toilet unclogging', 'Floor drains and main lines', 'Drain line cleaning', 'Finding the cause of repeat blockages'],
      signs: ['Water drains slowly', 'Sewage smell in the bathroom or kitchen', 'Gurgling from the drain', 'Water backing up from the floor drain'],
      faq: [
        { q: 'Why does the blockage keep coming back?', a: 'Usually a wrong slope in the line or grease build-up. We check the cause and suggest a fix before we leave.' },
      ],
    },
    prices: [
      { ar: 'تسليك مغسلة أو مطبخ', en: 'Sink or kitchen drain', from: null },
      { ar: 'تسليك كرسي حمام', en: 'Toilet unclogging', from: null },
      { ar: 'تسليك خط رئيسي', en: 'Main line unclogging', from: null },
    ],
  },
  {
    slug: 'plumbing',
    icon: 'pipe',
    ar: {
      name: 'السباكة والتمديدات',
      short: 'تمديدات المي والصرف، وتبديل المواسير والمحابس.',
      title: 'فني صحي بالكويت، سباكة وتمديدات | شلال بيروت',
      desc: 'فني صحي للسباكة وتمديدات المياه والصرف وتبديل المواسير والمحابس، في الموعد وبالضمان، والسعر قبل الشغل.',
      intro: 'من تبديل محبس لين تمديدات حمام كامل. نشتغل بقطع أصلية من محلنا، ونجرب كل شي قدامك قبل ما نطلع.',
      includes: ['تمديدات مياه حار وبارد', 'تمديدات صرف', 'تبديل مواسير ومحابس', 'تركيب عدادات ومحابس رئيسية', 'تجديد تمديدات الحمامات والمطابخ'],
      signs: ['ضغط المي ضعيف', 'محبس ما يسكر زين', 'مواسير قديمة أو صدية', 'تجديد حمام أو مطبخ'],
      faq: [
        { q: 'تستخدمون أي نوع مواسير؟', a: 'نستخدم مواسير وقطع أصلية من محلنا، ونوضح لك النوع والسعر قبل التركيب.' },
      ],
    },
    en: {
      name: 'Plumbing & pipework',
      short: 'Water supply and drainage lines, replacing pipes and valves.',
      title: 'Plumber in Kuwait, Plumbing & Pipework | Shalal Beirut',
      desc: 'Plumbing for water supply and drainage, pipe and valve replacement. On time, with a written warranty and the price agreed before work.',
      intro: 'From replacing a valve to re-piping a full bathroom. We use genuine parts from our own shop and test everything in front of you before we leave.',
      includes: ['Hot and cold water lines', 'Drainage lines', 'Pipe and valve replacement', 'Main valves and meters', 'Bathroom and kitchen re-piping'],
      signs: ['Low water pressure', 'A valve that will not close', 'Old or rusty pipes', 'Renovating a bathroom or kitchen'],
      faq: [
        { q: 'What pipes do you use?', a: 'Genuine pipes and fittings from our shop. We tell you the type and price before installing.' },
      ],
    },
    prices: [
      { ar: 'تبديل محبس', en: 'Valve replacement', from: null },
      { ar: 'تمديدات (حسب المتر)', en: 'Pipework (per metre)', from: null },
    ],
  },
  {
    slug: 'water-heaters',
    icon: 'heater',
    ar: {
      name: 'السخانات',
      short: 'تركيب وتبديل وصيانة السخانات، والهيتر والثرموستات.',
      title: 'تصليح وتركيب سخانات بالكويت | شلال بيروت',
      desc: 'تركيب وتبديل وصيانة السخانات العادية والمركزية، تبديل الهيتر والثرموستات، بقطع أصلية وضمان مكتوب.',
      intro: 'المي ما تسخن، أو السخان يفصل الكهرباء، أو يسرّب؟ نفحص السخان، ونقول لك إذا يستاهل التصليح أو الأوفر تبدله، والقرار لك.',
      includes: ['تركيب سخانات جديدة', 'تبديل الهيتر والثرموستات', 'صيانة السخانات المركزية', 'تنظيف السخان من الترسبات', 'إصلاح تسريب السخان'],
      signs: ['المي ما تسخن أو تسخن ببطء', 'السخان يفصل القاطع', 'صوت طقطقة من السخان', 'تسريب من السخان'],
      faq: [
        { q: 'أصلح السخان ولا أبدله؟', a: 'نفحصه ونعطيك الخيارين بالسعر. إذا التصليح ما يستاهل، نقول لك بصراحة.' },
      ],
    },
    en: {
      name: 'Water heaters',
      short: 'Installing, replacing and servicing water heaters, elements and thermostats.',
      title: 'Water Heater Repair & Installation in Kuwait | Shalal Beirut',
      desc: 'Installing, replacing and servicing standard and central water heaters, elements and thermostats, with genuine parts and a written warranty.',
      intro: 'No hot water, a heater tripping the breaker, or a leak? We check the heater and tell you whether it is worth repairing or cheaper to replace. The decision is yours.',
      includes: ['New heater installation', 'Element and thermostat replacement', 'Central heater servicing', 'Descaling', 'Heater leak repair'],
      signs: ['No hot water, or it heats slowly', 'The heater trips the breaker', 'Crackling noise from the heater', 'Water leaking from the heater'],
      faq: [
        { q: 'Should I repair or replace my heater?', a: 'We inspect it and give you both options with prices. If a repair is not worth it, we say so.' },
      ],
    },
    prices: [
      { ar: 'تبديل هيتر', en: 'Element replacement', from: null },
      { ar: 'تبديل ثرموستات', en: 'Thermostat replacement', from: null },
      { ar: 'تركيب سخان (بدون السخان)', en: 'Heater installation (labour)', from: null },
    ],
  },
  {
    slug: 'tanks-pumps',
    icon: 'tank',
    ar: {
      name: 'الخزانات والمضخات',
      short: 'تركيب وتنظيف وتعقيم الخزانات، والمضخات والعوامات.',
      title: 'تنظيف خزانات المياه وتصليح المضخات بالكويت | شلال بيروت',
      desc: 'تنظيف وتعقيم خزانات المياه، تركيب الخزانات، تصليح وتركيب المضخات والعوامات ومواسير السطح.',
      intro: 'مي نظيفة وضغط ثابت. ننظف ونعقم الخزان، ونفحص المضخة والعوامة، وننصحك بموعد التنظيف الجاي.',
      includes: ['تنظيف وتعقيم الخزانات', 'تركيب خزانات جديدة', 'تصليح وتبديل المضخات (ماطور الماي)', 'تبديل العوامات', 'تمديدات السطح'],
      signs: ['المي فيها لون أو ريحة', 'المضخة تشتغل وتطفي كثير', 'ضغط المي يتغير', 'الخزان يفيض أو ما يتعبى'],
      faq: [
        { q: 'كل كم لازم أنظف الخزان؟', a: 'ننصح كل 6 شهور. ونقدر نذكّرك لما يجي الموعد.' },
      ],
    },
    en: {
      name: 'Tanks & pumps',
      short: 'Tank installation, cleaning and disinfection, pumps and float valves.',
      title: 'Water Tank Cleaning & Pump Repair in Kuwait | Shalal Beirut',
      desc: 'Water tank cleaning and disinfection, tank installation, water pump and float valve repair and replacement, roof pipework.',
      intro: 'Clean water and steady pressure. We clean and disinfect the tank, check the pump and float valve, and advise when the next cleaning is due.',
      includes: ['Tank cleaning and disinfection', 'New tank installation', 'Water pump repair and replacement', 'Float valve replacement', 'Roof pipework'],
      signs: ['Discoloured or smelly water', 'The pump keeps switching on and off', 'Pressure keeps changing', 'The tank overflows or will not fill'],
      faq: [
        { q: 'How often should the tank be cleaned?', a: 'Every 6 months. We can remind you when it is due.' },
      ],
    },
    prices: [
      { ar: 'تنظيف وتعقيم خزان', en: 'Tank cleaning & disinfection', from: null },
      { ar: 'تصليح مضخة', en: 'Pump repair', from: null },
      { ar: 'تبديل عوامة', en: 'Float valve replacement', from: null },
    ],
  },
  {
    slug: 'water-coolers',
    icon: 'cooler',
    ar: {
      name: 'برادات ومبردات المياه',
      short: 'صيانة برادات المياه ومبردات الخزانات.',
      title: 'تصليح برادات ومبردات المياه بالكويت | شلال بيروت',
      desc: 'صيانة وتصليح برادات المياه ومبردات الخزانات للبيوت والمكاتب والمساجد، بقطع أصلية وضمان.',
      intro: 'في صيف الكويت، البراد لازم يشتغل. نصلح برادات المياه ومبردات الخزانات، ونغير الفلاتر، ونفحص التسريب.',
      includes: ['صيانة برادات المياه', 'تصليح مبردات الخزانات', 'تبديل الفلاتر', 'تركيب برادات جديدة', 'عقود صيانة للمساجد والمكاتب'],
      signs: ['المي ما تبرد', 'البراد يسرّب', 'صوت عالي من المبرد', 'طعم المي تغيّر'],
      faq: [
        { q: 'تصلحون برادات المساجد والمكاتب؟', a: 'إي نعم، ونسوي عقود صيانة دورية لها.' },
      ],
    },
    en: {
      name: 'Water coolers',
      short: 'Servicing water dispensers and tank coolers.',
      title: 'Water Cooler & Tank Chiller Repair in Kuwait | Shalal Beirut',
      desc: 'Servicing and repairing water coolers and tank chillers for homes, offices and mosques, with genuine parts and a warranty.',
      intro: 'In a Kuwaiti summer the cooler has to work. We repair water coolers and tank chillers, change filters and check for leaks.',
      includes: ['Water cooler servicing', 'Tank chiller repair', 'Filter replacement', 'New cooler installation', 'Maintenance contracts for mosques and offices'],
      signs: ['Water is not cold', 'The cooler leaks', 'Loud noise from the chiller', 'The water tastes different'],
      faq: [
        { q: 'Do you service coolers in mosques and offices?', a: 'Yes, and we offer scheduled maintenance contracts for them.' },
      ],
    },
    prices: [
      { ar: 'صيانة براد مياه', en: 'Water cooler service', from: null },
      { ar: 'تصليح مبرد خزان', en: 'Tank chiller repair', from: null },
    ],
  },
  {
    slug: 'sanitary-ware',
    icon: 'tap',
    ar: {
      name: 'تركيب الأدوات الصحية',
      short: 'خلاطات، مغاسل، كراسي، شطافات ودش، من محلنا أو من عندك.',
      title: 'تركيب أدوات صحية وخلاطات بالكويت | شلال بيروت',
      desc: 'تركيب الخلاطات والمغاسل وكراسي الحمام والشطافات والدش، بقطع أصلية من محلنا بكفالة، أو تركيب قطعك.',
      intro: 'تبي تجدد الحمام أو المطبخ؟ اختار القطع من محلنا بكفالة المصنع، أو جيب قطعك ونركبها. نحمي الأرضية ونرتب المكان بعد الشغل.',
      includes: ['تركيب خلاطات ومحابس', 'تركيب مغاسل وكراسي حمام', 'تركيب شطافات ودش', 'تركيب سيفونات وكراسي معلقة', 'بيع أدوات صحية أصلية من محلنا'],
      signs: ['خلاط يقطر', 'كرسي يتحرك أو يسرّب', 'تجديد حمام', 'تركيب قطع جديدة'],
      faq: [
        { q: 'أقدر أشتري القطع منكم؟', a: 'إي نعم، من محلنا مباشرة، وكل قطعة عليها ملصق ضمان.' },
        { q: 'تركبون قطع جايبها أنا؟', a: 'إي نعم، ونفحصها قبل التركيب ونقول لك إذا فيها مشكلة.' },
      ],
    },
    en: {
      name: 'Sanitary ware installation',
      short: 'Mixers, basins, toilets, shattafs and showers, from our shop or yours.',
      title: 'Sanitary Ware & Mixer Installation in Kuwait | Shalal Beirut',
      desc: 'Installing mixers, basins, toilets, shattafs and showers with genuine parts from our shop under warranty, or installing your own fittings.',
      intro: 'Renovating a bathroom or kitchen? Choose fittings from our shop with the manufacturer warranty, or bring your own and we install them. We protect the floor and tidy up afterwards.',
      includes: ['Mixers and valves', 'Basins and toilets', 'Shattafs and showers', 'Concealed cisterns and wall-hung toilets', 'Genuine sanitary ware from our shop'],
      signs: ['A dripping mixer', 'A loose or leaking toilet', 'Bathroom renovation', 'New fittings to install'],
      faq: [
        { q: 'Can I buy fittings from you?', a: 'Yes, directly from our shop, and every part carries a warranty sticker.' },
        { q: 'Will you install fittings I bought?', a: 'Yes. We check them before installing and tell you if anything is wrong.' },
      ],
    },
    prices: [
      { ar: 'تركيب خلاط', en: 'Mixer installation', from: null },
      { ar: 'تركيب كرسي حمام', en: 'Toilet installation', from: null },
      { ar: 'تركيب مغسلة', en: 'Basin installation', from: null },
    ],
  },
];

export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug)!;
