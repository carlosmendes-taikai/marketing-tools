"use client";

import { useEffect, useRef, useState } from "react";
import { rate100, type Rating, type Report, type Strategy } from "@/lib/speed";
import ui from "@/components/tool.module.css";
import styles from "./speed.module.css";

const STEPS = [
  "Opening your page on a mid-range phone",
  "Waiting for the main content to appear",
  "Measuring how long the page freezes",
  "Weighing images, scripts and fonts",
  "Checking the SEO basics",
  "Looking for accessibility issues",
  "Writing up what to fix first",
];

const EXAMPLES = ["mktbox.xyz", "github.com", "bbc.com"];

const RATING_WORD: Record<Rating, string> = { good: "Good", ok: "Needs work", poor: "Poor" };

export function SpeedStudio() {
  const [input, setInput] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const run = useRef(0);

  async function audit(url = input, s = strategy) {
    if (!url.trim()) return;
    const id = ++run.current;
    setRunning(true);
    setError("");
    setReport(null);
    const params = new URLSearchParams({ url: url.trim(), strategy: s });
    // `?demo` on the page URL uses saved sample data (local development only)
    if (new URLSearchParams(window.location.search).has("demo")) params.set("demo", "1");
    try {
      const res = await fetch(`/api/speed?${params}`);
      const data = await res.json();
      if (id !== run.current) return;
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      else setReport(data);
    } catch {
      if (id === run.current) setError("Couldn't reach the audit service. Check your connection.");
    } finally {
      if (id === run.current) setRunning(false);
    }
  }

  return (
    <div className={styles.studio}>
      <form
        className={`${ui.panel} ${styles.searchPanel}`}
        style={{ animationDelay: "0.2s" }}
        onSubmit={(e) => {
          e.preventDefault();
          audit();
        }}
      >
        <div className={styles.searchRow}>
          <input className={styles.searchInput} value={input} placeholder="yourwebsite.com" spellCheck={false} inputMode="url" onChange={(e) => setInput(e.target.value)} />
          <button className={ui.primary} disabled={!input.trim() || running}>
            {running ? "Auditing…" : "Run audit"}
          </button>
        </div>
        <div className={styles.optionsRow}>
          <div className={ui.segment}>
            {(
              [
                ["mobile", "Phone"],
                ["desktop", "Desktop"],
              ] as const
            ).map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={strategy === id ? ui.on : ""}
                onClick={() => {
                  setStrategy(id);
                  if (report || error) audit(input, id);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span className={styles.note}>Powered by Google Lighthouse, explained in plain English.</span>
          {!report && !running && (
            <div className={styles.examples}>
              <span>Try</span>
              {EXAMPLES.map((ex) => (
                <button
                  type="button"
                  key={ex}
                  onClick={() => {
                    setInput(ex);
                    audit(ex);
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {running && <Progress />}
      {error && !running && <div className={styles.error}>{error}</div>}
      {report && !running && <Results report={report} onSwitch={() => audit(input, report.strategy === "mobile" ? "desktop" : "mobile")} />}
    </div>
  );
}

/* ---------- progress ---------- */

function Progress() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const i = setInterval(() => setT((Date.now() - start) / 1000), 200);
    return () => clearInterval(i);
  }, []);
  const step = Math.min(STEPS.length - 1, Math.floor(t / 5));
  const pct = 92 * (1 - Math.exp(-t / 14)); // eases toward the end, never claims 100% early
  return (
    <div className={styles.progress}>
      <div className={styles.progressHead}>
        <b>Running the audit</b>
        <span>{t > 60 ? `${Math.floor(t)} s · big sites can take up to 2 minutes` : `${Math.floor(t)} s · usually 20 to 60 s`}</span>
      </div>
      <div className={styles.track}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <ul className={styles.steps}>
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? styles.done : i === step ? styles.now : ""}>
            <span className={styles.dot} />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- results ---------- */

function Results({ report, onSwitch }: { report: Report; onSwitch: () => void }) {
  const { scores } = report;
  const totalSave = report.fixes.slice(0, 3).reduce((a, f) => a + f.savingsMs, 0);
  const device = report.strategy === "mobile" ? "phones" : "desktop";
  const verdict =
    scores.performance >= 90
      ? `Fast on ${device}. Nice work.`
      : scores.performance >= 50
        ? `Okay on ${device}, but there's room to be faster.`
        : `Slow on ${device}. Visitors may leave before it loads.`;

  return (
    <div className={styles.results}>
      <section className={`${styles.card} ${styles.hero}`}>
        <div className={`${styles.device} ${report.strategy === "desktop" ? styles.desktop : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {report.screenshot ? <img src={report.screenshot} alt="How the page looked when the audit finished" /> : <span />}
        </div>
        <div className={styles.heroBody}>
          <p className={styles.url}>{report.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
          <h2 className={styles.verdict}>{verdict}</h2>
          {totalSave > 300 && (
            <p className={styles.sub}>
              Fixing the top {Math.min(3, report.fixes.length)} items below could make it load about <b>{(totalSave / 1000).toFixed(1)} s</b> faster.
            </p>
          )}
          <div className={styles.rings}>
            <Ring label="Speed" value={scores.performance} delay={0} />
            <Ring label="SEO" value={scores.seo} delay={120} />
            <Ring label="Accessibility" value={scores.accessibility} delay={240} />
            <Ring label="Best practices" value={scores.bestPractices} delay={360} />
          </div>
          <button className={ui.textBtn} onClick={onSwitch}>
            Check {report.strategy === "mobile" ? "desktop" : "phone"} too
          </button>
        </div>
      </section>

      {report.field && (
        <section className={styles.card} style={{ animationDelay: "120ms" }}>
          <div className={styles.cardHead}>
            <h3>What real visitors experience</h3>
            <Pill rating={report.field.overall} />
          </div>
          <p className={styles.cardNote}>From Chrome users who visited in the last 28 days.</p>
          <div className={styles.metrics}>
            {report.field.metrics.map((m) => (
              <Metric key={m.id} label={m.label} display={m.display} rating={m.rating} />
            ))}
          </div>
        </section>
      )}

      <section className={styles.card} style={{ animationDelay: "200ms" }}>
        <div className={styles.cardHead}>
          <h3>How it loads in our test</h3>
        </div>
        <div className={styles.metrics}>
          {report.lab.map((m) => (
            <Metric key={m.id} label={m.label} display={m.display} rating={m.rating} hint={m.hint} />
          ))}
        </div>
      </section>

      <section className={styles.card} style={{ animationDelay: "280ms" }}>
        <div className={styles.cardHead}>
          <h3>Fix these first</h3>
          <span className={styles.count}>{report.fixes.length}</span>
        </div>
        {report.fixes.length === 0 ? (
          <p className={styles.cardNote}>Nothing big to fix. This page is in good shape.</p>
        ) : (
          <ol className={styles.fixes}>
            {report.fixes.map((f, i) => (
              <Fix key={f.id} fix={f} index={i} />
            ))}
          </ol>
        )}
      </section>

      <div className={styles.split}>
        <section className={styles.card} style={{ animationDelay: "360ms" }}>
          <div className={styles.cardHead}>
            <h3>SEO basics</h3>
            <span className={styles.count}>
              {report.seo.filter((s) => s.pass).length}/{report.seo.length}
            </span>
          </div>
          <ul className={styles.checks}>
            {[...report.seo]
              .sort((a, b) => Number(a.pass) - Number(b.pass))
              .map((s) => (
                <li key={s.id} className={s.pass ? styles.pass : styles.fail}>
                  <span className={styles.mark} aria-label={s.pass ? "Passed" : "Failed"} />
                  {s.title}
                </li>
              ))}
          </ul>
        </section>
        <section className={styles.card} style={{ animationDelay: "440ms" }}>
          <div className={styles.cardHead}>
            <h3>Other issues</h3>
            <span className={styles.count}>{report.issues.length}</span>
          </div>
          {report.issues.length === 0 ? (
            <p className={styles.cardNote}>No accessibility or best-practice issues found.</p>
          ) : (
            <ul className={styles.checks}>
              {report.issues.map((s) => (
                <li key={s.id} className={styles.fail}>
                  <span className={styles.mark} />
                  <span>
                    {s.title}
                    <small>{s.area}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Ring({ label, value, delay }: { label: string; value: number; delay: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / 1100));
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className={`${styles.ring} ${styles[rate100(value)]}`}>
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
        <circle cx="42" cy="42" r={r} className={styles.ringBg} />
        <circle cx="42" cy="42" r={r} className={styles.ringFg} strokeDasharray={c} strokeDashoffset={c * (1 - n / 100)} />
      </svg>
      <b>{n}</b>
      <span>{label}</span>
    </div>
  );
}

function Pill({ rating }: { rating: Rating }) {
  return <span className={`${styles.pill} ${styles[rating]}`}>{RATING_WORD[rating]}</span>;
}

function Metric({ label, display, rating, hint }: { label: string; display: string; rating: Rating; hint?: string }) {
  return (
    <div className={`${styles.metric} ${styles[rating]}`} title={hint}>
      <span className={styles.metricLabel}>{label}</span>
      <b>{display}</b>
      <span className={styles.metricRating}>
        <i />
        {RATING_WORD[rating]}
      </span>
    </div>
  );
}

function Fix({ fix, index }: { fix: Report["fixes"][number]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const save = fix.savingsMs >= 100 ? `−${(fix.savingsMs / 1000).toFixed(1)} s` : fix.savingsBytes > 10240 ? `−${Math.round(fix.savingsBytes / 1024)} KB` : "";
  return (
    <li className={`${styles.fix} ${open ? styles.open : ""}`}>
      <button className={styles.fixHead} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={styles.fixNum}>{index + 1}</span>
        <span className={styles.fixTitle}>{fix.title}</span>
        {save && <span className={styles.save}>{save}</span>}
        <span className={styles.chev} aria-hidden />
      </button>
      <div className={styles.fixBody}>
        <div>
          {fix.why && <p>{fix.why}</p>}
          {fix.items.length > 0 && (
            <ul>
              {fix.items.map((it, i) => (
                <li key={i}>
                  <span>{it.label}</span>
                  {it.detail && <em>{it.detail}</em>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
