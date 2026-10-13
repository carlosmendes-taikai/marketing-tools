"use client";

import { useState } from "react";
import type { Check, PageMeta } from "@/lib/preview";
import ui from "@/components/tool.module.css";
import styles from "./preview.module.css";

type Result = { meta: PageMeta; checks: Check[]; score: number; suggested: string };

export function PreviewStudio() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function check(url = input) {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      // a fresh look each time someone presses Check, so fixes show up straight away
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url.trim())}&t=${Math.floor(Date.now() / 10000)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setResult(null);
      } else setResult(data);
    } catch {
      setError("Couldn't reach the preview service. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.studio}>
      <form
        className={`${ui.panel} ${styles.searchPanel}`}
        style={{ animationDelay: "0.2s" }}
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <div className={styles.searchRow}>
          <input className={styles.searchInput} value={input} placeholder="Paste the link you're about to share" spellCheck={false} inputMode="url" onChange={(e) => setInput(e.target.value)} />
          <button className={ui.primary} disabled={!input.trim() || loading}>
            {loading ? "Checking…" : "Check link"}
          </button>
        </div>
      </form>

      {error && !loading && <div className={styles.error}>{error}</div>}
      {loading && <Skeleton />}
      {result && !loading && <Results r={result} />}
    </div>
  );
}

