// Builds the Shalal Beirut logo files (SVG with outlined text + PNG exports).
// Usage: node build-logo.mjs
import { Blob, Face, Font, Buffer, shape } from 'harfbuzzjs';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAND = path.resolve(HERE, '..');
const FONT_DIR = path.join(BRAND, 'fonts');
const OUT = path.join(BRAND, 'logo');

// ---------- Palettes ----------
const PALETTES = {
  green: { pipe: '#17583A', water: '#1B8CC4', name: '#17583A', sub: '#2E4A3C', en: '#1B8CC4', dark: '#0F2A1F' },
  navy:  { pipe: '#0C3A52', water: '#27A6D9', name: '#0C3A52', sub: '#2B4655', en: '#27A6D9', dark: '#0A2433' },
};
const REVERSE = { pipe: '#FFFFFF', water: '#62C0EA', name: '#FFFFFF', sub: '#D5E6DC', en: '#9CD6F2' };
const MONO = (c) => ({ pipe: c, water: c, name: c, sub: c, en: c });

// ---------- Fonts (static TTF instances from Google Fonts) ----------
const FONTS = {
  display: { family: 'Reem Kufi', weight: 700 },
  body: { family: 'IBM Plex Sans Arabic', weight: 500 },
  latin: { family: 'Readex Pro', weight: 600 },
};

