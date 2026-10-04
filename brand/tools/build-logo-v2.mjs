// Vector redraw of the tap + cedar + water badge (draft v2). Writes SVG and PNG previews.
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const OUT = new URL('../logo-v2/', import.meta.url);
const f = (n) => Math.round(n * 10) / 10;

// One cedar tier: flat plate with a soft scalloped underside (Lebanese cedar, not a pine cone shape).
function tier(cx, y, w, h) {
  return `M${f(cx - w)} ${f(y)} Q${f(cx - w * 0.55)} ${f(y - h)} ${f(cx)} ${f(y - h * 1.1)} Q${f(cx + w * 0.55)} ${f(y - h)} ${f(cx + w)} ${f(y)}`
    + ` Q${f(cx + w * 0.75)} ${f(y + h * 0.38)} ${f(cx + w * 0.45)} ${f(y + h * 0.18)} Q${f(cx + w * 0.22)} ${f(y + h * 0.42)} ${f(cx)} ${f(y + h * 0.2)}`
    + ` Q${f(cx - w * 0.22)} ${f(y + h * 0.42)} ${f(cx - w * 0.45)} ${f(y + h * 0.18)} Q${f(cx - w * 0.75)} ${f(y + h * 0.38)} ${f(cx - w)} ${f(y)} Z`;
}
const CX = 310;
const TIERS = [[352, 150, 30], [302, 128, 30], [254, 104, 28], [210, 80, 26], [170, 56, 24], [136, 30, 24]];
const tiers = TIERS.map(([y, w, h]) => `<path d="${tier(CX, y, w, h)}" fill="url(#leaf)"/>`
  + `<path d="${tier(CX - w * 0.08, y - h * 0.32, w * 0.72, h * 0.55)}" fill="#7CC243" opacity=".55"/>`).join('');

function svg({ ring = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
  <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F4F7FA"/><stop offset=".35" stop-color="#AEB8C2"/><stop offset=".55" stop-color="#5E6B78"/><stop offset=".8" stop-color="#C9D1D9"/><stop offset="1" stop-color="#7D8996"/>
  </linearGradient>
  <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E9EEF2"/><stop offset=".45" stop-color="#8E99A5"/><stop offset=".7" stop-color="#4E5A66"/><stop offset="1" stop-color="#B9C2CB"/>
  </linearGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E9B3A"/><stop offset="1" stop-color="#1F6B2C"/></linearGradient>
  <linearGradient id="bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A3A22"/><stop offset=".5" stop-color="#8A5A34"/><stop offset="1" stop-color="#4A2E1B"/></linearGradient>
  <linearGradient id="stream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE6FA"/><stop offset=".5" stop-color="#4FB3EA"/><stop offset="1" stop-color="#1D6FC4"/></linearGradient>
  <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1D6FC4"/><stop offset=".6" stop-color="#2E8FDB"/><stop offset="1" stop-color="#0E4E9A"/></linearGradient>
  <linearGradient id="wave2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8FD3F5"/><stop offset="1" stop-color="#3FA6E6"/></linearGradient>
</defs>
${ring ? '<circle cx="262" cy="250" r="214" fill="none" stroke="url(#ringG)" stroke-width="16"/>' : ''}
<path d="M296 440 C301 380 300 330 303 290 L317 290 C320 330 319 380 326 440 Z" fill="url(#bark)"/>
${tiers}
<path d="M178 276 C177 332 170 384 156 446 L228 446 C214 384 206 332 204 276 Z" fill="url(#stream)"/>
<path d="M186 286 C185 330 180 374 170 424 M196 286 C197 328 200 368 210 420" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" fill="none"/>
<path d="M56 372 C140 446 292 446 404 376 C432 358 456 342 472 316 A232 232 0 0 1 56 372 Z" fill="url(#wave)"/>
<path d="M92 398 C176 450 306 446 418 370 C398 418 330 456 250 460 C182 462 126 436 92 398 Z" fill="url(#wave2)"/>
<path d="M404 376 C424 350 456 348 458 372 C460 392 436 400 424 386" fill="none" stroke="#DFF3FD" stroke-width="8" stroke-linecap="round"/>
<path d="M120 424 C190 452 290 450 370 412" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
<g fill="#4FB3EA"><circle cx="138" cy="392" r="9"/><circle cx="118" cy="366" r="6"/><circle cx="246" cy="400" r="8"/><circle cx="258" cy="376" r="5"/><circle cx="150" cy="366" r="4"/></g>
<rect x="28" y="182" width="26" height="58" rx="7" fill="url(#chrome)"/>
<path d="M48 194 H150 Q210 194 210 246 V266 H172 V250 Q172 230 150 230 H48 Z" fill="url(#chrome)"/>
<rect x="168" y="262" width="46" height="14" rx="5" fill="url(#chrome)"/>
<rect x="128" y="160" width="22" height="38" rx="4" fill="url(#chrome)"/>
<rect x="92" y="146" width="94" height="20" rx="10" fill="url(#chrome)"/>
<circle cx="139" cy="156" r="9" fill="#E9EEF2" stroke="#7D8996" stroke-width="2"/>
<path d="M58 202 H150 Q196 202 202 240" stroke="#fff" stroke-opacity=".8" stroke-width="5" stroke-linecap="round" fill="none"/>
</svg>`;
}

const full = svg();
writeFileSync(new URL('badge.svg', OUT), full);
writeFileSync(new URL('badge-noring.svg', OUT), svg({ ring: false }));
for (const [size, bg] of [[1024, null], [1080, '#FFFFFF'], [64, '#FFFFFF']]) {
  let img = sharp(Buffer.from(full), { density: 72 * size / 512 }).resize(size, size);
  if (bg) img = img.flatten({ background: bg });
  await img.png().toFile(new URL(`badge-${size}${bg ? '-white' : ''}.png`, OUT).pathname.replace(/^\/(\w:)/, '$1'));
}
console.log('done');
