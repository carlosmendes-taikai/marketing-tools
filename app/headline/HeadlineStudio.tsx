"use client";

import { useEffect, useMemo, useState } from "react";
import { analyze, CONTEXTS, type Analysis, type Context, type WordKind } from "@/lib/headline";
import ui from "@/components/tool.module.css";
import styles from "./headline.module.css";

const HISTORY_KEY = "headline-history-v1";
type Saved = { text: string; context: Context; score: number };

const KIND_LABEL: Record<WordKind, string> = { power: "Power", emotional: "Emotional", uncommon: "Uncommon", common: "Common" };
const KIND_TARGET: Record<WordKind, string> = { power: "at least one", emotional: "10 to 15%", uncommon: "10 to 45%", common: "20 to 30%" };

export function HeadlineStudio() {
  const [text, setText] = useState("");
  const [context, setContext] = useState<Context>("seo");
  const [history, setHistory] = useState<Saved[]>([]);

  useEffect(() => {
    let saved: Saved[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    } catch {}
    queueMicrotask(() => setHistory(saved));
  }, []);

  const a = useMemo(() => analyze(text, context), [text, context]);
  const has = a.text.length > 0;

  function remember() {
    if (!has) return;
    const next = [{ text: a.text, context, score: a.score }, ...history.filter((h) => !(h.text === a.text && h.context === context))].slice(0, 10);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  return (
    <div className={styles.studio}>
      <section className={`${ui.panel} ${styles.inputPanel}`} style={{ animationDelay: "0.2s" }}>
        <div className={ui.segment}>
          {CONTEXTS.map((c) => (
            <button key={c.id} className={context === c.id ? ui.on : ""} onClick={() => setContext(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <textarea
          className={styles.input}
          rows={2}
          value={text}
          placeholder="Type your headline"
          onChange={(e) => setText(e.target.value.replace(/\n/g, " "))}
          onBlur={remember}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              remember();
            }
          }}
        />
        {has && (
          <p className={styles.words} aria-label="Your headline, coloured by word type">
            {a.words.map((w, i) => (
              <span key={i} className={styles[w.kind]}>
                {w.word}
              </span>
            ))}
          </p>
        )}
      </section>

      {has ? (
        <div className={styles.grid}>
          <section className={`${styles.card} ${styles.scoreCard}`}>
            <Ring value={a.score} />
            <div>
              <h2 className={styles[`g_${a.grade.replace(" ", "")}`]}>{a.grade}</h2>
              <dl className={styles.facts}>
                <div>
                  <dt>Type</dt>
                  <dd>{a.type}</dd>
                </div>
                <div>
                  <dt>Tone</dt>
                  <dd>{a.sentiment}</dd>
                </div>
                <div>
                  <dt>Length</dt>
                  <dd>
                    {a.chars} chars · {a.words.length} words
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className={styles.card} style={{ animationDelay: "60ms" }}>
            <h3>Word balance</h3>
            <div className={styles.bars}>
              {(["power", "emotional", "uncommon", "common"] as WordKind[]).map((k) => (
                <div key={k} className={styles.barRow}>
                  <span className={`${styles.dot} ${styles[k]}`} />
                  <span className={styles.barLabel}>{KIND_LABEL[k]}</span>
                  <div className={styles.track}>
                    <i className={styles[k]} style={{ width: `${Math.round(a.balance[k] * 100)}%` }} />
                  </div>
                  <span className={styles.pct}>{Math.round(a.balance[k] * 100)}%</span>
                  <small>{KIND_TARGET[k]}</small>
                </div>
              ))}
            </div>
          </section>

          <section className={`${styles.card} ${styles.wide}`} style={{ animationDelay: "120ms" }}>
            <h3>How to make it better</h3>
            <ul className={styles.checks}>
              {a.checks.map((c, i) => (
                <li key={c.title} className={styles[c.level]} style={{ animationDelay: `${i * 40}ms` }}>
                  <span className={styles.mark} />
                  <div>
                    <b>{c.title}</b>
                    {c.tip && c.level !== "pass" && <span>{c.tip}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${styles.card} ${styles.wide}`} style={{ animationDelay: "180ms" }}>
            <h3>How it looks</h3>
            <Previews a={a} context={context} />
            {a.lastWords && (
              <p className={styles.skim}>
                People skim the first and last words: <b>{a.firstWords}</b> … <b>{a.lastWords}</b>. Do they tell the story on their own?
              </p>
            )}
          </section>
        </div>
      ) : (
        <p className={styles.empty}>Your score, word balance and previews appear as you type. Try a few versions and compare them below.</p>
      )}

      {history.length > 0 && (
        <section className={`${ui.panel} ${styles.history}`}>
          <h2>Versions you tried</h2>
          <ul>
            {[...history]
              .sort((x, y) => y.score - x.score)
              .map((h) => (
                <li key={h.context + h.text}>
                  <button
                    onClick={() => {
                      setText(h.text);
                      setContext(h.context);
                    }}
                  >
                    <span className={`${styles.pill} ${h.score >= 80 ? styles.pass : h.score >= 65 ? styles.warn : styles.fail}`}>{h.score}</span>
                    <span className={styles.histText}>{h.text}</span>
                    <small>{CONTEXTS.find((c) => c.id === h.context)?.label}</small>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = value >= 80 ? styles.pass : value >= 65 ? styles.warn : styles.fail;
  return (
    <div className={`${styles.ring} ${tone}`}>
      <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden>
        <circle cx="64" cy="64" r={r} className={styles.ringBg} />
        <circle cx="64" cy="64" r={r} className={styles.ringFg} strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <b>{value}</b>
    </div>
  );
}

function Previews({ a, context }: { a: Analysis; context: Context }) {
  const cut = (s: string, n: number) => ([...s].length > n ? [...s].slice(0, n - 1).join("").trimEnd() + "…" : s);
  const google = (
    <div key="g" className={styles.pv}>
      <small>Google</small>
      <div className={styles.google}>
        <span className={styles.gSite}>yoursite.com › blog</span>
        <span className={styles.gTitle}>{cut(a.text, 60)}</span>
        <span className={styles.gLine} />
        <span className={styles.gLine} style={{ width: "70%" }} />
      </div>
    </div>
  );
  const inbox = (
    <div key="e" className={styles.pv}>
      <small>Phone inbox</small>
      <div className={styles.inbox}>
        <span className={styles.avatar}>Y</span>
        <div>
          <div className={styles.inboxTop}>
            <b>Your brand</b>
            <span>9:41</span>
          </div>
          <span className={styles.subject}>{cut(a.text, 40)}</span>
          <span className={styles.gLine} style={{ width: "85%" }} />
        </div>
      </div>
    </div>
  );
  const linkedin = (
    <div key="l" className={styles.pv}>
      <small>LinkedIn feed</small>
      <div className={styles.li}>
        <div className={styles.liHead}>
          <span className={styles.avatar}>Y</span>
          <span className={styles.gLine} style={{ width: 90 }} />
        </div>
        <p className={styles.liText}>
          {a.text}
          <span className={styles.more}>…more</span>
        </p>
      </div>
    </div>
  );
  const ad = (
    <div key="a" className={styles.pv}>
      <small>Search ad</small>
      <div className={styles.google}>
        <span className={styles.gSite}>
          <b>Sponsored</b> · yoursite.com
        </span>
        <span className={styles.gTitle}>{cut(a.text, 30)}</span>
        <span className={styles.gLine} />
      </div>
    </div>
  );
  const order = { seo: [google, linkedin, inbox], linkedin: [linkedin, google, inbox], email: [inbox, google, linkedin], ad: [ad, google, linkedin] }[context];
  return <div className={styles.previews}>{order}</div>;
}
