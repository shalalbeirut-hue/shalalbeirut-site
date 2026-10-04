// Web assets from the tap + cedar badge (brand/logo-v2/original-large.jpg):
// the light backdrop is made transparent, then favicons, the site/app logo, app icons and share images are written.
// Usage: node brand/tools/build-logo-v2-assets.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BRAND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.resolve(BRAND, '..', 'public');
const V2 = path.join(BRAND, 'logo-v2');
const DEEP = '#0F2A1F';
const MIST = '#F2F6F3';

// 1. Transparent master: flood-fill the pale backdrop from the edges, soften the cut edge by one pixel.
const { data, info } = await sharp(path.join(V2, 'original-large.jpg')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const rgb = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
const pale = (i, min, spread) => { const [r, g, b] = rgb(i); return Math.min(r, g, b) > min && Math.max(r, g, b) - Math.min(r, g, b) < spread; };
const bg = new Uint8Array(W * H), stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || !pale(i, 212, 24)) continue;
  bg[i] = 1;
  const x = i % W;
  if (x > 0) stack.push(i - 1);
  if (x < W - 1) stack.push(i + 1);
  if (i >= W) stack.push(i - W);
  if (i < W * (H - 1)) stack.push(i + W);
}
for (let i = 0; i < W * H; i++) {
  if (bg[i]) { data[i * 4 + 3] = 0; continue; }
  const x = i % W;
  const edge = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (i >= W && bg[i - W]) || (i < W * (H - 1) && bg[i + W]);
  if (edge && pale(i, 180, 60)) data[i * 4 + 3] = 110;
}
const master = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
await fs.writeFile(path.join(V2, 'logo-transparent.png'), master);

const square = (size, background = '#0000', pad = 0) =>
  sharp(master).resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: '#0000' })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#0000' })
    .flatten(background === '#0000' ? false : { background });
const flat = (img, background) => (background ? img.flatten({ background }) : img);

// 2. Site and app logo (shown at 40–60 px, so 256 covers 3x screens), favicons, app icons.
await sharp(master).resize(256, 256, { fit: 'contain', background: '#0000' }).webp({ quality: 90, alphaQuality: 90 }).toFile(path.join(PUBLIC, 'logo.webp'));
await sharp(master).resize(256, 256, { fit: 'contain', background: '#0000' }).png().toFile(path.join(PUBLIC, 'logo.png'));
for (const s of [32, 48]) await sharp(master).resize(s, s, { fit: 'contain', background: '#0000' }).png().toFile(path.join(PUBLIC, `favicon-${s}.png`));
await flat(sharp(master).resize(472, 472, { fit: 'contain', background: '#0000' }).extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#0000' }), '#FFFFFF').png().toFile(path.join(PUBLIC, 'logo-512.png'));
await flat(sharp(master).resize(160, 160, { fit: 'contain', background: '#0000' }).extend({ top: 10, bottom: 10, left: 10, right: 10, background: '#0000' }), '#FFFFFF').png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
// Social profile pictures (Instagram/WhatsApp/Google crop to a circle).
await flat(sharp(master).resize(940, 940, { fit: 'contain', background: '#0000' }).extend({ top: 70, bottom: 70, left: 70, right: 70, background: '#0000' }), '#FFFFFF').png().toFile(path.join(V2, 'profile-1080.png'));

// 3. Share images 1200x630: the badge next to the existing Arabic/English wordmark.
const wordmark = async (file, crop) => {
  const svg = await fs.readFile(path.join(BRAND, 'logo', file));
  const scale = 2.4;
  const png = await sharp(svg, { density: 72 * scale }).png().toBuffer();
  const m = await sharp(png).metadata();
  const k = m.width / +String(svg).match(/ width="([\d.]+)"/)[1];
  return sharp(png).extract({ left: Math.round(crop.left * k), top: 0, width: Math.min(Math.round(crop.width * k), m.width - Math.round(crop.left * k)), height: m.height }).png().toBuffer().then((b) => sharp(b).trim({ threshold: 1 }).png().toBuffer());
};
const words = {
  ar: await wordmark('green/horizontal-ar-color.svg', { left: 0, width: 426 }),
  en: await wordmark('green/horizontal-en-color.svg', { left: 180, width: 469 }),
};
const badge = await sharp(master).resize(400, 400, { fit: 'contain', background: '#0000' }).png().toBuffer();
for (const lang of ['ar', 'en']) {
  const text = await sharp(words[lang]).resize({ width: 640, height: 260, fit: 'inside' }).png().toBuffer();
  const tm = await sharp(text).metadata();
  const total = 400 + 48 + tm.width, x0 = Math.round((1200 - total) / 2), y = 105;
  const [badgeX, textX] = lang === 'ar' ? [x0 + tm.width + 48, x0] : [x0, x0 + 448];
  const base = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${MIST}"/><rect y="566" width="1200" height="64" fill="${DEEP}"/><path d="M0 566 C200 540 400 548 600 560 S1000 582 1200 548 V566Z" fill="#1B8CC4"/></svg>`);
  await sharp(base).composite([
    { input: badge, left: badgeX, top: y },
    { input: text, left: textX, top: y + Math.round((400 - tm.height) / 2) },
  ]).png().toFile(path.join(PUBLIC, `og-${lang}.png`));
}
console.log('logo-v2 web assets written');
