// Turns Google PageSpeed Insights (Lighthouse) results into a short, plain-English report.

export type Strategy = "mobile" | "desktop";
export type Rating = "good" | "ok" | "poor";

export type Report = {
  url: string;
  strategy: Strategy;
  fetchedAt: string;
  scores: { performance: number; seo: number; accessibility: number; bestPractices: number };
  screenshot: string | null;
  field: { overall: Rating; metrics: { id: string; label: string; display: string; rating: Rating }[] } | null;
  lab: { id: string; label: string; hint: string; display: string; rating: Rating }[];
  fixes: { id: string; title: string; why: string; savingsMs: number; savingsBytes: number; items: { label: string; detail: string }[] }[];
  seo: { id: string; title: string; pass: boolean }[];
  issues: { id: string; title: string; area: "Accessibility" | "Best practices" }[];
};

export const rate = (score: number | null | undefined): Rating => (score == null ? "ok" : score >= 0.9 ? "good" : score >= 0.5 ? "ok" : "poor");
export const rate100 = (n: number): Rating => (n >= 90 ? "good" : n >= 50 ? "ok" : "poor");

const LAB = [
  { id: "largest-contentful-paint", label: "Main content appears", hint: "When the biggest image or text block shows up" },
  { id: "first-contentful-paint", label: "First thing appears", hint: "When visitors first see anything at all" },
  { id: "total-blocking-time", label: "Page freezes for", hint: "Time the page ignores taps and clicks while loading" },
  { id: "cumulative-layout-shift", label: "Layout jumps", hint: "How much things move around while loading. Lower is better" },
  { id: "speed-index", label: "Looks complete", hint: "How fast the visible page fills in" },
];

const FIELD: Record<string, string> = {
  LARGEST_CONTENTFUL_PAINT_MS: "Main content appears",
  INTERACTION_TO_NEXT_PAINT: "Reacts to taps and clicks",
  CUMULATIVE_LAYOUT_SHIFT_SCORE: "Layout jumps",
  FIRST_CONTENTFUL_PAINT_MS: "First thing appears",
  EXPERIMENTAL_TIME_TO_FIRST_BYTE: "Server responds",
};

