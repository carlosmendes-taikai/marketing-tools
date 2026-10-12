"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { TOOLS, type Tool } from "@/lib/site";
import styles from "./bento.module.css";

// Each demo sits still until its block is hovered (or focused), then plays.
type DemoProps = { active: boolean };

const SIZE: Record<string, string> = {
  qr: `${styles.big} ${styles.dark}`,
  signature: styles.wide,
  utm: styles.wide,
  resize: styles.wide,
  headline: styles.wide,
};

const DEMOS: Record<string, ComponentType<DemoProps>> = {
  qr: QrDemo,
  signature: SignatureDemo,
  keywords: KeywordsDemo,
  speed: SpeedDemo,
  utm: UtmDemo,
  preview: PreviewDemo,
  linkedin: LinkedinDemo,
  resize: ResizeDemo,
  headline: HeadlineDemo,
};

export function Bento() {
  return (
    <div id="tools" className={styles.grid}>
      {TOOLS.map((tool, i) => (
        <Tile key={tool.slug} tool={tool} index={i} />
      ))}
    </div>
  );
}

function Tile({ tool, index }: { tool: Tool; index: number }) {
  const [active, setActive] = useState(false);
  const Demo = DEMOS[tool.slug];
  const showBlurb = SIZE[tool.slug] !== undefined;
  const inner = (
    <>
      <div className={styles.stage}>{Demo && <Demo active={active} />}</div>
      <h3>{tool.name}</h3>
      {showBlurb && <p>{tool.blurb}</p>}
      <span className={styles.go} aria-hidden>
        {tool.live ? "→" : "Soon"}
      </span>
    </>
  );
  const props = {
    className: `${styles.tile} ${SIZE[tool.slug] ?? ""} ${tool.live ? "" : styles.soon} ${active ? styles.active : ""}`,
    style: { animationDelay: `${300 + index * 70}ms` },
    onMouseEnter: () => setActive(true),
    onMouseLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  };

  return tool.live ? (
    <Link href={`/${tool.slug}`} {...props}>
      {inner}
    </Link>
  ) : (
    <div {...props} title="Coming soon" tabIndex={0}>
      {inner}
    </div>
  );
}

/** Steps through 0..count-1 while active; sits on 0 otherwise. */
function useTicker(ms: number, count: number, active: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [ms, count, active]);
  return active ? i : 0;
}

/** Counts from 0 up to `to` while active; shows `to` when idle. */
function useCountUp(to: number, step: number, ms: number, active: boolean, loopPause = 0) {
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!active) return;
    let v = 0;
    const t = setInterval(() => {
      v += step;
      if (v > to + loopPause) v = 0;
      setN(Math.min(v, to));
    }, ms);
    return () => clearInterval(t);
  }, [to, step, ms, active, loopPause]);
  return active ? n : to;
}

/* ---------- demos ---------- */

function buildQrCells() {
  const N = 21;
  let seed = 11;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const finder = (r: number, c: number) => {
    for (const [R, C] of [
      [0, 0],
      [0, 14],
      [14, 0],
    ]) {
      const y = r - R,
        x = c - C;
      if (y >= 0 && y < 7 && x >= 0 && x < 7)
        return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4) ? 2 : -1;
    }
    return 0;
  };
  const cells: number[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const f = finder(r, c);
      cells.push(f === 2 ? 2 : f === 0 && rnd() > 0.52 ? 1 : 0);
    }
  return cells;
}

const QR_CELLS = buildQrCells();
// reveal in a scrambled order so the code "draws itself"
const QR_ORDER = QR_CELLS.map((_, i) => (i * 7919) % QR_CELLS.length);
const QR_TYPES = ["Link", "Wifi", "Contact", "Email", "SMS", "Event"];

function QrDemo({ active }: DemoProps) {
  const shown = useCountUp(QR_CELLS.length, 6, 16, active);
  const type = useTicker(1100, QR_TYPES.length, active);

  return (
    <div className={styles.qrStage}>
      <div className={styles.qrTypes}>
        {QR_TYPES.map((t, i) => (
          <span key={t} className={i === type ? styles.act : ""}>
            {t}
          </span>
        ))}
      </div>
      <div className={styles.qr}>
        {QR_CELLS.map((v, i) => (
          <i key={i} className={`${v === 2 ? styles.f : v === 0 ? styles.x : ""} ${QR_ORDER[i] < shown ? styles.on : ""}`} />
        ))}
      </div>
    </div>
  );
}

