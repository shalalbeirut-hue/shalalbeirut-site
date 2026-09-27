// Builds brand/guidelines.html from the generated logo SVGs.
// Usage: node build-logo.mjs && node build-guide.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BRAND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = path.join(BRAND, 'logo');

async function svg(rel, cls = '') {
  let s = await fs.readFile(path.join(LOGO, rel + '.svg'), 'utf8');
  s = s.replace(/\s(width|height)="\d+"/g, '').replace('<svg ', `<svg class="${cls}" role="img" aria-label="شعار شلال بيروت" `);
  return s.trim();
}

const P = {
  green: { label: 'أخضر الأرز', note: 'اللوحة الأساسية' },
  navy: { label: 'كحلي الخليج', note: 'بديلة' },
};

const logos = {};
for (const pal of Object.keys(P)) {
  logos[pal] = {
    ar: await svg(`${pal}/horizontal-ar-color`, 'lg'),
    en: await svg(`${pal}/horizontal-en-color`, 'lg'),
    st: await svg(`${pal}/stacked-color`, 'st'),
    icon: await svg(`${pal}/icon-color`, 'ic'),
  };
}
const rev = {
  ar: await svg('common/horizontal-ar-reverse', 'lg'),
  icon: await svg('common/icon-reverse', 'ic'),
  white: await svg('common/icon-white', 'ic'),
  black: await svg('common/horizontal-ar-black', 'lg'),
};

