import { Marked } from "marked";

// Shared by the live blog and the admin preview, so what you see while editing is what ships.
// A line containing only {{tool}} drops in the live tool card at that spot.

export const TOOL_MARKER = "<p>{{tool}}</p>";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type Rendered = {
  html: string; // full article, with the tool card marker left in place
  toc: { id: string; text: string }[];
  faq: { q: string; a: string }[];
  minutes: number;
};

export function renderMarkdown(body: string): Rendered {
  const toc: Rendered["toc"] = [];
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
  const faq: Rendered["faq"] = [];
  const faqPart = body.split(/^## Frequently asked questions\s*$/m)[1];
  if (faqPart) {
    for (const block of faqPart.split(/^### /m).slice(1)) {
      const [q, ...rest] = block.split("\n");
      const a = rest.join(" ").replace(/\s+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "").trim();
      if (q.trim() && a) faq.push({ q: q.trim(), a });
    }
  }

  const words = body.replace(/[#>*`\-|]/g, " ").split(/\s+/).filter(Boolean).length;
  return { html, toc, faq, minutes: Math.max(2, Math.round(words / 230)) };
}
