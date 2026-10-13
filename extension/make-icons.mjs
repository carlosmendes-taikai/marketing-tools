// Draws the toolbar and store icons from the logo mark. Run from site/: node extension/make-icons.mjs
import sharp from "sharp";

function svg(size) {
  // store icon: 96px artwork in a 128 canvas with transparent padding; toolbar sizes use the full canvas
  const pad = size === 128 ? 16 : 0;
  const s = size - pad * 2;
  const inset = s * 0.2, gap = s * 0.07, t = (s - inset * 2 - gap) / 2;
  const colors = ["#141413", "#6c70e0", "#141413", "#141413"];
  const squares = colors
    .map((c, i) => `<rect x="${pad + inset + (i % 2) * (t + gap)}" y="${pad + inset + Math.floor(i / 2) * (t + gap)}" width="${t}" height="${t}" rx="${t * 0.29}" fill="${c}"/>`)
    .join("");
  const stroke = Math.max(1, size / 64);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect x="${pad + stroke / 2}" y="${pad + stroke / 2}" width="${s - stroke}" height="${s - stroke}" rx="${s * 0.24}" fill="#f4f3ef" stroke="rgba(20,20,19,0.12)" stroke-width="${stroke}"/>
    ${squares}
  </svg>`;
}

for (const size of [16, 32, 48, 128]) {
  await sharp(Buffer.from(svg(size))).png().toFile(new URL(`./icons/${size}.png`, import.meta.url).pathname);
}
console.log("icons written");
