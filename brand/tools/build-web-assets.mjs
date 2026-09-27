// Writes favicons, app icons and social share images into public/.
// Usage: node build-logo.mjs && node build-web-assets.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BRAND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.resolve(BRAND, '..', 'public');
const read = (rel) => fs.readFile(path.join(BRAND, 'logo', rel + '.svg'));
const DEEP = '#0F2A1F';
const MIST = '#F2F6F3';

await fs.mkdir(PUBLIC, { recursive: true });
const icon = await read('green/icon-color');
const iconRev = await read('common/icon-reverse');

await fs.writeFile(path.join(PUBLIC, 'favicon.svg'), icon);
await sharp(icon, { density: 400 }).resize(32, 32, { fit: 'contain', background: '#0000' }).png().toFile(path.join(PUBLIC, 'favicon-32.png'));
await sharp(icon, { density: 600 }).resize(512, 512, { fit: 'contain', background: '#FFFFFF' }).png().toFile(path.join(PUBLIC, 'logo-512.png'));

// Apple touch icon: reverse mark on the deep green, with padding.
const touchMark = await sharp(iconRev, { density: 600 }).resize(124, 124, { fit: 'contain', background: '#0000' }).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: DEEP } })
  .composite([{ input: touchMark, gravity: 'center' }]).png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));

// Share images 1200x630: horizontal logo on mist, with a deep green band.
for (const [lang, file] of [['ar', 'green/horizontal-ar-color'], ['en', 'green/horizontal-en-color']]) {
  const logo = await sharp(await read(file), { density: 400 }).resize({ width: 900, height: 330, fit: 'inside' }).png().toBuffer();
  const band = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${MIST}"/><rect y="566" width="1200" height="64" fill="${DEEP}"/><path d="M0 566 C200 540 400 548 600 560 S1000 582 1200 548 V566Z" fill="#1B8CC4"/></svg>`);
  await sharp(band).composite([{ input: logo, gravity: 'center', top: 120, left: Math.round((1200 - (await sharp(logo).metadata()).width) / 2) }])
    .png().toFile(path.join(PUBLIC, `og-${lang}.png`));
}

// robots.txt is maintained by hand in public/ (it also blocks the private app paths).
console.log('Web assets written to public/');
