// Shared between the link-preview API and page: what we read from a page, and the checks we run on it.

export type PageMeta = {
  url: string; // what the person typed, cleaned
  finalUrl: string; // after redirects
  status: number;
  title: string; // og:title, falling back to <title>
  description: string; // og:description, falling back to meta description
  htmlTitle: string;
  metaDescription: string;
  siteName: string;
  domain: string;
  canonical: string;
  favicon: string;
  image: ImageInfo | null;
  twitterCard: string;
  tags: { key: string; value: string }[]; // every og: and twitter: tag found, in page order
};

export type ImageInfo = {
  url: string;
  ok: boolean; // loaded and is an image
  width: number | null;
  height: number | null;
  bytes: number | null;
  type: string;
  declaredWidth: number | null;
  declaredHeight: number | null;
};

export type Check = { id: string; level: "pass" | "warn" | "fail"; title: string; detail: string };

const len = (s: string) => [...s].length;

export function runChecks(m: PageMeta): Check[] {
  const c: Check[] = [];
  const has = (k: string) => m.tags.some((t) => t.key === k && t.value.trim());

  // image
  if (!m.image) c.push({ id: "image", level: "fail", title: "No share image", detail: "Add an og:image. Posts with an image get far more clicks, and LinkedIn shows a grey box without one." });
  else if (!m.image.ok) c.push({ id: "image", level: "fail", title: "Share image doesn't load", detail: "The og:image address is broken or blocked. Check it opens in a browser, and use a full https:// address." });
  else {
    const { width: w, height: h } = m.image;
    if (w && h) {
      const ratio = w / h;
      if (w < 600 || h < 315) c.push({ id: "image-size", level: "warn", title: `Image is small (${w} × ${h})`, detail: "Use at least 1200 × 627 so it stays sharp on big screens." });
      else c.push({ id: "image-size", level: "pass", title: `Image size is good (${w} × ${h})`, detail: "" });
      if (ratio < 1.6 || ratio > 2.1) c.push({ id: "image-ratio", level: "warn", title: "Image will be cropped", detail: `It's ${ratio.toFixed(2)}:1. Most apps show 1.91:1 (like 1200 × 627), so edges get cut off.` });
    }
    if (m.image.bytes && m.image.bytes > 5 * 1024 * 1024) c.push({ id: "image-bytes", level: "fail", title: "Image is over 5 MB", detail: "LinkedIn and others skip images this big. Compress it." });
    else if (m.image.bytes && m.image.bytes > 1024 * 1024) c.push({ id: "image-bytes", level: "warn", title: "Image is heavy", detail: `${(m.image.bytes / 1024 / 1024).toFixed(1)} MB. Under 1 MB loads faster in feeds.` });
    if (m.image.url.startsWith("http://")) c.push({ id: "image-https", level: "warn", title: "Image isn't on https", detail: "Some apps refuse images served over plain http." });
  }

  // title
  if (!has("og:title")) c.push({ id: "title", level: m.htmlTitle ? "warn" : "fail", title: "No og:title", detail: m.htmlTitle ? "Apps fall back to the page title. Add og:title to control what people see." : "Add an og:title, the headline of your share card." });
  else if (len(m.title) > 70) c.push({ id: "title", level: "warn", title: `Title is long (${len(m.title)} characters)`, detail: "LinkedIn and Facebook cut titles around 70 characters. Keep the key words first." });
  else c.push({ id: "title", level: "pass", title: "Title length is good", detail: "" });

  // description
  if (!has("og:description")) c.push({ id: "desc", level: m.metaDescription ? "warn" : "fail", title: "No og:description", detail: "Add a one or two sentence summary. WhatsApp, Slack and Facebook show it under the title." });
  else if (len(m.description) > 160) c.push({ id: "desc", level: "warn", title: `Description is long (${len(m.description)} characters)`, detail: "Most apps show about 155 characters. The rest gets cut." });
  else c.push({ id: "desc", level: "pass", title: "Description length is good", detail: "" });

  // the rest
  if (!has("og:url") && !m.canonical) c.push({ id: "url", level: "warn", title: "No og:url or canonical link", detail: "Tells apps the main address of the page, so likes and shares count in one place." });
  if (!has("twitter:card")) c.push({ id: "twitter", level: "warn", title: "No twitter:card", detail: "Add twitter:card = summary_large_image so X shows the big image, not a small thumbnail." });
  if (!has("og:site_name")) c.push({ id: "site", level: "warn", title: "No og:site_name", detail: "Your brand name, shown above the title on Facebook and Slack." });
  if (!m.metaDescription) c.push({ id: "meta-desc", level: "warn", title: "No meta description for Google", detail: "Google writes its own snippet without one, often from random page text." });
  if (m.status >= 400) c.push({ id: "status", level: "fail", title: `Page answered with an error (${m.status})`, detail: "Apps won't show a preview for a page that errors." });

  const order = { fail: 0, warn: 1, pass: 2 };
  return c.sort((a, b) => order[a.level] - order[b.level]);
}

export function scoreOf(checks: Check[]): number {
  const fails = checks.filter((c) => c.level === "fail").length;
  const warns = checks.filter((c) => c.level === "warn").length;
  return Math.max(0, 100 - fails * 25 - warns * 8);
}

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** A complete, corrected set of tags to paste into the page's <head>. */
export function suggestedTags(m: PageMeta): string {
  const title = m.title || m.htmlTitle || "Your page title";
  const desc = m.description || m.metaDescription || "One or two sentences about this page.";
  const url = m.canonical || m.finalUrl;
  const image = m.image?.ok ? m.image.url : "https://yoursite.com/share-image-1200x627.png";
  const lines = [
    `<title>${escAttr(m.htmlTitle || title)}</title>`,
    `<meta name="description" content="${escAttr(m.metaDescription || desc)}" />`,
    `<link rel="canonical" href="${escAttr(url)}" />`,
    "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escAttr(url)}" />`,
    `<meta property="og:site_name" content="${escAttr(m.siteName || m.domain)}" />`,
    `<meta property="og:title" content="${escAttr(title)}" />`,
    `<meta property="og:description" content="${escAttr(desc)}" />`,
    `<meta property="og:image" content="${escAttr(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="627" />`,
    "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escAttr(title)}" />`,
    `<meta name="twitter:description" content="${escAttr(desc)}" />`,
    `<meta name="twitter:image" content="${escAttr(image)}" />`,
  ];
  return lines.join("\n");
}
