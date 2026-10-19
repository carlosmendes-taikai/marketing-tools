"use client";

import { useEffect, useMemo, useState } from "react";
import { buildSchema, DEFAULTS, issuesFor, toScript, TYPES, visibleFields, type Faq, type Field, type SchemaType, type Values } from "@/lib/schema";
import ui from "@/components/tool.module.css";
import styles from "./schema.module.css";

const STORE_KEY = "schema-v1";
type Saved = { type: SchemaType; values: Partial<Record<SchemaType, Values>>; faqs: Faq[] };
const EMPTY_FAQS: Faq[] = [
  { q: "", a: "" },
  { q: "", a: "" },
];

export function SchemaStudio() {
  const [type, setType] = useState<SchemaType>("faq");
  const [all, setAll] = useState<Partial<Record<SchemaType, Values>>>({});
  const [faqs, setFaqs] = useState<Faq[]>(EMPTY_FAQS);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let saved: Saved | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    } catch {}
    const asked = new URLSearchParams(window.location.search).get("type") as SchemaType | null;
    queueMicrotask(() => {
      if (saved) {
        setType(saved.type);
        setAll(saved.values ?? {});
        if (saved.faqs?.length) setFaqs(saved.faqs);
      }
      if (asked && TYPES.some((x) => x.id === asked)) setType(asked);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ type, values: all, faqs } satisfies Saved));
    } catch {}
  }, [type, all, faqs, loaded]);

  const values = useMemo(() => ({ ...DEFAULTS, ...all[type] }), [all, type]);
  const set = (key: string, v: string) => setAll((a) => ({ ...a, [type]: { ...a[type], [key]: v } }));
  const data = useMemo(() => buildSchema(type, values, faqs), [type, values, faqs]);
  const code = toScript(data);
  const issues = issuesFor(type, values, faqs);
  const fails = issues.filter((i) => i.level === "fail").length;

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function reset() {
    setAll((a) => ({ ...a, [type]: {} }));
    if (type === "faq") setFaqs(EMPTY_FAQS);
  }

  const touched = type === "faq" ? faqs.some((f) => f.q || f.a) : Object.keys(all[type] ?? {}).some((k) => all[type]?.[k]);

  return (
    <div className={ui.studio}>
      <div className={ui.controls}>
        <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.2s" }}>
          <h2>What is the page about?</h2>
          <div className={styles.types}>
            {TYPES.map((x) => (
              <button key={x.id} className={`${styles.type} ${type === x.id ? styles.typeOn : ""}`} onClick={() => setType(x.id)} aria-pressed={type === x.id}>
                <b>{x.label}</b>
                <span>{x.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.26s" }} key={type}>
          <div className={styles.panelHead}>
            <h2>{TYPES.find((x) => x.id === type)?.label} details</h2>
            {touched && (
              <button className={ui.textBtn} onClick={reset}>
                Clear
              </button>
            )}
          </div>
          {type === "faq" ? (
            <FaqEditor faqs={faqs} setFaqs={setFaqs} />
          ) : (
            <div className={ui.fields}>
              {visibleFields(type, values).map((f) => (
                <FieldInput key={f.key} f={f} value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className={ui.previewCol}>
        <div className={ui.previewCard}>
          <small className={styles.cap}>How it can look in Google</small>
          <RichResult type={type} v={values} faqs={faqs} />

          <div className={styles.codeHead}>
            <small className={styles.cap}>Your code</small>
            <span className={fails ? styles.bad : styles.good}>{fails ? `${fails} thing${fails === 1 ? "" : "s"} missing` : "Ready to use"}</span>
          </div>
          <pre className={styles.code}>
            <code>
              <Highlight code={code} />
            </code>
          </pre>
          <div className={ui.buttons}>
            <button className={ui.primary} onClick={copy}>
              {copied ? "Copied" : "Copy code"}
            </button>
            <a className={`${ui.secondary} ${styles.linkBtn}`} href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer" title="Paste the code in Google's Rich Results Test">
              Test in Google
            </a>
          </div>
          {issues.length > 0 && (
            <ul className={styles.issues}>
              {issues.map((i) => (
                <li key={i.text} className={styles[i.level]}>
                  {i.text}
                </li>
              ))}
            </ul>
          )}
          <p className={styles.where}>
            Paste it inside the page&apos;s <code>&lt;head&gt;</code>, or anywhere in the page. In WordPress, Webflow, Framer or Lovable, use the custom code box for that page.
          </p>
        </div>
      </aside>
    </div>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: string; onChange: (v: string) => void }) {
  const props = { value, placeholder: f.placeholder, spellCheck: false, onChange: (e: { target: { value: string } }) => onChange(e.target.value) };
  return (
    <label className={`${ui.field} ${f.half ? ui.half : ""}`}>
      <span className={styles.label}>
        {f.label}
        {f.need === "required" && <i className={styles.req}>required</i>}
      </span>
      {f.hint && <small className={styles.hint}>{f.hint}</small>}
      {f.kind === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {f.options?.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      ) : f.kind === "textarea" || f.kind === "lines" ? (
        <textarea rows={f.kind === "lines" ? 3 : 2} {...props} />
      ) : (
        <input
          type={f.kind === "date" ? "date" : f.kind === "datetime" ? "datetime-local" : "text"}
          inputMode={f.kind === "number" ? "decimal" : f.kind === "url" ? "url" : undefined}
          {...props}
        />
      )}
    </label>
  );
}

function FaqEditor({ faqs, setFaqs }: { faqs: Faq[]; setFaqs: (f: Faq[]) => void }) {
  const edit = (i: number, key: keyof Faq, v: string) => setFaqs(faqs.map((f, k) => (k === i ? { ...f, [key]: v } : f)));
  return (
    <div className={styles.faqs}>
      {faqs.map((f, i) => (
        <div key={i} className={styles.faq}>
          <div className={styles.faqTop}>
            <span className={styles.num}>{i + 1}</span>
            <input value={f.q} placeholder={i === 0 ? "Is the QR code free forever?" : "Question"} onChange={(e) => edit(i, "q", e.target.value)} aria-label={`Question ${i + 1}`} />
            {faqs.length > 1 && (
              <button className={styles.remove} onClick={() => setFaqs(faqs.filter((_, k) => k !== i))} aria-label={`Remove question ${i + 1}`}>
                ×
              </button>
            )}
          </div>
          <textarea
            rows={2}
            value={f.a}
            placeholder={i === 0 ? "Yes. Static QR codes never expire and there's nothing to renew." : "Answer"}
            onChange={(e) => edit(i, "a", e.target.value)}
            aria-label={`Answer ${i + 1}`}
          />
        </div>
      ))}
      <button className={ui.secondary} onClick={() => setFaqs([...faqs, { q: "", a: "" }])} disabled={faqs.length >= 30}>
        Add a question
      </button>
      <p className={styles.note}>Use the same questions and answers that are visible on the page. Google now shows FAQ dropdowns mostly for government and health sites, but Bing and AI search tools still read them.</p>
    </div>
  );
}

/** A small, honest sketch of the extra details Google can show for each type. */
function RichResult({ type, v, faqs }: { type: SchemaType; v: Values; faqs: Faq[] }) {
  const host = (u?: string) => {
    try {
      return new URL(u ?? "").hostname.replace(/^www\./, "");
    } catch {
      return "yoursite.com";
    }
  };
  const date = (d?: string, withTime = false) => {
    if (!d) return "";
    const x = new Date(d);
    return isNaN(+x) ? "" : x.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
  };
  const stars = (r: number) => "★★★★★".slice(0, Math.round(r)) + "☆☆☆☆☆".slice(0, 5 - Math.round(r));
  const done = faqs.filter((f) => f.q.trim() && f.a.trim());

  const title = { faq: "Your page title", article: v.headline, product: v.name, local: v.name, event: v.name, organization: v.name }[type] || "Your page title";
  const site = host(type === "event" ? v.ticketUrl || v.organizerUrl : v.url);
  const desc = v.description || (type === "faq" ? "The page's own description shows here." : "");

  return (
    <div className={styles.serp}>
      <span className={styles.sSite}>{site}</span>
      <span className={styles.sTitle}>{title}</span>
      {type === "article" && (v.datePublished || v.authorName) && (
        <span className={styles.sMeta}>{[date(v.dateModified || v.datePublished), v.authorName].filter(Boolean).join(" · ")}</span>
      )}
      {type === "product" && (v.ratingValue || v.price) && (
        <span className={styles.sMeta}>
          {v.ratingValue && (
            <>
              <span className={styles.stars}>{stars(Number(v.ratingValue) || 0)}</span> Rating: {v.ratingValue}
              {v.reviewCount ? ` · ${v.reviewCount} reviews` : ""}
              {v.price ? " · " : ""}
            </>
          )}
          {v.price && `${Number(v.price).toLocaleString("en", { style: "currency", currency: v.currency || "EUR" })} · ${{ InStock: "In stock", OutOfStock: "Out of stock", PreOrder: "Pre-order", LimitedAvailability: "Limited stock" }[v.availability] ?? ""}`}
        </span>
      )}
      {type === "local" && (v.street || v.city || v.telephone) && (
        <span className={styles.sMeta}>{[[v.street, v.city].filter(Boolean).join(", "), v.telephone, v.priceRange].filter(Boolean).join(" · ")}</span>
      )}
      {desc && <span className={styles.sDesc}>{desc}</span>}
      {type === "event" && v.startDate && (
        <div className={styles.sEvent}>
          <b>{date(v.startDate, true)}</b>
          <span>{v.mode === "online" ? "Online" : [v.venue, v.city].filter(Boolean).join(", ") || "Venue"}</span>
          {v.price !== undefined && v.price !== "" && <em>{Number(v.price) === 0 ? "Free" : Number(v.price).toLocaleString("en", { style: "currency", currency: v.currency || "EUR" })}</em>}
        </div>
      )}
      {type === "faq" && (
        <ul className={styles.sFaq}>
          {(done.length ? done : [{ q: "Your first question", a: "" }, { q: "Your second question", a: "" }]).slice(0, 3).map((f, i) => (
            <li key={i}>
              {f.q}
              <span>⌄</span>
            </li>
          ))}
        </ul>
      )}
      {type === "organization" && (
        <div className={styles.sOrg}>
          {v.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.logo} alt="" width={40} height={40} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
          ) : (
            <i />
          )}
          <span>{v.sameAs ? `${v.sameAs.split(/\n+/).filter((l) => l.trim()).length} social profiles linked` : "Logo and social profiles in the knowledge panel"}</span>
        </div>
      )}
    </div>
  );
}

/** Colours the JSON: keys, strings and the script tag. */
function Highlight({ code }: { code: string }) {
  const parts = code.split(/("(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|<\/?script[^>]*>)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("<") ? (
          <span key={i} className={styles.cTag}>
            {p}
          </span>
        ) : p.startsWith('"') ? (
          <span key={i} className={parts[i + 1]?.trimStart().startsWith(":") ? styles.cKey : styles.cStr}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}
