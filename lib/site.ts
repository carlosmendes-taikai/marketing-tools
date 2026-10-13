// The site name, used in the logo, titles and share images. Change it here and it updates everywhere.
export const SITE_NAME = "mktbox";
export const AUTHOR = "Carlos Mendes";
export const GITHUB_URL = "https://github.com/carlosmendes-taikai/marketing-tools";

export type Tool = {
  slug: string;
  name: string;
  blurb: string;
  live: boolean;
};

// Ordered by build priority.
export const TOOLS: Tool[] = [
  { slug: "qr", name: "QR code generator", blurb: "Links, wifi, contacts and more. Styled your way. Never expires.", live: true },
  { slug: "signature", name: "Email signature", blurb: "With an animated GIF that works in Gmail and Outlook.", live: true },
  { slug: "keywords", name: "Keyword ideas", blurb: "What people actually type into Google about your topic.", live: true },
  { slug: "speed", name: "Page speed audit", blurb: "A plain-English report on what is slowing your site down.", live: true },
  { slug: "utm", name: "UTM builder", blurb: "Tagged links, each with its own QR, saved for later.", live: true },
  { slug: "preview", name: "Link preview", blurb: "See your link on LinkedIn, X and WhatsApp before you share it.", live: true },
  { slug: "linkedin", name: "LinkedIn post formatter", blurb: "Bold, italic and lists, plus where \"…more\" cuts your post.", live: true },
  { slug: "resize", name: "Image resizer", blurb: "One image, every social size, one zip.", live: true },
  { slug: "headline", name: "Headline analyzer", blurb: "Score your hook before you hit post.", live: true },
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
