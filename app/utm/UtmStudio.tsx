"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MiniQr, downloadQrPng, qrPngBlob } from "@/components/MiniQr";
import { makeZip } from "@/lib/zip";
import { buildUtm, BULK_LIMIT, CHANNELS, type Channel, EMPTY_UTM, FIELD_INFO, parseBase, parseBulk, parseCsv, tidyValue, warningsFor, type Clean, type SavedLink, type UtmFields } from "@/lib/utm";
import ui from "@/components/tool.module.css";
import styles from "./utm.module.css";

const LIBRARY_KEY = "utm-library-v1";

export function UtmStudio() {
  const [base, setBase] = useState("");
  const [fields, setFields] = useState<UtmFields>(EMPTY_UTM);
  const [clean, setClean] = useState<Clean>({ lowercase: true, spaces: "_" });
  const [mode, setMode] = useState<"single" | "multi" | "bulk">("single");
  const [bulkText, setBulkText] = useState("");
  const [zipping, setZipping] = useState(false);
  const [channels, setChannels] = useState<Set<string>>(new Set(["linkedin", "instagram", "newsletter"]));
  const [more, setMore] = useState(false);
  const [other, setOther] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState<Channel[]>([]);
  const [draft, setDraft] = useState({ source: "", medium: "" });
  const sourceRef = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<SavedLink[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let saved: SavedLink[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? "[]");
    } catch {}
    queueMicrotask(() => {
      setLibrary(saved);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    } catch {}
  }, [library, loaded]);

  // The browser extension and other tools can hand over a value: ?url=...
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("url");
    if (value) queueMicrotask(() => setBase(value));
  }, []);

  const url = buildUtm(base, fields, clean);
  const warnings = warningsFor(base, fields);
  const ready = !!url && !!fields.source.trim() && !!fields.medium.trim();

  const multi = useMemo(
    () =>
      [...CHANNELS, ...custom].filter((c) => channels.has(c.id)).map((c) => ({
        channel: c,
        url: buildUtm(base, { ...fields, source: c.source, medium: c.medium }, clean),
      })),
    [base, fields, clean, channels, custom],
  );

  const bulk = useMemo(
    () =>
      parseBulk(bulkText).map((r) => {
        const f = { ...fields, ...r.fields };
        return { base: r.base, fields: f, url: buildUtm(r.base, f, clean) };
      }),
    [bulkText, fields, clean],
  );
  const bulkReady = bulk.filter((r) => r.url);

  async function readFile(file: File) {
    const text = await file.text();
    // CSV files become the same tab separated rows a spreadsheet paste gives
    setBulkText(text.includes("\t") ? text : parseCsv(text).map((r) => r.join("\t")).join("\n"));
  }

  async function zipQrs() {
    setZipping(true);
    try {
      const files = await Promise.all(
        bulkReady.map(async (r, i) => ({ name: `${String(i + 1).padStart(3, "0")}-${slug(r.base)}.png`, blob: await qrPngBlob(r.url) })),
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await makeZip(files));
      a.download = "utm-qr-codes.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } finally {
      setZipping(false);
    }
  }

  const set = (key: keyof UtmFields, v: string) => setFields((f) => ({ ...f, [key]: v }));
  const activeChannel = other ? undefined : CHANNELS.find((c) => c.source === fields.source && c.medium === fields.medium)?.id;
  const otherOn = mode !== "multi" ? other || (!activeChannel && !!(fields.source || fields.medium)) : customOpen;

  function addCustom() {
    const source = tidyValue(draft.source, clean);
    const medium = tidyValue(draft.medium, clean);
    if (!source || !medium) return;
    const id = `custom-${source}-${medium}`;
    if (!custom.some((c) => c.id === id)) setCustom((list) => [...list, { id, label: source, source, medium }]);
    setChannels((sel) => new Set(sel).add(id));
    setDraft({ source: "", medium: "" });
  }

  function flash(key: string) {
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    flash(key);
  }

  function save(links: { url: string; base?: string; fields: UtmFields }[]) {
    const now = new Date().toISOString();
    const fresh = links
      .filter((l) => l.url && !library.some((s) => s.url === l.url))
      .map((l) => ({ id: crypto.randomUUID(), url: l.url, base: (l.base ?? base).trim(), fields: l.fields, createdAt: now }));
    setLibrary((lib) => [...fresh, ...lib]);
    flash("saved");
  }

  const tidyFields = (f: UtmFields): UtmFields => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, tidyValue(v, clean)])) as UtmFields;

  return (
    <>
      <div className={ui.studio}>
        <div className={ui.controls}>
          <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.2s" }}>
            <h2>{mode === "bulk" ? "Your links" : "Your link"}</h2>
            {mode === "bulk" ? (
              <>
                <label className={ui.field}>
                  <textarea
                    className={styles.bulkInput}
                    value={bulkText}
                    rows={7}
                    wrap="off"
                    spellCheck={false}
                    placeholder={"yourwebsite.com/pricing\nyourwebsite.com/blog/launch\nyourwebsite.com/signup"}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </label>
                <p className={styles.bulkHint}>
                  One link per line, or paste straight from a spreadsheet. Extra columns named source, medium, campaign or content give each link its own tags. Up to {BULK_LIMIT} links.{" "}
                  <label className={styles.upload}>
                    Upload a CSV
                    <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
                  </label>
                </p>
              </>
            ) : (
              <label className={ui.field}>
                <input value={base} placeholder="yourwebsite.com/landing-page" spellCheck={false} inputMode="url" onChange={(e) => setBase(e.target.value)} />
              </label>
            )}
            <div className={styles.modeRow}>
              <div className={ui.segment}>
                <button className={mode === "single" ? ui.on : ""} onClick={() => setMode("single")}>
                  One link
                </button>
                <button className={mode === "multi" ? ui.on : ""} onClick={() => setMode("multi")}>
                  One per channel
                </button>
                <button className={mode === "bulk" ? ui.on : ""} onClick={() => setMode("bulk")}>
                  Many links
                </button>
              </div>
            </div>
          </section>

          <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.26s" }}>
            <h2>{mode === "multi" ? "Pick the channels" : mode === "bulk" ? "Where will you share them?" : "Where will you share it?"}</h2>
            <div className={styles.channels}>
              {(mode !== "multi" ? CHANNELS : [...CHANNELS, ...custom]).map((c) => {
                const on = mode !== "multi" ? activeChannel === c.id : channels.has(c.id);
                return (
                  <button
                    key={c.id}
                    className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                    onClick={() => {
                      if (mode !== "multi") {
                        setOther(false);
                        setFields((f) => ({ ...f, source: c.source, medium: c.medium }));
                      } else
                        setChannels((s) => {
                          const n = new Set(s);
                          if (n.has(c.id)) n.delete(c.id);
                          else n.add(c.id);
                          return n;
                        });
                    }}
                  >
                    {mode === "multi" && <span className={styles.box} aria-hidden />}
                    {c.label}
                  </button>
                );
              })}
              <button
                className={`${styles.chip} ${otherOn ? styles.chipOn : ""}`}
                onClick={() => {
                  if (mode !== "multi") {
                    setOther(true);
                    setFields((f) => ({ ...f, source: "", medium: "" }));
                    setTimeout(() => sourceRef.current?.focus(), 0);
                  } else setCustomOpen((o) => !o);
                }}
              >
                Other
              </button>
            </div>

            {mode === "multi" && customOpen && (
              <div className={styles.customRow}>
                <label className={ui.field}>
                  <span className={styles.label}>Campaign source</span>
                  <input value={draft.source} placeholder="podcast" spellCheck={false} onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
                </label>
                <label className={ui.field}>
                  <span className={styles.label}>Campaign medium</span>
                  <input value={draft.medium} placeholder="audio" spellCheck={false} onChange={(e) => setDraft((d) => ({ ...d, medium: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
                </label>
                <button className={ui.secondary} disabled={!draft.source.trim() || !draft.medium.trim()} onClick={addCustom}>
                  Add channel
                </button>
              </div>
            )}

            <div className={`${ui.fields} ${styles.tagFields}`}>
              {FIELD_INFO.filter((f) => (mode !== "multi" ? !f.optional || more : f.key !== "source" && f.key !== "medium" && (!f.optional || more))).map((f) => (
                <label key={f.key} className={`${ui.field} ${ui.half}`}>
                  <span className={styles.label}>{f.label}</span>
                  <small className={styles.desc}>{f.hint}</small>
                  <input
                    ref={f.key === "source" ? sourceRef : undefined}
                    value={fields[f.key]}
                    placeholder={f.placeholder}
                    spellCheck={false}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <button className={ui.textBtn} onClick={() => setMore((m) => !m)} style={{ marginTop: 12 }}>
              {more ? "Fewer options" : "More options: campaign content, term and ID"}
            </button>

            <div className={ui.row} style={{ marginTop: 14 }}>
              <span className={ui.rowLabel}>Tidy tags</span>
              <div className={styles.cleanOpts}>
                <button type="button" className={`${ui.toggle} ${clean.lowercase ? ui.toggleOn : ""}`} onClick={() => setClean((c) => ({ ...c, lowercase: !c.lowercase }))} aria-pressed={clean.lowercase}>
                  <span className={ui.knob} />
                  Lowercase
                </button>
                <div className={ui.segment}>
                  {(
                    [
                      ["_", "Spaces to _"],
                      ["-", "Spaces to -"],
                      ["keep", "Keep spaces"],
                    ] as const
                  ).map(([v, label]) => (
                    <button key={v} className={clean.spaces === v ? ui.on : ""} onClick={() => setClean((c) => ({ ...c, spaces: v }))}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className={ui.previewCol}>
          <div className={ui.previewCard}>
            {mode === "single" ? (
              <>
                <div className={`${styles.output} ${url ? "" : styles.outputEmpty}`}>{url ? <Pretty url={url} /> : "Your tagged link appears here as you type."}</div>
                {warnings.length > 0 && (
                  <ul className={ui.warnings}>
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
                <div className={ui.buttons}>
                  <button className={ui.primary} disabled={!url} onClick={() => copy(url, "url")}>
                    {copied === "url" ? "Copied" : "Copy link"}
                  </button>
                  <button className={ui.secondary} disabled={!ready} onClick={() => save([{ url, fields: tidyFields(fields) }])}>
                    {copied === "saved" ? "Saved" : "Save"}
                  </button>
                  <a className={`${ui.secondary} ${styles.linkBtn} ${url ? "" : styles.disabled}`} href={url || undefined} target="_blank" rel="noreferrer">
                    Test
                  </a>
                </div>
                <div className={styles.qrRow}>
                  <MiniQr data={url} className={`${styles.qr} ${url ? "" : styles.qrEmpty}`} />
                  <div className={styles.qrActions}>
                    <b>QR code for this link</b>
                    <span>Scans open the tagged link, so print clicks show up in your analytics too.</span>
                    <button className={ui.textBtn} disabled={!url} onClick={() => downloadQrPng(url, "utm-qr")}>
                      Download PNG
                    </button>
                    {url && (
                      <Link className={ui.textBtn} href={`/qr?link=${encodeURIComponent(url)}`}>
                        Style it in the QR generator
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : mode === "bulk" ? (
              <>
                <div className={styles.multiHead}>
                  <b>
                    {bulkReady.length} link{bulkReady.length === 1 ? "" : "s"}
                  </b>
                  <span>
                    {!bulk.length
                      ? "paste your links first"
                      : !fields.source.trim() && !bulk.every((r) => r.fields.source)
                        ? "pick where you'll share them"
                        : bulk.length > bulkReady.length
                          ? `${bulk.length - bulkReady.length} line${bulk.length - bulkReady.length === 1 ? "" : "s"} skipped`
                          : fields.campaign
                            ? `campaign ${tidyValue(fields.campaign, clean)}`
                            : "add a campaign name"}
                  </span>
                </div>
                <ul className={`${styles.multiList} ${styles.bulkList}`}>
                  {bulk.map((r, i) => (
                    <li key={i} className={r.url ? "" : styles.bad}>
                      <div>
                        <b>{r.base.replace(/^https?:\/\/(www\.)?/, "") || "(empty)"}</b>
                        <span>{r.url ? r.url.replace(/^https?:\/\//, "") : "This doesn't look like a link"}</span>
                      </div>
                      <button className={styles.iconBtn} disabled={!r.url} onClick={() => copy(r.url, `bulk-${i}`)} title="Copy link">
                        {copied === `bulk-${i}` ? "✓" : "Copy"}
                      </button>
                      <button className={styles.iconBtn} disabled={!r.url} onClick={() => downloadQrPng(r.url, `qr-${slug(r.base)}`)} title="Download QR code">
                        QR
                      </button>
                    </li>
                  ))}
                </ul>
                <div className={`${ui.buttons} ${styles.bulkButtons}`}>
                  <button className={ui.primary} disabled={!bulkReady.length} onClick={() => copy(bulk.map((r) => r.url).join("\n"), "all")} title="One per line, in the same order, so they paste back into your spreadsheet">
                    {copied === "all" ? "Copied" : "Copy all"}
                  </button>
                  <button className={ui.secondary} disabled={!bulkReady.length} onClick={() => downloadCsv(bulkReady.map((r) => ({ url: r.url, base: r.base, fields: tidyFields(r.fields) })), "utm-links")}>
                    CSV
                  </button>
                  <button className={ui.secondary} disabled={!bulkReady.length || zipping} onClick={zipQrs}>
                    {zipping ? "Making…" : "QR codes (.zip)"}
                  </button>
                  <button className={ui.secondary} disabled={!bulkReady.length} onClick={() => save(bulkReady.map((r) => ({ url: r.url, base: r.base, fields: tidyFields(r.fields) })))}>
                    {copied === "saved" ? "Saved" : "Save all"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.multiHead}>
                  <b>
                    {multi.length} link{multi.length === 1 ? "" : "s"}
                  </b>
                  <span>{parseBase(base) ? (fields.campaign ? `campaign ${tidyValue(fields.campaign, clean)}` : "add a campaign name") : "add your link first"}</span>
                </div>
                <ul className={styles.multiList}>
                  {multi.map(({ channel, url: u }) => (
                    <li key={channel.id}>
                      <div>
                        <b>{channel.label}</b>
                        <span>{u ? u.replace(/^https?:\/\//, "") : "…"}</span>
                      </div>
                      <button className={styles.iconBtn} disabled={!u} onClick={() => copy(u, channel.id)} title="Copy link">
                        {copied === channel.id ? "✓" : "Copy"}
                      </button>
                      <button className={styles.iconBtn} disabled={!u} onClick={() => downloadQrPng(u, `qr-${channel.id}`)} title="Download QR code">
                        QR
                      </button>
                    </li>
                  ))}
                </ul>
                <div className={ui.buttons}>
                  <button className={ui.primary} disabled={!multi.length || !multi[0]?.url} onClick={() => copy(multi.map((m) => `${m.channel.label}: ${m.url}`).join("\n"), "all")}>
                    {copied === "all" ? "Copied" : "Copy all"}
                  </button>
                  <button
                    className={ui.secondary}
                    disabled={!multi.length || !multi[0]?.url}
                    onClick={() => save(multi.map((m) => ({ url: m.url, fields: tidyFields({ ...fields, source: m.channel.source, medium: m.channel.medium }) })))}
                  >
                    {copied === "saved" ? "Saved" : "Save all"}
                  </button>
                  <button className={ui.secondary} disabled={!multi.length || !multi[0]?.url} onClick={() => downloadCsv(multi.map((m) => ({ url: m.url, base, fields: tidyFields({ ...fields, source: m.channel.source, medium: m.channel.medium }) })), "utm-links")}>
                    CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      <Library
        items={library}
        copied={copied}
        onCopy={(l) => copy(l.url, l.id)}
        onLoad={(l) => {
          setMode("single");
          setBase(l.base);
          setFields(l.fields);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={(id) => setLibrary((lib) => lib.filter((l) => l.id !== id))}
      />
    </>
  );
}

/** The link with its tags picked out, so you can read it at a glance. */
function Pretty({ url }: { url: string }) {
  const u = new URL(url);
  const params = [...u.searchParams.entries()];
  return (
    <>
      <span className={styles.base}>{`${u.origin}${u.pathname}`.replace(/^https?:\/\//, "")}</span>
      {params.map(([k, v], i) => (
        <span key={k} className={k.startsWith("utm_") ? styles.param : styles.other}>
          {i === 0 ? "?" : "&"}
          <span className={styles.key}>{k}=</span>
          {v}
        </span>
      ))}
      {u.hash && <span className={styles.other}>{u.hash}</span>}
    </>
  );
}

/** A short, file-name-safe version of a link: yoursite-com-blog-launch */
function slug(link: string) {
  return link.replace(/^https?:\/\/(www\.)?/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60).toLowerCase() || "link";
}

function downloadCsv(rows: { url: string; base: string; fields: UtmFields }[], name: string) {
  const head = ["url", "source", "medium", "campaign", "content", "term", "id"];
  const body = rows.map((r) => [r.url, r.fields.source, r.fields.medium, r.fields.campaign, r.fields.content, r.fields.term, r.fields.id]);
  const csv = [head, ...body].map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Library({
  items,
  copied,
  onCopy,
  onLoad,
  onDelete,
}: {
  items: SavedLink[];
  copied: string;
  onCopy: (l: SavedLink) => void;
  onLoad: (l: SavedLink) => void;
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  // While deleting rows in a row, hold the list's height so nothing slides under the cursor.
  const listRef = useRef<HTMLUListElement>(null);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const shown = items.filter((l) => !q || l.url.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className={`${ui.panel} ${styles.library}`} style={{ animationDelay: "0.4s" }} onMouseLeave={() => setLockedHeight(null)}>
      <div className={styles.libHead}>
        <h2>Saved links</h2>
        {items.length > 0 && (
          <div className={styles.libActions}>
            <input className={styles.search} value={q} placeholder="Search" onChange={(e) => setQ(e.target.value)} />
            <button className={ui.secondary} onClick={() => downloadCsv(shown, "saved-utm-links")}>
              CSV
            </button>
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p className={styles.libEmpty}>Links you save stay here, in this browser only. Nothing is sent anywhere.</p>
      ) : (
        <ul className={styles.libList} ref={listRef} style={lockedHeight ? { minHeight: lockedHeight } : undefined}>
          {shown.map((l) => (
            <li key={l.id}>
              <div className={styles.libMain}>
                <div className={styles.tags}>
                  {l.fields.campaign && <span className={styles.tagCampaign}>{l.fields.campaign}</span>}
                  <span>{l.fields.source}</span>
                  <span>{l.fields.medium}</span>
                  {l.fields.content && <span>{l.fields.content}</span>}
                </div>
                <span className={styles.libUrl}>{l.url.replace(/^https?:\/\//, "")}</span>
              </div>
              <time>{new Date(l.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</time>
              <button className={styles.iconBtn} onClick={() => onCopy(l)}>
                {copied === l.id ? "✓" : "Copy"}
              </button>
              <button className={styles.iconBtn} onClick={() => onLoad(l)}>
                Edit
              </button>
              <button
                className={`${styles.iconBtn} ${styles.danger}`}
                onClick={() => {
                  if (lockedHeight === null && listRef.current) setLockedHeight(listRef.current.offsetHeight);
                  onDelete(l.id);
                }}
                aria-label="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