// Plain-English versions of the checks Google runs most often.
const PLAIN: Record<string, { title: string; why: string }> = {
  "render-blocking-resources": { title: "Files hold the page back", why: "Some CSS or scripts must finish loading before anything shows. Load them later or inline the critical bits." },
  "render-blocking-insight": { title: "Files hold the page back", why: "Some CSS or scripts must finish loading before anything shows. Load them later or inline the critical bits." },
  "uses-responsive-images": { title: "Images are bigger than needed", why: "Phones download desktop-sized images. Serve smaller versions for smaller screens." },
  "image-delivery-insight": { title: "Images could be much lighter", why: "Resize and compress images, and use modern formats like WebP or AVIF." },
  "offscreen-images": { title: "Hidden images load too early", why: "Images below the fold load straight away. Lazy-load them so they wait until needed." },
  "uses-optimized-images": { title: "Images aren't compressed", why: "Compressing images keeps them sharp but much smaller." },
  "modern-image-formats": { title: "Old image formats", why: "WebP or AVIF are usually 25 to 50% smaller than JPG or PNG." },
  "unused-javascript": { title: "Scripts that aren't used", why: "The page downloads JavaScript it never runs. Remove it or load it only where it's needed." },
  "unused-css-rules": { title: "Styles that aren't used", why: "The page downloads CSS that this page doesn't use." },
  "unminified-javascript": { title: "Scripts aren't minified", why: "Minifying strips spaces and comments so files download faster." },
  "unminified-css": { title: "Styles aren't minified", why: "Minifying strips spaces and comments so files download faster." },
  "uses-text-compression": { title: "Files sent uncompressed", why: "Turn on gzip or Brotli on your server. It's usually a one-line setting." },
  "server-response-time": { title: "Server is slow to answer", why: "Your server takes a while to send the first byte. Caching or a faster host helps." },
  "document-latency-insight": { title: "Server is slow to answer", why: "Your server takes a while to send the first byte. Caching or a faster host helps." },
  redirects: { title: "Too many redirects", why: "Each redirect adds a round trip before the page even starts loading." },
  "uses-long-cache-ttl": { title: "Files aren't cached for long", why: "Returning visitors re-download files. Tell browsers to keep them longer." },
  "cache-insight": { title: "Files aren't cached for long", why: "Returning visitors re-download files. Tell browsers to keep them longer." },
  "total-byte-weight": { title: "The page is heavy", why: "The total download is large, which hurts most on mobile data." },
  "dom-size": { title: "The page has a lot of elements", why: "Very large pages take longer to lay out and react to taps." },
  "dom-size-insight": { title: "The page has a lot of elements", why: "Very large pages take longer to lay out and react to taps." },
  "bootup-time": { title: "Scripts take long to run", why: "JavaScript keeps the phone busy. Trim or delay heavy scripts." },
  "mainthread-work-breakdown": { title: "The browser is overworked", why: "Too much work happens while loading, so the page feels stuck." },
  "font-display": { title: "Text hides while fonts load", why: "Let text show in a fallback font until your web font arrives." },
  "font-display-insight": { title: "Text hides while fonts load", why: "Let text show in a fallback font until your web font arrives." },
  "third-party-summary": { title: "Third-party scripts slow it down", why: "Chat widgets, trackers and embeds add weight. Keep only the ones you need." },
  "third-parties-insight": { title: "Third-party scripts slow it down", why: "Chat widgets, trackers and embeds add weight. Keep only the ones you need." },
  "lcp-lazy-loaded": { title: "Main image loads lazily", why: "Your biggest image waits to load. Load it straight away instead." },
  "lcp-discovery-insight": { title: "Main image is found late", why: "The browser discovers your biggest image late. Preload it or put it in the HTML." },
  "lcp-phases-insight": { title: "Main content is slow to appear", why: "Something delays your biggest image or text block. Check the files listed." },
  "unsized-images": { title: "Images have no set size", why: "Without width and height, the layout jumps when images load." },
  "cls-culprits-insight": { title: "Things jump around while loading", why: "Elements move as the page loads. Reserve space for images, ads and embeds." },
  "layout-shift-elements": { title: "Things jump around while loading", why: "Elements move as the page loads. Reserve space for images, ads and embeds." },
  "efficient-animated-content": { title: "Heavy GIFs", why: "Animated GIFs are huge. Video files are often 10 times smaller." },
  "duplicated-javascript": { title: "Duplicate scripts", why: "The same code is downloaded more than once." },
  "duplicated-javascript-insight": { title: "Duplicate scripts", why: "The same code is downloaded more than once." },
  "legacy-javascript": { title: "Old-browser code shipped to everyone", why: "Modern browsers don't need these extra compatibility scripts." },
  "legacy-javascript-insight": { title: "Old-browser code shipped to everyone", why: "Modern browsers don't need these extra compatibility scripts." },
  "uses-rel-preconnect": { title: "Connections start late", why: "Tell the browser early which other sites it will need." },
  "network-dependency-tree-insight": { title: "Files load one after another", why: "Some files only start once others finish. Preload the important ones." },
  "forced-reflow-insight": { title: "Scripts force extra layout work", why: "Code measures and changes the layout repeatedly, which slows the page." },
  "viewport-insight": { title: "Not set up for phones", why: "Add a viewport tag so the page fits mobile screens." },
};

const SEO_PLAIN: Record<string, string> = {
  "document-title": "Page has a title",
  "meta-description": "Page has a description for Google",
  "http-status-code": "Page loads without errors",
  "link-text": "Links say where they go",
  "crawlable-anchors": "Google can follow the links",
  "is-crawlable": "Google is allowed to index it",
  "robots-txt": "robots.txt is valid",
  "image-alt": "Images have descriptions",
  hreflang: "Language versions are set up right",
  canonical: "Main version of the page is clear",
  "font-size": "Text is readable on phones",
  "tap-targets": "Buttons are easy to tap",
  viewport: "Page fits phone screens",
  "structured-data": "Structured data",
};

/* ---------- server-side: shrink Google's huge response to what the report needs ---------- */

