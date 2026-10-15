"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { buildPlainText, buildSignature, EMPTY, FONTS, NETWORKS, SAMPLE, type NetworkId, type Signature, type Template } from "@/lib/signature";
import { ImageField } from "./ImageField";
import ui from "@/components/tool.module.css";
import styles from "./signature.module.css";

const STORAGE_KEY = "signature-v1";

const TEMPLATES: { id: Template; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "stacked", label: "Stacked" },
  { id: "minimal", label: "Minimal" },
];

const CLIENTS = {
  gmail: [
    "Click Copy signature above.",
    "In Gmail, open Settings (the gear), then See all settings.",
    "Scroll to Signature, click Create new, and paste.",
    "Scroll down and click Save changes.",
  ],
  outlook: [
    "Click Copy signature above.",
    "In Outlook, go to Settings, then Mail, then Compose and reply (on desktop: File, Options, Mail, Signatures).",
    "Add a new signature and paste it into the box.",
    "Save. Note: Outlook desktop shows only the first frame of a GIF.",
  ],
  apple: [
    "Click Copy signature above.",
    "In Mail, open Settings, then Signatures, and add a new one.",
    "Untick \"Always match my default message font\", then paste.",
    "Close the window. It saves on its own.",
  ],
};

export function SignatureStudio() {
  const [sig, setSig] = useState<Signature>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState<"" | "rich" | "html">("");
  const [client, setClient] = useState<keyof typeof CLIENTS>("gmail");
  const [origin, setOrigin] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  // Restore the last signature from this browser; icons are served from whatever site this runs on.
  useEffect(() => {
    let saved: Signature | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = { ...EMPTY, ...JSON.parse(raw) };
    } catch {}
    queueMicrotask(() => {
      if (saved) setSig(saved);
      setOrigin(window.location.origin);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sig));
    } catch {}
  }, [sig, loaded]);

  const empty = !sig.name.trim();
  const html = useMemo(() => {
    // Until a name is typed, show the sample in the person's chosen style.
    const shown = empty ? { ...SAMPLE, template: sig.template, accent: sig.accent, font: sig.font, iconStyle: sig.iconStyle, photoShape: sig.photoShape } : sig;
    return buildSignature(shown, origin);
  }, [sig, empty, origin]);

  const set = <K extends keyof Signature>(key: K, value: Signature[K]) => setSig((s) => ({ ...s, [key]: value }));
  const setSocial = (id: NetworkId, value: string) => setSig((s) => ({ ...s, socials: { ...s.socials, [id]: value } }));

  async function copyRich() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([buildPlainText(sig)], { type: "text/plain" }),
        }),
      ]);
    } catch {
      // Older browsers: select the rendered preview and copy it.
      const range = document.createRange();
      range.selectNodeContents(previewRef.current!);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
    }
    flash("rich");
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(html);
    flash("html");
  }

  function flash(kind: "rich" | "html") {
    setCopied(kind);
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <div className={ui.studio}>
      <div className={ui.controls}>
        <section className={`${ui.panel} ${ui.beforePreview}`} style={{ animationDelay: "0.2s" }}>
          <h2>Your details</h2>
          <div className={ui.fields}>
            <Text label="Full name" value={sig.name} onChange={(v) => set("name", v)} placeholder="Ana Silva" />
            <Text label="Job title" value={sig.title} onChange={(v) => set("title", v)} placeholder="Head of Growth" half />
            <Text label="Company" value={sig.company} onChange={(v) => set("company", v)} placeholder="Bakery Co" half />
            <Text label="Phone" value={sig.phone} onChange={(v) => set("phone", v)} placeholder="+351 912 345 678" half />
            <Text label="Email" value={sig.email} onChange={(v) => set("email", v)} placeholder="ana@bakery.co" half />
            <Text label="Website" value={sig.website} onChange={(v) => set("website", v)} placeholder="bakery.co" half />
            <Text label="Address" value={sig.address} onChange={(v) => set("address", v)} placeholder="Optional" half />
          </div>
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.26s" }}>
          <h2>Photo or logo</h2>
          <ImageField value={sig.photo} onChange={(v) => set("photo", v)} hint="A square image works best. Up to 1 MB." />
          {sig.photo && (
            <div className={styles.inlineOpts}>
              <div className={ui.segment}>
                {(["circle", "rounded", "square"] as const).map((s) => (
                  <button key={s} className={sig.photoShape === s ? ui.on : ""} onClick={() => set("photoShape", s)}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <label className={ui.slider}>
                <span>Size</span>
                <input type="range" min={56} max={120} value={sig.photoSize} onChange={(e) => set("photoSize", +e.target.value)} />
              </label>
            </div>
          )}
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.32s" }}>
          <h2>Animated banner</h2>
          <p className={styles.note}>A GIF under your signature. It plays in Gmail, Apple Mail and Outlook on the web.</p>
          <ImageField value={sig.banner} onChange={(v) => set("banner", v)} hint="GIF, PNG or JPG. Up to 1 MB." />
          {sig.banner && (
            <div className={styles.inlineOpts}>
              <label className={`${ui.field} ${styles.grow}`}>
                <span>Where it links to</span>
                <input value={sig.bannerLink} placeholder="bakery.co/menu" onChange={(e) => set("bannerLink", e.target.value)} />
              </label>
              <label className={ui.slider}>
                <span>Width</span>
                <input type="range" min={240} max={600} step={10} value={sig.bannerWidth} onChange={(e) => set("bannerWidth", +e.target.value)} />
              </label>
            </div>
          )}
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.38s" }}>
          <h2>Social links</h2>
          <div className={ui.fields}>
            {NETWORKS.map((n) => (
              <Text key={n.id} label={n.label} value={sig.socials[n.id] ?? ""} onChange={(v) => setSocial(n.id, v)} placeholder={n.placeholder} half />
            ))}
          </div>
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.44s" }}>
          <h2>Button</h2>
          <div className={ui.fields}>
            <Text label="Button text" value={sig.ctaText} onChange={(v) => set("ctaText", v)} placeholder="Book a call" half />
            <Text label="Button link" value={sig.ctaUrl} onChange={(v) => set("ctaUrl", v)} placeholder="cal.com/ana" half />
          </div>
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.5s" }}>
          <h2>Style</h2>
          <div className={styles.templates}>
            {TEMPLATES.map((t) => (
              <button key={t.id} className={`${styles.template} ${sig.template === t.id ? styles.templateOn : ""}`} onClick={() => set("template", t.id)}>
                <TemplateIcon id={t.id} />
                {t.label}
              </button>
            ))}
          </div>
          <div className={ui.row}>
            <span className={ui.rowLabel}>Font</span>
            <div className={ui.segment}>
              {FONTS.map((f) => (
                <button key={f.id} className={sig.font === f.id ? ui.on : ""} style={{ fontFamily: f.id }} onClick={() => set("font", f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {sig.template !== "minimal" && (
            <div className={ui.row}>
              <span className={ui.rowLabel}>Social icons</span>
              <div className={ui.segment}>
                {(["circle", "plain"] as const).map((s) => (
                  <button key={s} className={sig.iconStyle === s ? ui.on : ""} onClick={() => set("iconStyle", s)}>
                    {s === "circle" ? "Filled" : "Plain"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={ui.colors}>
            <ColorPicker label="Accent" value={sig.accent} onChange={(v) => set("accent", v)} />
            <ColorPicker label="Text" value={sig.text} onChange={(v) => set("text", v)} />
          </div>
        </section>

        <section className={ui.panel} style={{ animationDelay: "0.56s" }}>
          <h2>Disclaimer</h2>
          <label className={ui.field}>
            <textarea rows={3} value={sig.disclaimer} placeholder="Optional. Small print shown at the bottom." onChange={(e) => set("disclaimer", e.target.value)} />
          </label>
        </section>
      </div>

      <aside className={ui.previewCol}>
        <div className={ui.previewCard}>
          <div className={styles.mail}>
            <div className={styles.mailBar}>
              <i />
              <i />
              <i />
            </div>
            <div className={styles.mailHead}>
              <div>
                <span>To</span> hello@client.com
              </div>
              <div>
                <span>Subject</span> Quick follow-up
              </div>
            </div>
            <div className={styles.mailBody}>
              <p>Hi Sam,</p>
              <p>Great speaking earlier. Sending the details over now.</p>
              <p>Best,</p>
              <div className={`${styles.sig} ${empty ? styles.sigSample : ""}`} ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
              {empty && <span className={styles.sampleTag}>Example. Start typing your name.</span>}
            </div>
          </div>

          <div className={ui.buttons}>
            <button className={ui.primary} disabled={empty} onClick={copyRich}>
              {copied === "rich" ? "Copied" : "Copy signature"}
            </button>
            <button className={ui.secondary} disabled={empty} onClick={copyHtml}>
              {copied === "html" ? "Copied" : "Copy HTML"}
            </button>
          </div>

          <div className={styles.howto}>
            <div className={ui.segment}>
              {(
                [
                  ["gmail", "Gmail"],
                  ["outlook", "Outlook"],
                  ["apple", "Apple Mail"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} className={client === id ? ui.on : ""} onClick={() => setClient(id)}>
                  {label}
                </button>
              ))}
            </div>
            <ol key={client}>
              {CLIENTS[client].map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Text({ label, value, onChange, placeholder, half }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; half?: boolean }) {
  return (
    <label className={`${ui.field} ${half ? ui.half : ""}`}>
      <span>{label}</span>
      <input value={value} placeholder={placeholder} spellCheck={false} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TemplateIcon({ id }: { id: Template }) {
  return (
    <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
      {id === "classic" && (
        <>
          <circle cx="12" cy="14" r="8" />
          <rect x="25" y="4" width="1.5" height="30" className={styles.accentFill} />
          <rect x="31" y="6" width="22" height="4" rx="2" />
          <rect x="31" y="14" width="16" height="3" rx="1.5" opacity=".4" />
          <rect x="31" y="22" width="26" height="3" rx="1.5" opacity=".4" />
          <rect x="31" y="28" width="20" height="3" rx="1.5" opacity=".4" />
        </>
      )}
      {id === "stacked" && (
        <>
          <circle cx="10" cy="9" r="6" />
          <rect x="4" y="19" width="24" height="4" rx="2" />
          <rect x="4" y="26" width="18" height="3" rx="1.5" opacity=".4" />
          <rect x="4" y="32" width="30" height="3" rx="1.5" opacity=".4" />
        </>
      )}
      {id === "minimal" && (
        <>
          <rect x="4" y="10" width="26" height="4" rx="2" className={styles.accentFill} />
          <rect x="4" y="18" width="20" height="3" rx="1.5" opacity=".4" />
          <rect x="4" y="25" width="50" height="3" rx="1.5" opacity=".4" />
        </>
      )}
    </svg>
  );
}
