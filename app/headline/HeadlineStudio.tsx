"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyze, CONTEXTS, FORMULAS, PART_LABEL, type Analysis, type Context, type WordKind } from "@/lib/headline";
import ui from "@/components/tool.module.css";
import styles from "./headline.module.css";

const HISTORY_KEY = "headline-history-v1";
type Saved = { text: string; context: Context; score: number };

const KIND_LABEL: Record<WordKind, string> = { power: "Power", emotional: "Emotional", uncommon: "Uncommon", common: "Common" };
const tone = (v: number) => (v >= 80 ? styles.pass : v >= 65 ? styles.warn : styles.fail);

export function HeadlineStudio() {
  const [text, setText] = useState("");
  const [context, setContext] = useState<Context>("seo");
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<Saved[]>([]);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let saved: Saved[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    } catch {}
    queueMicrotask(() => setHistory(saved));
  }, []);

  const a = useMemo(() => analyze(text, context, keyword), [text, context, keyword]);
  const has = a.text.length > 0;

  function remember(t = a.text, s = a.score) {
    if (!t) return;
    const next = [{ text: t, context, score: s }, ...history.filter((h) => !(h.text === t && h.context === context))].slice(0, 10);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  function clear() {
    remember();
    setText("");
    input.current?.focus();
  }

  return (
    <div className={styles.studio}>
      <section className={`${ui.panel} ${styles.inputPanel}`} style={{ animationDelay: "0.2s" }}>
        <div className={styles.topRow}>
          <div className={ui.segment}>
            {CONTEXTS.map((c) => (
              <button key={c.id} className={context === c.id ? ui.on : ""} onClick={() => setContext(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          {context === "seo" && (
            <input className={styles.keyword} value={keyword} placeholder="Target keyword (optional)" spellCheck={false} onChange={(e) => setKeyword(e.target.value)} />
          )}
        </div>
        <div className={styles.inputWrap}>
          <textarea
            ref={input}
            className={styles.input}
            rows={2}
            value={text}
            placeholder="Type your headline"
            onChange={(e) => setText(e.target.value.replace(/\n/g, " "))}
            onBlur={() => remember()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                remember();
              }
            }}
          />
          {text && (
            <button className={styles.clear} onClick={clear} aria-label="Clear headline" title="Clear">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        {has && (
          <div className={styles.wordsRow}>
            <p className={styles.words} aria-label="Your headline, coloured by word type">
              {a.words.map((w, i) => (
                <span key={i} className={styles[w.kind]}>
                  {w.word}
                </span>
              ))}
            </p>
            <div className={styles.legend}>
              {(["power", "emotional", "uncommon", "common"] as WordKind[]).map((k) => (
                <span key={k}>
                  <i className={styles[k]} />
                  {KIND_LABEL[k]}
                </span>
              ))}
            </div>
          </div>
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
                  <dt>Length</dt>
                  <dd>
                    {a.chars} chars · {a.words.length} words
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className={styles.card} style={{ animationDelay: "60ms" }}>
            <h3>Score breakdown</h3>
            <div className={styles.bars}>
              {[...a.parts]
                .sort((x, y) => y.weight - x.weight)
                .map((p) => {
                  const pct = Math.round(p.value * 100);
                  return (
                    <div key={p.id} className={styles.barRow}>
                      <span className={styles.barLabel}>{PART_LABEL[p.id]}</span>
                      <div className={styles.track}>
                        <i className={tone(pct)} style={{ width: `${Math.max(3, pct)}%` }} />
                      </div>
                      <span className={styles.pct}>{pct}</span>
                    </div>
                  );
                })}
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
        <p className={styles.empty}>Type a headline, or start from one of the formulas below.</p>
      )}

      <Formulas
        context={context}
        onPick={(example) => {
          remember();
          setText(example);
          window.scrollTo({ top: 0, behavior: "smooth" });
          input.current?.focus();
        }}
      />

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
                    <span className={`${styles.pill} ${tone(h.score)}`}>{h.score}</span>
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

/** Proven patterns for the chosen format, each with a worked example and its live score. */
function Formulas({ context, onPick }: { context: Context; onPick: (example: string) => void }) {
  return (
    <section className={`${ui.panel} ${styles.formulas}`}>
      <h2>Formulas that work</h2>
      <p className={styles.formulaNote}>Patterns that consistently win clicks for {CONTEXTS.find((c) => c.id === context)!.label.toLowerCase()}s. Pick one and swap in your own details.</p>
      <ul key={context}>
        {FORMULAS[context].map((f, i) => {
          const score = analyze(f.example, context).score;
          return (
            <li key={f.example} style={{ animationDelay: `${i * 50}ms` }}>
              <button onClick={() => onPick(f.example)}>
                <span className={styles.formula}>
                  {f.formula.split(/(\[[^\]]+\])/).map((part, j) =>
                    part.startsWith("[") ? (
                      <em key={j}>{part.slice(1, -1)}</em>
                    ) : (
                      <span key={j}>{part}</span>
                    ),
                  )}
                </span>
                <span className={styles.example}>{f.example}</span>
                <span className={`${styles.pill} ${tone(score)}`}>{score}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className={`${styles.ring} ${tone(value)}`}>
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
          <span className={styles.subject}>{cut(a.text.replace(/\{first_name\}/i, "Sam"), 40)}</span>
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
