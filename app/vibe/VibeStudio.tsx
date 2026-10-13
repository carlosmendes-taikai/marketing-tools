"use client";

import { useEffect, useRef, useState } from "react";
import { rate100 } from "@/lib/speed";
import type { Check, VibeReport } from "@/lib/vibe";
import ui from "@/components/tool.module.css";
import speed from "../speed/speed.module.css";
import styles from "./vibe.module.css";

const STEPS = ["Loading the page the way Google sees it", "Reading the app's code files", "Looking for leaked secret keys", "Checking browser security settings", "Weighing what has to download", "Writing up what to fix first"];

const STATUS_WORD: Record<Check["status"], string> = { fail: "Fix", warn: "Improve", info: "Check", pass: "Good" };

export function VibeStudio() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState<VibeReport | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const run = useRef(0);

  // The browser extension and other tools can hand over a value: ?url=...
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("url");
    if (value)
      queueMicrotask(() => {
        setInput(value);
        audit(value);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  async function audit(url = input) {
    if (!url.trim()) return;
    const id = ++run.current;
    setRunning(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch(`/api/vibe?url=${encodeURIComponent(url.trim())}`);
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
    <div className={speed.studio}>
      <form
        className={`${ui.panel} ${speed.searchPanel}`}
        style={{ animationDelay: "0.2s" }}
        onSubmit={(e) => {
          e.preventDefault();
          audit();
        }}
      >
        <div className={speed.searchRow}>
          <input className={speed.searchInput} value={input} placeholder="yourapp.lovable.app" spellCheck={false} inputMode="url" onChange={(e) => setInput(e.target.value)} />
          <button className={ui.primary} disabled={!input.trim() || running}>
            {running ? "Auditing…" : "Run audit"}
          </button>
        </div>
        <div className={speed.optionsRow}>
          <span className={speed.note}>For apps built with Lovable, Base44, Bolt, v0, Replit and others. We only read what any browser can see.</span>
        </div>
      </form>

      {running && <Progress />}
      {error && !running && <div className={speed.error}>{error}</div>}
      {report && !running && <Results report={report} />}
    </div>
  );
}

/* ---------- progress ---------- */

function Progress() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const i = setInterval(() => setT((Date.now() - start) / 1000), 150);
    return () => clearInterval(i);
  }, []);
  const step = Math.min(STEPS.length - 1, Math.floor(t / 1.4));
  const pct = 94 * (1 - Math.exp(-t / 4));
  return (
    <div className={speed.progress}>
      <div className={speed.progressHead}>
        <b>Auditing the app</b>
        <span>{Math.floor(t)} s · usually 5 to 15 s</span>
      </div>
      <div className={speed.track}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <ul className={speed.steps}>
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? speed.done : i === step ? speed.now : ""}>
            <span className={speed.dot} />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- results ---------- */

