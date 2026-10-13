// Placeholder name until we pick the real one. Change it here and it updates everywhere.
export const SITE_NAME = "untitled.tools";
export const AUTHOR = "Carlos Mendes";
export const GITHUB_URL = "https://github.com";

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