async function loadFont({ family, weight }) {
  await fs.mkdir(FONT_DIR, { recursive: true });
  const file = path.join(FONT_DIR, `${family.replace(/ /g, '')}-${weight}.ttf`);
  try { await fs.access(file); } catch {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}`)).text();
    const urls = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
    if (!urls.length) throw new Error(`No TTF for ${family}`);
    // The Arabic-capable file is the last one Google lists for families with subsets; take the largest.
    let best = null;
    for (const u of urls) {
      const buf = Buffer_from(await (await fetch(u)).arrayBuffer());
      if (!best || buf.length > best.length) best = buf;
    }
    await fs.writeFile(file, best);
  }
  const data = await fs.readFile(file);
  const face = new Face(new Blob(new Uint8Array(data)), 0);
  return { font: new Font(face), upem: face.upem };
}
function Buffer_from(ab) { return globalThis.Buffer.from(ab); }

// Shape text and return { d, width, ascent } in px, origin at baseline-left.
function textPath(f, text, size, tracking = 0) {
  const buf = new Buffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  shape(f.font, buf);
  const glyphs = buf.getGlyphInfosAndPositions();
  const s = size / f.upem;
  let x = 0, parts = [];
  for (const g of glyphs) {
    const p = f.font.glyphToPath(g.codepoint);
    if (p) parts.push(`<path transform="translate(${((x + (g.xOffset || 0)) * s).toFixed(2)} ${(-(g.yOffset || 0) * s).toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})" d="${p}"/>`);
    x += g.xAdvance + tracking * f.upem;
  }
  const width = (x - tracking * f.upem) * s;
  return { svg: parts.join(''), width };
}

// ---------- The mark (C2: pipe cedar), 120x120 ----------
function mark(c) {
  return `
  <path d="M60 4C60 4 54 11 54 14.5A6 6 0 0 0 66 14.5C66 11 60 4 60 4Z" fill="${c.water}"/>
  <g fill="none" stroke="${c.pipe}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M60 25V92"/>
    <path d="M49 38V36Q49 30 55 30H65Q71 30 71 36V38"/>
    <path d="M40 53V50Q40 44 46 44H74Q80 44 80 50V53"/>
    <path d="M31 68V64Q31 58 37 58H83Q89 58 89 64V68"/>
    <path d="M22 83V78Q22 72 28 72H92Q98 72 98 78V83"/>
  </g>
  <path d="M14 104q11.5-7 23 0t23 0t23 0t23 0" fill="none" stroke="${c.water}" stroke-width="6" stroke-linecap="round"/>`;
}
const MARK_BOX = { x: 10, y: 1, w: 100, h: 110 }; // visual bounds of the mark inside its 120 box

const svgDoc = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" width="${Math.round(w)}" height="${Math.round(h)}">` +
  (bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : '') + body + `</svg>\n`;

// ---------- Layouts ----------
function iconOnly(c, pad = 6) {
  const { x, y, w, h } = MARK_BOX;
  const W = w + pad * 2, H = h + pad * 2;
  return svgDoc(W, H, `<g transform="translate(${pad - x} ${pad - y})">${mark(c)}</g>`);
}

function horizontalAr(F, c) {
  const name = textPath(F.display, 'شلال بيروت', 76);
  const sub = textPath(F.body, 'للأدوات الصحية وصيانتها', 29);
  const en = textPath(F.latin, 'SHALAL BEIRUT', 20, 0.28);
  const markH = 164, sc = markH / MARK_BOX.h, markW = MARK_BOX.w * sc;
  const gap = 28, pad = 12;
  const textW = Math.max(name.width, sub.width, en.width);
  const W = pad * 2 + textW + gap + markW, H = pad * 2 + markH;
  const right = pad + textW; // text is right-aligned to this x (RTL)
  const body =
    `<g transform="translate(${W - pad - markW} ${pad}) scale(${sc}) translate(${-MARK_BOX.x} ${-MARK_BOX.y})">${mark(c)}</g>` +
    `<g fill="${c.name}" transform="translate(${right - name.width} ${pad + 76})">${name.svg}</g>` +
    `<g fill="${c.sub}" transform="translate(${right - sub.width} ${pad + 130})">${sub.svg}</g>` +
    `<g fill="${c.en}" transform="translate(${right - en.width} ${pad + 162})">${en.svg}</g>`;
  return svgDoc(W, H, body);
}

function horizontalEn(F, c) {
  const name = textPath(F.latin, 'SHALAL BEIRUT', 54, 0.06);
  const sub = textPath(F.body, 'Sanitary Ware & Maintenance', 25);
  const ar = textPath(F.display, 'شلال بيروت', 30);
  const markH = 130, sc = markH / MARK_BOX.h, markW = MARK_BOX.w * sc;
  const gap = 24, pad = 12;
  const textW = Math.max(name.width, sub.width, ar.width);
  const W = pad * 2 + markW + gap + textW, H = pad * 2 + markH;
  const left = pad + markW + gap;
  const body =
    `<g transform="translate(${pad} ${pad}) scale(${sc}) translate(${-MARK_BOX.x} ${-MARK_BOX.y})">${mark(c)}</g>` +
    `<g fill="${c.name}" transform="translate(${left} ${pad + 52})">${name.svg}</g>` +
    `<g fill="${c.sub}" transform="translate(${left} ${pad + 88})">${sub.svg}</g>` +
    `<g fill="${c.en}" transform="translate(${left} ${pad + 126})">${ar.svg}</g>`;
  return svgDoc(W, H, body);
}

function stacked(F, c) {
  const name = textPath(F.display, 'شلال بيروت', 80);
  const sub = textPath(F.body, 'للأدوات الصحية وصيانتها', 30);
  const en = textPath(F.latin, 'SHALAL BEIRUT', 20, 0.3);
  const markH = 190, sc = markH / MARK_BOX.h, markW = MARK_BOX.w * sc;
  const pad = 14;
  const W = pad * 2 + Math.max(name.width, sub.width, en.width, markW);
  const cx = W / 2;
  const H = pad + markH + 118 + 44 + 34 + pad;
  const top = pad + markH;
  const body =
    `<g transform="translate(${cx - markW / 2} ${pad}) scale(${sc}) translate(${-MARK_BOX.x} ${-MARK_BOX.y})">${mark(c)}</g>` +
    `<g fill="${c.name}" transform="translate(${cx - name.width / 2} ${top + 100})">${name.svg}</g>` +
    `<g fill="${c.sub}" transform="translate(${cx - sub.width / 2} ${top + 150})">${sub.svg}</g>` +
    `<g fill="${c.en}" transform="translate(${cx - en.width / 2} ${top + 188})">${en.svg}</g>`;
  return svgDoc(W, H, body);
}

// Square social profile image: mark centered on a solid brand background.
function profile(bg, c) {
  const S = 1080, markH = 600, sc = markH / MARK_BOX.h, markW = MARK_BOX.w * sc;
  return svgDoc(S, S, `<g transform="translate(${(S - markW) / 2} ${(S - markH) / 2}) scale(${sc}) translate(${-MARK_BOX.x} ${-MARK_BOX.y})">${mark(c)}</g>`, bg);
}

// ---------- Build ----------
const F = {
  display: await loadFont(FONTS.display),
  body: await loadFont(FONTS.body),
  latin: await loadFont(FONTS.latin),
};

const files = [];
async function emit(rel, svg, pngWidths = []) {
  const file = path.join(OUT, rel + '.svg');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, svg);
  files.push(rel + '.svg');
  for (const w of pngWidths) {
    const name = `${rel.replace('/', '-')}-${w}.png`;
    const png = path.join(OUT, 'png', name);
    await fs.mkdir(path.dirname(png), { recursive: true });
    await sharp(globalThis.Buffer.from(svg), { density: 300 }).resize({ width: w }).png().toFile(png);
    files.push(`png/${name}`);
  }
}

for (const [pal, c] of Object.entries(PALETTES)) {
  const dir = pal;
  await emit(`${dir}/icon-color`, iconOnly(c), [512, 1024]);
  await emit(`${dir}/horizontal-ar-color`, horizontalAr(F, c), [1600]);
  await emit(`${dir}/horizontal-en-color`, horizontalEn(F, c), [1600]);
  await emit(`${dir}/stacked-color`, stacked(F, c), [1200]);
  await emit(`${dir}/profile-dark`, profile(c.dark, { ...REVERSE }), [1080]);
  await emit(`${dir}/profile-light`, profile('#FFFFFF', c), [1080]);
}
// Palette-independent variants
for (const [suffix, c] of [['reverse', REVERSE], ['black', MONO('#111111')], ['white', MONO('#FFFFFF')]]) {
  await emit(`common/icon-${suffix}`, iconOnly(c), suffix === 'black' ? [512] : []);
  await emit(`common/horizontal-ar-${suffix}`, horizontalAr(F, c));
  await emit(`common/horizontal-en-${suffix}`, horizontalEn(F, c));
  await emit(`common/stacked-${suffix}`, stacked(F, c));
}

console.log(files.length + ' files written to ' + OUT);
