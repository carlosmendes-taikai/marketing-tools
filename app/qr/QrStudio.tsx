"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling";
import { CONTENT_TYPES, contrast, encode, luminanceOf, type ContentType, type Field } from "@/lib/qr-data";
import { composeSvg, saveBlob, svgToPng, type FrameKind, type FrameOptions } from "./compose";
import { ColorPicker } from "@/components/ColorPicker";
import styles from "@/components/tool.module.css";

type DotType = NonNullable<NonNullable<Options["dotsOptions"]>["type"]>;
type CornerType = NonNullable<NonNullable<Options["cornersSquareOptions"]>["type"]>;
type CornerDotType = NonNullable<NonNullable<Options["cornersDotOptions"]>["type"]>;

type Style = {
  dots: DotType;
  corners: CornerType;
  cornerDots: CornerDotType;
  shape: "square" | "circle";
  fg: string;
  cornerColor: string;
  bg: string;
  transparent: boolean;
  gradient: boolean;
  fg2: string;
};

const RENDER = 1000; // internal size; the SVG is vector, PNG is scaled on export

const PRESETS: { name: string; style: Style }[] = [
  {
    name: "Classic",
    style: { dots: "square", corners: "square", cornerDots: "square", shape: "square", fg: "#141413", cornerColor: "#141413", bg: "#ffffff", transparent: false, gradient: false, fg2: "#6c70e0" },
  },
  {
    name: "Soft",
    style: { dots: "rounded", corners: "extra-rounded", cornerDots: "dot", shape: "square", fg: "#2b2d6e", cornerColor: "#6c70e0", bg: "#ffffff", transparent: false, gradient: false, fg2: "#6c70e0" },
  },
  {
    name: "Dots",
    style: { dots: "dots", corners: "dot", cornerDots: "dot", shape: "square", fg: "#141413", cornerColor: "#141413", bg: "#f4f3ef", transparent: false, gradient: false, fg2: "#6c70e0" },
  },
  {
    name: "Leaf",
    style: { dots: "classy-rounded", corners: "extra-rounded", cornerDots: "classy", shape: "square", fg: "#2f5d46", cornerColor: "#2f5d46", bg: "#f3f7f2", transparent: false, gradient: false, fg2: "#6c70e0" },
  },
  {
    name: "Twilight",
    style: { dots: "rounded", corners: "extra-rounded", cornerDots: "dot", shape: "square", fg: "#6c70e0", cornerColor: "#3b3fa8", bg: "#ffffff", transparent: false, gradient: true, fg2: "#c26ad8" },
  },
  {
    name: "Badge",
    style: { dots: "dots", corners: "extra-rounded", cornerDots: "dot", shape: "circle", fg: "#141413", cornerColor: "#6c70e0", bg: "#ffffff", transparent: false, gradient: false, fg2: "#6c70e0" },
  },
];

const DOTS: { id: DotType; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "extra-rounded", label: "Soft" },
  { id: "dots", label: "Dots" },
  { id: "classy", label: "Classy" },
  { id: "classy-rounded", label: "Leaf" },
];

const CORNERS: { id: CornerType; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "extra-rounded", label: "Rounded" },
  { id: "dot", label: "Circle" },
];

const CORNER_DOTS: { id: CornerDotType; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "dot", label: "Circle" },
  { id: "classy", label: "Leaf" },
];

const SIZES = [512, 1024, 2048, 4096];

