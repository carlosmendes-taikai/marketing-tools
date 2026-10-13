"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Doc, Store } from "@/lib/cms";
import { renderMarkdown, slugify, TOOL_MARKER } from "@/lib/markdown";
import { TOOLS } from "@/lib/site";
import prose from "../blog/blog.module.css";
import styles from "./admin.module.css";

type View = { kind: "loading" } | { kind: "login" } | { kind: "list" } | { kind: "edit"; id: string | null };

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): Doc => ({ id: "", slug: "", title: "", description: "", date: today(), updated: "", tool: "", status: "draft", body: "Intro paragraph.\n\n## First section\n\n{{tool}}\n\n## Frequently asked questions\n\n### A question people search for?\n\nA short, direct answer.\n" });

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({}) as T & { error?: string }) };
}

export function Admin() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [store, setStore] = useState<Store | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(
    () =>
      api<Store>("/api/admin/posts").then((res) => {
        if (res.status === 401) return setView({ kind: "login" });
        setStore(res.data);
        setView((v) => (v.kind === "loading" || v.kind === "login" ? { kind: "list" } : v));
      }),
    [],
  );

  useEffect(() => {
    api<Store>("/api/admin/posts").then((res) => {
      if (res.status === 401) return setView({ kind: "login" });
      setStore(res.data);
      setView({ kind: "list" });
    });
  }, []);

  if (view.kind === "loading") return <p className={styles.loading}>Loading…</p>;
  if (view.kind === "login") return <Login onDone={load} />;
  if (!store) return null;

  if (view.kind === "edit") {
    const doc = view.id ? store.posts.find((p) => p.id === view.id) : undefined;
    return (
      <Editor
        key={`${view.id ?? "new"}:${doc?.updated ?? ""}`} // remount after each save, so "unsaved" resets
        initial={doc ?? blank()}
        notice={notice}
        isNew={!doc}
        taken={store.posts.filter((p) => p.id !== doc?.id).map((p) => p.slug)}
        onBack={() => {
          setNotice("");
          setView({ kind: "list" });
        }}
        onSaved={(post, redirects) => {
          setStore((s) => s && { redirects, posts: s.posts.some((p) => p.id === post.id) ? s.posts.map((p) => (p.id === post.id ? post : p)) : [...s.posts, post] });
          setNotice(post.status === "published" ? "Saved and live." : "Saved as draft.");
          setView({ kind: "edit", id: post.id });
        }}
        onDeleted={(id) => {
          setStore((s) => s && { ...s, posts: s.posts.filter((p) => p.id !== id) });
          setView({ kind: "list" });
        }}
        onSignedOut={() => setView({ kind: "login" })}
      />
    );
  }

  return <List posts={store.posts} onOpen={(id) => setView({ kind: "edit", id })} onSignedOut={() => setView({ kind: "login" })} />;
}

/* ---------- login ---------- */

