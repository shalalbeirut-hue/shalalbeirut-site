// New-build contracting: drainage, water supply, tank and distribution networks for new plots (قسائم) and buildings.
// Done by our own licensed contracting team. No warranty period is stated on purpose (owner's decision).
import type { Service } from './services';

export const NEWBUILD_PATH = '/new-builds/';

export const NEWBUILD = {
  ar: {
    label: 'مقاولات',
    title: 'مقاول صحي معتمد للقسائم الجديدة بالكويت | شلال بيروت',
    desc: 'تمديدات الصرف والتغذية وشبكات التوانكي والمجاري الرئيسية وشبكات توزيع المياه للقسائم الجديدة والعماير بالكويت. خبرة 30 سنة، حسب أصول الصنعة وتحت إشراف مهندسك.',
    h1: 'مقاولات الصحي للقسائم الجديدة',
    intro: 'تبني بيت جديد أو عمارة؟ فريق المقاولات المعتمد في شركتنا عنده خبرة 30 سنة بالكويت في تمديد الصرف والتغذية للقسائم الجديدة، وشبكات توزيع المياه الرئيسية، وشبكات التوانكي والمجاري الرئيسية. نشتغل حسب أصول الصنعة، وتحت إشراف المهندس المعتمد من المالك، ونسلّمك الشغل بأعلى المواصفات الهندسية وبالضمان.',
    promises: [
      { icon: 'shield', t: 'خبرة 30 سنة بالكويت', d: 'فريق مقاولات معتمد من شركتنا، اشتغل على قسائم وعماير بكل مناطق الكويت.' },
      { icon: 'list', t: 'حسب أصول الصنعة', d: 'ميول صحيحة، ومواسير وقطع معتمدة، وفحص ضغط واختبار لكل خط قبل التغطية.' },
      { icon: 'building', t: 'تحت إشراف مهندسك', d: 'نشتغل تحت إشراف المهندس المعتمد من المالك، ونسلّم كل مرحلة بعد ما يعتمدها.' },
      { icon: 'check', t: 'ضمان التسليم', d: 'نسلّمك الشغل بأعلى المواصفات الهندسية، والضمان مكتوب بالعقد.' },
    ],
    steps: [
      { t: 'طرّش لنا المخطط', d: 'المخطط الصحي أو المعماري على الواتساب، أو نجيك القسيمة ونعاين.' },
      { t: 'عرض سعر مفصّل', d: 'بنود واضحة: المواد والمصنعية وكل مرحلة لحالها، قبل لا نبدأ.' },
      { t: 'التنفيذ مع مراحل البناء', d: 'صرف تحت الأرض قبل الصبّة، وبعدها التغذية والتوانكي والتشطيب، بالتنسيق مع المقاول الرئيسي.' },
      { t: 'الفحص مع مهندسك', d: 'اختبار ضغط للتغذية واختبار ماي للصرف، ويعتمده مهندسك قبل التغطية.' },
      { t: 'التسليم والضمان', d: 'نسلّمك الشغل والمخططات المنفذة، والضمان مكتوب.' },
    ],
    who: ['قسائم وبيوت جديدة', 'فلل', 'عماير سكنية واستثمارية', 'مجمعات سكنية وتجارية', 'شاليهات واستراحات', 'تجديد تمديدات البيوت القديمة'],
    faq: [
      { q: 'تشتغلون من بداية البناء؟', a: 'إي، نبدأ من تمديدات الصرف تحت الأرض قبل الصبّة، لين التسليم النهائي.' },
      { q: 'شلون تسعّرون الشغل؟', a: 'من المخطط. طرّش لنا المخطط على الواتساب، أو نجيك نعاين، ونعطيك عرض سعر مفصّل بالبنود.' },
      { q: 'منو يشرف على الشغل؟', a: 'المهندس المعتمد من المالك، ونسلّم كل مرحلة بعد ما يفحصها ويعتمدها.' },
      { q: 'تغطون كل مناطق الكويت؟', a: 'إي، نشتغل على القسائم الجديدة بكل مناطق الكويت.' },
      { q: 'المواد منكم ولا من المالك؟', a: 'الاثنين ينفعون. نقدر نوفّر المواد من محلنا، أو نركّب المواد اللي يعتمدها مهندسك.' },
    ],
    cta: 'السلام عليكم، عندي مشروع بناء وأبي عرض سعر للتأسيس الصحي 🏗️',
    sendPlan: 'طرّش المخطط على الواتساب',
  },
  en: {
    label: 'Contracting',
    title: 'Licensed Plumbing Contractor for New Builds in Kuwait | Shalal Beirut',
    desc: 'Drainage, water supply, tank networks, main sewers and water distribution networks for new plots and buildings in Kuwait. 30 years of experience, built to code under your engineer’s supervision.',
    h1: 'Plumbing contracting for new builds',
    intro: 'Building a new home or a building? Our company’s licensed contracting team has 30 years of experience in Kuwait installing drainage and water supply for new plots, main water distribution networks, tank networks and main sewers. We build to code, under the supervision of the owner’s approved engineer, and hand over to the highest engineering standards with a guarantee.',
    promises: [
      { icon: 'shield', t: '30 years in Kuwait', d: 'Our own licensed contracting team, with plots and buildings across every area of Kuwait.' },
      { icon: 'list', t: 'Built to code', d: 'Correct falls, approved pipes and fittings, and a pressure test on every line before it is covered.' },
      { icon: 'building', t: 'Under your engineer', d: 'We work under the owner’s approved engineer and hand over each stage once it is signed off.' },
      { icon: 'check', t: 'Guaranteed handover', d: 'Handed over to the highest engineering standards, with the guarantee written into the contract.' },
    ],
    steps: [
      { t: 'Send us the drawings', d: 'Plumbing or architectural drawings on WhatsApp, or we visit the plot.' },
      { t: 'A detailed quote', d: 'Clear items for materials, labour and each stage, before we start.' },
      { t: 'Work alongside the build', d: 'Underground drainage before the slab, then supply, tanks and finishing, coordinated with the main contractor.' },
      { t: 'Testing with your engineer', d: 'Pressure tests on supply and water tests on drainage, signed off by your engineer before covering.' },
      { t: 'Handover and guarantee', d: 'We hand over the work and the as-built drawings, with a written guarantee.' },
    ],
    who: ['New plots and homes', 'Villas', 'Residential and investment buildings', 'Residential and commercial complexes', 'Chalets', 'Re-piping older homes'],
    faq: [
      { q: 'Do you start from the beginning of the build?', a: 'Yes, from the underground drainage before the slab through to final handover.' },
      { q: 'How do you price the work?', a: 'From the drawings. Send them on WhatsApp or we visit, and you get a detailed itemised quote.' },
      { q: 'Who supervises the work?', a: 'The owner’s approved engineer. We hand over each stage after they inspect and approve it.' },
      { q: 'Do you cover all of Kuwait?', a: 'Yes, we work on new plots in every area of Kuwait.' },
      { q: 'Do you supply the materials?', a: 'Either way. We can supply materials from our shop, or install materials approved by your engineer.' },
    ],
    cta: 'Hello, I would like a quote for plumbing on a new build',
    sendPlan: 'Send the drawings on WhatsApp',
  },
};

