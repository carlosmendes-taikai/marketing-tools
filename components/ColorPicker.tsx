"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./colorpicker.module.css";

const SWATCHES = ["#141413", "#2b2d6e", "#6c70e0", "#c26ad8", "#a8406e", "#c2410c", "#2f5d46", "#0f766e", "#1d4ed8", "#ffffff", "#f4f3ef", "#e8e8fb"];

type HSV = { h: number; s: number; v: number };

function hexToHsv(hex: string): HSV {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const max = Math.max(r, g, b),
    d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: HSV): string {
  const f = (k: number) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  return (
    "#" +
    [f(5), f(3), f(1)]
      .map((c) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

export function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const [draft, setDraft] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  // keep the latest hue available to the drag handler
  const hsvRef = useRef(hsv);
  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  // Close on any click outside, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = (next: HSV) => {
    setHsv(next);
    onChange(hsvToHex(next));
  };

  const pick = (hex: string) => {
    setHsv(hexToHsv(hex));
    onChange(hex);
  };

  const dragArea = (e: React.PointerEvent) => {
    const el = area.current!;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent | React.PointerEvent) => {
      const r = el.getBoundingClientRect();
      const s = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      const v = 1 - Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height));
      apply({ ...hsvRef.current, s, v });
    };
    move(e);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        onClick={() => {
          if (!open) setHsv(hexToHsv(value));
          setOpen((o) => !o);
        }}
        aria-expanded={open}
      >
        <span className={styles.chip} style={{ background: value }} />
        <span className={styles.text}>
          <small>{label}</small>
          <span>{value}</span>
        </span>
      </button>

      {open && (
        <div className={styles.pop} role="dialog" aria-label={`${label} color`}>
          <div ref={area} className={styles.area} style={{ background: `hsl(${hsv.h} 100% 50%)` }} onPointerDown={dragArea}>
            <span className={styles.thumb} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv) }} />
          </div>
          <input
            className={styles.hue}
            type="range"
            min={0}
            max={359}
            value={Math.round(hsv.h)}
            onChange={(e) => apply({ ...hsv, h: +e.target.value })}
            aria-label="Hue"
          />
          <div className={styles.swatches}>
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={c.toLowerCase() === value.toLowerCase() ? styles.sel : ""}
                style={{ background: c }}
                onClick={() => pick(c)}
                aria-label={c}
              />
            ))}
          </div>
          <label className={styles.hex}>
            <span>Hex</span>
            <input
              value={draft ?? value}
              spellCheck={false}
              onBlur={() => setDraft(null)}
              onChange={(e) => {
                const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                setDraft(v);
                if (isHex(v)) pick(v.toLowerCase());
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