function Login({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const res = await api<{ ok: boolean }>("/api/admin/auth", { method: "POST", body: JSON.stringify({ action: "request", email }) });
    setBusy(false);
    if (!res.ok) return setError(res.data.error ?? "Couldn't send the code.");
    setStep("code");
    setCode("");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await api<{ ok: boolean }>("/api/admin/auth", { method: "POST", body: JSON.stringify({ action: "verify", code }) });
    setBusy(false);
    if (!res.ok) return setError(res.data.error ?? "That didn't work.");
    onDone();
  }

  return (
    <div className={styles.login}>
      <h1>Admin</h1>
      {step === "email" ? (
        <form onSubmit={send}>
          <p>Enter your email and we&apos;ll send you a login code.</p>
          <input type="email" required autoFocus autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className={styles.primary} disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p>If that email has access, a 6-digit code is on its way. It expires in 10 minutes.</p>
          <input
            className={styles.code}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button className={styles.primary} disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Log in"}
          </button>
          <div className={styles.loginLinks}>
            <button type="button" onClick={() => send()} disabled={busy}>
              Send a new code
            </button>
            <button type="button" onClick={() => setStep("email")}>
              Use a different email
            </button>
          </div>
        </form>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

async function signOut(then: () => void) {
  await api("/api/admin/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
  then();
}

/* ---------- list ---------- */

function List({ posts, onOpen, onSignedOut }: { posts: Doc[]; onOpen: (id: string | null) => void; onSignedOut: () => void }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...posts]
      .filter((p) => !q || `${p.title} ${p.slug} ${p.tool}`.toLowerCase().includes(q))
      .sort((a, b) => b.updated.localeCompare(a.updated));
  }, [posts, query]);
  const drafts = posts.filter((p) => p.status === "draft").length;

  return (
    <div className={styles.list}>
      <header className={styles.listHead}>
        <div>
          <h1>Articles</h1>
          <p>
            {posts.length - drafts} published{drafts ? `, ${drafts} ${drafts === 1 ? "draft" : "drafts"}` : ""}
          </p>
        </div>
        <div className={styles.headActions}>
          <button className={styles.ghost} onClick={() => signOut(onSignedOut)}>
            Sign out
          </button>
          <button className={styles.primary} onClick={() => onOpen(null)}>
            New article
          </button>
        </div>
      </header>
      <input className={styles.search} placeholder="Search articles" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className={styles.rows}>
        {shown.map((p) => (
          <button key={p.id} className={styles.row} onClick={() => onOpen(p.id)}>
            <span className={styles.rowMain}>
              <b>{p.title || "Untitled"}</b>
              <small>/blog/{p.slug}</small>
            </span>
            <span className={styles.rowTool}>{TOOLS.find((t) => t.slug === p.tool)?.name ?? "No tool"}</span>
            <span className={p.status === "draft" ? styles.pillDraft : styles.pill}>{p.status === "draft" ? "Draft" : "Published"}</span>
            <span className={styles.rowDate}>{new Date(p.updated).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </button>
        ))}
        {!shown.length && <p className={styles.empty}>No articles match.</p>}
      </div>
    </div>
  );
}

/* ---------- editor ---------- */

const TOOLBAR: { label: string; title: string; wrap?: [string, string]; line?: string; insert?: string }[] = [
  { label: "H2", title: "Section heading", line: "## " },
  { label: "H3", title: "Sub-heading or FAQ question", line: "### " },
  { label: "B", title: "Bold (⌘B)", wrap: ["**", "**"] },
  { label: "I", title: "Italic (⌘I)", wrap: ["*", "*"] },
  { label: "Link", title: "Link (⌘K)", wrap: ["[", "](https://)"] },
  { label: "• List", title: "Bulleted list", line: "- " },
  { label: "1. List", title: "Numbered list", line: "1. " },
  { label: "Quote", title: "Quote", line: "> " },
  { label: "Code", title: "Inline code", wrap: ["`", "`"] },
  { label: "Tool card", title: "Insert the live tool card here", insert: "\n{{tool}}\n" },
];

function Editor({
  initial,
  notice,
  isNew,
  taken,
  onBack,
  onSaved,
  onDeleted,
  onSignedOut,
}: {
  initial: Doc;
  notice: string;
  isNew: boolean;
  taken: string[];
  onBack: () => void;
  onSaved: (post: Doc, redirects: Record<string, string>) => void;
  onDeleted: (id: string) => void;
  onSignedOut: () => void;
}) {
  const [doc, setDoc] = useState<Doc>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [tab, setTab] = useState<"article" | "google">("article");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(notice && !isNew ? { tone: "ok", text: notice } : null);
  const area = useRef<HTMLTextAreaElement>(null);

  const dirty = JSON.stringify(doc) !== JSON.stringify(initial);
  const set = <K extends keyof Doc>(key: K, value: Doc[K]) => setDoc((d) => ({ ...d, [key]: value }));
  const slug = slugify(doc.slug);
  const rendered = useMemo(() => renderMarkdown(doc.body), [doc.body]);
  const tool = TOOLS.find((t) => t.slug === doc.tool);
  const liveSlugChanged = !isNew && initial.status === "published" && slug !== initial.slug;

  const checks = useMemo(() => {
    const list: string[] = [];
    if (!doc.title.trim()) list.push("Add a title.");
    else if (doc.title.length > 60) list.push(`Title is ${doc.title.length} characters. Google shows about 60.`);
    if (!doc.description.trim()) list.push("Add a meta description. It's the grey text under the title on Google.");
    else if (doc.description.length > 160) list.push(`Description is ${doc.description.length} characters. Google cuts off around 160.`);
    else if (doc.description.length < 110) list.push(`Description is short (${doc.description.length}). Aim for 120 to 160 characters.`);
    if (taken.includes(slug)) list.push(`/blog/${slug} is already used by another article.`);
    if (doc.tool && !doc.body.includes("{{tool}}")) list.push("No tool card in the article. Use the Tool card button to place one.");
    if (rendered.toc.length < 2) list.push("Fewer than two sections (## headings). Sections help readers and Google.");
    if (!rendered.faq.length) list.push("No FAQ. Questions under “## Frequently asked questions” can show up in Google.");
    return list;
  }, [doc, slug, taken, rendered]);

  const save = useCallback(
    async (status?: Doc["status"]) => {
      setSaving(true);
      setMessage(null);
      const res = await api<{ post: Doc; redirects: Record<string, string> }>("/api/admin/posts", {
        method: "PUT",
        body: JSON.stringify({ ...doc, slug, status: status ?? doc.status, id: isNew ? undefined : doc.id, prevUpdated: isNew ? undefined : initial.updated }),
      });
      setSaving(false);
      if (res.status === 401) return onSignedOut();
      if (!res.ok) return setMessage({ tone: "error", text: res.data.error ?? "Couldn't save." });
      onSaved(res.data.post, res.data.redirects);
    },
    [doc, slug, isNew, initial.updated, onSaved, onSignedOut],
  );

  // ⌘S saves, and warn before leaving with unsaved changes
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("beforeunload", leave);
    };
  }, [dirty, saving, save]);

  function format(item: (typeof TOOLBAR)[number]) {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    let next = value;
    let cursor = [start, end];
    if (item.wrap) {
      const [a, b] = item.wrap;
      next = value.slice(0, start) + a + value.slice(start, end) + b + value.slice(end);
      cursor = [start + a.length, end + a.length];
    } else if (item.line) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const block = value.slice(lineStart, end);
      const prefixed = block
        .split("\n")
        .map((l) => item.line + l.replace(/^(#{2,3} |- |\d+\. |> )/, ""))
        .join("\n");
      next = value.slice(0, lineStart) + prefixed + value.slice(end);
      cursor = [lineStart + prefixed.length, lineStart + prefixed.length];
    } else if (item.insert) {
      next = value.slice(0, start) + item.insert + value.slice(end);
      cursor = [start + item.insert.length, start + item.insert.length];
    }
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor[0], cursor[1]);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const hit = { b: "B", i: "I", k: "Link" }[e.key.toLowerCase()];
    if (!hit) return;
    e.preventDefault();
    format(TOOLBAR.find((t) => t.label === hit)!);
  }

  async function remove() {
    if (!confirm(`Delete “${doc.title || "Untitled"}”? This can't be undone.`)) return;
    const res = await api(`/api/admin/posts?id=${encodeURIComponent(doc.id)}`, { method: "DELETE" });
    if (res.status === 401) return onSignedOut();
    if (!res.ok) return setMessage({ tone: "error", text: res.data.error ?? "Couldn't delete." });
    onDeleted(doc.id);
  }

  const [before, after] = rendered.html.includes(TOOL_MARKER) ? rendered.html.split(TOOL_MARKER) : [rendered.html, ""];

  return (
    <div className={styles.editor}>
      <div className={styles.bar}>
        <button
          className={styles.back}
          onClick={() => {
            if (!dirty || confirm("Leave without saving your changes?")) onBack();
          }}
        >
          ← All articles
        </button>
        <div className={styles.barRight}>
          {message && <span className={message.tone === "ok" ? styles.saved : styles.error}>{message.text}</span>}
          {!isNew && initial.status === "published" && (
            <a className={styles.ghost} href={`/blog/${initial.slug}`} target="_blank" rel="noopener">
              View live ↗
            </a>
          )}
          <div className={styles.segment} role="group" aria-label="Status">
            <button className={doc.status === "draft" ? styles.segOn : ""} onClick={() => set("status", "draft")}>
              Draft
            </button>
            <button className={doc.status === "published" ? styles.segOn : ""} onClick={() => set("status", "published")}>
              Published
            </button>
          </div>
          <button className={styles.primary} disabled={saving || (!dirty && !isNew)} onClick={() => save()}>
            {saving ? "Saving…" : doc.status === "published" ? (initial.status === "published" ? "Save changes" : "Publish") : "Save draft"}
          </button>
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.fields}>
          <Field label="Title" count={doc.title.length} max={60}>
            <input
              value={doc.title}
              placeholder="How to…"
              onChange={(e) => {
                const title = e.target.value;
                setDoc((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }));
              }}
            />
          </Field>
          <Field label="URL" hint={liveSlugChanged ? `The old address /blog/${initial.slug} will redirect here.` : undefined}>
            <div className={styles.slug}>
              <span>mktbox.xyz/blog/</span>
              <input
                value={doc.slug}
                placeholder="how-to-make-a-qr-code"
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                onBlur={() => set("slug", slug)}
              />
            </div>
          </Field>
          <Field label="Meta description" count={doc.description.length} max={160} min={120}>
            <textarea rows={3} value={doc.description} placeholder="One or two sentences for Google and share cards." onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className={styles.pair}>
            <Field label="Tool">
              <select value={doc.tool} onChange={(e) => set("tool", e.target.value)}>
                <option value="">No tool</option>
                {TOOLS.filter((t) => t.live).map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Publish date">
              <input type="date" value={doc.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
          </div>

          <div className={styles.content}>
            <div className={styles.toolbar}>
              {TOOLBAR.map((t) => (
                <button key={t.label} type="button" title={t.title} onMouseDown={(e) => e.preventDefault()} onClick={() => format(t)}>
                  {t.label}
                </button>
              ))}
            </div>
            <textarea ref={area} className={styles.body} value={doc.body} onChange={(e) => set("body", e.target.value)} onKeyDown={onKeyDown} spellCheck />
            <p className={styles.help}>
              Markdown: <code>## Heading</code>, <code>**bold**</code>, <code>[link](/qr)</code>, <code>- list</code>. Questions under <code>## Frequently asked questions</code> become FAQ results on Google.
            </p>
          </div>

          {checks.length > 0 && (
            <ul className={styles.checks}>
              {checks.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}

          {!isNew && (
            <button className={styles.danger} onClick={remove}>
              Delete article
            </button>
          )}
        </div>

        <aside className={styles.preview}>
          <div className={styles.tabs}>
            <button className={tab === "article" ? styles.tabOn : ""} onClick={() => setTab("article")}>
              Article
            </button>
            <button className={tab === "google" ? styles.tabOn : ""} onClick={() => setTab("google")}>
              Google
            </button>
            <span>{rendered.minutes} min read</span>
          </div>
          {tab === "article" ? (
            <div className={styles.page}>
              <h1 className={styles.pageTitle}>{doc.title || "Untitled"}</h1>
              {doc.description && <p className={prose.lead}>{doc.description}</p>}
              <div className={prose.prose} dangerouslySetInnerHTML={{ __html: before }} />
              {after && <div className={styles.toolSlot}>{tool ? `${tool.name} card` : "Tool card (pick a tool)"}</div>}
              {after && <div className={prose.prose} dangerouslySetInnerHTML={{ __html: after }} />}
            </div>
          ) : (
            <div className={styles.serp}>
              <div className={styles.serpSite}>
                <span className={styles.serpIcon} />
                <div>
                  <b>mktbox</b>
                  <small>https://mktbox.xyz › blog › {slug || "…"}</small>
                </div>
              </div>
              <h3>{cut(`${doc.title || "Untitled"} · mktbox`, 62)}</h3>
              <p>{cut(doc.description || "Google will pick text from the page if there's no description.", 160)}</p>
              {rendered.faq.length > 0 && (
                <div className={styles.serpFaq}>
                  {rendered.faq.slice(0, 3).map((f) => (
                    <span key={f.q}>
                      {f.q} <i>⌄</i>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function Field({ label, count, max, min, hint, children }: { label: string; count?: number; max?: number; min?: number; hint?: string; children: React.ReactNode }) {
  const tone = count === undefined || !max ? "" : count > max ? styles.over : min && count && count < min ? styles.under : styles.fine;
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {count !== undefined && max && (
          <em className={tone}>
            {count}/{max}
          </em>
        )}
      </span>
      {children}
      {hint && <small className={styles.hint}>{hint}</small>}
    </label>
  );
}
