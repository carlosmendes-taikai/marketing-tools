// Builds email-safe signature HTML: tables and inline styles only, because
// Gmail and Outlook strip <style> tags, flexbox and most modern CSS.

export const MAX_UPLOAD_BYTES = 1024 * 1024;

export const NETWORKS = [
  { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you" },
  { id: "x", label: "X", placeholder: "x.com/you" },
  { id: "instagram", label: "Instagram", placeholder: "instagram.com/you" },
  { id: "facebook", label: "Facebook", placeholder: "facebook.com/you" },
  { id: "youtube", label: "YouTube", placeholder: "youtube.com/@you" },
  { id: "tiktok", label: "TikTok", placeholder: "tiktok.com/@you" },
  { id: "github", label: "GitHub", placeholder: "github.com/you" },
  { id: "threads", label: "Threads", placeholder: "threads.net/@you" },
  { id: "bluesky", label: "Bluesky", placeholder: "bsky.app/profile/you" },
  { id: "dribbble", label: "Dribbble", placeholder: "dribbble.com/you" },
  { id: "behance", label: "Behance", placeholder: "behance.net/you" },
] as const;

export type NetworkId = (typeof NETWORKS)[number]["id"];
export type Template = "classic" | "stacked" | "minimal";

export const FONTS = [
  { id: "Arial, Helvetica, sans-serif", label: "Arial" },
  { id: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { id: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { id: "'Trebuchet MS', Tahoma, sans-serif", label: "Trebuchet" },
  { id: "Georgia, 'Times New Roman', serif", label: "Georgia" },
];

export type Signature = {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  photo: string;
  photoShape: "circle" | "rounded" | "square";
  photoSize: number;
  banner: string;
  bannerLink: string;
  bannerWidth: number;
  socials: Partial<Record<NetworkId, string>>;
  ctaText: string;
  ctaUrl: string;
  disclaimer: string;
  template: Template;
  accent: string;
  text: string;
  font: string;
  iconStyle: "circle" | "plain";
};

export const EMPTY: Signature = {
  name: "",
  title: "",
  company: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  photo: "",
  photoShape: "circle",
  photoSize: 88,
  banner: "",
  bannerLink: "",
  bannerWidth: 420,
  socials: {},
  ctaText: "",
  ctaUrl: "",
  disclaimer: "",
  template: "classic",
  accent: "#6c70e0",
  text: "#141413",
  font: FONTS[0].id,
  iconStyle: "circle",
};

// Shown in the preview until the person starts typing.
export const SAMPLE: Signature = {
  ...EMPTY,
  name: "Ana Silva",
  title: "Head of Growth",
  company: "Bakery Co",
  phone: "+351 912 345 678",
  email: "ana@bakery.co",
  website: "bakery.co",
  socials: { linkedin: "linkedin.com/in/ana", instagram: "instagram.com/bakery" },
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Makes a link safe and absolute. Anything that isn't web, mail or phone is dropped. */
export function safeUrl(raw: string, kind: "web" | "mail" | "tel" = "web"): string {
  const v = raw.trim();
  if (!v) return "";
  if (kind === "mail") return `mailto:${v.replace(/^mailto:/i, "")}`;
  if (kind === "tel") return `tel:${v.replace(/[^\d+]/g, "")}`;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return ""; // javascript:, data:, etc.
  return `https://${v}`;
}

const displayUrl = (v: string) => v.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");

export function buildSignature(s: Signature, assetOrigin: string): string {
  const font = s.font;
  const muted = "#76746e";
  const base = `font-family:${font};font-size:13px;line-height:1.5;color:${s.text};`;
  const link = (href: string, label: string, color = s.text) =>
    href ? `<a href="${esc(href)}" style="color:${color};text-decoration:none;">${esc(label)}</a>` : esc(label);

  const radius = s.photoShape === "circle" ? "50%" : s.photoShape === "rounded" ? "14px" : "0";
  const photoSrc = safeUrl(s.photo);
  const photo = photoSrc
    ? `<img src="${esc(photoSrc)}" width="${s.photoSize}" height="${s.photoSize}" alt="${esc(s.name)}" style="display:block;width:${s.photoSize}px;height:${s.photoSize}px;border-radius:${radius};object-fit:cover;border:0;" />`
    : "";

  const nameBlock = `
    <div style="font-size:17px;font-weight:bold;letter-spacing:-0.2px;color:${s.template === "minimal" ? s.accent : s.text};">${esc(s.name)}</div>
    ${s.title || s.company ? `<div style="color:${muted};">${esc([s.title, s.company].filter(Boolean).join(" · "))}</div>` : ""}`;

  const contactItems = [
    s.phone && { k: "P", v: link(safeUrl(s.phone, "tel"), s.phone) },
    s.email && { k: "E", v: link(safeUrl(s.email, "mail"), s.email) },
    s.website && { k: "W", v: link(safeUrl(s.website), displayUrl(s.website)) },
    s.address && { k: "A", v: esc(s.address) },
  ].filter(Boolean) as { k: string; v: string }[];

  const contacts =
    s.template === "minimal"
      ? contactItems.length
        ? `<div style="margin-top:6px;">${contactItems.map((c) => c.v).join(`<span style="color:${muted};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`)}</div>`
        : ""
      : contactItems
          .map((c) => `<div><span style="color:${s.accent};font-weight:bold;">${c.k}</span>&nbsp;&nbsp;${c.v}</div>`)
          .join("");

  const iconColor = s.accent.replace("#", "");
  const iconStyle = s.template === "minimal" ? "plain" : s.iconStyle;
  const socialLinks = NETWORKS.filter((n) => s.socials[n.id]?.trim()).map((n) => {
    const href = safeUrl(s.socials[n.id]!);
    if (!href) return "";
    const src = `${assetOrigin}/api/icon?n=${n.id}&c=${iconColor}&s=${iconStyle}`;
    return `<td style="padding:0 6px 0 0;"><a href="${esc(href)}" style="text-decoration:none;"><img src="${src}" width="22" height="22" alt="${n.label}" style="display:block;width:22px;height:22px;border:0;" /></a></td>`;
  });
  const socials = socialLinks.length
    ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:10px;"><tr>${socialLinks.join("")}</tr></table>`
    : "";

  const ctaHref = safeUrl(s.ctaUrl);
  const cta =
    s.ctaText && ctaHref
      ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:12px;"><tr><td bgcolor="${s.accent}" style="background:${s.accent};border-radius:8px;padding:8px 16px;"><a href="${esc(ctaHref)}" style="font-family:${font};font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;display:inline-block;">${esc(s.ctaText)}</a></td></tr></table>`
      : "";

  const bannerSrc = safeUrl(s.banner);
  const bannerImg = bannerSrc
    ? `<img src="${esc(bannerSrc)}" width="${s.bannerWidth}" alt="${esc(s.company || s.name)}" style="display:block;width:${s.bannerWidth}px;max-width:100%;height:auto;border:0;border-radius:10px;" />`
    : "";
  const bannerHref = safeUrl(s.bannerLink);
  const banner = bannerImg
    ? `<tr><td colspan="3" style="padding-top:14px;">${bannerHref ? `<a href="${esc(bannerHref)}">${bannerImg}</a>` : bannerImg}</td></tr>`
    : "";

  const disclaimer = s.disclaimer
    ? `<tr><td colspan="3" style="padding-top:14px;font-family:${font};font-size:11px;line-height:1.4;color:${muted};max-width:480px;">${esc(s.disclaimer).replace(/\n/g, "<br />")}</td></tr>`
    : "";

  const details = `${nameBlock}<div style="margin-top:8px;">${contacts}</div>${socials}${cta}`;

  let body: string;
  if (s.template === "classic" && photo) {
    body = `<tr>
      <td valign="top" style="padding-right:16px;">${photo}</td>
      <td valign="top" style="border-left:2px solid ${s.accent};padding-left:16px;${base}">${details}</td>
      <td></td>
    </tr>`;
  } else if (s.template === "classic") {
    body = `<tr><td valign="top" colspan="3" style="border-left:2px solid ${s.accent};padding-left:16px;${base}">${details}</td></tr>`;
  } else if (s.template === "stacked") {
    body = `${photo ? `<tr><td colspan="3" style="padding-bottom:12px;">${photo}</td></tr>` : ""}
      <tr><td colspan="3" style="${base}">${details}</td></tr>`;
  } else {
    body = `<tr><td colspan="3" style="${base}">${details}</td></tr>`;
  }

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${base}border-collapse:collapse;">${body}${banner}${disclaimer}</table>`;
}

/** Plain-text version for apps that paste without formatting. */
export function buildPlainText(s: Signature): string {
  return [
    s.name,
    [s.title, s.company].filter(Boolean).join(" · "),
    s.phone,
    s.email,
    s.website && displayUrl(s.website),
    s.address,
  ]
    .filter(Boolean)
    .join("\n");
}
