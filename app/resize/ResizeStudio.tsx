"use client";

import { useEffect, useRef, useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { PLATFORMS, SIZES, type Size } from "@/lib/sizes";
import { makeZip } from "@/lib/zip";
import { saveBlob as save } from "@/app/qr/compose";
import ui from "@/components/tool.module.css";
import styles from "./resize.module.css";

type Source = { el: HTMLImageElement; url: string; name: string; w: number; h: number };
type Frame = { px: number; py: number; zoom: number }; // where the image sits (0 to 1 on each axis) and how far it's zoomed
type Mode = "crop" | "fit";
type Format = "jpg" | "png" | "webp";

const CENTER: Frame = { px: 0.5, py: 0.5, zoom: 1 };
const MIME: Record<Format, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Where the photo lands inside a W×H canvas. The preview and the exported file share this maths. */
function layout(W: number, H: number, iw: number, ih: number, mode: Mode, f: Frame) {
  const base = mode === "crop" ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih);
  const s = base * f.zoom;
  const dw = iw * s;
  const dh = ih * s;
  return { dw, dh, ox: (W - dw) * f.px, oy: (H - dh) * f.py };
}

export function ResizeStudio() {
  const [src, setSrc] = useState<Source | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(SIZES.filter((s) => s.on).map((s) => s.id)));
  const [mode, setMode] = useState<Mode>("crop");
  const [bg, setBg] = useState<"blur" | "color">("blur");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [format, setFormat] = useState<Format>("jpg");
  const [frames, setFrames] = useState<Record<string, Frame>>({});
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (src) URL.revokeObjectURL(src.url);
    },
    [src],
  );

  function load(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That isn't an image. Try a JPG, PNG or WebP.");
    setError("");
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      setSrc({ el, url, name: file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image", w: el.naturalWidth, h: el.naturalHeight });
      setFrames({});
    };
    el.onerror = () => setError("Couldn't open that image. HEIC photos from iPhones need converting to JPG first.");
    el.src = url;
  }

  const sizes = SIZES.filter((s) => selected.has(s.id));
  const frameOf = (id: string) => frames[id] ?? CENTER;
  const setFrame = (id: string, f: Frame) => setFrames((all) => ({ ...all, [id]: f }));

  async function render(size: Size): Promise<Blob> {
    const { w: W, h: H } = size;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    if (mode === "fit") {
      if (bg === "blur") {
        const cover = layout(W, H, src!.w, src!.h, "crop", CENTER);
        ctx.filter = `blur(${Math.round(Math.max(W, H) / 30)}px) brightness(0.9)`;
        ctx.drawImage(src!.el, cover.ox - 40, cover.oy - 40, cover.dw + 80, cover.dh + 80);
        ctx.filter = "none";
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);
      }
    } else if (format === "jpg") {
      ctx.fillStyle = "#ffffff"; // JPG has no transparency
      ctx.fillRect(0, 0, W, H);
    }
    const { dw, dh, ox, oy } = layout(W, H, src!.w, src!.h, mode, frameOf(size.id));
    ctx.drawImage(src!.el, ox, oy, dw, dh);
    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export failed"))), MIME[format], 0.92));
  }

  const fileName = (s: Size) => `${src!.name}-${s.platform.toLowerCase()}-${s.label.toLowerCase().replace(/[^a-z]+/g, "-")}-${s.w}x${s.h}.${format}`;

  async function downloadOne(s: Size) {
    setBusy(s.id);
    try {
      save(await render(s), fileName(s));
    } finally {
      setBusy("");
    }
  }

  async function downloadAll() {
    setBusy("all");
    try {
      const files = [];
      for (const s of sizes) files.push({ name: fileName(s), blob: await render(s) });
      save(await makeZip(files), `${src!.name}-social-sizes.zip`);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className={styles.studio}>
      <section className={`${ui.panel} ${styles.top}`} style={{ animationDelay: "0.2s" }}>
        {!src ? (
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
            <input type="file" accept="image/*" onChange={(e) => load(e.target.files?.[0])} />
            <span className={styles.dropIcon} aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <b>Drop an image, or click to choose one</b>
            <small>It stays on your device. Nothing is uploaded.</small>
          </label>
        ) : (
          <div className={styles.loaded}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src.url} alt="" className={styles.thumb} />
            <div className={styles.loadedInfo}>
              <b>{src.name}</b>
              <span>
                {src.w} × {src.h}
              </span>
              <label className={ui.textBtn}>
                Change image
                <input type="file" accept="image/*" hidden onChange={(e) => load(e.target.files?.[0])} />
              </label>
            </div>
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <section className={`${ui.panel} ${styles.picker}`} style={{ animationDelay: "0.26s" }}>
        {PLATFORMS.map((p) => (
          <div key={p} className={styles.platform}>
            <span className={styles.platformName}>{p}</span>
            <div className={styles.chips}>
              {SIZES.filter((s) => s.platform === p).map((s) => {
                const on = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                    onClick={() =>
                      setSelected((sel) => {
                        const n = new Set(sel);
                        if (n.has(s.id)) n.delete(s.id);
                        else n.add(s.id);
                        return n;
                      })
                    }
                  >
                    <span className={styles.ratio} style={{ aspectRatio: `${s.w} / ${s.h}` }} aria-hidden />
                    {s.label}
                    <small>
                      {s.w}×{s.h}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {src && sizes.length > 0 && (
        <>
          <div className={styles.bar}>
            <div className={styles.barLeft}>
              <div className={ui.segment}>
                <button className={mode === "crop" ? ui.on : ""} onClick={() => setMode("crop")}>
                  Fill and crop
                </button>
                <button className={mode === "fit" ? ui.on : ""} onClick={() => setMode("fit")}>
                  Fit whole image
                </button>
              </div>
              <span className={styles.barHint}>{mode === "crop" ? "Drag any image to reframe it" : "Nothing gets cut off"}</span>
            </div>
            <div className={styles.barRight}>
              <div className={ui.segment}>
                {(["jpg", "png", "webp"] as const).map((f) => (
                  <button key={f} className={format === f ? ui.on : ""} onClick={() => setFormat(f)}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className={ui.primary} disabled={!!busy} onClick={downloadAll}>
                {busy === "all" ? "Making zip…" : `Download all (${sizes.length})`}
              </button>
            </div>
          </div>
          {mode === "fit" && (
            <div className={styles.subOptions}>
              <span className={styles.subLabel}>Fill the empty space with</span>
              <div className={styles.subSeg}>
                <button className={bg === "blur" ? styles.subOn : ""} onClick={() => setBg("blur")}>
                  Blurred edges
                </button>
                <button className={bg === "color" ? styles.subOn : ""} onClick={() => setBg("color")}>
                  Solid colour
                </button>
              </div>
              {bg === "color" && <ColorPicker label="Background" value={bgColor} onChange={setBgColor} />}
            </div>
          )}
          <div className={styles.grid}>
            {sizes.map((s, i) => (
              <Card
                key={s.id}
                size={s}
                src={src}
                mode={mode}
                bg={bg}
                bgColor={bgColor}
                frame={frameOf(s.id)}
                onFrame={(f) => setFrame(s.id, f)}
                onDownload={() => downloadOne(s)}
                busy={busy === s.id}
                delay={i * 50}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({
  size,
  src,
  mode,
  bg,
  bgColor,
  frame,
  onFrame,
  onDownload,
  busy,
  delay,
}: {
  size: Size;
  src: Source;
  mode: Mode;
  bg: "blur" | "color";
  bgColor: string;
  frame: Frame;
  onFrame: (f: Frame) => void;
  onDownload: () => void;
  busy: boolean;
  delay: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const { w: W, h: H } = size;
  const { dw, dh, ox, oy } = layout(W, H, src.w, src.h, mode, frame);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const [min, max] = mode === "crop" ? [1, 3] : [0.5, 1];

  function startDrag(e: React.PointerEvent) {
    const el = box.current!;
    el.setPointerCapture(e.pointerId);
    const scale = W / el.clientWidth; // canvas pixels per screen pixel
    const start = { x: e.clientX, y: e.clientY, ox, oy };
    const move = (ev: PointerEvent) => {
      const nx = start.ox + (ev.clientX - start.x) * scale;
      const ny = start.oy + (ev.clientY - start.y) * scale;
      const clamp = (v: number) => Math.min(1, Math.max(0, v));
      onFrame({
        ...frame,
        px: W - dw !== 0 ? clamp(nx / (W - dw)) : frame.px,
        py: H - dh !== 0 ? clamp(ny / (H - dh)) : frame.py,
      });
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  }

  return (
    <article className={styles.card} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.frameWrap}>
        <div
          ref={box}
          className={styles.frame}
          // fits inside the 216px-tall slot without losing its shape
          style={{ aspectRatio: `${W} / ${H}`, width: `min(100%, ${Math.round((216 * W) / H)}px)`, background: mode === "fit" && bg === "color" ? bgColor : undefined }}
          onPointerDown={startDrag}
          onWheel={(e) => {
            if (!e.shiftKey) return;
            e.preventDefault();
            onFrame({ ...frame, zoom: Math.min(max, Math.max(min, frame.zoom - e.deltaY / 500)) });
          }}
        >
          {mode === "fit" && bg === "blur" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src.url} alt="" className={styles.blurBg} draggable={false} />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src.url}
            alt=""
            draggable={false}
            className={styles.photo}
            style={{ width: pct(dw, W), height: pct(dh, H), left: pct(ox, W), top: pct(oy, H) }}
          />
        </div>
      </div>
      <div className={styles.cardInfo}>
        <div>
          <b>
            {size.platform} {size.label.toLowerCase()}
          </b>
          <small>
            {size.w} × {size.h}
          </small>
        </div>
        <button className={styles.dl} onClick={onDownload} disabled={busy} aria-label={`Download ${size.label}`}>
          {busy ? "…" : <DownloadIcon />}
        </button>
      </div>
      <label className={`${ui.slider} ${styles.zoom}`}>
        <span>Zoom</span>
        <input type="range" min={min} max={max} step={0.01} value={frame.zoom} onChange={(e) => onFrame({ ...frame, zoom: +e.target.value })} />
        <button className={ui.textBtn} onClick={() => onFrame(CENTER)} disabled={frame.zoom === 1 && frame.px === 0.5 && frame.py === 0.5}>
          Reset
        </button>
      </label>
    </article>
  );
}

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);
