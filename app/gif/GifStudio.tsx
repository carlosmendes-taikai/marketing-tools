"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ANIMATIONS, cycleSeconds, drawFrame, flattenAlpha, type AnimationId, type Scene } from "@/lib/animations";
import { encodeGif, type Frame } from "@/lib/gif";
import { ColorPicker } from "@/components/ColorPicker";
import ui from "@/components/tool.module.css";
import styles from "./gif.module.css";

type Source = { img: HTMLImageElement; url: string; name: string; w: number; h: number; own: boolean };
type Result = { url: string; bytes: number; name: string; key: string };

const FPS = 20;
const WIDTHS = [240, 400, 600, 800];
const SAMPLE = "/gif-sample.svg";

const kb = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export function GifStudio() {
  const [src, setSrc] = useState<Source | null>(null);
  const [animation, setAnimation] = useState<AnimationId>("shine");
  const [duration, setDuration] = useState(1.6);
  const [hold, setHold] = useState(1.4);
  const [width, setWidth] = useState(400);
  const [padding, setPadding] = useState(0.1);
  const [transparent, setTransparent] = useState(false);
  const [bg, setBg] = useState("#ffffff");
  const [matte, setMatte] = useState<"light" | "dark">("light");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [made, setMade] = useState<Result | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const anim = ANIMATIONS.find((a) => a.id === animation)!;
  // an export only counts while the settings still match it
  const key = JSON.stringify([src?.url, animation, duration, hold, width, padding, transparent, bg, matte]);
  const result = made && made.key === key ? made : null;
  const height = src ? Math.max(2, Math.round((width * src.h) / src.w)) : Math.round(width / 3);
  const scene = (img: CanvasImageSource, s: Source): Scene => ({
    img,
    imgW: s.w,
    imgH: s.h,
    width,
    height,
    padding,
    background: transparent ? null : bg,
    animation,
    duration,
    hold,
  });

  function openImage(url: string, name: string, own: boolean) {
    const img = new Image();
    img.onload = () => {
      // SVGs without a size report 0 or 150 wide; give them a sensible drawing size
      const w = img.naturalWidth || 600;
      const h = img.naturalHeight || 200;
      setSrc((old) => {
        if (old?.own) URL.revokeObjectURL(old.url);
        return { img, url, name, w, h, own };
      });
      setError("");
    };
    img.onerror = () => setError("Couldn't open that image. Try a PNG, JPG, SVG or WebP.");
    img.src = url;
  }

  function load(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That isn't an image. Try a PNG, JPG, SVG or WebP.");
    if (file.type === "image/gif") return setError("That's already a GIF. Use a still image (PNG, JPG, SVG or WebP).");
    const name = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
    openImage(URL.createObjectURL(file), name, true);
    // logos are usually PNG or SVG with a see-through background: keep it see-through
    setTransparent(file.type === "image/png" || file.type === "image/svg+xml");
  }

  // the browser extension can hand over an image address: ?img=...
  useEffect(() => {
    const img = new URLSearchParams(window.location.search).get("img");
    if (!img) return;
    fetch(img, { mode: "cors" })
      .then((res) => (res.ok ? res.blob() : Promise.reject()))
      .then((blob) => load(new File([blob], decodeURIComponent(new URL(img).pathname.split("/").pop() || "image"), { type: blob.type })))
      .catch(() => setError("That website doesn't let other sites open its images. Right-click the image, save it, then drop it here."));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  // live preview
  useEffect(() => {
    const c = canvas.current;
    if (!c || !src) return;
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d")!;
    const s = scene(src.img, src);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      drawFrame(ctx, s, (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scene() reads exactly these
  }, [src, animation, duration, hold, width, height, padding, transparent, bg]);

  async function exportGif() {
    if (!src) return;
    setProgress(0);
    await new Promise((r) => setTimeout(r, 30));
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const s = scene(src.img, src);
    const count = Math.min(160, Math.max(2, Math.round(cycleSeconds(s) * FPS)));
    const frames: Frame[] = [];
    for (let i = 0; i < count; i++) {
      drawFrame(ctx, s, i / FPS);
      const { data } = ctx.getImageData(0, 0, width, height);
      if (transparent) flattenAlpha(data, width, matte === "light" ? [255, 255, 255] : [20, 20, 19]);
      frames.push({ data, delayMs: 1000 / FPS });
      if (i % 10 === 9) {
        setProgress((0.3 * i) / count);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    const blob = await encodeGif(frames, width, height, { transparent, onProgress: (p) => setProgress(0.3 + 0.7 * p) });
    if (made) URL.revokeObjectURL(made.url);
    setMade({ url: URL.createObjectURL(blob), bytes: blob.size, name: `${src.name}-${animation}.gif`, key });
    setProgress(null);
  }

  return (
    <div className={ui.studio}>
      <div className={ui.controls}>
        <section className={ui.panel} style={{ animationDelay: "0.2s" }}>
          <h2>Your image</h2>
          {src ? (
            <div className={styles.loaded}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src.url} alt="" className={styles.thumb} />
              <div>
                <b>{src.own ? src.name : "Sample logo"}</b>
                <span>
                  {src.w} × {src.h}
                </span>
              </div>
              <label className={ui.textBtn}>
                Change
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onChange={(e) => load(e.target.files?.[0])} />
              </label>
            </div>
          ) : (
            <>
              <label
                className={`${styles.drop} ${dragOver ? styles.dragging : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  load(e.dataTransfer.files[0]);
                }}
              >
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(e) => load(e.target.files?.[0])} />
                <b>Drop a logo or banner, or click to choose</b>
                <small>PNG, JPG, SVG or WebP. It stays on your device. Nothing is uploaded.</small>
              </label>
              <button
                className={`${ui.textBtn} ${styles.sample}`}
                onClick={() => {
                  openImage(SAMPLE, "mktbox", false);
                  setTransparent(true);
                }}
              >
                Or try it with a sample logo
              </button>
            </>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.28s" }}>
          <h2>Animation</h2>
          <div className={styles.effects}>
            {ANIMATIONS.map((a) => (
              <button key={a.id} className={`${styles.effect} ${a.id === animation ? styles.on : ""}`} onClick={() => setAnimation(a.id)}>
                <span className={`${styles.icon} ${styles[`i_${a.id}`]}`} aria-hidden>
                  <i />
                </span>
                <b>{a.name}</b>
                <small>{a.hint}</small>
              </button>
            ))}
          </div>
          <div className={ui.row}>
            <span className={ui.rowLabel}>Speed</span>
            <label className={ui.slider}>
              <input type="range" min={0.6} max={4} step={0.1} value={4.6 - duration} onChange={(e) => setDuration(+(4.6 - +e.target.value).toFixed(1))} />
              <span className={styles.value}>{duration.toFixed(1)} s</span>
            </label>
          </div>
          {!anim.continuous && (
            <div className={ui.row}>
              <span className={ui.rowLabel}>Pause between</span>
              <label className={ui.slider}>
                <input type="range" min={0} max={4} step={0.1} value={hold} onChange={(e) => setHold(+e.target.value)} />
                <span className={styles.value}>{hold.toFixed(1)} s</span>
              </label>
            </div>
          )}
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.36s" }}>
          <h2>Size and background</h2>
          <div className={ui.row}>
            <span className={ui.rowLabel}>Width</span>
            <div className={ui.segment}>
              {WIDTHS.map((w) => (
                <button key={w} className={w === width ? ui.on : ""} onClick={() => setWidth(w)}>
                  {w} px
                </button>
              ))}
            </div>
          </div>
          <div className={ui.row}>
            <span className={ui.rowLabel}>Space around</span>
            <label className={ui.slider}>
              <input type="range" min={0} max={0.3} step={0.01} value={padding} onChange={(e) => setPadding(+e.target.value)} />
              <span className={styles.value}>{Math.round(padding * 100)}%</span>
            </label>
          </div>
          <div className={ui.row}>
            <span className={ui.rowLabel}>Background</span>
            <div className={ui.segment}>
              <button className={!transparent ? ui.on : ""} onClick={() => setTransparent(false)}>
                Color
              </button>
              <button className={transparent ? ui.on : ""} onClick={() => setTransparent(true)}>
                Transparent
              </button>
            </div>
          </div>
          {transparent ? (
            <div className={ui.row}>
              <span className={ui.rowLabel}>Will sit on</span>
              <div className={ui.segment}>
                <button className={matte === "light" ? ui.on : ""} onClick={() => setMatte("light")}>
                  Light pages
                </button>
                <button className={matte === "dark" ? ui.on : ""} onClick={() => setMatte("dark")}>
                  Dark pages
                </button>
              </div>
            </div>
          ) : (
            <div className={ui.colors}>
              <ColorPicker label="Background" value={bg} onChange={setBg} />
            </div>
          )}
        </section>
      </div>

      <div className={ui.previewCol}>
        <div className={ui.previewCard}>
          <div className={`${styles.stage} ${transparent ? styles.checker : ""}`}>
            {src ? <canvas ref={canvas} className={styles.canvas} aria-label="Live preview of the animation" /> : <p className={styles.placeholder}>Your animated preview shows here</p>}
          </div>
          <p className={styles.meta}>
            {width} × {height} px · {anim.name} · loops every {cycleSeconds({ animation, duration, hold }).toFixed(1)} s
          </p>

          {result ? (
            <div className={styles.done}>
              <a className={ui.primary} href={result.url} download={result.name}>
                Download GIF · {kb(result.bytes)}
              </a>
              <p className={styles.note}>
                {result.bytes <= 1024 * 1024
                  ? "Light enough for email signatures and most sites."
                  : "Over 1 MB: try a smaller width or a shorter pause for emails."}{" "}
                <Link href="/signature">Add it to an email signature →</Link>
              </p>
            </div>
          ) : (
            <button className={`${ui.primary} ${styles.make}`} disabled={!src || progress !== null} onClick={exportGif}>
              {progress !== null ? `Making your GIF… ${Math.round(progress * 100)}%` : "Make GIF"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
