"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { applyStyle, hasStyle, STYLES, styledShare, toPlain, type StyleId } from "@/lib/unicode-styles";
import type { PageMeta } from "@/lib/preview";
import ui from "@/components/tool.module.css";
import styles from "./linkedin.module.css";

const DRAFT_KEY = "linkedin-draft-v1";
const LIMIT = 3000;
const SYMBOLS = ["→", "•", "✓", "👉", "💡", "🔥", "📌", "✨"];
const TOOLBAR: { id: StyleId; label: string; glyph: string }[] = [
  { id: "bold", label: "Bold", glyph: "B" },
  { id: "italic", label: "Italic", glyph: "I" },
  { id: "boldItalic", label: "Bold italic", glyph: "BI" },
  { id: "underline", label: "Underline", glyph: "U" },
  { id: "strike", label: "Strikethrough", glyph: "S" },
  { id: "mono", label: "Monospace", glyph: "M" },
];

type Draft = { text: string; name: string; headline: string };
const EMPTY: Draft = { text: "", name: "", headline: "" };

export function PostStudio() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let saved: Draft | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) saved = { ...EMPTY, ...JSON.parse(raw) };
    } catch {}
    queueMicrotask(() => {
      if (saved) setDraft(saved);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft, loaded]);

  const text = draft.text;
  const chars = [...text].length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const heavy = styledShare(text) > 0.25 && chars > 40;

  function flashHint(msg: string) {
    setHint(msg);
    setTimeout(() => setHint(""), 2200);
  }

  /** Replaces the selection through the browser's own editing, so undo (Cmd+Z) keeps working. */
  function replaceSelection(start: number, end: number, next: string) {
    const el = ta.current!;
    el.focus();
    el.setSelectionRange(start, end);
    const ok = document.execCommand?.("insertText", false, next);
    if (!ok) {
      el.setRangeText(next, start, end, "end");
      setDraft((d) => ({ ...d, text: el.value }));
    }
    el.setSelectionRange(start, start + next.length);
  }

  function style(id: StyleId) {
    const el = ta.current!;
    const { selectionStart: s, selectionEnd: e, value } = el;
    if (s === e) return flashHint("Select some text first, then pick a style.");
    const sel = value.slice(s, e);
    replaceSelection(s, e, hasStyle(sel, id) ? toPlain(sel) : applyStyle(sel, id));
  }

  function clearStyles() {
    const el = ta.current!;
    const { selectionStart: s, selectionEnd: e, value } = el;
    if (s === e) replaceSelection(0, value.length, toPlain(value));
    else replaceSelection(s, e, toPlain(value.slice(s, e)));
  }

  function list(kind: "bullet" | "number") {
    const el = ta.current!;
    const { selectionStart, selectionEnd, value } = el;
    const start = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const endIdx = value.indexOf("\n", selectionEnd);
    const end = endIdx === -1 ? value.length : endIdx;
    const lines = value.slice(start, end).split("\n");
    const marker = (i: number) => (kind === "bullet" ? "• " : `${i + 1}. `);
    const pattern = kind === "bullet" ? /^• / : /^\d+\. /;
    const all = lines.every((l) => pattern.test(l) || !l.trim());
    const next = lines.map((l, i) => (!l.trim() ? l : all ? l.replace(pattern, "") : marker(i) + l.replace(/^(• |\d+\. )/, ""))).join("\n");
    replaceSelection(start, end, next);
  }

  function insert(symbol: string) {
    const el = ta.current!;
    replaceSelection(el.selectionStart, el.selectionEnd, symbol);
    const at = el.selectionEnd;
    el.setSelectionRange(at, at);
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <div className={styles.studio}>
        <section className={`${ui.panel} ${styles.editor}`} style={{ animationDelay: "0.2s" }}>
          <div className={styles.toolbar} role="toolbar" aria-label="Text styles">
            {TOOLBAR.map((t) => (
              <button
                key={t.id}
                className={`${styles.tool} ${styles[`g_${t.id}`] ?? ""}`}
                title={t.label}
                aria-label={t.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => style(t.id)}
              >
                {t.glyph}
              </button>
            ))}
            <span className={styles.sep} />
            <button className={styles.tool} title="Bullet list" aria-label="Bullet list" onMouseDown={(e) => e.preventDefault()} onClick={() => list("bullet")}>
              <ListIcon />
            </button>
            <button className={styles.tool} title="Numbered list" aria-label="Numbered list" onMouseDown={(e) => e.preventDefault()} onClick={() => list("number")}>
              <NumIcon />
            </button>
            <button className={styles.tool} title="Remove styles" aria-label="Remove styles" onMouseDown={(e) => e.preventDefault()} onClick={clearStyles}>
              <ClearIcon />
            </button>
            <span className={styles.sep} />
            {SYMBOLS.map((s) => (
              <button key={s} className={`${styles.tool} ${styles.symbol}`} title={`Insert ${s}`} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(s)}>
                {s}
              </button>
            ))}
          </div>

          <textarea
            ref={ta}
            className={styles.textarea}
            value={text}
            placeholder={"Write your post here.\n\nSelect words and press B to make them bold. The preview shows exactly where LinkedIn cuts it off with \"…more\"."}
            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
            onKeyDown={(e) => {
              const mod = e.metaKey || e.ctrlKey;
              if (mod && e.key.toLowerCase() === "b") {
                e.preventDefault();
                style("bold");
              } else if (mod && e.key.toLowerCase() === "i") {
                e.preventDefault();
                style("italic");
              }
            }}
          />

          {(hint || heavy) && <p className={styles.hint}>{hint || "Lots of styled text. LinkedIn search and screen readers can't read styled letters, so keep them for a few key words."}</p>}

          <div className={styles.footer}>
            <span className={`${styles.count} ${chars > LIMIT ? styles.over : chars > LIMIT * 0.9 ? styles.near : ""}`}>
              {chars.toLocaleString()} / {LIMIT.toLocaleString()}
            </span>
            <span className={styles.meta}>
              {words} words · {Math.max(1, Math.round(words / 230))} min read
            </span>
            <button className={ui.textBtn} onClick={() => setDraft((d) => ({ ...d, text: "" }))} disabled={!text}>
              Clear
            </button>
            <button className={ui.primary} disabled={!text.trim()} onClick={copy}>
              {copied ? "Copied" : "Copy post"}
            </button>
          </div>
        </section>

        <aside className={styles.previewCol}>
          <div className={`${ui.previewCard} ${styles.previewCard}`}>
            <div className={styles.previewHead}>
              <h2>Preview</h2>
              <div className={ui.segment}>
                <button className={device === "mobile" ? ui.on : ""} onClick={() => setDevice("mobile")}>
                  Phone
                </button>
                <button className={device === "desktop" ? ui.on : ""} onClick={() => setDevice("desktop")}>
                  Desktop
                </button>
              </div>
            </div>
            <div className={styles.feed}>
              <Post draft={draft} setDraft={setDraft} device={device} />
            </div>
          </div>
        </aside>
      </div>

      <StyleGallery />
    </>
  );
}

