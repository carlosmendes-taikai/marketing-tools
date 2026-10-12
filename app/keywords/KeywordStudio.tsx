"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, MARKETS, normalize, popularity, type GroupId, type Idea, type Source } from "@/lib/keywords";
import ui from "@/components/tool.module.css";
import styles from "./keywords.module.css";

type GroupState = { status: "loading" | "done" | "error"; ideas: Idea[]; error?: string };
type Sort = "google" | "popular";
const HISTORY_KEY = "keywords-history-v1";
const PREVIEW = 30;
const EXAMPLES = ["email signature", "coffee shop", "running shoes", "crm software"];

export function KeywordStudio() {
  const [input, setInput] = useState("");
  const [market, setMarket] = useState(MARKETS[0].id);
  const [source, setSource] = useState<Source>("google");
  const [seed, setSeed] = useState("");
  const [groups, setGroups] = useState<Partial<Record<GroupId, GroupState>>>({});
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<GroupId>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState("");
  const [sort, setSort] = useState<Sort>("google");
  const run = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    } catch {}
    queueMicrotask(() => setHistory(saved));
  }, []);

  function search(raw: string, opts?: { market?: string; source?: Source }) {
    const q = normalize(raw);
    if (!q) return;
    const m = opts?.market ?? market;
    const src = opts?.source ?? source;
    const id = ++run.current;
    setInput(q);
    setSeed(q);
    setFilter("");
    setSelected(new Set());
    setExpanded(new Set());
    setGroups(Object.fromEntries(GROUPS.map((g) => [g.id, { status: "loading", ideas: [] }])));
    window.scrollTo({ top: 0, behavior: "smooth" });

    const next = [q, ...history.filter((h) => h !== q)].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}

    for (const g of GROUPS) {
      const params = new URLSearchParams({ q, group: g.id, market: m, source: src, v: "2" });
      fetch(`/api/suggest?${params}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Something went wrong");
          return data.ideas as Idea[];
        })
        .then((ideas) => id === run.current && setGroups((s) => ({ ...s, [g.id]: { status: "done", ideas } })))
        .catch((e: Error) => id === run.current && setGroups((s) => ({ ...s, [g.id]: { status: "error", ideas: [], error: e.message } })));
    }
  }

  // Popularity for every idea across all groups: best rank anywhere, how often it came up,
  // and whether Google offers it straight after the topic itself.
  const scores = useMemo(() => {
    const agg = new Map<string, { p: number; h: number; popular: boolean }>();
    for (const g of GROUPS)
      for (const { t, p, h } of groups[g.id]?.ideas ?? []) {
        const a = agg.get(t);
        if (a) {
          a.p = Math.min(a.p, p);
          a.h += h;
          a.popular ||= g.id === "popular";
        } else agg.set(t, { p, h, popular: g.id === "popular" });
      }
    return new Map([...agg].map(([t, a]) => [t, popularity(a.p, a.h, a.popular)]));
  }, [groups]);

  // Every idea once, in group order: what the totals and exports use.
  const all = useMemo(() => {
    const seen = new Set<string>();
    const rows: { idea: string; group: string; score: number }[] = [];
    for (const g of GROUPS)
      for (const { t } of groups[g.id]?.ideas ?? [])
        if (!seen.has(t)) {
          seen.add(t);
          rows.push({ idea: t, group: g.label, score: scores.get(t) ?? 1 });
        }
    return sort === "popular" ? [...rows].sort((a, b) => b.score - a.score) : rows;
  }, [groups, scores, sort]);

  const f = filter.trim().toLowerCase();
  const loading = GROUPS.some((g) => groups[g.id]?.status === "loading");
  const hasResults = seed !== "";

  const toggle = (idea: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(idea)) n.delete(idea);
      else n.add(idea);
      return n;
    });

  const exportRows = () => (selected.size ? all.filter((r) => selected.has(r.idea)) : all.filter((r) => !f || r.idea.includes(f)));

  async function copyList() {
    await navigator.clipboard.writeText(exportRows().map((r) => r.idea).join("\n"));
    setCopied("list");
    setTimeout(() => setCopied(""), 1600);
  }

  function downloadCsv() {
    const rows = [["keyword", "group", "popularity (1-5)"], ...exportRows().map((r) => [r.idea, r.group, String(r.score)])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `keywords-${seed.replace(/\s+/g, "-")}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function copyOne(idea: string) {
    await navigator.clipboard.writeText(idea);
    setCopied(idea);
    setTimeout(() => setCopied(""), 1200);
  }

  return (
    <div className={styles.studio}>
      <form
        className={`${ui.panel} ${styles.searchPanel}`}
        style={{ animationDelay: "0.2s" }}
        onSubmit={(e) => {
          e.preventDefault();
          search(input);
        }}
      >
        <div className={styles.searchRow}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            value={input}
            placeholder="Type a topic, like email signature"
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className={ui.primary} disabled={!input.trim() || loading}>
            {loading ? "Finding…" : "Find ideas"}
          </button>
        </div>
        <div className={styles.optionsRow}>
          <label className={styles.select}>
            <select
              value={market}
              onChange={(e) => {
                setMarket(e.target.value);
                if (seed) search(seed, { market: e.target.value });
              }}
            >
              {MARKETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <div className={ui.segment}>
            {(
              [
                ["google", "Google"],
                ["youtube", "YouTube"],
              ] as const
            ).map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={source === id ? ui.on : ""}
                onClick={() => {
                  setSource(id);
                  if (seed) search(seed, { source: id });
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {!hasResults && (
            <div className={styles.examples}>
              {(history.length ? history : EXAMPLES).slice(0, 5).map((ex) => (
                <button type="button" key={ex} onClick={() => search(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {hasResults && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.count}>
              <b>{all.length}</b> ideas for <em>{seed}</em>
              {selected.size > 0 && (
                <button className={ui.textBtn} onClick={() => setSelected(new Set())}>
                  {selected.size} selected, clear
                </button>
              )}
            </div>
            <div className={styles.actions}>
              <div className={ui.segment}>
                {(
                  [
                    ["google", "Google order"],
                    ["popular", "Most popular"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} className={sort === id ? ui.on : ""} onClick={() => setSort(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <input className={styles.filter} value={filter} placeholder="Filter" onChange={(e) => setFilter(e.target.value)} />
              <button className={ui.secondary} disabled={!all.length} onClick={copyList}>
                {copied === "list" ? "Copied" : selected.size ? "Copy selected" : "Copy all"}
              </button>
              <button className={ui.secondary} disabled={!all.length} onClick={downloadCsv}>
                CSV
              </button>
            </div>
          </div>

          <div className={styles.groups} key={seed + market + source}>
            {GROUPS.map((g, gi) => {
              const state = groups[g.id];
              const texts = (state?.ideas ?? []).map((i) => i.t).filter((t) => !f || t.includes(f));
              const ideas = sort === "popular" ? [...texts].sort((a, b) => (scores.get(b) ?? 1) - (scores.get(a) ?? 1)) : texts;
              const open = expanded.has(g.id);
              const visible = open ? ideas : ideas.slice(0, PREVIEW);
              return (
                <section key={g.id} className={styles.group} style={{ animationDelay: `${gi * 60}ms` }}>
                  <header>
                    <h2>{g.label}</h2>
                    <span>{state?.status === "loading" ? "" : ideas.length}</span>
                  </header>
                  {state?.status === "loading" && <Skeleton />}
                  {state?.status === "error" && <p className={styles.empty}>{state.error}</p>}
                  {state?.status === "done" && !ideas.length && <p className={styles.empty}>{f ? "Nothing matches the filter." : "No ideas here."}</p>}
                  <ul key={sort}>
                    {visible.map((idea, i) => (
                      <li key={idea} style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }} className={selected.has(idea) ? styles.sel : ""}>
                        <button className={styles.idea} onClick={() => toggle(idea)}>
                          <span className={styles.tick} aria-hidden />
                          <span className={styles.ideaText}>
                            <Highlight text={idea} seed={seed} />
                          </span>
                        </button>
                        <Bars value={scores.get(idea) ?? 1} />
                        <span className={styles.rowActions}>
                          <button title="Copy" onClick={() => copyOne(idea)}>
                            {copied === idea ? "✓" : <CopyIcon />}
                          </button>
                          <button title={`Find ideas for "${idea}"`} onClick={() => search(idea)}>
                            <DigIcon />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {ideas.length > PREVIEW && (
                    <button
                      className={styles.more}
                      onClick={() =>
                        setExpanded((s) => {
                          const n = new Set(s);
                          if (open) n.delete(g.id);
                          else n.add(g.id);
                          return n;
                        })
                      }
                    >
                      {open ? "Show less" : `Show all ${ideas.length}`}
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** The seed stays quiet; the words people add around it stand out. */
function Highlight({ text, seed }: { text: string; seed: string }) {
  const at = text.indexOf(seed);
  if (at < 0) return <b>{text}</b>;
  return (
    <>
      {at > 0 && <b>{text.slice(0, at)}</b>}
      <span className={styles.seed}>{seed}</span>
      {text.length > at + seed.length && <b>{text.slice(at + seed.length)}</b>}
    </>
  );
}

function Skeleton() {
  return (
    <div className={styles.skeleton}>
      {[72, 58, 84, 64, 76, 52].map((w, i) => (
        <i key={i} style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  );
}

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="9" y="9" width="12" height="12" rx="3" />
    <path d="M5 15V6a3 3 0 0 1 3-3h7" />
  </svg>
);

const DigIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.5-4.5" />
  </svg>
);

/** Five rising bars; the filled ones show popularity. A signal, not search volume. */
function Bars({ value }: { value: number }) {
  return (
    <span className={styles.bars} title={`Popularity ${value} of 5, based on how Google ranks it`} aria-label={`Popularity ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= value ? styles.barOn : ""} style={{ height: 4 + n * 2.2 }} />
      ))}
    </span>
  );
}
