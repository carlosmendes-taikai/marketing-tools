// The GIF animator's effects. Each one draws a single moment of the animation onto a canvas,
// so the same code runs the live preview and renders the frames for the GIF.
// Kept subtle on purpose: logos and banners that move a little, not stickers.

export type AnimationId = "shine" | "float" | "pulse" | "fade" | "wipe" | "zoom" | "drop";

export type Animation = {
  id: AnimationId;
  name: string;
  hint: string;
  /** Loops seamlessly on its own. Otherwise it plays in, holds, then fades out before repeating. */
  continuous: boolean;
};

export const ANIMATIONS: Animation[] = [
  { id: "shine", name: "Shine", hint: "A light sweeps across", continuous: false },
  { id: "float", name: "Float", hint: "Bobs gently up and down", continuous: true },
  { id: "pulse", name: "Pulse", hint: "Breathes in and out", continuous: true },
  { id: "fade", name: "Fade in", hint: "Rises softly into view", continuous: false },
  { id: "wipe", name: "Wipe", hint: "Revealed from left to right", continuous: false },
  { id: "zoom", name: "Slow zoom", hint: "Drifts closer, then back", continuous: true },
  { id: "drop", name: "Drop in", hint: "Lands with a small bounce", continuous: false },
];

export type Scene = {
  img: CanvasImageSource;
  imgW: number;
  imgH: number;
  width: number;
  height: number;
  padding: number; // 0..0.3 of the shorter side
  background: string | null; // null = transparent
  animation: AnimationId;
  duration: number; // seconds of movement
  hold: number; // seconds of stillness before repeating (non-continuous effects)
};

export const cycleSeconds = (s: Pick<Scene, "animation" | "duration" | "hold">) =>
  ANIMATIONS.find((a) => a.id === s.animation)!.continuous ? s.duration : s.duration + s.hold;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function bounceOut(t: number) {
  const n = 7.5625,
    d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

let scratch: HTMLCanvasElement | null = null;

/** Draws the scene at `time` seconds (any value; it wraps around the cycle). */
export function drawFrame(ctx: CanvasRenderingContext2D, s: Scene, time: number) {
  const { width: W, height: H } = s;
  const cycle = cycleSeconds(s);
  const t = ((time % cycle) + cycle) % cycle;
  const p = clamp(t / s.duration); // progress of the movement
  const loop = t / cycle; // 0..1 around the whole loop

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, W, H);
  if (s.background) {
    ctx.fillStyle = s.background;
    ctx.fillRect(0, 0, W, H);
  }

  // fit the image inside the padded box
  const pad = Math.min(W, H) * s.padding;
  const scale = Math.min((W - pad * 2) / s.imgW, (H - pad * 2) / s.imgH);
  const w = s.imgW * scale;
  const h = s.imgH * scale;
  const x = (W - w) / 2;
  const y = (H - h) / 2;

  // non-continuous effects fade out over the last part of the hold, so the loop restarts cleanly
  const outro = s.hold > 0 ? clamp((t - (cycle - Math.min(0.4, s.hold))) / Math.min(0.4, s.hold)) : 0;

  let alpha = 1;
  let dy = 0;
  let zoom = 1;
  let reveal = 1;

  switch (s.animation) {
    case "float":
      dy = Math.sin(loop * Math.PI * 2) * H * 0.035;
      break;
    case "pulse":
      zoom = 1 + 0.045 * Math.sin(loop * Math.PI * 2);
      break;
    case "zoom":
      zoom = 1 + 0.1 * (1 - Math.cos(loop * Math.PI * 2)) / 2;
      break;
    case "fade":
      alpha = easeOut(p) * (1 - outro);
      dy = (1 - easeOut(p)) * H * 0.06;
      break;
    case "wipe":
      reveal = easeInOut(p);
      alpha = 1 - outro;
      break;
    case "drop":
      dy = -(1 - bounceOut(p)) * H * 0.35;
      alpha = clamp(p * 4) * (1 - outro);
      break;
    case "shine":
      break;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H / 2 + dy);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -H / 2);
  if (reveal < 1) {
    ctx.beginPath();
    ctx.rect(x - 1, 0, (w + 2) * reveal, H);
    ctx.clip();
  }

  if (s.animation === "shine" && p > 0 && p < 1) {
    // draw the image, then a light band on top of it only (not on the transparent parts)
    scratch ??= document.createElement("canvas");
    if (scratch.width !== W || scratch.height !== H) {
      scratch.width = W;
      scratch.height = H;
    }
    const sc = scratch.getContext("2d")!;
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.globalCompositeOperation = "source-over";
    sc.clearRect(0, 0, W, H);
    sc.drawImage(s.img, x, y, w, h);
    sc.globalCompositeOperation = "source-atop";
    const band = Math.max(w, h) * 0.35;
    const cx = x - band + (w + band * 2) * easeInOut(p);
    const g = sc.createLinearGradient(cx - band, y, cx + band, y + h * 0.4);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    sc.fillStyle = g;
    sc.fillRect(0, 0, W, H);
    ctx.drawImage(scratch, 0, 0);
  } else {
    ctx.drawImage(s.img, x, y, w, h);
  }
  ctx.restore();
}

// 4x4 ordered dither, so soft edges and fades survive GIF's on/off transparency as a fine dissolve
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) * 16);

/** For transparent GIFs: every pixel becomes fully on or off; kept edge pixels are blended onto `matte`. */
export function flattenAlpha(data: Uint8ClampedArray, width: number, matte: [number, number, number]) {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 255) continue;
    const px = (i >> 2) % width;
    const py = Math.floor((i >> 2) / width);
    if (a <= BAYER[(py & 3) * 4 + (px & 3)]) {
      data[i + 3] = 0;
      continue;
    }
    const k = a / 255;
    data[i] = data[i] * k + matte[0] * (1 - k);
    data[i + 1] = data[i + 1] * k + matte[1] * (1 - k);
    data[i + 2] = data[i + 2] * k + matte[2] * (1 - k);
    data[i + 3] = 255;
  }
}