/* ---------- the LinkedIn post ---------- */

function Post({ draft, setDraft, device }: { draft: Draft; setDraft: (f: (d: Draft) => Draft) => void; device: "mobile" | "desktop" }) {
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const url = draft.text.match(/https?:\/\/[^\s]+[^\s.,!?)]/)?.[0] ?? "";

  // Does the text run past LinkedIn's three-line fold?
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [draft.text, device, expanded]);

  const empty = !draft.text.trim();

  return (
    <article className={`${styles.post} ${device === "desktop" ? styles.desktop : styles.mobile}`}>
      <header className={styles.postHead}>
        <span className={styles.avatar}>{(draft.name || "Y").trim()[0]?.toUpperCase()}</span>
        <div className={styles.who}>
          <input className={styles.nameInput} value={draft.name} placeholder="Your name" onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-label="Your name" />
          <input className={styles.headlineInput} value={draft.headline} placeholder="Your headline" onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))} aria-label="Your headline" />
          <small>now · 🌐</small>
        </div>
      </header>

      <div className={styles.bodyWrap}>
        <div ref={body} className={`${styles.body} ${expanded ? "" : styles.clamp} ${empty ? styles.placeholder : ""}`}>
          {empty ? "Your post shows up here as you type." : <Rich text={draft.text} />}
        </div>
        {clipped && !expanded && (
          <button className={styles.more} onClick={() => setExpanded(true)}>
            …more
          </button>
        )}
        {expanded && (
          <button className={styles.less} onClick={() => setExpanded(false)}>
            Show where it cuts off
          </button>
        )}
      </div>

      {url && <LinkCard url={url} />}

      <footer className={styles.actions}>
        <span>Like</span>
        <span>Comment</span>
        <span>Repost</span>
        <span>Send</span>
      </footer>
    </article>
  );
}

/** Hashtags, mentions and links in LinkedIn blue. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+|#[\p{L}\p{N}_]+|@[\p{L}][\p{L}\p{N}_]*)/u);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className={styles.blue}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** The link card LinkedIn adds under a post, using the link preview tool's engine. */
function LinkCard({ url }: { url: string }) {
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [forUrl, setForUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!cancelled) {
          setMeta(res.ok ? data.meta : null);
          setForUrl(url);
        }
      } catch {}
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [url]);

  if (!meta || forUrl !== url) return <div className={styles.cardLoading}>Fetching link preview…</div>;
  return (
    <div className={styles.card}>
      {meta.image?.ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.image.url} alt="" />
      ) : (
        <div className={styles.cardNoImg}>No share image on this page</div>
      )}
      <div className={styles.cardText}>
        <b>{meta.title || meta.domain}</b>
        <small>{meta.domain}</small>
      </div>
    </div>
  );
}

/* ---------- every style at once ---------- */

function StyleGallery() {
  const [text, setText] = useState("Make it stand out");
  const [copied, setCopied] = useState("");
  return (
    <section className={`${ui.panel} ${styles.gallery}`} style={{ animationDelay: "0.35s" }}>
      <div className={styles.galleryHead}>
        <h2>Every style at once</h2>
        <input className={styles.galleryInput} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to style" />
      </div>
      <div className={styles.galleryGrid}>
        {STYLES.map((s) => {
          const out = applyStyle(text, s.id);
          return (
            <button
              key={s.id}
              className={styles.sample}
              onClick={async () => {
                await navigator.clipboard.writeText(out);
                setCopied(s.id);
                setTimeout(() => setCopied(""), 1400);
              }}
            >
              <small>{copied === s.id ? "Copied" : s.label}</small>
              <span>{out || " "}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);

const NumIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3" />
  </svg>
);

const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M6 4h12M12 4l-3 16M4 20l16-16" />
  </svg>
);