const PLAN = { ar: 'التسعير حسب المخطط', en: 'Priced from the drawings', from: null };

export const NEWBUILD_SERVICES: Service[] = [
  {
    slug: 'drainage-sewers',
    icon: 'drain',
    ar: {
      name: 'تمديدات الصرف والمجاري الرئيسية',
      short: 'صرف الحمامات والمطابخ، وخطوط المجاري الرئيسية والمناهيل لين شبكة الدولة.',
      title: 'تمديدات صرف صحي ومجاري رئيسية للقسائم | شلال بيروت',
      desc: 'تمديد الصرف الصحي للقسائم الجديدة والعماير بالكويت: خطوط الحمامات والمطابخ، والمجاري الرئيسية والمناهيل، والتوصيل على شبكة الدولة، تحت إشراف مهندسك.',
      intro: 'الصرف أول شي ينحط بالبيت وآخر شي تبي تكسر عشانه. نمدّ خطوط الصرف تحت الأرض قبل الصبّة بميول صحيحة، ونركّب المناهيل والمجاري الرئيسية لين التوصيل على شبكة الدولة، ونختبر كل خط بالماي قبل التغطية وتحت إشراف مهندسك.',
      includes: ['تمديد صرف الحمامات والمطابخ', 'خطوط المجاري الرئيسية', 'تركيب المناهيل وأغطيتها', 'التوصيل على شبكة الدولة', 'صرف مياه الأمطار والأسطح', 'اختبار ماي لكل خط قبل التغطية'],
      signs: ['قسيمة جديدة قبل الصبّة', 'عمارة أو مجمع تحت الإنشاء', 'تجديد صرف بيت قديم', 'مشاكل انسداد متكررة بسبب ميول غلط'],
      faq: [
        { q: 'متى لازم تبدأون الصرف؟', a: 'قبل صبّة الأرضيات، عشان الخطوط تنحط بالميول الصحيحة وتنفحص قبل التغطية.' },
        { q: 'تسوون التوصيل على شبكة الدولة؟', a: 'إي، نمدّ لين نقطة التوصيل حسب المخطط المعتمد.' },
      ],
    },
    en: {
      name: 'Drainage and main sewer lines',
      short: 'Bathroom and kitchen drainage, main sewer lines and manholes up to the public network.',
      title: 'Drainage and Main Sewer Installation for New Plots | Shalal Beirut',
      desc: 'Drainage for new plots and buildings in Kuwait: bathroom and kitchen lines, main sewers and manholes, and connection to the public network. Built to code under your engineer.',
      intro: 'Drainage is the first thing laid in a house and the last thing you want to break open. We lay underground lines before the slab with correct falls, install manholes and main sewers up to the public connection, and water-test every line before it is covered, under your engineer’s supervision.',
      includes: ['Bathroom and kitchen drainage', 'Main sewer lines', 'Manholes and covers', 'Connection to the public network', 'Rain and roof drainage', 'Water test on every line before covering'],
      signs: ['A new plot before the slab', 'A building or complex under construction', 'Replacing drainage in an older home', 'Repeated blockages from wrong falls'],
      faq: [
        { q: 'When should drainage start?', a: 'Before the floor slab, so lines go in at the right falls and are tested before covering.' },
        { q: 'Do you connect to the public network?', a: 'Yes, up to the connection point shown on the approved drawings.' },
      ],
    },
    prices: [PLAN],
  },
  {
    slug: 'water-supply-tanks',
    icon: 'tank',
    ar: {
      name: 'تمديدات التغذية وشبكات التوانكي',
      short: 'التغذية من العداد للخزانات، وشبكات التوانكي الأرضية والعلوية والمضخات.',
      title: 'تمديدات تغذية المياه وشبكات التوانكي للقسائم | شلال بيروت',
      desc: 'تمديد تغذية المياه للقسائم الجديدة بالكويت: من العداد للخزان الأرضي، والمضخات، والتوانكي العلوية، وشبكات الحار والبارد. فحص ضغط لكل خط وتحت إشراف مهندسك.',
      intro: 'ضغط ماي قوي بكل الأدوار يبدأ من تمديد صحيح. نمدّ التغذية من العداد للخزان الأرضي، ونركّب المضخات وخطوط الرفع للتوانكي العلوية، وشبكات الحار والبارد للحمامات والمطابخ، ونسوي فحص ضغط لكل خط قبل التغطية.',
      includes: ['تغذية من العداد للخزان الأرضي', 'شبكات التوانكي الأرضية والعلوية', 'تركيب المضخات وخطوط الرفع', 'تمديدات الحار والبارد', 'خطوط السخانات المركزية', 'فحص ضغط لكل خط'],
      signs: ['قسيمة جديدة', 'إضافة دور أو ملحق', 'ضغط الماي ضعيف بالأدوار العليا', 'تبديل تمديدات قديمة'],
      faq: [
        { q: 'شنو نوع المواسير اللي تستخدمونها؟', a: 'حسب المواصفات المعتمدة ومخطط مهندسك، وأغلب الشغل مواسير PPR بقطع معتمدة.' },
        { q: 'تركّبون المضخات والخزانات؟', a: 'إي، الخزانات والمضخات والعوامات وخطوط الرفع كلها ضمن الشغل.' },
      ],
    },
    en: {
      name: 'Water supply and tank networks',
      short: 'Supply from the meter to the tanks, ground and roof tank networks and pumps.',
      title: 'Water Supply and Tank Network Installation for New Plots | Shalal Beirut',
      desc: 'Water supply for new plots in Kuwait: meter to ground tank, pumps, roof tanks and hot and cold networks. Pressure-tested lines under your engineer’s supervision.',
      intro: 'Good water pressure on every floor starts with correct pipework. We run supply from the meter to the ground tank, install pumps and rising mains to the roof tanks, and lay hot and cold networks for bathrooms and kitchens, with a pressure test on every line before covering.',
      includes: ['Meter to ground tank supply', 'Ground and roof tank networks', 'Pumps and rising mains', 'Hot and cold pipework', 'Central water heater lines', 'Pressure test on every line'],
      signs: ['A new plot', 'Adding a floor or annex', 'Weak pressure on upper floors', 'Replacing old pipework'],
      faq: [
        { q: 'Which pipes do you use?', a: 'To the approved specification and your engineer’s drawings, mostly PPR with approved fittings.' },
        { q: 'Do you install tanks and pumps?', a: 'Yes, tanks, pumps, float valves and rising mains are all part of the job.' },
      ],
    },
    prices: [PLAN],
  },
  {
    slug: 'water-networks',
    icon: 'pipe',
    ar: {
      name: 'شبكات توزيع المياه الرئيسية',
      short: 'توزيع الماي على الأدوار والشقق للعماير والمجمعات.',
      title: 'شبكات توزيع المياه الرئيسية للعماير والمجمعات | شلال بيروت',
      desc: 'تنفيذ شبكات توزيع المياه الرئيسية للعماير والمجمعات بالكويت: الخطوط الرئيسية، والتوزيع على الأدوار والشقق، والمحابس والعدادات الفرعية. حسب أصول الصنعة.',
      intro: 'في العماير والمجمعات، الشبكة الرئيسية هي اللي تحدد إذا الماي يوصل كل شقة بضغط زين. ننفّذ الخطوط الرئيسية والتوزيع على الأدوار والشقق، ونركّب المحابس والعدادات الفرعية بحيث تقدر تسكّر أي جزء بدون ما توقف العمارة كلها.',
      includes: ['الخطوط الرئيسية للعمارة أو المجمع', 'التوزيع على الأدوار والشقق', 'محابس رئيسية وفرعية', 'تجهيز العدادات الفرعية', 'ربط الخزانات والمضخات بالشبكة', 'فحص ضغط واستلام مع المهندس'],
      signs: ['عمارة أو مجمع تحت الإنشاء', 'تقسيم بيت لشقق', 'ضغط غير متساوي بين الشقق', 'تجديد شبكة قديمة'],
      faq: [
        { q: 'تشتغلون للعماير الكبيرة؟', a: 'إي، للبيوت والفلل والعماير والمجمعات.' },
        { q: 'أقدر أسكّر شقة وحدة للصيانة؟', a: 'إي، نصمم الشبكة بمحابس لكل دور وشقة عشان الصيانة ما توقف العمارة.' },
      ],
    },
    en: {
      name: 'Main water distribution networks',
      short: 'Distributing water to every floor and flat in buildings and complexes.',
      title: 'Main Water Distribution Networks for Buildings and Complexes | Shalal Beirut',
      desc: 'Main water distribution networks for buildings and complexes in Kuwait: main lines, distribution to floors and flats, isolation valves and sub-meters. Built to code.',
      intro: 'In buildings and complexes, the main network decides whether every flat gets good pressure. We install the main lines and the distribution to floors and flats, with valves and sub-meters so any part can be isolated without shutting the whole building.',
      includes: ['Main lines for the building or complex', 'Distribution to floors and flats', 'Main and branch valves', 'Sub-meter provisions', 'Connecting tanks and pumps to the network', 'Pressure test and handover with the engineer'],
      signs: ['A building or complex under construction', 'Splitting a house into flats', 'Uneven pressure between flats', 'Replacing an old network'],
      faq: [
        { q: 'Do you work on large buildings?', a: 'Yes, homes, villas, buildings and complexes.' },
        { q: 'Can one flat be isolated for maintenance?', a: 'Yes, we design the network with valves per floor and flat so maintenance never stops the building.' },
      ],
    },
    prices: [PLAN],
  },
];

export const newbuildBySlug = (slug: string) => NEWBUILD_SERVICES.find((s) => s.slug === slug)!;
