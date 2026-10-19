"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyze, CONTEXTS, FORMULAS, PART_LABEL, type Analysis, type Context, type WordKind } from "@/lib/headline";
import { brandOf, cutToWidth, DESC_PX, pageChecks, TITLE_PX, type PageTitleInfo } from "@/lib/title-check";
import ui from "@/components/tool.module.css";
import styles from "./headline.module.css";

const HISTORY_KEY = "headline-history-v1";
type Saved = { text: string; context: Context; score: number };

const KIND_LABEL: Record<WordKind, string> = { power: "Power", emotional: "Emotional", uncommon: "Uncommon", common: "Common" };
const FORMAT_NAME: Record<Context, string> = { seo: "blog and SEO titles", linkedin: "LinkedIn hooks", email: "email subjects", ad: "ad headlines" };
const tone = (v: number) => (v >= 80 ? styles.pass : v >= 65 ? styles.warn : styles.fail);

export function HeadlineStudio() {
  const [text, setText] = useState("");
  const [context, setContext] = useState<Context>("seo");
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<Saved[]>([]);
  const input = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"write" | "site">("write");
  const [site, setSite] = useState("");
  const [page, setPage] = useState<PageTitleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkSite(address: string) {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/title?url=${encodeURIComponent(address.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setPage(data);
      setContext("seo");
      setText(data.title.slice(0, 300));
    } catch (e) {
      setPage(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let saved: Saved[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    } catch {}
    queueMicrotask(() => setHistory(saved));
  }, []);

  // The browser extension and other tools can hand over a value: ?text=... or a page to check: ?url=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("text");
    const address = params.get("url");
    if (address)
      queueMicrotask(() => {
        setMode("site");
        setSite(address);
        checkSite(address);
      });
    else if (value) queueMicrotask(() => setText(value.slice(0, 300)));
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

  function pickFormula(example: string) {
    remember();
    setText(example);
    window.scrollTo({ top: 0, behavior: "smooth" });
    input.current?.focus();
  }

  function clear() {
    remember();
    setText("");
    input.current?.focus();
  }

  return (
    <div className={styles.studio}>
      <div className={`${ui.segment} ${styles.modeSwitch}`}>
        <button className={mode === "write" ? ui.on : ""} onClick={() => setMode("write")}>
          Write a headline
        </button>
        <button
          className={mode === "site" ? ui.on : ""}
          onClick={() => {
            setMode("site");
            setContext("seo");
          }}
        >
          Check a website title
        </button>
      </div>

      <section className={`${ui.panel} ${styles.inputPanel}`} style={{ animationDelay: "0.2s" }}>
        {mode === "site" && (
          <form
            className={styles.siteForm}
            onSubmit={(e) => {
              e.preventDefault();
              checkSite(site);
            }}
          >
            <input value={site} placeholder="Paste a page address, like yoursite.com/pricing" spellCheck={false} inputMode="url" onChange={(e) => setSite(e.target.value)} />
            <button className={ui.primary} disabled={!site.trim() || loading}>
              {loading ? "Checking…" : "Check"}
            </button>
          </form>
        )}
        {mode === "site" && error && <p className={styles.siteError}>{error}</p>}
        {mode === "site" && page && <span className={styles.siteLabel}>Page title. Edit it to try a better version:</span>}
        <div className={styles.topRow} hidden={mode === "site"}>
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
        <div className={styles.inputWrap} hidden={mode === "site" && !page}>
          <textarea
            ref={input}
            className={styles.input}
            rows={2}
            value={text}
            placeholder={mode === "site" ? "This page has no title" : "Type your headline"}
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

      {mode === "site" && page && <SiteCheck page={page} title={text} />}

      {mode === "site" && !page ? (
        <p className={styles.empty}>{loading ? "Reading the page…" : "Paste any page to see how its title and description look in Google, and what to fix."}</p>
      ) : has ? (
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

          <Formulas context={context} onPick={pickFormula} className={styles.wide} />

          <section className={`${styles.card} ${styles.wide}`} style={{ animationDelay: "180ms" }}>
            <h3>How it looks</h3>
            <Previews a={a} context={context} site={mode === "site" && !!page} />
            {a.lastWords && (
              <p className={styles.skim}>
                People skim the first and last words: <b>{a.firstWords}</b> … <b>{a.lastWords}</b>. Do they tell the story on their own?
              </p>
            )}
          </section>
        </div>
      ) : (
        <>
          <p className={styles.empty}>Type a headline, or start from one of the formulas below.</p>
          <Formulas context={context} onPick={pickFormula} />
        </>
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

/** A live page's Google result, drawn with the same widths Google uses, plus what to fix on the page. */
function SiteCheck({ page, title }: { page: PageTitleInfo; title: string }) {
  const checks = pageChecks(page, title);
  const u = new URL(page.finalUrl);
  const crumbs = [u.hostname.replace(/^www\./, ""), ...u.pathname.split("/").filter(Boolean)].join(" › ");
  const issues = checks.filter((c) => c.level !== "pass").length;
  return (
    <div className={styles.grid}>
      <section className={`${styles.card} ${styles.wide}`}>
        <div className={styles.siteHead}>
          <h3>In Google, today</h3>
          <span>{issues ? `${issues} thing${issues === 1 ? "" : "s"} to fix` : "Looks good"}</span>
        </div>
        <div className={`${styles.google} ${styles.serp}`}>
          <div className={styles.serpSite}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.favicon} alt="" width={26} height={26} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            <div>
              <b>{brandOf(page)}</b>
              <span>{crumbs}</span>
            </div>
          </div>
          <span className={styles.gTitle}>{title.trim() ? cutToWidth(title.trim(), TITLE_PX, "title") : <i>No title</i>}</span>
          <span className={styles.gDesc}>{page.description ? cutToWidth(page.description, DESC_PX, "description") : <i>No description. Google picks text from the page.</i>}</span>
        </div>
        <ul className={`${styles.checks} ${styles.siteChecks}`}>
          {checks.map((c, i) => (
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
    </div>
  );
}

/** Proven patterns for the chosen format, each with a worked example and its live score. */
function Formulas({ context, onPick, className = "" }: { context: Context; onPick: (example: string) => void; className?: string }) {
  return (
    <section className={`${ui.panel} ${styles.formulas} ${className}`}>
      <h2>Formulas that work</h2>
      <p className={styles.formulaNote}>Patterns that consistently win clicks for {FORMAT_NAME[context]}. Pick one and swap in your own details.</p>
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

function Previews({ a, context, site }: { a: Analysis; context: Context; site?: boolean }) {
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
  // a checked website already shows its real Google result above
  return <div className={styles.previews}>{site ? order.filter((el) => el !== google) : order}</div>;
}