function SignatureDemo() {
  return (
    <div className={styles.sig}>
      <div className={styles.av}>
        <i />
      </div>
      <div className={styles.sigText}>
        <b>Carlos Mendes</b>
        <span>Marketing lead</span>
      </div>
      <svg width="110" height="44" viewBox="0 0 110 44" aria-hidden>
        <path
          d="M4 30c10-22 18-24 16-6s8-18 14-14-2 18 6 12 10-20 16-14-4 16 4 12 14-14 22-10 10 10 24 2"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

const KW: [string, string[]][] = [
  ["qr code", ["for wifi", "free no signup", "with logo"]],
  ["email signature", ["with gif", "for gmail", "examples"]],
  ["utm", ["builder", "parameters", "best practices"]],
];

function KeywordsDemo({ active }: DemoProps) {
  const i = useTicker(2400, KW.length, active);
  const [q, list] = KW[i];
  return (
    <div className={styles.kw}>
      <div className={styles.kwQ}>{q}</div>
      {list.map((s, k) => (
        <div key={q + s} className={styles.kwS} style={{ animationDelay: `${150 + k * 200}ms` }}>
          {q} <b>{s}</b>
        </div>
      ))}
    </div>
  );
}

const SCORES = [94, 81, 98];

function SpeedDemo({ active }: DemoProps) {
  const i = useTicker(2600, SCORES.length, active);
  return <Gauge key={active ? i : "idle"} target={SCORES[i]} active={active} />;
}

function Gauge({ target, active }: { target: number; active: boolean }) {
  const n = useCountUp(target, 2, 18, active, 1000);
  return (
    <div className={styles.gauge}>
      <svg width="130" height="130" aria-hidden>
        <circle className={styles.gBg} cx="65" cy="65" r="52" />
        <circle className={styles.gFg} cx="65" cy="65" r="52" style={{ strokeDashoffset: 327 * (1 - n / 100) }} />
      </svg>
      <div className={styles.gNum}>{n}</div>
    </div>
  );
}

const UTM: [boolean, string][] = [
  [false, "untitled.tools/qr"],
  [true, "?utm_source="],
  [false, "linkedin"],
  [true, "&utm_medium="],
  [false, "social"],
  [true, "&utm_campaign="],
  [false, "launch"],
];
const UTM_LEN = UTM.reduce((a, [, s]) => a + s.length, 0);
const UTM_STARTS = UTM.map((_, k) => UTM.slice(0, k).reduce((a, [, s]) => a + s.length, 0));

function UtmDemo({ active }: DemoProps) {
  const n = useCountUp(UTM_LEN, 1, 30, active, 60);
  return (
    <div className={styles.url}>
      {UTM.map(([param, s], k) => {
        const part = s.slice(0, Math.max(0, n - UTM_STARTS[k]));
        return param ? (
          <span key={k} className={styles.param}>
            {part}
          </span>
        ) : (
          <span key={k}>{part}</span>
        );
      })}
      {active && <span className={styles.caret} />}
    </div>
  );
}

const NETS = ["LinkedIn", "X", "WhatsApp"];

function PreviewDemo({ active }: DemoProps) {
  const i = useTicker(1000, NETS.length, active);
  return (
    <div className={styles.preview}>
      <div className={styles.nets}>
        {NETS.map((n, k) => (
          <i key={n} className={k === i ? styles.act : ""}>
            {n}
          </i>
        ))}
      </div>
      <div className={styles.card}>
        <div className={styles.cardImg} />
        <div className={styles.cardTx}>
          <b>Free marketing tools</b>
          <span>untitled.tools</span>
        </div>
      </div>
    </div>
  );
}

function LinkedinDemo() {
  return (
    <div className={styles.li}>
      I almost paid €12 for a QR code last week. So I built my own, and made it free.
      <div className={styles.fold}>
        <span />
        <span>…see more</span>
      </div>
    </div>
  );
}

const SIZES: [string, number, number][] = [
  ["1:1", 96, 96],
  ["4:5", 86, 108],
  ["9:16", 64, 114],
  ["16:9", 140, 79],
  ["1.91:1", 150, 78],
];

function ResizeDemo({ active }: DemoProps) {
  const i = useTicker(650, SIZES.length, active);
  return (
    <div className={styles.frames}>
      {SIZES.map(([label, w, h], k) => (
        <div key={label} className={`${styles.fr} ${active && k === i ? styles.frOn : ""}`} style={{ width: w * 0.8, height: h * 0.8 }}>
          {label}
        </div>
      ))}
    </div>
  );
}

function HeadlineDemo() {
  const rows: [string, number, boolean][] = [
    ["clarity", 86, false],
    ["emotion", 64, false],
    ["overall", 78, true],
  ];
  return (
    <div className={styles.hl}>
      <div className={styles.hlH}>&ldquo;7 free tools I wish I&rsquo;d found sooner&rdquo;</div>
      <div className={styles.bars}>
        {rows.map(([k, v, a]) => (
          <div key={k} className={styles.barRow}>
            <span>{k}</span>
            <div className={styles.bar}>
              <i className={a ? styles.barA : ""} style={{ width: `${v}%` }} />
            </div>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