function Results({ report }: { report: VibeReport }) {
  const todo = report.checks.filter((c) => c.status === "fail" || c.status === "warn");
  const info = report.checks.filter((c) => c.status === "info");
  const good = report.checks.filter((c) => c.status === "pass");
  const leaked = report.checks.some((c) => (c.id === "secrets" || c.id === "exposed-files") && c.status === "fail");
  const verdict = leaked
    ? "Fix the leaked secrets first. Everything else can wait."
    : report.score >= 85
      ? "In good shape. Just a few things to tidy up."
      : report.score >= 60
        ? "Solid, but a few things are holding it back."
        : "Some important problems to fix before you share it widely.";
  const builtWith = [report.platform && `Built with ${report.platform.name}`, report.backend.length && `${report.backend.join(" and ")} backend`].filter(Boolean).join(" · ");

  return (
    <div className={speed.results}>
      <section className={`${speed.card} ${styles.hero}`}>
        <div>
          <p className={speed.url}>{report.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
          <h2 className={speed.verdict}>{verdict}</h2>
          <p className={speed.sub}>
            {builtWith || "We couldn't tell which tool built it, so the tips below are general."}
            {todo.length > 0 && ` · ${todo.length} ${todo.length === 1 ? "thing" : "things"} to fix`}
          </p>
        </div>
        <div className={speed.rings}>
          <Ring label="Overall" value={report.score} delay={0} />
          <Ring label="SEO" value={report.scores.seo} delay={120} />
          <Ring label="Security" value={report.scores.security} delay={240} />
          <Ring label="Speed" value={report.scores.speed} delay={360} />
        </div>
      </section>

      <LoadSpeed url={report.url} />

      <section className={speed.card} style={{ animationDelay: "160ms" }}>
        <div className={speed.cardHead}>
          <h3>Fix these first</h3>
          <span className={speed.count}>{todo.length}</span>
        </div>
        {todo.length === 0 ? (
          <p className={speed.cardNote}>Nothing to fix from the outside. Nice work.</p>
        ) : (
          <ol className={speed.fixes}>
            {todo.map((c, i) => (
              <Item key={c.id} check={c} index={i} />
            ))}
          </ol>
        )}
      </section>

      {(info.length > 0 || report.tips.length > 0) && (
        <section className={speed.card} style={{ animationDelay: "240ms" }}>
          <div className={speed.cardHead}>
            <h3>{report.platform ? `Tips for ${report.platform.name} apps` : "Worth checking yourself"}</h3>
          </div>
          {info.map((c) => (
            <div key={c.id} className={styles.note}>
              <b>{c.title}</b>
              <p>{c.detail}</p>
              {c.fix && <p className={styles.fix}>{c.fix}</p>}
            </div>
          ))}
          {report.tips.length > 0 && (
            <ul className={styles.tips}>
              {report.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className={speed.card} style={{ animationDelay: "320ms" }}>
        <div className={speed.cardHead}>
          <h3>Already good</h3>
          <span className={speed.count}>{good.length}</span>
        </div>
        <ul className={speed.checks}>
          {good.map((c) => (
            <li key={c.id} className={speed.pass}>
              <span className={speed.mark} aria-label="Passed" />
              <span>
                {c.title}
                <small>{c.detail}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.scope}>
        This audit reads your live app from the outside: the page, its code files and a few standard files. It doesn&apos;t log in, send data or test your database. Use it
        alongside your platform&apos;s own security scan.
      </p>
    </div>
  );
}

/** Google's lab speed score, fetched after the main report because it takes longer. */
function LoadSpeed({ url }: { url: string }) {
  const [state, setState] = useState<{ score: number } | "loading" | "error">("loading");
  useEffect(() => {
    let live = true;
    fetch(`/api/speed?url=${encodeURIComponent(url)}&strategy=mobile`)
      .then(async (res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => live && setState({ score: data.scores.performance }))
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [url]);
  if (state === "error") return null;
  return (
    <section className={`${speed.card} ${styles.load}`} style={{ animationDelay: "80ms" }}>
      {state === "loading" ? (
        <>
          <span className={styles.spinner} aria-hidden />
          <p>
            <b>Measuring load speed on a phone…</b> Google&apos;s test takes 20 to 60 seconds. The rest of the report is ready below.
          </p>
        </>
      ) : (
        <>
          <b className={`${styles.loadScore} ${styles[rate100(state.score)]}`}>{state.score}</b>
          <p>
            <b>Google speed score on phones.</b>{" "}
            {state.score >= 90 ? "Fast." : state.score >= 50 ? "Okay, with room to improve." : "Slow: visitors may leave before it loads."}
          </p>
          <a className={ui.textBtn} href={`/speed?url=${encodeURIComponent(url)}`}>
            Full speed report →
          </a>
        </>
      )}
    </section>
  );
}

function Item({ check, index }: { check: Check; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <li className={`${speed.fix} ${open ? speed.open : ""}`}>
      <button className={speed.fixHead} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={speed.fixNum}>{index + 1}</span>
        <span className={speed.fixTitle}>{check.title}</span>
        <span className={`${styles.tag} ${styles[check.status]}`}>
          {STATUS_WORD[check.status]} · {check.category === "seo" ? "SEO" : check.category === "security" ? "Security" : "Speed"}
        </span>
        <span className={speed.chev} aria-hidden />
      </button>
      <div className={speed.fixBody}>
        <div>
          <p>{check.detail}</p>
          {check.items && (
            <ul>
              {check.items.map((it) => (
                <li key={it}>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )}
          {check.fix && (
            <p className={styles.fix}>
              <b>How to fix it:</b> {check.fix}
            </p>
          )}
        </div>
      </div>
    </li>
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
    <div className={`${speed.ring} ${speed[rate100(value)]}`}>
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
        <circle cx="42" cy="42" r={r} className={speed.ringBg} />
        <circle cx="42" cy="42" r={r} className={speed.ringFg} strokeDasharray={c} strokeDashoffset={c * (1 - n / 100)} />
      </svg>
      <b>{n}</b>
      <span>{label}</span>
    </div>
  );
}
