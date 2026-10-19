"use client";

import { useEffect, useState } from "react";
import { BAND_TEXT, calc, EMPTY, METHOD_INFO, PLATFORMS, type Inputs, type Method, type Platform } from "@/lib/engagement";
import ui from "@/components/tool.module.css";
import styles from "./engagement.module.css";

const STORE_KEY = "engagement-v1";
const fmt = (x: number) => x.toLocaleString("en", { maximumFractionDigits: 0 });
const pct = (x: number) => `${x < 1 ? x.toFixed(2) : x.toFixed(1)}%`;

export function EngagementStudio() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [method, setMethod] = useState<Method>("followers");
  const [v, setV] = useState<Inputs>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let saved: { platform: Platform; method: Method; v: Inputs } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    } catch {}
    queueMicrotask(() => {
      if (saved?.platform) {
        setPlatform(saved.platform);
        setMethod(saved.method);
        setV({ ...EMPTY, ...saved.v });
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ platform, method, v }));
    } catch {}
  }, [platform, method, v, loaded]);

  const p = PLATFORMS.find((x) => x.id === platform)!;
  const r = calc(platform, method, v);
  const set = (k: keyof Inputs) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  const posts = Math.max(1, Math.round(Number(v.posts)) || 1);
  const scaleMax = r.bands[2] * 1.6;
  const at = (x: number) => `${Math.min(100, (x / scaleMax) * 100)}%`;

  function pickPlatform(id: Platform) {
    setPlatform(id);
    const next = PLATFORMS.find((x) => x.id === id)!;
    if (!next.methods.includes(method)) setMethod(next.methods[0]);
  }

  const num = (k: keyof Inputs, label: string, placeholder: string, hint?: string) => (
    <label key={k} className={`${ui.field} ${ui.half}`}>
      <span className={styles.label}>{label}</span>
      {hint && <small className={styles.hint}>{hint}</small>}
      <input value={v[k]} placeholder={placeholder} inputMode="numeric" onChange={set(k)} />
    </label>
  );

  return (
    <div className={ui.studio}>
      <div className={ui.controls}>
        <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.2s" }}>
          <h2>Platform</h2>
          <div className={`${ui.segment} ${styles.gap}`}>
            {PLATFORMS.map((x) => (
              <button key={x.id} className={platform === x.id ? ui.on : ""} onClick={() => pickPlatform(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          <h2 className={styles.sub}>Calculate it</h2>
          <div className={`${ui.segment} ${styles.gap}`}>
            {p.methods.map((m) => (
              <button key={m} className={method === m ? ui.on : ""} onClick={() => setMethod(m)}>
                {METHOD_INFO[m].label}
              </button>
            ))}
          </div>
          <p className={styles.note}>{METHOD_INFO[method].note}</p>
        </section>

        <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.26s" }}>
          <div className={styles.head}>
            <h2>Your numbers</h2>
            {Object.entries(v).some(([k, x]) => k !== "posts" && x) && (
              <button className={ui.textBtn} onClick={() => setV(EMPTY)}>
                Clear
              </button>
            )}
          </div>
          <div className={ui.fields}>
            {method === "followers" && num("followers", "Followers", "12,400")}
            {method === "reach" && num("reach", "Reach or impressions", "8,300", posts > 1 ? "Total across the posts" : undefined)}
            {method === "views" && num("views", "Views", "25,000", posts > 1 ? "Total across the posts" : undefined)}
            {num("posts", "Number of posts", "1", "Add totals for several posts to get the average")}
            {r.parts.map((x) => num(x.key as keyof Inputs, x.label, { likes: "420", comments: "36", shares: "18", saves: "25", clicks: "40" }[x.key] ?? "0"))}
          </div>
        </section>
      </div>

      <aside className={ui.previewCol}>
        <div className={ui.previewCard}>
          <small className={styles.cap}>
            {p.label} engagement rate, {METHOD_INFO[method].short}
            {posts > 1 ? `, average of ${posts} posts` : ""}
          </small>
          <div className={`${styles.big} ${r.band ? styles[r.band] : ""}`}>
            <b>{r.rate === null ? "–" : pct(r.rate)}</b>
            {r.band && <span className={styles.badge}>{BAND_TEXT[r.band]}</span>}
          </div>

          <div className={styles.scale} aria-hidden>
            <div className={styles.track}>
              <i className={styles.z0} style={{ width: at(r.bands[0]) }} />
              <i className={styles.z1} style={{ width: `calc(${at(r.bands[1])} - ${at(r.bands[0])})` }} />
              <i className={styles.z2} style={{ width: `calc(${at(r.bands[2])} - ${at(r.bands[1])})` }} />
              <i className={styles.z3} />
            </div>
            {r.rate !== null && <em className={styles.you} style={{ left: at(r.rate) }} />}
            <div className={styles.ticks}>
              <span style={{ left: at(r.bands[0]) }}>{pct(r.bands[0])}</span>
              <span style={{ left: at(r.bands[1]) }}>{pct(r.bands[1])}</span>
              <span style={{ left: at(r.bands[2]) }}>{pct(r.bands[2])}</span>
            </div>
          </div>

          <p className={styles.verdict}>
            {r.rate === null
              ? `Fill in the ${METHOD_INFO[method].base} and at least one kind of interaction.`
              : r.toGood > 0
                ? `Typical for ${p.label} is about ${pct(r.typical)}. About ${fmt(r.toGood)} more interaction${r.toGood === 1 ? "" : "s"} per post would make it good.`
                : `Typical for ${p.label} is about ${pct(r.typical)}. You're well above it.`}
          </p>

          {r.interactions > 0 && (
            <div className={styles.parts}>
              {r.parts
                .filter((x) => x.value > 0)
                .map((x) => (
                  <div key={x.key} className={styles.part}>
                    <span>{x.label}</span>
                    <div className={styles.partBar}>
                      <i style={{ width: `${(x.value / r.interactions) * 100}%` }} />
                    </div>
                    <b>{Math.round((x.value / r.interactions) * 100)}%</b>
                  </div>
                ))}
            </div>
          )}

          <dl className={styles.stats}>
            <div>
              <dt>Interactions</dt>
              <dd>{fmt(r.interactions)}</dd>
            </div>
            <div>
              <dt>Per post</dt>
              <dd>{fmt(r.perPost)}</dd>
            </div>
          </dl>
          <p className={styles.formula}>
            Formula: <code>{METHOD_INFO[method].formula}</code>
          </p>
          <p className={styles.small}>
            Benchmarks are rounded medians for brand accounts from 2025 reports by{" "}
            <a href="https://www.socialinsider.io/social-media-benchmarks" target="_blank" rel="noreferrer">
              Socialinsider
            </a>{" "}
            and{" "}
            <a href="https://www.rivaliq.com/blog/social-media-industry-benchmark-report/" target="_blank" rel="noreferrer">
              Rival IQ
            </a>
            . Smaller and personal accounts usually score higher.
          </p>
        </div>
      </aside>
    </div>
  );
}
