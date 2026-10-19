// Checks a live page's search result: title, description, main heading, brand and index rules.
// Google cuts titles by width, not letters: about 600px of 20px Arial on desktop, and descriptions at about 920px of 14px Arial.

export type PageTitleInfo = {
  url: string;
  finalUrl: string;
  status: number;
  title: string;
  titleCount: number;
  description: string;
  ogTitle: string;
  siteName: string;
  robots: string;
  canonical: string;
  favicon: string;
  h1: string[];
  bodyWords: number;
};

export type PageCheck = { level: "pass" | "warn" | "fail"; title: string; tip?: string };

export const TITLE_PX = 600;
export const DESC_PX = 920;

let ctx: CanvasRenderingContext2D | null = null;
/** Width in pixels as Google draws it (browser only). */
export function pixelWidth(text: string, font: "title" | "description"): number {
  if (typeof document === "undefined") return text.length * (font === "title" ? 9.5 : 6.5);
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return 0;
  ctx.font = font === "title" ? "20px Arial, sans-serif" : "14px Arial, sans-serif";
  return Math.round(ctx.measureText(text).width);
}

/** The longest start of `text` that fits in `px`, with an ellipsis when it was cut. */
export function cutToWidth(text: string, px: number, font: "title" | "description"): string {
  if (pixelWidth(text, font) <= px) return text;
  const chars = [...text];
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (pixelWidth(chars.slice(0, mid).join("") + " ...", font) <= px) lo = mid;
    else hi = mid - 1;
  }
  return chars.slice(0, lo).join("").replace(/[\s,;:|·–—-]+$/, "") + " ...";
}

/** The brand: og:site_name if the page has one, else the domain without www and the ending. */
export function brandOf(info: PageTitleInfo): string {
  if (info.siteName.trim()) return info.siteName.trim();
  const host = new URL(info.finalUrl).hostname.replace(/^www\./, "");
  return host.split(".").slice(0, -1).join(".") || host;
}

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 2),
  );

export function pageChecks(info: PageTitleInfo, title: string): PageCheck[] {
  const out: PageCheck[] = [];
  const t = title.trim();
  const isHome = new URL(info.finalUrl).pathname.replace(/\/$/, "") === "";

  /* title */
  if (!t) out.push({ level: "fail", title: "No page title", tip: "Google will make one up from the page. Add a <title> that says what the page is about." });
  else {
    const px = pixelWidth(t, "title");
    if (px > TITLE_PX) out.push({ level: "warn", title: `Title is cut off in Google (${px}px of ${TITLE_PX}px)`, tip: "Google stops at about 600 pixels. Shorten it or move the brand to the end so the important words survive." });
    else if (px < 250) out.push({ level: "warn", title: `Short title (${px}px of ${TITLE_PX}px)`, tip: "There's room for more. Add what makes the page worth the click, like the benefit or who it's for." });
    else out.push({ level: "pass", title: `Title fits in Google (${px}px of ${TITLE_PX}px)` });
  }
  if (info.titleCount > 1) out.push({ level: "warn", title: `${info.titleCount} title tags on the page`, tip: "Keep one. Google may pick the wrong one." });

  /* brand */
  const brand = brandOf(info).toLowerCase();
  if (t && brand) {
    const at = t.toLowerCase().indexOf(brand);
    if (at < 0) out.push({ level: "warn", title: "Brand isn't in the title", tip: `Ending with " | ${brandOf(info)}" helps people recognise you in the results.` });
    else if (at === 0 && !isHome && t.length > brand.length + 3) out.push({ level: "warn", title: "Title starts with the brand", tip: "Lead with the topic and put the brand at the end. Searchers read the first words." });
    else out.push({ level: "pass", title: "Brand is in the title" });
  }

  /* description */
  const d = info.description.trim();
  if (!d) out.push({ level: "fail", title: "No meta description", tip: "Google will grab a random bit of the page instead. Write one or two sentences that sell the click." });
  else {
    const px = pixelWidth(d, "description");
    if (px > DESC_PX) out.push({ level: "warn", title: `Description is cut off (${[...d].length} characters)`, tip: "Google shows about 155 characters. Put the most useful part first." });
    else if ([...d].length < 70) out.push({ level: "warn", title: `Short description (${[...d].length} characters)`, tip: "Aim for 120 to 155 characters so you use the space Google gives you." });
    else out.push({ level: "pass", title: `Description fits (${[...d].length} characters)` });
  }

  /* main heading */
  if (!info.h1.length) {
    if (info.bodyWords < 40)
      out.push({ level: "warn", title: "The page is built by JavaScript", tip: "The HTML has almost no text, so Google sees an empty page at first. Try the vibe code audit for the fix." });
    else out.push({ level: "warn", title: "No main heading (H1)", tip: "Add one H1 that matches the title. It confirms to Google and to readers what the page is about." });
  } else {
    if (info.h1.length > 1) out.push({ level: "warn", title: `${info.h1.length} main headings (H1)`, tip: "Use one H1 per page, and H2s for the sections." });
    const tw = words(t);
    const hw = words(info.h1[0]);
    const shared = [...hw].filter((w) => tw.has(w)).length;
    if (t && hw.size && shared / Math.min(tw.size || 1, hw.size) < 0.34)
      out.push({ level: "warn", title: "Title and heading tell different stories", tip: `The page's heading is "${info.h1[0]}". Use the same main words in both.` });
    else if (t) out.push({ level: "pass", title: "Title matches the main heading" });
  }

  /* indexing */
  if (/noindex/i.test(info.robots)) out.push({ level: "fail", title: "The page asks Google not to list it", tip: `It has a "noindex" rule (${info.robots}). Remove it if this page should show up in search.` });
  if (info.canonical) {
    const a = info.canonical.replace(/\/$/, "");
    const b = info.finalUrl.split(/[?#]/)[0].replace(/\/$/, "");
    if (a !== b) out.push({ level: "warn", title: "Points Google to another address", tip: `The canonical tag says the main version is ${info.canonical}. Google will show that one instead.` });
  }
  if (info.status >= 400) out.push({ level: "fail", title: `The page answers with an error (${info.status})`, tip: "Google drops pages that return errors." });

  const order = { fail: 0, warn: 1, pass: 2 };
  return out.sort((x, y) => order[x.level] - order[y.level]);
}
