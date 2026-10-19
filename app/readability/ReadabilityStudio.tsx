"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { analyze, AUDIENCES, EXAMPLE, KIND_INFO, type AudienceId, type Mark, type MarkKind } from "@/lib/readability";
import ui from "@/components/tool.module.css";
import styles from "./readability.module.css";

const DRAFT_KEY = "readability-draft-v1";
const ORDER: MarkKind[] = ["veryLong", "long", "passive", "simpler", "buzzword", "filler", "adverb"];
const minutes = (m: number) => (m < 1 ? `${Math.max(1, Math.round(m * 60))} sec` : `${Math.round(m * 10) / 10} min`);

export function ReadabilityStudio() {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<AudienceId>("everyone");
  const [hidden, setHidden] = useState<Set<MarkKind>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let draft = "";
    try {
      draft = localStorage.getItem(DRAFT_KEY) ?? "";
    } catch {}
    const handed = new URLSearchParams(window.location.search).get("text");
    queueMicrotask(() => {
      setText(handed ? handed.slice(0, 20000) : draft);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, text);
    } catch {}
  }, [text, loaded]);

  // the box grows with the text, so the highlights underneath never have to scroll
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const r = useMemo(() => analyze(text), [text]);
  const target = AUDIENCES.find((a) => a.id === audience)!;
  const has = r.words > 0;
  const counts = ORDER.map((k) => [k, r.marks.filter((m) => m.kind === k).length] as const).filter(([, n]) => n > 0);
  const shown = r.marks.filter((m) => !hidden.has(m.kind));
  const tone = !has ? "" : r.grade <= target.grade ? styles.good : r.grade <= target.grade + 2 ? styles.ok : styles.poor;

  const toggle = (k: MarkKind) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <div className={ui.studio}>
      <div className={ui.controls}>
        <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.2s" }}>
          <div className={styles.head}>
            <h2>Your text</h2>
            <div className={styles.headBtns}>
              {!text && (
                <button className={ui.textBtn} onClick={() => setText(EXAMPLE)}>
                  Try an example
                </button>
              )}
              {text && (
                <button className={ui.textBtn} onClick={() => setText("")}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className={styles.editor}>
            <div className={styles.backdrop} aria-hidden>
              <Marked text={text} marks={shown} />
              {"\n"}
            </div>
            <textarea
              ref={area}
              className={styles.input}
              value={text}
              rows={10}
              spellCheck
              placeholder="Paste a landing page, email, post or ad. Highlights show what to simplify as you type."
              onChange={(e) => setText(e.target.value.slice(0, 20000))}
              aria-label="Text to check"
            />
          </div>
          {counts.length > 0 && (
            <div className={styles.legend}>
              {counts.map(([k, n]) => (
                <button key={k} className={`${styles.chip} ${styles[`k_${k}`]} ${hidden.has(k) ? styles.off : ""}`} onClick={() => toggle(k)} aria-pressed={!hidden.has(k)}>
                  <i />
                  {n} {n === 1 ? KIND_INFO[k].label.toLowerCase() : KIND_INFO[k].plural}
                </button>
              ))}
            </div>
          )}
        </section>

        {shown.length > 0 && (
          <section className={`${ui.panel} ${styles.fixes}`}>
            <h2>What to fix</h2>
            <ul>
              {[...shown]
                .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.start - b.start)
                .slice(0, 40)
                .map((m) => (
                  <li key={`${m.kind}${m.start}`}>
                    <button
                      onClick={() => {
                        const el = area.current;
                        if (!el) return;
                        el.focus();
                        el.setSelectionRange(m.start, m.end);
                      }}
                    >
                      <span className={`${styles.tag} ${styles[`k_${m.kind}`]}`}>{KIND_INFO[m.kind].label}</span>
                      <span className={styles.fixText}>
                        {m.kind === "long" || m.kind === "veryLong" ? <i>{text.slice(m.start, m.start + 70).trim()}…</i> : null}
                        {m.tip}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>

      <aside className={ui.previewCol}>
        <div className={ui.previewCard}>
          <small className={styles.cap}>Written for</small>
          <div className={`${ui.segment} ${styles.aud}`}>
            {AUDIENCES.map((a) => (
              <button key={a.id} className={audience === a.id ? ui.on : ""} onClick={() => setAudience(a.id)}>
                {a.label}
              </button>
            ))}
          </div>
          <p className={styles.audNote}>
            {target.note} Aim for grade {target.grade} or lower.
          </p>

          <div className={`${styles.score} ${tone}`}>
            <div>
              <b>{has ? `Grade ${Math.round(r.grade)}` : "Grade –"}</b>
              <span>{has ? `${r.label} · reading ease ${r.ease}` : "Paste some text to see its level"}</span>
            </div>
            <div className={styles.meter} aria-hidden>
              <i style={{ width: `${has ? Math.min(100, (r.grade / 16) * 100) : 0}%` }} />
              <em style={{ left: `${(target.grade / 16) * 100}%` }} />
            </div>
            {has && <p className={styles.verdict}>{r.grade <= target.grade ? "Easy enough for this audience." : `About ${Math.ceil(r.grade - target.grade)} grade${Math.ceil(r.grade - target.grade) === 1 ? "" : "s"} too hard. Shorten the highlighted sentences first.`}</p>}
          </div>

          <dl className={styles.stats}>
            <div>
              <dt>Words</dt>
              <dd>{r.words}</dd>
            </div>
            <div>
              <dt>Sentences</dt>
              <dd>{r.sentences}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>{has ? minutes(r.readMin) : "–"}</dd>
            </div>
            <div>
              <dt>Speaking time</dt>
              <dd>{has ? minutes(r.speakMin) : "–"}</dd>
            </div>
            <div>
              <dt>Words per sentence</dt>
              <dd>{has ? r.avgSentence : "–"}</dd>
            </div>
            <div>
              <dt>Longest sentence</dt>
              <dd>{has ? `${r.longest} words` : "–"}</dd>
            </div>
          </dl>
          <p className={styles.small}>Everything runs in your browser. Your text isn&apos;t sent anywhere.</p>
        </div>
      </aside>
    </div>
  );
}

/** The text with its highlights. Sentence marks wrap word marks, so both can show at once. */
function Marked({ text, marks }: { text: string; marks: Mark[] }) {
  const sentences = marks.filter((m) => m.kind === "long" || m.kind === "veryLong");
  const words = marks.filter((m) => m.kind !== "long" && m.kind !== "veryLong");

  const wordsIn = (start: number, end: number): ReactNode[] => {
    const out: ReactNode[] = [];
    let at = start;
    for (const m of words) {
      if (m.end <= start || m.start >= end) continue;
      const s = Math.max(m.start, start);
      const e = Math.min(m.end, end);
      if (s > at) out.push(text.slice(at, s));
      out.push(
        <mark key={`${m.kind}${s}`} className={styles[`k_${m.kind}`]}>
          {text.slice(s, e)}
        </mark>,
      );
      at = e;
    }
    if (at < end) out.push(text.slice(at, end));
    return out;
  };

  const out: ReactNode[] = [];
  let at = 0;
  for (const s of sentences) {
    if (s.start > at) out.push(...wordsIn(at, s.start));
    out.push(
      <span key={`s${s.start}`} className={styles[`k_${s.kind}`]}>
        {wordsIn(s.start, s.end)}
      </span>,
    );
    at = s.end;
  }
  out.push(...wordsIn(at, text.length));
  return <>{out}</>;
}
