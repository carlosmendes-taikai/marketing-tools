// Builds tagged links for campaign tracking (Google Analytics and most other tools read utm_ tags).

export type UtmFields = { source: string; medium: string; campaign: string; term: string; content: string; id: string };

export const EMPTY_UTM: UtmFields = { source: "", medium: "", campaign: "", term: "", content: "", id: "" };

// The usual source and medium for each channel, following Google Analytics' channel rules.
export type Channel = { id: string; label: string; source: string; medium: string };

export const CHANNELS: Channel[] = [
  { id: "linkedin", label: "LinkedIn", source: "linkedin", medium: "social" },
  { id: "instagram", label: "Instagram", source: "instagram", medium: "social" },
  { id: "facebook", label: "Facebook", source: "facebook", medium: "social" },
  { id: "x", label: "X", source: "x", medium: "social" },
  { id: "tiktok", label: "TikTok", source: "tiktok", medium: "social" },
  { id: "youtube", label: "YouTube", source: "youtube", medium: "video" },
  { id: "newsletter", label: "Newsletter", source: "newsletter", medium: "email" },
  { id: "google-ads", label: "Google Ads", source: "google", medium: "cpc" },
  { id: "meta-ads", label: "Meta Ads", source: "facebook", medium: "paid_social" },
  { id: "linkedin-ads", label: "LinkedIn Ads", source: "linkedin", medium: "paid_social" },
  { id: "qr", label: "Printed QR", source: "qr", medium: "offline" },
  { id: "partner", label: "Partner site", source: "partner", medium: "referral" },
];

// Google's own names for each tag, with a plain description underneath.
export const FIELD_INFO: { key: keyof UtmFields; label: string; hint: string; placeholder: string; optional?: boolean }[] = [
  { key: "source", label: "Campaign source", hint: "Where the visit comes from: the site, app or newsletter", placeholder: "linkedin" },
  { key: "medium", label: "Campaign medium", hint: "The type of channel, like social, email or cpc", placeholder: "social" },
  { key: "campaign", label: "Campaign name", hint: "Name of the campaign or launch", placeholder: "spring_launch" },
  { key: "content", label: "Campaign content", hint: "Tells apart links in the same place, like a header button and a footer link", placeholder: "header_button", optional: true },
  { key: "term", label: "Campaign term", hint: "The keyword you paid for, in search ads", placeholder: "qr code generator", optional: true },
  { key: "id", label: "Campaign ID", hint: "The campaign's ID from your ads platform, to match reports", placeholder: "summer_24_01", optional: true },
];

export type Clean = { lowercase: boolean; spaces: "_" | "-" | "keep" };

export function tidyValue(v: string, c: Clean): string {
  let out = v.trim();
  if (c.lowercase) out = out.toLowerCase();
  if (c.spaces !== "keep") out = out.replace(/\s+/g, c.spaces);
  return out;
}

export function parseBase(raw: string): URL | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);
    if (!u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

/** Adds the tags to the link, replacing any utm_ tags it already had. Keeps #anchors at the end. */
export function buildUtm(base: string, f: UtmFields, c: Clean): string {
  const u = parseBase(base);
  if (!u) return "";
  for (const key of Object.keys(f) as (keyof UtmFields)[]) {
    const v = tidyValue(f[key], c);
    if (v) u.searchParams.set(`utm_${key}`, v);
    else u.searchParams.delete(`utm_${key}`);
  }
  return u.toString().replace(/\+/g, "%20");
}

export function warningsFor(base: string, f: UtmFields): string[] {
  const w: string[] = [];
  const u = parseBase(base);
  if (base.trim() && !u) w.push("That link doesn't look right. Include the full address, like yoursite.com/page.");
  if (u && [...u.searchParams.keys()].some((k) => k.startsWith("utm_"))) w.push("Your link already had tags. We replaced them with the ones below.");
  if (u && (f.source || f.campaign) && !f.medium.trim()) w.push("Add a campaign medium. Without it, analytics tools file the visit under \"unassigned\".");
  if (u && (f.medium || f.campaign) && !f.source.trim()) w.push("Add a campaign source so you can see where the clicks came from.");
  if (u && !f.campaign.trim() && (f.source || f.medium)) w.push("Add a campaign name so this link is easy to find in reports.");
  return w;
}

export type SavedLink = { id: string; url: string; base: string; fields: UtmFields; createdAt: string };
