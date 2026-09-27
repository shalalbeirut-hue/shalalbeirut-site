// Kuwait's six governorates with well-known residential areas in each.
type Copy = { name: string; title: string; desc: string; intro: string; places: string[] };
export type Area = { slug: string; ar: Copy; en: Copy };

export const AREAS: Area[] = [
  {
    slug: 'hawalli',
    ar: {
      name: 'حولي',
      title: 'فني صحي حولي والسالمية | شلال بيروت',
      desc: 'فني صحي في محافظة حولي: السالمية، الجابرية، الرميثية، سلوى، بيان ومشرف. في الموعد وبالضمان والسعر قبل الشغل.',
      intro: 'حولي أكثر محافظة فيها عمارات وشقق، وأغلب طلباتها تسريبات حمامات وتسليك وتبديل خلاطات. نغطي كل مناطق المحافظة بموعد محدد.',
      places: ['حولي', 'السالمية', 'الجابرية', 'الرميثية', 'سلوى', 'بيان', 'مشرف', 'الشعب', 'الصديق', 'حطين', 'الزهراء', 'السلام', 'الشهداء'],
    },
    en: {
      name: 'Hawalli',
      title: 'Plumber in Hawalli & Salmiya | Shalal Beirut',
      desc: 'Plumbing and maintenance across Hawalli governorate: Salmiya, Jabriya, Rumaithiya, Salwa, Bayan and Mishref. On time, guaranteed, price before work.',
      intro: 'Hawalli has the most apartment buildings in Kuwait, and most jobs here are bathroom leaks, blocked drains and mixer replacements. We cover the whole governorate with a fixed arrival time.',
      places: ['Hawalli', 'Salmiya', 'Jabriya', 'Rumaithiya', 'Salwa', 'Bayan', 'Mishref', 'Shaab', 'Siddiq', 'Hitteen', 'Zahra', 'Salam', 'Shuhada'],
    },
  },
  {
    slug: 'capital',
    ar: {
      name: 'العاصمة',
      title: 'فني صحي العاصمة ومدينة الكويت | شلال بيروت',
      desc: 'فني صحي في محافظة العاصمة: مدينة الكويت، شرق، الدسمة، الشامية، كيفان، الخالدية والعديلية. في الموعد وبالضمان.',
      intro: 'في العاصمة بيوت قديمة وأبراج مكاتب مع بعض. نشتغل على تجديد التمديدات القديمة، وصيانة الخزانات، وعقود صيانة المكاتب.',
      places: ['مدينة الكويت', 'شرق', 'الدسمة', 'الشامية', 'كيفان', 'الخالدية', 'العديلية', 'الفيحاء', 'الروضة', 'القادسية', 'المنصورية', 'اليرموك', 'الشويخ', 'قرطبة', 'السرة'],
    },
    en: {
      name: 'Capital',
      title: 'Plumber in Kuwait City & the Capital | Shalal Beirut',
      desc: 'Plumbing and maintenance across the Capital governorate: Kuwait City, Sharq, Dasma, Shamiya, Kaifan, Khaldiya and Adailiya. On time and guaranteed.',
      intro: 'The Capital mixes older family homes with office towers. We handle re-piping of older homes, tank maintenance and office maintenance contracts.',
      places: ['Kuwait City', 'Sharq', 'Dasma', 'Shamiya', 'Kaifan', 'Khaldiya', 'Adailiya', 'Faiha', 'Rawda', 'Qadsiya', 'Mansouriya', 'Yarmouk', 'Shuwaikh', 'Qurtuba', 'Surra'],
    },
  },
  {
    slug: 'farwaniya',
    ar: {
      name: 'الفروانية',
      title: 'فني صحي الفروانية وخيطان | شلال بيروت',
      desc: 'فني صحي في محافظة الفروانية: الفروانية، خيطان، جليب الشيوخ، العارضية، الرابية والأندلس. السعر قبل الشغل وضمان مكتوب.',
      intro: 'الفروانية مزدحمة، فالموعد المحدد يفرق. نوصل في الوقت اللي اتفقنا عليه، ونرسل لك رسالة والفني في الطريق.',
      places: ['الفروانية', 'خيطان', 'جليب الشيوخ', 'العارضية', 'الرابية', 'الأندلس', 'الرحاب', 'العمرية', 'الرقعي', 'إشبيلية', 'الفردوس', 'صباح الناصر', 'عبدالله المبارك'],
    },
    en: {
      name: 'Farwaniya',
      title: 'Plumber in Farwaniya & Khaitan | Shalal Beirut',
      desc: 'Plumbing and maintenance across Farwaniya governorate: Farwaniya, Khaitan, Jleeb Al-Shuyoukh, Ardiya, Rabia and Andalous. Price before work, written warranty.',
      intro: 'Farwaniya is busy, so a fixed arrival time matters. We arrive when we agreed and message you when the technician is on the way.',
      places: ['Farwaniya', 'Khaitan', 'Jleeb Al-Shuyoukh', 'Ardiya', 'Rabia', 'Andalous', 'Rehab', 'Omariya', 'Riggae', 'Ishbiliya', 'Firdous', 'Sabah Al-Nasser', 'Abdullah Al-Mubarak'],
    },
  },
  {
    slug: 'ahmadi',
    ar: {
      name: 'الأحمدي',
      title: 'فني صحي الأحمدي والفحيحيل والمنقف | شلال بيروت',
      desc: 'فني صحي في محافظة الأحمدي: الفحيحيل، المنقف، أبو حليفة، الفنطاس، المهبولة، الصباحية والعقيلة. في الموعد وبالضمان.',
      intro: 'من الشاليهات للشقق للبيوت، الأحمدي فيها كل شي. أكثر الطلبات هنا خزانات ومضخات وسخانات مركزية.',
      places: ['الأحمدي', 'الفحيحيل', 'المنقف', 'أبو حليفة', 'الفنطاس', 'المهبولة', 'الصباحية', 'العقيلة', 'الرقة', 'هدية', 'الظهر', 'الوفرة', 'صباح الأحمد', 'جابر العلي'],
    },
    en: {
      name: 'Ahmadi',
      title: 'Plumber in Ahmadi, Fahaheel & Mangaf | Shalal Beirut',
      desc: 'Plumbing and maintenance across Ahmadi governorate: Fahaheel, Mangaf, Abu Halifa, Fintas, Mahboula, Sabahiya and Egaila. On time and guaranteed.',
      intro: 'From chalets to flats to family homes, Ahmadi has it all. Most jobs here are tanks, pumps and central water heaters.',
      places: ['Ahmadi', 'Fahaheel', 'Mangaf', 'Abu Halifa', 'Fintas', 'Mahboula', 'Sabahiya', 'Egaila', 'Riqqa', 'Hadiya', 'Dhaher', 'Wafra', 'Sabah Al-Ahmad', 'Jaber Al-Ali'],
    },
  },
  {
    slug: 'jahra',
    ar: {
      name: 'الجهراء',
      title: 'فني صحي الجهراء | شلال بيروت',
      desc: 'فني صحي في محافظة الجهراء: الجهراء، سعد العبدالله، القصر، العيون، النسيم والواحة. في الموعد وبالضمان والسعر قبل الشغل.',
      intro: 'بيوت الجهراء كبيرة وخزاناتها كثيرة. نركز على تنظيف الخزانات والمضخات والسخانات، ونرتب زيارات دورية للبيت كله.',
      places: ['الجهراء', 'سعد العبدالله', 'القصر', 'العيون', 'النسيم', 'الواحة', 'تيماء', 'النعيم', 'القيروان', 'جابر الأحمد', 'الصليبية'],
    },
    en: {
      name: 'Jahra',
      title: 'Plumber in Jahra | Shalal Beirut',
      desc: 'Plumbing and maintenance across Jahra governorate: Jahra, Saad Al-Abdullah, Qasr, Oyoun, Naseem and Waha. On time, guaranteed, price before work.',
      intro: 'Homes in Jahra are large, with several tanks each. We focus on tank cleaning, pumps and heaters, and can schedule regular visits for the whole house.',
      places: ['Jahra', 'Saad Al-Abdullah', 'Qasr', 'Oyoun', 'Naseem', 'Waha', 'Taima', 'Naeem', 'Qairawan', 'Jaber Al-Ahmad', 'Sulaibiya'],
    },
  },
  {
    slug: 'mubarak-al-kabeer',
    ar: {
      name: 'مبارك الكبير',
      title: 'فني صحي مبارك الكبير وصباح السالم | شلال بيروت',
      desc: 'فني صحي في محافظة مبارك الكبير: صباح السالم، القرين، العدان، القصور، المسيلة وأبو فطيرة. في الموعد وبالضمان.',
      intro: 'مبارك الكبير أغلبها بيوت عائلية. نشتغل على تسريبات الحمامات وتجديد التمديدات وتركيب الأدوات الصحية، ونحمي البيت ونرتبه بعد الشغل.',
      places: ['صباح السالم', 'القرين', 'العدان', 'القصور', 'المسيلة', 'أبو فطيرة', 'مبارك الكبير', 'أبو الحصانية', 'الفنيطيس', 'المسايل'],
    },
    en: {
      name: 'Mubarak Al-Kabeer',
      title: 'Plumber in Mubarak Al-Kabeer & Sabah Al-Salem | Shalal Beirut',
      desc: 'Plumbing and maintenance across Mubarak Al-Kabeer: Sabah Al-Salem, Qurain, Adan, Qusour, Messila and Abu Fatira. On time and guaranteed.',
      intro: 'Mubarak Al-Kabeer is mostly family homes. We handle bathroom leaks, re-piping and sanitary ware installation, and we protect and tidy the house after the job.',
      places: ['Sabah Al-Salem', 'Qurain', 'Adan', 'Qusour', 'Messila', 'Abu Fatira', 'Mubarak Al-Kabeer', 'Abu Al-Hasaniya', 'Fnaitees', 'Masayel'],
    },
  },
];
