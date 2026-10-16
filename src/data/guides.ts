// Articles under /guides/. Each one links to the service it supports.
// (/blog is not used: it returns 410 for the previous domain owner's pages.)
import type { Lang } from '../i18n';

type Section = { h: string; p?: string[]; list?: string[] };
type Copy = { title: string; desc: string; h1: string; lead: string; sections: Section[] };
export type Guide = { slug: string; date: string; service: string; ar: Copy; en: Copy };

export const GUIDES: Guide[] = [
  {
    slug: 'new-plot-plumbing-stages',
    date: '2026-10-16',
    service: '/new-builds/',
    ar: {
      title: 'تأسيس الصحي للقسيمة الجديدة: من المخطط للتسليم | شلال بيروت',
      desc: 'دليل مختصر لمراحل تمديدات الصرف والتغذية والتوانكي في القسيمة الجديدة بالكويت، وشنو لازم تتأكد منه بكل مرحلة قبل التغطية.',
      h1: 'مراحل تأسيس الصحي لقسيمتك الجديدة',
      lead: 'تمديدات الصحي تنحط مرة وحدة وتقعد ويّاك عمر. أي غلط فيها يبين بعد السكن: انسداد، ريحة، ضغط ماي ضعيف، أو تسريب تحت البلاط. هذا ملخص المراحل من المخطط لين التسليم، وشنو تتأكد منه بكل مرحلة.',
      sections: [
        {
          h: '1. المخطط الصحي قبل كل شي',
          p: ['قبل لا يبدأ الحفر، لازم يكون عندك مخطط صحي معتمد: أماكن الحمامات والمطابخ، ومسارات الصرف، ومكان الخزان الأرضي والتوانكي العلوية، ونقطة التوصيل على شبكة الدولة.', 'راجع المخطط مع المقاول الصحي بدري، لأن تغيير مكان حمام بعد الصبّة يكلّف وايد.'],
        },
        {
          h: '2. الصرف تحت الأرض قبل الصبّة',
          p: ['هذي أهم مرحلة. خطوط الصرف تنحط تحت الأرضيات قبل الصبّة، وأي غلط فيها ما يتصلح إلا بالتكسير.'],
          list: ['ميول صحيحة لكل خط عشان ما يصير ركود أو انسداد', 'مواسير وقطع معتمدة بالمقاسات اللي بالمخطط', 'مناهيل بأماكن يسهل توصلها للصيانة', 'اختبار ماي لكل خط قبل التغطية، ويحضره مهندسك'],
        },
        {
          h: '3. التغذية والخزانات',
          p: ['بعدها تنمد التغذية من العداد للخزان الأرضي، وتنركّب المضخات وخط الرفع للتوانكي العلوية. ضغط الماي بالأدوار العليا يعتمد على هالمرحلة.'],
          list: ['مقاسات مواسير مناسبة لعدد الأدوار والحمامات', 'محابس رئيسية تقدر تسكّر فيها كل جزء لحاله', 'مكان مضخة فيه تهوية وسهل توصله للصيانة'],
        },
        {
          h: '4. تمديدات الحمامات والمطابخ (الحار والبارد)',
          p: ['داخل الجدران تنمد خطوط الحار والبارد لكل حمام ومطبخ، وخطوط السخانات. هني لازم فحص ضغط لكل الشبكة قبل اللياسة والبلاط.'],
        },
        {
          h: '5. الفحص والاستلام مع مهندسك',
          p: ['ولا مرحلة تتغطى قبل ما يفحصها المهندس المعتمد من المالك ويعتمدها. اطلب نتيجة اختبار الضغط واختبار الماي مكتوبة.'],
        },
        {
          h: '6. التشطيب والتسليم',
          p: ['بعد البلاط تنركّب الأدوات الصحية: الكراسي والمغاسل والخلاطات والسخانات. وعند التسليم، خذ المخططات المنفذة (كيف ما انمدّت فعلاً) وورقة الضمان.'],
        },
        {
          h: 'شلون نشتغل إحنا',
          p: ['فريق المقاولات المعتمد في شركتنا عنده خبرة 30 سنة بالكويت في تمديد الصرف والتغذية للقسائم الجديدة، وشبكات توزيع المياه الرئيسية، وشبكات التوانكي والمجاري الرئيسية. نشتغل حسب أصول الصنعة وتحت إشراف مهندسك، ونسلّمك الشغل بأعلى المواصفات الهندسية وبالضمان.', 'طرّش لنا المخطط على الواتساب ونرد عليك بعرض سعر مفصّل.'],
        },
      ],
    },
    en: {
      title: 'Plumbing Stages for a New Plot in Kuwait: Drawings to Handover | Shalal Beirut',
      desc: 'A short guide to the drainage, water supply and tank stages on a new plot in Kuwait, and what to check at each stage before it is covered.',
      h1: 'Plumbing stages for your new plot',
      lead: 'Plumbing goes in once and stays with you for life. Mistakes show up after you move in: blockages, smells, weak pressure or leaks under the tiles. Here are the stages from drawings to handover, and what to check at each one.',
      sections: [
        { h: '1. Plumbing drawings first', p: ['Before digging starts you need approved plumbing drawings: bathroom and kitchen locations, drainage routes, the ground tank and roof tanks, and the public connection point.', 'Review them with your plumbing contractor early. Moving a bathroom after the slab is expensive.'] },
        { h: '2. Underground drainage before the slab', p: ['This is the most important stage. Drainage lines go under the floors before the slab, and mistakes can only be fixed by breaking.'], list: ['Correct falls on every line to avoid standing water and blockages', 'Approved pipes and fittings at the sizes on the drawings', 'Manholes where they are easy to reach', 'A water test on every line before covering, witnessed by your engineer'] },
        { h: '3. Supply and tanks', p: ['Next, supply runs from the meter to the ground tank, and pumps and the rising main go up to the roof tanks. Upper-floor pressure depends on this stage.'], list: ['Pipe sizes suited to the number of floors and bathrooms', 'Main valves so each part can be isolated', 'A ventilated, accessible pump location'] },
        { h: '4. Bathroom and kitchen pipework (hot and cold)', p: ['Hot and cold lines run inside the walls to every bathroom and kitchen, plus heater lines. The whole network needs a pressure test before plastering and tiling.'] },
        { h: '5. Testing and sign-off with your engineer', p: ['No stage should be covered before the owner’s approved engineer inspects and approves it. Ask for the pressure and water test results in writing.'] },
        { h: '6. Finishing and handover', p: ['After tiling come the fittings: toilets, basins, mixers and heaters. At handover, get the as-built drawings and the guarantee in writing.'] },
        { h: 'How we work', p: ['Our company’s licensed contracting team has 30 years of experience in Kuwait installing drainage and supply for new plots, main water distribution networks, tank networks and main sewers. We build to code under your engineer’s supervision and hand over to the highest engineering standards, with a guarantee.', 'Send us your drawings on WhatsApp for a detailed quote.'] },
      ],
    },
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug)!;
export const guideList = (lang: Lang) => GUIDES.map((g) => ({ slug: g.slug, ...g[lang] }));
