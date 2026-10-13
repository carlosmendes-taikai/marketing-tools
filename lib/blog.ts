import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";

// Articles live as Markdown files in /content/blog, with a small header block:
// ---
// title: How to make a QR code for free
// description: One or two sentences for Google and share cards.
// date: 2026-10-13
// tool: qr
// ---
// A line containing only {{tool}} drops in the live tool card at that spot.

const DIR = join(process.cwd(), "content", "blog");

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tool: string;
  minutes: number;
  html: string; // full article, with the tool card marker left in place
  toc: { id: string; text: string }[];
  faq: { q: string; a: string }[];
};

export const TOOL_MARKER = "<p>{{tool}}</p>";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function parse(file: string): Post {
  const raw = readFileSync(join(DIR, file), "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing header in ${file}`);
  const meta = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const at = line.indexOf(":");
      let value = line.slice(at + 1).trim();
      if (/^".*"$/.test(value)) value = value.slice(1, -1).replace(/\\"/g, '"'); // "quoted: titles"
      return [line.slice(0, at).trim(), value];
    }),
  );
  const body = match[2];

  const toc: Post["toc"] = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slugify(text);
        if (depth === 2) toc.push({ id, text: text.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !href.startsWith("https://mktbox.xyz");
        return `<a href="${href}"${title ? ` title="${title}"` : ""}${external ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
      },
    },
  });
  const html = marked.parse(body) as string;

  // FAQ: every "### question" under the "Frequently asked questions" heading, with the paragraph after it
  const faq: Post["faq"] = [];
  const faqPart = body.split(/^## Frequently asked questions\s*$/m)[1];
  if (faqPart) {
    for (const block of faqPart.split(/^### /m).slice(1)) {
      const [q, ...rest] = block.split("\n");
      const a = rest.join(" ").replace(/\s+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "").trim();
      if (q.trim() && a) faq.push({ q: q.trim(), a });
    }
  }

  const words = body.replace(/[#>*`\-|]/g, " ").split(/\s+/).filter(Boolean).length;
  return {
    slug: file.replace(/\.md$/, ""),
    title: meta.title,
    description: meta.description,
    date: meta.date,
    tool: meta.tool,
    minutes: Math.max(2, Math.round(words / 230)),
    html,
    toc,
    faq,
  };
}

let cache: Post[] | null = null;

/** Every article, newest first. */
export function getPosts(): Post[] {
  if (!cache)
    cache = readdirSync(DIR)
      .filter((f) => f.endsWith(".md"))
      .map(parse)
      .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return cache;
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);
export const postsForTool = (tool: string) => getPosts().filter((p) => p.tool === tool);

export const formatDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