function Skeleton() {
  return (
    <div className={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 80}ms` }}>
          <i />
          <b />
          <b style={{ width: "60%" }} />
        </div>
      ))}
    </div>
  );
}

function Results({ r }: { r: Result }) {
  const { meta } = r;
  const problems = r.checks.filter((c) => c.level !== "pass").length;
  const verdict = r.score >= 85 ? "Ready to share" : r.score >= 55 ? "Shareable, with a few fixes" : "Needs work before you share it";
  return (
    <div className={styles.results}>
      <section className={`${styles.card} ${styles.summary}`}>
        <div className={styles.summaryHead}>
          <div className={`${styles.score} ${r.score >= 85 ? styles.good : r.score >= 55 ? styles.ok : styles.poor}`}>
            <b>{r.score}</b>
            <span>/100</span>
          </div>
          <div>
            <h2>{verdict}</h2>
            <p className={styles.domain}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meta.favicon} alt="" width={16} height={16} onError={(e) => (e.currentTarget.style.display = "none")} />
              {meta.finalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </p>
            <p className={styles.sub}>{problems ? `${problems} thing${problems === 1 ? "" : "s"} to fix, most important first.` : "Everything apps look for is in place."}</p>
          </div>
        </div>
        <ul className={styles.checks}>
          {r.checks.map((c) => (
            <li key={c.id} className={styles[c.level]}>
              <span className={styles.mark} />
              <div>
                <b>{c.title}</b>
                {c.detail && <span>{c.detail}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.grid}>
        <Platform name="LinkedIn" delay={0}>
          <LinkedIn m={meta} />
        </Platform>
        <Platform name="X" delay={60}>
          <XCard m={meta} />
        </Platform>
        <Platform name="WhatsApp" delay={120}>
          <WhatsApp m={meta} />
        </Platform>
        <Platform name="Slack" delay={180}>
          <Slack m={meta} />
        </Platform>
        <Platform name="Facebook" delay={240}>
          <Facebook m={meta} />
        </Platform>
        <Platform name="Google search" delay={300}>
          <Google m={meta} />
        </Platform>
      </div>

      <div className={styles.split}>
        <section className={styles.card} style={{ animationDelay: "200ms" }}>
          <h3>Tags on the page</h3>
          {meta.tags.length ? (
            <dl className={styles.tags}>
              {meta.tags.map((t, i) => (
                <div key={i}>
                  <dt>{t.key}</dt>
                  <dd>{t.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.empty}>None found. Apps have to guess, which is why previews look off.</p>
          )}
        </section>
        <section className={styles.card} style={{ animationDelay: "260ms" }}>
          <div className={styles.codeHead}>
            <h3>Fixed tags, ready to paste</h3>
            <CopyButton text={r.suggested} />
          </div>
          <p className={styles.empty}>Paste into your page&rsquo;s &lt;head&gt;, or hand it to whoever runs your site.</p>
          <pre className={styles.code}>{r.suggested}</pre>
        </section>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={ui.secondary}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Platform({ name, delay, children }: { name: string; delay: number; children: React.ReactNode }) {
  return (
    <section className={styles.platform} style={{ animationDelay: `${delay}ms` }}>
      <h3>{name}</h3>
      <div className={styles.stage}>{children}</div>
    </section>
  );
}

function Img({ m, className }: { m: PageMeta; className?: string }) {
  if (!m.image?.ok) return <div className={`${styles.noImg} ${className ?? ""}`}>No image</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={m.image.url} alt="" className={className} />;
}

/* ---------- platform mockups (approximations of each app's link card) ---------- */

const Author = ({ name }: { name: string }) => (
  <div className={styles.author}>
    <span className={styles.avatar} />
    <div>
      <b>{name}</b>
      <small>Just now</small>
    </div>
  </div>
);

function LinkedIn({ m }: { m: PageMeta }) {
  return (
    <div className={styles.li}>
      <Author name="You" />
      <p className={styles.postText}>Worth a read 👇</p>
      <div className={styles.liCard}>
        <Img m={m} className={styles.wideImg} />
        <div className={styles.liText}>
          <b className={styles.clamp2}>{m.title || m.domain}</b>
          <small>{m.domain}</small>
        </div>
      </div>
    </div>
  );
}

function XCard({ m }: { m: PageMeta }) {
  const large = m.twitterCard !== "summary" && m.image?.ok;
  return (
    <div className={styles.x}>
      <Author name="You" />
      {large ? (
        <>
          <div className={styles.xLarge}>
            <Img m={m} className={styles.wideImg} />
            <span className={styles.xOverlay}>{m.title || m.domain}</span>
          </div>
          <small className={styles.xFrom}>From {m.domain}</small>
        </>
      ) : (
        <div className={styles.xSmall}>
          <Img m={m} className={styles.squareImg} />
          <div>
            <small>{m.domain}</small>
            <b className={styles.clamp1}>{m.title}</b>
            <span className={styles.clamp2}>{m.description}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsApp({ m }: { m: PageMeta }) {
  return (
    <div className={styles.wa}>
      <div className={styles.waBubble}>
        <div className={styles.waCard}>
          {m.image?.ok && <Img m={m} className={styles.wideImg} />}
          <div className={styles.waText}>
            <b className={styles.clamp2}>{m.title || m.domain}</b>
            {m.description && <span className={styles.clamp2}>{m.description}</span>}
            <small>{m.domain}</small>
          </div>
        </div>
        <span className={styles.waLink}>{m.finalUrl.replace(/\/$/, "")}</span>
        <small className={styles.waTime}>12:04 ✓✓</small>
      </div>
    </div>
  );
}

function Slack({ m }: { m: PageMeta }) {
  return (
    <div className={styles.slack}>
      <Author name="you" />
      <div className={styles.slackUnfurl}>
        <small className={styles.slackSite}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.favicon} alt="" width={14} height={14} onError={(e) => (e.currentTarget.style.display = "none")} />
          {m.siteName || m.domain}
        </small>
        <b className={styles.slackTitle}>{m.title || m.domain}</b>
        {m.description && <span className={styles.clamp3}>{m.description}</span>}
        {m.image?.ok && <Img m={m} className={styles.slackImg} />}
      </div>
    </div>
  );
}

function Facebook({ m }: { m: PageMeta }) {
  return (
    <div className={styles.fb}>
      <Author name="You" />
      <div className={styles.fbCard}>
        <Img m={m} className={styles.wideImg} />
        <div className={styles.fbText}>
          <small>{m.domain.toUpperCase()}</small>
          <b className={styles.clamp2}>{m.title || m.domain}</b>
          {m.description && <span className={styles.clamp1}>{m.description}</span>}
        </div>
      </div>
    </div>
  );
}

function Google({ m }: { m: PageMeta }) {
  const path = m.finalUrl.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "").split("/").filter(Boolean);
  return (
    <div className={styles.google}>
      <div className={styles.gSite}>
        <span className={styles.gIcon}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.favicon} alt="" width={18} height={18} onError={(e) => (e.currentTarget.style.display = "none")} />
        </span>
        <div>
          <b>{m.siteName || m.domain}</b>
          <small>
            {`https://${m.domain}`}
            {path.length ? ` › ${path.join(" › ")}` : ""}
          </small>
        </div>
      </div>
      <a className={`${styles.gTitle} ${styles.clamp1}`}>{m.htmlTitle || m.title}</a>
      <span className={styles.clamp2}>{m.metaDescription || m.description || "Google will pick some text from the page, since there's no description."}</span>
    </div>
  );
}
