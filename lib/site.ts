// The site name, used in the logo, titles and share images. Change it here and it updates everywhere.
export const SITE_NAME = "mktbox";
export const AUTHOR = "Carlos Mendes";
export const GITHUB_URL = "https://github.com/mendes-cc/marketing-tools";
export const CHROME_URL = "https://chromewebstore.google.com/detail/mktbox-free-marketing-too/ileaeieokkoaiegmpdjldjfjionjaide";

export type Tool = {
  slug: string;
  name: string;
  blurb: string;
  live: boolean;
  group: Group;
};

// Menu sections, in order
export const GROUPS = ["Create", "Write", "Track and share", "SEO and audits"] as const;
export type Group = (typeof GROUPS)[number];

// Also the default order of the homepage cards.
export const TOOLS: Tool[] = [
  { slug: "qr", name: "QR code generator", blurb: "Links, wifi, contacts and more. Styled your way. Never expires.", live: true, group: "Create" },
  { slug: "signature", name: "Email signature", blurb: "With an animated GIF that works in Gmail and Outlook.", live: true, group: "Create" },
  { slug: "keywords", name: "Keyword ideas", blurb: "What people actually type into Google about your topic.", live: true, group: "SEO and audits" },
  { slug: "speed", name: "Page speed audit", blurb: "A plain-English report on what is slowing your site down.", live: true, group: "SEO and audits" },
  { slug: "vibe", name: "Vibe code audit", blurb: "Check a Lovable, Base44 or Bolt app for SEO, security and speed problems.", live: true, group: "SEO and audits" },
  { slug: "utm", name: "UTM builder", blurb: "Tagged links, each with its own QR, saved for later.", live: true, group: "Track and share" },
  { slug: "preview", name: "Link preview", blurb: "See your link on LinkedIn, X and WhatsApp before you share it.", live: true, group: "Track and share" },
  { slug: "linkedin", name: "LinkedIn post formatter", blurb: "Bold, italic and lists, plus where \"…more\" cuts your post.", live: true, group: "Write" },
  { slug: "resize", name: "Image resizer", blurb: "One image, every social size, one zip.", live: true, group: "Create" },
  { slug: "headline", name: "Headline analyzer", blurb: "Score your hook before you hit post.", live: true, group: "Write" },
  { slug: "engagement", name: "Engagement rate calculator", blurb: "Your rate on any platform, next to the benchmark.", live: true, group: "Track and share" },
  { slug: "readability", name: "Readability checker", blurb: "Reading level, long sentences and buzzwords, highlighted.", live: true, group: "Write" },
  { slug: "schema", name: "Schema markup generator", blurb: "Structured data for stars, prices and FAQs in Google.", live: true, group: "SEO and audits" },
  { slug: "gif", name: "GIF animator", blurb: "Turn a logo or banner into a subtle animated GIF.", live: true, group: "Create" },
];

/** A tool name mid-sentence: "the email signature", but "the UTM builder" and "the LinkedIn post formatter". */
export const nameInSentence = (name: string) => (/^[A-Z][a-z]+\b/.test(name) ? name[0].toLowerCase() + name.slice(1) : name);

/** Cover subtitle and alt text, falling back to sensible defaults when left empty in the editor. */
export function coverText(post: { title: string; tool: string; subtitle?: string; coverAlt?: string }) {
  const tool = TOOLS.find((t) => t.slug === post.tool);
  const subtitle = post.subtitle?.trim() || (tool ? `A plain-English guide, with the free ${nameInSentence(tool.name)}` : "A plain-English guide by mktbox");
  const coverAlt = post.coverAlt?.trim() || `Cover image with the title "${post.title}" and the mktbox logo`;
  return { subtitle, coverAlt };
}