type Audit = {
  id: string;
  title: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue?: string;
  numericValue?: number;
  metricSavings?: Record<string, number>;
  details?: { type?: string; overallSavingsMs?: number; overallSavingsBytes?: number; items?: Record<string, unknown>[]; data?: string };
};
type AuditRef = { id: string; weight: number; group?: string };
type Category = { score: number | null; auditRefs: AuditRef[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Psi = any;

const tidy = (t: string) => t.replace(/[`\[\]]/g, "").replace(/\s+/g, " ").trim();
const pct = (n: number | null | undefined) => Math.round((n ?? 0) * 100);
const kb = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

function itemsOf(a: Audit): { label: string; detail: string }[] {
  let rows = a.details?.items ?? [];
  if (a.details?.type === "list") rows = rows.flatMap((r) => ((r as { items?: Record<string, unknown>[] }).items ?? []));
  return rows
    .map((r) => {
      const node = r.node as { nodeLabel?: string; snippet?: string } | undefined;
      const label = String(r.url ?? node?.nodeLabel ?? node?.snippet ?? r.entity ?? (r.source as { url?: string })?.url ?? "");
      const wastedBytes = Number(r.wastedBytes ?? 0);
      const wastedMs = Number(r.wastedMs ?? 0);
      const detail = wastedBytes > 1024 ? `save ${kb(wastedBytes)}` : wastedMs > 10 ? `save ${(wastedMs / 1000).toFixed(1)} s` : "";
      return { label: label.replace(/^https?:\/\//, "").slice(0, 120), detail };
    })
    .filter((r) => r.label)
    .slice(0, 5);
}

export function toReport(data: Psi, strategy: Strategy): Report {
  const lr = data.lighthouseResult;
  const audits: Record<string, Audit> = lr.audits;
  const cats: Record<string, Category> = lr.categories;

  const lab = LAB.filter((m) => audits[m.id]).map((m) => ({
    id: m.id,
    label: m.label,
    hint: m.hint,
    display: audits[m.id].displayValue ?? "",
    rating: rate(audits[m.id].score),
  }));

  const le = data.loadingExperience;
  const fieldCat = (c?: string): Rating => (c === "FAST" ? "good" : c === "SLOW" ? "poor" : "ok");
  const field =
    le?.metrics && Object.keys(le.metrics).length
      ? {
          overall: fieldCat(le.overall_category),
          metrics: Object.entries(FIELD)
            .filter(([k]) => le.metrics[k])
            .map(([k, label]) => {
              const m = le.metrics[k];
              const display = k === "CUMULATIVE_LAYOUT_SHIFT_SCORE" ? (m.percentile / 100).toFixed(2) : m.percentile >= 1000 ? `${(m.percentile / 1000).toFixed(1)} s` : `${m.percentile} ms`;
              return { id: k, label, display, rating: fieldCat(m.category) };
            }),
        }
      : null;

  // Prefer Lighthouse's newer "insights"; fall back to the classic opportunity and diagnostic checks.
  const perfRefs = cats.performance.auditRefs;
  const hasInsights = perfRefs.some((r) => r.group === "insights");
  const fixRefs = perfRefs.filter((r) => (hasInsights ? r.group === "insights" : r.group === "load-opportunities" || r.group === "diagnostics"));
  const fixes = fixRefs
    .map((r) => audits[r.id])
    .filter((a) => a && a.score !== null && a.score < 0.9 && !["notApplicable", "manual", "informative"].includes(a.scoreDisplayMode))
    .map((a) => {
      const plain = PLAIN[a.id];
      const savingsMs = a.details?.overallSavingsMs ?? Math.max(a.metricSavings?.LCP ?? 0, a.metricSavings?.FCP ?? 0);
      return {
        id: a.id,
        title: plain?.title ?? tidy(a.title),
        why: plain?.why ?? "",
        savingsMs: Math.round(savingsMs),
        savingsBytes: Math.round(a.details?.overallSavingsBytes ?? 0),
        items: itemsOf(a),
      };
    })
    .sort((x, y) => y.savingsMs - x.savingsMs || y.savingsBytes - x.savingsBytes)
    .slice(0, 8);

  const failing = (cat: string) =>
    (cats[cat]?.auditRefs ?? [])
      .map((r) => audits[r.id])
      .filter((a) => a && a.score !== null && a.score < 1 && ["binary", "numeric", "metricSavings"].includes(a.scoreDisplayMode));

  const seo = (cats.seo?.auditRefs ?? [])
    .map((r) => audits[r.id])
    .filter((a) => a && SEO_PLAIN[a.id] && a.scoreDisplayMode === "binary")
    .map((a) => ({ id: a.id, title: SEO_PLAIN[a.id], pass: a.score === 1 }));

  const issues = [
    ...failing("accessibility").map((a) => ({ id: a.id, title: tidy(a.title), area: "Accessibility" as const })),
    ...failing("best-practices").map((a) => ({ id: a.id, title: tidy(a.title), area: "Best practices" as const })),
  ].slice(0, 12);

  return {
    url: lr.finalDisplayedUrl ?? lr.finalUrl ?? data.id,
    strategy,
    fetchedAt: lr.fetchTime,
    scores: {
      performance: pct(cats.performance?.score),
      seo: pct(cats.seo?.score),
      accessibility: pct(cats.accessibility?.score),
      bestPractices: pct(cats["best-practices"]?.score),
    },
    screenshot: audits["final-screenshot"]?.details?.data ?? null,
    field,
    lab,
    fixes,
    seo,
    issues,
  };
}

/** Adds https:// and rejects anything that isn't a public web address. */
export function cleanUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!u.hostname.includes(".") || ["localhost", "127.0.0.1"].includes(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}
