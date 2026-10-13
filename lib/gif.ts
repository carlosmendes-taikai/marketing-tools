// A small animated GIF encoder, written for the GIF animator so nothing needs installing.
// Frames come in as RGBA pixels; out comes a looping GIF. One shared 256-color palette
// (picked with median cut from all frames) keeps colors steady from frame to frame.

export type Frame = { data: Uint8ClampedArray; delayMs: number };

type Box = { pixels: Uint32Array; min: number[]; max: number[] };

const r8 = (c: number) => (c >> 16) & 255;
const g8 = (c: number) => (c >> 8) & 255;
const b8 = (c: number) => c & 255;

/** Picks up to `max` colors that best represent the sampled pixels (median cut). */
function medianCut(colors: Uint32Array, max: number): number[] {
  const boxOf = (pixels: Uint32Array): Box => {
    const min = [255, 255, 255];
    const mx = [0, 0, 0];
    for (const c of pixels) {
      const v = [r8(c), g8(c), b8(c)];
      for (let k = 0; k < 3; k++) {
        if (v[k] < min[k]) min[k] = v[k];
        if (v[k] > mx[k]) mx[k] = v[k];
      }
    }
    return { pixels, min, max: mx };
  };
  const boxes: Box[] = [boxOf(colors)];
  while (boxes.length < max) {
    // split the box with the widest color range
    let pick = -1;
    let widest = 0;
    boxes.forEach((b, i) => {
      if (b.pixels.length < 2) return;
      const range = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
      if (range > widest) {
        widest = range;
        pick = i;
      }
    });
    if (pick < 0) break;
    const box = boxes[pick];
    const ranges = [box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]];
    const ch = ranges.indexOf(Math.max(...ranges));
    const get = ch === 0 ? r8 : ch === 1 ? g8 : b8;
    const sorted = Uint32Array.from(box.pixels).sort((a, b) => get(a) - get(b));
    const mid = sorted.length >> 1;
    boxes.splice(pick, 1, boxOf(sorted.subarray(0, mid)), boxOf(sorted.subarray(mid)));
  }
  return boxes.map((b) => {
    let r = 0,
      g = 0,
      bl = 0;
    for (const c of b.pixels) {
      r += r8(c);
      g += g8(c);
      bl += b8(c);
    }
    const n = b.pixels.length || 1;
    return (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(bl / n);
  });
}

/** LZW compression as GIF expects it, packed into 255-byte sub-blocks. */
function lzw(indices: Uint8Array, minCodeSize: number, out: number[]) {
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  let codeSize = minCodeSize + 1;
  let next = end + 1;
  let dict = new Map<number, number>();
  let bitBuf = 0;
  let bitLen = 0;
  const bytes: number[] = [];
  const emit = (code: number) => {
    bitBuf |= code << bitLen;
    bitLen += codeSize;
    while (bitLen >= 8) {
      bytes.push(bitBuf & 255);
      bitBuf >>>= 8;
      bitLen -= 8;
    }
  };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) {
      prefix = hit;
      continue;
    }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << codeSize && codeSize < 12) codeSize++;
    } else {
      emit(clear);
      dict = new Map();
      codeSize = minCodeSize + 1;
      next = end + 1;
    }
    prefix = k;
  }
  emit(prefix);
  emit(end);
  if (bitLen > 0) bytes.push(bitBuf & 255);
  out.push(minCodeSize);
  for (let i = 0; i < bytes.length; i += 255) {
    const n = Math.min(255, bytes.length - i);
    out.push(n);
    for (let j = 0; j < n; j++) out.push(bytes[i + j]);
  }
  out.push(0);
}

/**
 * Encodes frames into a looping GIF.
 * Pixels under half opacity become transparent when `transparent` is on; the rest are shown solid.
 * `onProgress` gets 0..1, and the encoder yields to the browser between frames so the page stays responsive.
 */
export async function encodeGif(frames: Frame[], width: number, height: number, opts: { transparent: boolean; onProgress?: (p: number) => void }): Promise<Blob> {
  // 1. sample colors from every frame for the palette
  const sample: number[] = [];
  const step = Math.max(1, Math.floor((frames.length * width * height) / 60000));
  frames.forEach((f) => {
    for (let p = 0; p < width * height; p += step) {
      const o = p * 4;
      if (opts.transparent && f.data[o + 3] < 128) continue;
      sample.push((f.data[o] << 16) | (f.data[o + 1] << 8) | f.data[o + 2]);
    }
  });
  if (!sample.length) sample.push(0xffffff);
  const palette = medianCut(Uint32Array.from(sample), opts.transparent ? 255 : 256);
  const transparentIndex = opts.transparent ? palette.length : -1;
  if (opts.transparent) palette.push(0);
  while (palette.length < 256) palette.push(0);

  // nearest palette color, cached on 15-bit color
  const cache = new Int16Array(32768).fill(-1);
  const nearest = (r: number, g: number, b: number) => {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const hit = cache[key];
    if (hit >= 0) return hit;
    let best = 0;
    let dist = Infinity;
    const used = opts.transparent ? transparentIndex : 256;
    for (let i = 0; i < used; i++) {
      const c = palette[i];
      const dr = r - r8(c),
        dg = g - g8(c),
        db = b - b8(c);
      const d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
      if (d < dist) {
        dist = d;
        best = i;
      }
    }
    cache[key] = best;
    return best;
  };

  // 2. header, screen, palette, loop forever
  const out: number[] = [];
  const word = (n: number) => out.push(n & 255, (n >> 8) & 255);
  for (const ch of "GIF89a") out.push(ch.charCodeAt(0));
  word(width);
  word(height);
  out.push(0xf7, 0, 0); // global palette, 8 bits, 256 colors
  for (const c of palette) out.push(r8(c), g8(c), b8(c));
  out.push(0x21, 0xff, 11, ..."NETSCAPE2.0".split("").map((c) => c.charCodeAt(0)), 3, 1, 0, 0, 0);

  // 3. frames
  const indices = new Uint8Array(width * height);
  for (let f = 0; f < frames.length; f++) {
    const { data, delayMs } = frames[f];
    for (let p = 0; p < indices.length; p++) {
      const o = p * 4;
      indices[p] = opts.transparent && data[o + 3] < 128 ? transparentIndex : nearest(data[o], data[o + 1], data[o + 2]);
    }
    // graphics control: disposal "restore to background" so transparent frames don't smear
    const packed = opts.transparent ? (2 << 2) | 1 : 1 << 2;
    out.push(0x21, 0xf9, 4, packed);
    word(Math.max(2, Math.round(delayMs / 10)));
    out.push(opts.transparent ? transparentIndex : 0, 0);
    out.push(0x2c);
    word(0);
    word(0);
    word(width);
    word(height);
    out.push(0);
    lzw(indices, 8, out);
    opts.onProgress?.((f + 1) / frames.length);
    if (f % 3 === 2) await new Promise((r) => setTimeout(r, 0));
  }
  out.push(0x3b);
  return new Blob([new Uint8Array(out)], { type: "image/gif" });
}