const html = `<title>هوية شلال بيروت</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@700&family=Readex+Pro:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap">
<style>
:root{
  --bg:#F2F6F3; --surface:#FFFFFF; --ink:#14211B; --muted:#56665E; --line:#D8E1DB; --chip:#E6EDE8;
  --cedar:#17583A; --water:#1B8CC4; --water-text:#136E9C; --deep:#0F2A1F; --sand:#E0A93B;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0D1512; --surface:#15201A; --ink:#E5EDE8; --muted:#9BACA3; --line:#27352D; --chip:#1D2A23;
    --water-text:#7CCBEF; color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --bg:#0D1512; --surface:#15201A; --ink:#E5EDE8; --muted:#9BACA3; --line:#27352D; --chip:#1D2A23;
  --water-text:#7CCBEF; color-scheme:dark;
}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;font-size:16px;line-height:1.7;padding-inline:16px;padding-block:28px 72px}
.wrap{max-width:1040px;margin-inline:auto;display:flex;flex-direction:column;gap:56px}
h1,h2,h3{font-family:"Readex Pro","IBM Plex Sans Arabic",sans-serif;margin:0;line-height:1.25;text-wrap:balance}
h1{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:600}
h2{font-size:1.45rem;font-weight:600}
h3{font-size:1.05rem;font-weight:600}
p{margin:0;max-width:66ch}
.muted{color:var(--muted)}
section{display:flex;flex-direction:column;gap:18px}
.sec-head{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:22px}
.eyebrow{font-family:"Readex Pro",sans-serif;font-size:.78rem;letter-spacing:.1em;color:var(--muted);text-transform:uppercase}

.hero{display:grid;grid-template-columns:minmax(0,1fr);gap:20px}
.hero-top{display:flex;flex-direction:column;gap:10px}
.stage{background:#FFFFFF;border:1px solid #E1E8E3;border-radius:18px;padding:clamp(24px,6vw,56px);display:flex;justify-content:center}
.stage.dark{background:var(--deep);border-color:var(--deep)}
.lg{width:100%;max-width:620px;height:auto;display:block}
.st{width:100%;max-width:280px;height:auto;display:block}
.ic{width:100%;height:auto;display:block}

.seg{display:flex;gap:8px;flex-wrap:wrap}
.seg button{font:inherit;font-size:.92rem;border:1px solid var(--line);background:var(--chip);color:var(--ink);border-radius:999px;padding:7px 15px;cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--surface);border-color:var(--ink);font-weight:600}
.seg button:focus-visible{outline:3px solid var(--water);outline-offset:2px}

.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px}
.panel .tile{border-radius:10px;padding:24px;display:flex;align-items:center;justify-content:center;min-height:150px;background:#fff;border:1px solid #E1E8E3}
.panel .tile.dark{background:var(--deep);border-color:var(--deep)}
.panel .tile .ic{max-width:96px}
.cap{font-size:.9rem;color:var(--muted)}

.colors{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:14px}
.color{border-radius:14px;overflow:hidden;border:1px solid var(--line);background:var(--surface)}
.color .chip{height:96px;display:flex;align-items:flex-end;padding:10px 12px;font-size:.8rem;font-weight:600}
.color .meta{padding:12px;display:flex;flex-direction:column;gap:2px;font-size:.88rem}
.color .meta b{font-size:.98rem}
.color code{font-family:"Readex Pro",monospace;direction:ltr;text-align:right;color:var(--muted);font-variant-numeric:tabular-nums}

.type{display:grid;gap:14px}
.spec{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 20px;align-items:baseline}
.spec .sample{grid-column:1/-1}
.spec .role{font-weight:600}
.spec .fam{font-family:"Readex Pro",sans-serif;font-size:.85rem;color:var(--muted);direction:ltr}
.s-display{font-family:"Reem Kufi",sans-serif;font-weight:700;font-size:clamp(2rem,6vw,3.2rem);line-height:1.2;color:var(--cedar)}
:root[data-theme="dark"] .s-display{color:#8FD0A8}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .s-display{color:#8FD0A8}}
.s-body{font-size:1.1rem}
.s-latin{font-family:"Readex Pro",sans-serif;font-weight:600;font-size:1.5rem;direction:ltr;text-align:right}

.rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:14px}
.rule{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px}
.rule .tile{border-radius:10px;height:130px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #E1E8E3;overflow:hidden}
.rule .tile svg{width:78px;height:auto}
.rule .tag{font-size:.8rem;font-weight:600;border-radius:999px;padding:1px 10px;align-self:flex-start}
.tag.no{background:#FBE3E1;color:#9B2C22}
.tag.yes{background:#DDF1E4;color:#17583A}

.voice{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}
.voice .panel p{font-size:1.02rem}
.voice .panel.bad p{color:var(--muted);text-decoration:line-through;text-decoration-color:#C0564B55}

.apps{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px}
.phone{background:#0B141A;border-radius:18px;padding:18px;display:flex;align-items:center;gap:12px;color:#E9EDEF}
.avatar{width:56px;height:56px;border-radius:50%;background:var(--deep);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.avatar svg{width:38px}
.phone .nm{font-weight:600}
.phone .st2{font-size:.85rem;color:#8696A0}
.sticker{width:220px;height:220px;border-radius:50%;background:#fff;border:6px solid #17583A;margin-inline:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#17583A;text-align:center}
.sticker svg{width:64px}
.sticker .w{font-family:"Reem Kufi",sans-serif;font-weight:700;font-size:1.7rem;line-height:1}
.sticker .d{font-size:.8rem;color:#2E4A3C}
.sticker .n{font-family:"Readex Pro",sans-serif;font-size:.7rem;letter-spacing:.18em;color:#1B8CC4}
.appicon{width:120px;height:120px;border-radius:28px;background:var(--deep);display:flex;align-items:center;justify-content:center;margin-inline:auto}
.appicon svg{width:84px}

.files{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px;overflow-x:auto}
.files table{border-collapse:collapse;width:100%;font-size:.92rem;min-width:520px}
.files th,.files td{text-align:right;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.files code{font-family:"Readex Pro",monospace;direction:ltr;display:inline-block}
a{color:var(--water-text)}
</style>

<main class="wrap">
  <header class="hero">
    <div class="hero-top">
      <span class="eyebrow">دليل الهوية البصرية · النسخة 1</span>
      <h1>شلال بيروت للأدوات الصحية وصيانتها</h1>
      <p class="muted">الدليل ده بيحدد إزاي نستخدم اللوجو والألوان والخطوط في كل مكان: الموقع، الواتساب، الإنستغرام، الفلاير، ملصق الضمان، زي الفني، والسيارة. الرمز أرزة لبنانية مرسومة بمواسير، وفوقها نقطة مياه، وتحتها موج. يعني: أصلنا، وشغلنا، والمياه اللي بنصونها.</p>
    </div>
    <div class="seg" role="group" aria-label="لوحة الألوان">
      <button type="button" data-pal="green" aria-pressed="true">لوحة 1 · أخضر الأرز (الأساسية)</button>
      <button type="button" data-pal="navy" aria-pressed="false">لوحة 2 · كحلي الخليج</button>
    </div>
    <div class="stage"><div data-slot="ar" style="width:100%;display:flex;justify-content:center">${logos.green.ar}</div></div>
  </header>

  <section>
    <div class="sec-head"><span class="eyebrow">01 · اللوجو</span><h2>نسخ اللوجو</h2>
      <p class="muted">النسخة الأفقية العربي هي الأساسية. الإنجليزي للشركات والمقيمين. المتراكبة للأماكن الطويلة زي الستوري واليافطة العمودية. والأيقونة لوحدها للمساحات الصغيرة.</p></div>
    <div class="grid2">
      <div class="panel"><div class="tile" data-slot="en">${logos.green.en}</div><span class="cap">أفقي إنجليزي: الموقع الإنجليزي، العقود، والفواتير.</span></div>
      <div class="panel"><div class="tile" data-slot="st">${logos.green.st}</div><span class="cap">متراكب: الستوري، اليافطة العمودية، وضهر الفلاير.</span></div>
    </div>
    <div class="grid3">
      <div class="panel"><div class="tile" data-slot="icon">${logos.green.icon}</div><span class="cap">الأيقونة بالألوان</span></div>
      <div class="panel"><div class="tile dark">${rev.icon}</div><span class="cap">الأيقونة على خلفية غامقة</span></div>
      <div class="panel"><div class="tile dark">${rev.white}</div><span class="cap">أبيض بالكامل: حفر، تطريز، زجاج</span></div>
    </div>
    <div class="stage dark">${rev.ar}</div>
    <div class="stage">${rev.black}</div>
  </section>

  <section>
    <div class="sec-head"><span class="eyebrow">02 · المساحة والمقاس</span><h2>مساحة الأمان وأقل مقاس</h2></div>
    <div class="grid2">
      <div class="panel"><h3>مساحة الأمان</h3><p>سيب حوالين اللوجو مسافة فاضية قد <b>ارتفاع نقطة المياه</b> اللي فوق الأرزة، من كل الجهات. مفيش نص ولا صورة ولا حافة تدخل في المسافة دي.</p></div>
      <div class="panel"><h3>أقل مقاس</h3><p>الأفقي: <b>140px</b> على الشاشة، و<b>40mm</b> في الطباعة.<br>الأيقونة: <b>24px</b> على الشاشة، و<b>10mm</b> في الطباعة.<br>أصغر من كده، استخدم الأيقونة لوحدها.</p></div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="eyebrow">03 · الألوان</span><h2>لوحة الألوان</h2>
      <p class="muted">الأخضر هو صوت البراند، والأزرق للمياه والأزرار، والرملي للعروض بس. الأبيض بيتكتب على الأخضر والكحلي الغامق بأمان. أما على الأزرق الفاتح، فالأبيض بيتقري في العناوين الكبيرة بس. للأزرار الصغيرة استخدم الأزرق الغامق.</p></div>
    <div class="colors" id="colors"></div>
  </section>

  <section>
    <div class="sec-head"><span class="eyebrow">04 · الخطوط</span><h2>الخطوط</h2>
      <p class="muted">كلها من Google Fonts مجاناً، وبتدعم العربي كويس.</p></div>
    <div class="type">
      <div class="spec"><span class="role">العناوين الكبيرة والشعار</span><span class="fam">Reem Kufi · Bold 700</span><div class="sample s-display">في الموعد.. وبالضمان</div></div>
      <div class="spec"><span class="role">النص العربي</span><span class="fam">IBM Plex Sans Arabic · 400/500/600</span><div class="sample s-body">نحدد لك وقت الوصول، ونشرح لك المشكلة والتكلفة قبل الشغل، وما نبدأ إلا بموافقتك. وكل قطعة من محلنا عليها ملصق ضمان.</div></div>
      <div class="spec"><span class="role">الإنجليزي والأرقام</span><span class="fam">Readex Pro · 400/600</span><div class="sample s-latin">On time. Guaranteed.</div></div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="eyebrow">05 · الاستخدام</span><h2>اعمل وما تعملش</h2></div>
    <div class="rules">
      <div class="rule"><div class="tile" data-slot="icon2">${logos.green.icon}</div><span class="tag yes">صح</span><span class="cap">الألوان الرسمية على خلفية فاتحة ونضيفة.</span></div>
      <div class="rule"><div class="tile"><div style="transform:scaleX(1.6)">${logos.green.icon}</div></div><span class="tag no">غلط</span><span class="cap">ما تمطّش اللوجو ولا تضغطه.</span></div>
      <div class="rule"><div class="tile"><div style="filter:hue-rotate(140deg) saturate(1.6)">${logos.green.icon}</div></div><span class="tag no">غلط</span><span class="cap">ما تغيّرش الألوان لألوان برا اللوحة.</span></div>
      <div class="rule"><div class="tile"><div style="transform:rotate(-18deg)">${logos.green.icon}</div></div><span class="tag no">غلط</span><span class="cap">ما تلفّش اللوجو.</span></div>
      <div class="rule"><div class="tile"><div style="filter:drop-shadow(6px 6px 3px rgba(0,0,0,.55))">${logos.green.icon}</div></div><span class="tag no">غلط</span><span class="cap">من غير ظلال ولا تأثيرات.</span></div>
      <div class="rule"><div class="tile" style="background:repeating-linear-gradient(45deg,#8FA89A 0 12px,#C8B98F 12px 24px)">${logos.green.icon}</div><span class="tag no">غلط</span><span class="cap">ما تحطوش على خلفية زحمة. استخدم الأبيض أو الغامق.</span></div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="eyebrow">06 · نبرة الكلام</span><h2>إزاي بنتكلم</h2>
      <p class="muted">عربي كويتي بسيط ومحترم. وعود محددة بأرقام بدل الصفات الكبيرة. الإنجليزي مهني وقصير.</p></div>
    <div class="voice">
      <div class="panel"><span class="tag yes" style="align-self:flex-start">كده</span><p>نوصلك خلال ساعتين من تأكيد الموعد، ونرسل لك رسالة والفني في الطريق.</p></div>
      <div class="panel bad"><span class="tag no" style="align-self:flex-start">مش كده</span><p>أسرع وأفضل فني صحي في الكويت 24 ساعة بأرخص الأسعار!!!</p></div>
      <div class="panel"><span class="tag yes" style="align-self:flex-start">كده</span><p>السعر قبل الشغل. وما نبدأ إلا بموافقتك.</p></div>
      <div class="panel bad"><span class="tag no" style="align-self:flex-start">مش كده</span><p>أسعار مناسبة للجميع وخصومات هائلة.</p></div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="eyebrow">07 · التطبيقات</span><h2>الهوية في الاستخدام</h2></div>
    <div class="apps">
      <div class="panel"><div class="phone"><div class="avatar">${rev.icon}</div><div><div class="nm">شلال بيروت</div><div class="st2">في الموعد.. وبالضمان</div></div></div><span class="cap">صورة البروفايل: الأيقونة على الأخضر الغامق. الملف: <code>profile-dark-1080.png</code></span></div>
      <div class="panel"><div class="sticker" data-slot="sticker">${logos.green.icon}<span class="w">ضمان</span><span class="d">مدة الضمان ‎[—]‎ شهور</span><span class="n">SHALAL BEIRUT</span></div><span class="cap">ملصق الضمان على القطع: دايرة 5 سم، وتحته رقم الطلب.</span></div>
      <div class="panel"><div class="appicon">${rev.icon}</div><span class="cap">أيقونة تطبيق الفنيين على الموبايل.</span></div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="eyebrow">08 · الملفات</span><h2>ملفات اللوجو</h2>
      <p class="muted">كل الملفات على GitHub في <a href="https://github.com/shalalbeirut-hue/shalalbeirut-site/tree/main/brand/logo">brand/logo</a>. ملفات SVG للطباعة والمطبعة، وملفات PNG للسوشيال والواتساب. الكلام في اللوجو محوّل لأشكال، فمش محتاج الخط يكون متسطب.</p></div>
    <div class="files"><table>
      <thead><tr><th>الملف</th><th>الاستخدام</th></tr></thead>
      <tbody>
        <tr><td><code>green/horizontal-ar-color.svg</code></td><td>اللوجو الأساسي: الموقع، الفواتير، الفلاير</td></tr>
        <tr><td><code>green/horizontal-en-color.svg</code></td><td>الإنجليزي</td></tr>
        <tr><td><code>green/stacked-color.svg</code></td><td>الستوري واليافطة العمودية</td></tr>
        <tr><td><code>green/icon-color.svg</code></td><td>الأيقونة لوحدها</td></tr>
        <tr><td><code>common/*-reverse.svg</code></td><td>على خلفيات غامقة</td></tr>
        <tr><td><code>common/*-white.svg</code> و <code>*-black.svg</code></td><td>لون واحد: حفر، تطريز، ختم، فاكس</td></tr>
        <tr><td><code>png/green-profile-dark-1080.png</code></td><td>صورة بروفايل الواتساب والإنستغرام والتيك توك</td></tr>
        <tr><td><code>navy/…</code></td><td>نفس الملفات باللوحة البديلة</td></tr>
      </tbody>
    </table></div>
  </section>
</main>

<template id="L-navy-ar">${logos.navy.ar}</template>
<template id="L-navy-en">${logos.navy.en}</template>
<template id="L-navy-st">${logos.navy.st}</template>
<template id="L-navy-icon">${logos.navy.icon}</template>
<template id="L-green-ar">${logos.green.ar}</template>
<template id="L-green-en">${logos.green.en}</template>
<template id="L-green-st">${logos.green.st}</template>
<template id="L-green-icon">${logos.green.icon}</template>

<script>
(function(){
  var COLORS={
    green:[
      ['أخضر الأرز','#17583A','الأساسي: اللوجو، العناوين، الأزرار الرئيسية','#fff'],
      ['أزرق المياه','#1B8CC4','المياه، الأيقونات، العناوين الكبيرة','#fff'],
      ['أزرق غامق للنصوص','#136E9C','لينكات وأزرار صغيرة على الأبيض','#fff'],
      ['أخضر ليلي','#0F2A1F','الخلفيات الغامقة والفوتر','#fff'],
      ['رملي العروض','#E0A93B','العروض والخصومات بس','#14211B'],
      ['ضباب','#F2F6F3','خلفيات الأقسام الفاتحة','#14211B'],
      ['حبر','#14211B','النصوص','#fff']
    ],
    navy:[
      ['كحلي الخليج','#0C3A52','الأساسي: اللوجو، العناوين، الأزرار الرئيسية','#fff'],
      ['أزرق المياه','#27A6D9','المياه، الأيقونات، العناوين الكبيرة','#0C3A52'],
      ['أزرق غامق للنصوص','#136E9C','لينكات وأزرار صغيرة على الأبيض','#fff'],
      ['كحلي ليلي','#0A2433','الخلفيات الغامقة والفوتر','#fff'],
      ['رملي العروض','#E0A93B','العروض والخصومات بس','#14211B'],
      ['ضباب','#F1F5F7','خلفيات الأقسام الفاتحة','#14211B'],
      ['حبر','#132029','النصوص','#fff']
    ]
  };
  function renderColors(p){
    document.getElementById('colors').innerHTML=COLORS[p].map(function(c){
      return '<div class="color"><div class="chip" style="background:'+c[1]+';color:'+c[3]+'">Aa عربي</div><div class="meta"><b>'+c[0]+'</b><code>'+c[1]+'</code><span class="muted">'+c[2]+'</span></div></div>';
    }).join('');
  }
  function swap(p){
    [['ar','ar'],['en','en'],['st','st'],['icon','icon'],['icon2','icon'],['sticker','icon']].forEach(function(pair){
      var slot=document.querySelector('[data-slot="'+pair[0]+'"]'); if(!slot) return;
      var tpl=document.getElementById('L-'+p+'-'+pair[1]);
      var old=slot.querySelector('svg'); var fresh=tpl.content.firstElementChild.cloneNode(true);
      old.replaceWith(fresh);
    });
    renderColors(p);
  }
  document.querySelectorAll('[data-pal]').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('[data-pal]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
      swap(b.getAttribute('data-pal'));
    });
  });
  renderColors('green');
})();
</script>
`;

await fs.writeFile(path.join(BRAND, 'guidelines.html'), html);
console.log('brand/guidelines.html written (' + Math.round(html.length / 1024) + ' KB)');