export function QrStudio() {
  const [type, setType] = useState<ContentType>("link");
  const [values, setValues] = useState<Record<ContentType, Record<string, string>>>(
    () => Object.fromEntries(CONTENT_TYPES.map((t) => [t.id, { ...t.defaults }])) as Record<ContentType, Record<string, string>>,
  );
  const [style, setStyle] = useState<Style>(PRESETS[1].style);
  const [preset, setPreset] = useState("Soft");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(0.3);
  const [frame, setFrame] = useState<FrameOptions>({ kind: "none", text: "Scan me", color: "#141413", textColor: "#ffffff" });
  const [size, setSize] = useState(2048);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Other tools (like the UTM builder) can hand over a link: /qr?link=https://...
  useEffect(() => {
    const link = new URLSearchParams(window.location.search).get("link");
    if (link) queueMicrotask(() => setValues((v) => ({ ...v, link: { ...v.link, url: link } })));
  }, []);

  const qrRef = useRef<QRCodeStyling | null>(null);
  const svgRef = useRef<string>("");

  const current = CONTENT_TYPES.find((t) => t.id === type)!;
  const data = encode(type, values[type]);
  const empty = !data;

  const options = useMemo<Options>(() => {
    const fill = style.gradient
      ? { gradient: { type: "linear" as const, rotation: Math.PI / 4, colorStops: [{ offset: 0, color: style.fg }, { offset: 1, color: style.fg2 }] } }
      : { color: style.fg };
    return {
      type: "svg",
      width: RENDER,
      height: RENDER,
      margin: style.shape === "circle" ? 0 : 40,
      shape: style.shape,
      data: data || "https://mktbox.xyz",
      image: logo ?? undefined,
      qrOptions: { errorCorrectionLevel: logo ? "H" : "Q" },
      imageOptions: { hideBackgroundDots: true, imageSize: logoSize, margin: 14, saveAsBlob: true },
      dotsOptions: { type: style.dots, ...fill },
      cornersSquareOptions: { type: style.corners, color: style.cornerColor },
      cornersDotOptions: { type: style.cornerDots, color: style.cornerColor },
      backgroundOptions: { color: style.transparent ? "transparent" : style.bg },
    };
  }, [data, style, logo, logoSize]);

  // Render the preview whenever anything changes (debounced so typing stays smooth).
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      // A fresh instance each time: update() merges into old settings, so a removed gradient would linger.
      const { default: QR } = await import("qr-code-styling");
      qrRef.current = new QR(options);
      const raw = await qrRef.current.getRawData("svg");
      if (!raw || cancelled) return;
      const svg = await (raw as Blob).text();
      svgRef.current = svg;
      const composed = composeSvg(svg, RENDER, frame);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(new Blob([composed], { type: "image/svg+xml" }));
      });
    }, 90);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [options, frame]);

  // A little pop on the preview when the look changes (not on every keystroke).
  const lookKey = JSON.stringify([style, frame.kind, !!logo]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!style.transparent) {
      const c = contrast(style.fg, style.bg);
      if (c < 3) w.push("Low contrast between the code and the background. Some phones may not scan it.");
      else if (luminanceOf(style.fg) > luminanceOf(style.bg))
        w.push("Light code on a dark background. Most phones read it, some older scanners don't.");
    } else {
      w.push("Transparent background. Place it on a light, plain surface.");
    }
    if (logo && logoSize > 0.38) w.push("The logo is large. Test-scan before you print.");
    if (data.length > 400) w.push("Lots of content makes a dense code. Print it at least 3 cm wide.");
    return w;
  }, [style, logo, logoSize, data]);

  const setField = (key: string, value: string) => setValues((v) => ({ ...v, [type]: { ...v[type], [key]: value } }));
  const tweak = (patch: Partial<Style>) => {
    setStyle((s) => ({ ...s, ...patch }));
    setPreset("");
  };

  async function download(ext: "png" | "svg") {
    if (empty || !svgRef.current) return;
    setBusy(true);
    try {
      const composed = composeSvg(svgRef.current, RENDER, frame);
      const name = `qr-${type}`;
      if (ext === "svg") saveBlob(new Blob([composed], { type: "image/svg+xml" }), `${name}.svg`);
      else saveBlob(await svgToPng(composed, size), `${name}.png`);
    } finally {
      setBusy(false);
    }
  }

  function onLogo(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className={styles.studio}>
      <div className={styles.controls}>
        <section className={`${styles.panel} ${styles.beforePreview}`} style={{ animationDelay: "0.2s" }}>
          <h2>What should it open?</h2>
          <div className={styles.types} role="tablist">
            {CONTENT_TYPES.map((t) => (
              <button key={t.id} role="tab" aria-selected={t.id === type} className={t.id === type ? styles.on : ""} onClick={() => setType(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className={styles.fields} key={type}>
            {current.fields.map((f) => (
              <FieldInput key={f.key} field={f} value={values[type][f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
            ))}
          </div>
        </section>

        <section className={styles.panel} style={{ animationDelay: "0.28s" }}>
          <h2>Style</h2>
          <div className={styles.presets}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                className={`${styles.preset} ${preset === p.name ? styles.on : ""}`}
                onClick={() => {
                  setStyle(p.style);
                  setPreset(p.name);
                }}
              >
                <span
                  className={styles.swatch}
                  style={{
                    background: p.style.gradient ? `linear-gradient(135deg, ${p.style.fg}, ${p.style.fg2})` : p.style.fg,
                    outlineColor: p.style.bg,
                    borderRadius: p.style.shape === "circle" ? "50%" : p.style.dots === "square" ? 4 : 9,
                  }}
                />
                {p.name}
              </button>
            ))}
          </div>

          <Picker label="Dots" items={DOTS} value={style.dots} onPick={(dots) => tweak({ dots })} icon={(id) => <DotIcon type={id} />} />
          <Picker label="Corners" items={CORNERS} value={style.corners} onPick={(corners) => tweak({ corners })} icon={(id) => <CornerIcon type={id} />} />
          <Picker label="Corner centers" items={CORNER_DOTS} value={style.cornerDots} onPick={(cornerDots) => tweak({ cornerDots })} icon={(id) => <CornerDotIcon type={id} />} />

          <div className={styles.row}>
            <span className={styles.rowLabel}>Shape</span>
            <div className={styles.segment}>
              {(["square", "circle"] as const).map((s) => (
                <button key={s} className={style.shape === s ? styles.on : ""} onClick={() => tweak({ shape: s })}>
                  {s === "square" ? "Square" : "Circle"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.colors}>
            <ColorPicker label="Code" value={style.fg} onChange={(fg) => tweak({ fg })} />
            {style.gradient && <ColorPicker label="Fades to" value={style.fg2} onChange={(fg2) => tweak({ fg2 })} />}
            <ColorPicker label="Corners" value={style.cornerColor} onChange={(cornerColor) => tweak({ cornerColor })} />
            {!style.transparent && <ColorPicker label="Background" value={style.bg} onChange={(bg) => tweak({ bg })} />}
          </div>
          <div className={styles.toggles}>
            <Toggle label="Gradient" on={style.gradient} onChange={(gradient) => tweak({ gradient })} />
            <Toggle label="Transparent background" on={style.transparent} onChange={(transparent) => tweak({ transparent })} />
          </div>
        </section>

        <section className={styles.panel} style={{ animationDelay: "0.36s" }}>
          <h2>Logo</h2>
          {logo ? (
            <div className={styles.logoRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="Your logo" className={styles.logoThumb} />
              <label className={styles.slider}>
                <span>Size</span>
                <input type="range" min={0.15} max={0.45} step={0.01} value={logoSize} onChange={(e) => setLogoSize(+e.target.value)} />
              </label>
              <button className={styles.textBtn} onClick={() => setLogo(null)}>
                Remove
              </button>
            </div>
          ) : (
            <label className={styles.drop}>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(e) => onLogo(e.target.files?.[0])} />
              <span>Drop a logo here or click to upload</span>
              <small>PNG, JPG, SVG or WebP. It never leaves your browser.</small>
            </label>
          )}
        </section>

        <section className={styles.panel} style={{ animationDelay: "0.44s" }}>
          <h2>Frame</h2>
          <div className={styles.segment}>
            {(
              [
                ["none", "None"],
                ["card", "Card"],
                ["pill", "Button"],
              ] as [FrameKind, string][]
            ).map(([k, l]) => (
              <button key={k} className={frame.kind === k ? styles.on : ""} onClick={() => setFrame((f) => ({ ...f, kind: k }))}>
                {l}
              </button>
            ))}
          </div>
          {frame.kind !== "none" && (
            <div className={styles.frameOpts}>
              <label className={styles.field}>
                <span>Call to action</span>
                <input value={frame.text} maxLength={28} onChange={(e) => setFrame((f) => ({ ...f, text: e.target.value }))} />
              </label>
              <div className={styles.colors}>
                <ColorPicker label="Frame" value={frame.color} onChange={(color) => setFrame((f) => ({ ...f, color }))} />
                <ColorPicker label="Text" value={frame.textColor} onChange={(textColor) => setFrame((f) => ({ ...f, textColor }))} />
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className={styles.previewCol}>
        <div className={styles.previewCard}>
          <div className={`${styles.canvas} ${empty ? styles.empty : ""}`}>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={lookKey} src={preview} alt="QR code preview" className={styles.qrImg} />
            )}
            {empty && <p className={styles.hint}>Fill in the details to make your code</p>}
          </div>

          {warnings.length > 0 && !empty && (
            <ul className={styles.warnings}>
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <div className={styles.download}>
            <div className={styles.sizeRow}>
              <span>PNG size</span>
              <div className={styles.segment}>
                {SIZES.map((s) => (
                  <button key={s} className={size === s ? styles.on : ""} onClick={() => setSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.buttons}>
              <button className={styles.primary} disabled={empty || busy} onClick={() => download("png")}>
                Download PNG
              </button>
              <button className={styles.secondary} disabled={empty || busy} onClick={() => download("svg")}>
                SVG
              </button>
            </div>
            <p className={styles.fine}>Static code. Works forever, no tracking, no account.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- small pieces ---------- */

function FieldInput({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const cls = `${styles.field} ${field.half ? styles.half : ""}`;
  if (field.kind === "checkbox")
    return (
      <div className={`${cls} ${styles.checkField}`}>
        <Toggle label={field.label} on={!!value} onChange={(on) => onChange(on ? "1" : "")} />
      </div>
    );
  return (
    <label className={cls}>
      <span>{field.label}</span>
      {field.kind === "textarea" ? (
        <textarea rows={3} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : field.kind === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.kind === "datetime" ? "datetime-local" : field.kind === "password" ? "text" : "text"}
          value={value}
          placeholder={field.placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function Picker<T extends string>({
  label,
  items,
  value,
  onPick,
  icon,
}: {
  label: string;
  items: { id: T; label: string }[];
  value: T;
  onPick: (v: T) => void;
  icon: (id: T) => React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.picker}>
        {items.map((it) => (
          <button key={it.id} className={value === it.id ? styles.on : ""} onClick={() => onPick(it.id)} title={it.label} aria-label={it.label}>
            {icon(it.id)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`${styles.toggle} ${on ? styles.toggleOn : ""}`} onClick={() => onChange(!on)} aria-pressed={on}>
      <span className={styles.knob} />
      {label}
    </button>
  );
}

/* ---------- shape icons ---------- */

const GRID = [
  [1, 1, 0],
  [0, 1, 1],
  [1, 1, 1],
];

function DotIcon({ type }: { type: DotType }) {
  const cell = 8;
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      {GRID.flatMap((row, r) =>
        row.map((on, c) => {
          if (!on) return null;
          const x = 3 + c * cell,
            y = 3 + r * cell;
          if (type === "dots") return <circle key={`${r}${c}`} cx={x + cell / 2} cy={y + cell / 2} r={cell / 2 - 0.5} />;
          const rx = type === "square" ? 0 : type === "rounded" ? 2 : type === "extra-rounded" ? 3.5 : 0;
          if (type === "classy" || type === "classy-rounded") {
            const k = type === "classy" ? 0 : 1.5;
            return (
              <path
                key={`${r}${c}`}
                d={`M${x} ${y + cell}V${y + 3 + k}Q${x} ${y} ${x + 3 + k} ${y}H${x + cell}V${y + cell - 3 - k}Q${x + cell} ${y + cell} ${x + cell - 3 - k} ${y + cell}Z`}
              />
            );
          }
          return <rect key={`${r}${c}`} x={x} y={y} width={cell} height={cell} rx={rx} />;
        }),
      )}
    </svg>
  );
}

function CornerIcon({ type }: { type: CornerType }) {
  const rx = type === "square" ? 1 : type === "extra-rounded" ? 7 : 12;
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <rect x="4" y="4" width="22" height="22" rx={rx} fill="none" strokeWidth="4" style={{ stroke: "currentColor" }} />
    </svg>
  );
}

function CornerDotIcon({ type }: { type: CornerDotType }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      {type === "dot" ? (
        <circle cx="15" cy="15" r="7" />
      ) : type === "classy" ? (
        <path d="M8 22V12Q8 8 12 8H22V18Q22 22 18 22Z" />
      ) : (
        <rect x="8" y="8" width="14" height="14" />
      )}
    </svg>
  );
}
