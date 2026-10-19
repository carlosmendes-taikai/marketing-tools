// Engagement rate maths and rough benchmarks per platform.
// Benchmarks are rounded from public 2025 reports (Socialinsider, Rival IQ). They're medians for brand accounts:
// small and personal accounts usually score higher, and each report measures a little differently.

export type Platform = "instagram" | "tiktok" | "linkedin" | "facebook" | "x" | "youtube";
export type Method = "followers" | "reach" | "views";

export type Inputs = {
  followers: string;
  reach: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  clicks: string;
  posts: string;
};

export const EMPTY: Inputs = { followers: "", reach: "", views: "", likes: "", comments: "", shares: "", saves: "", clicks: "", posts: "1" };

type Bands = [number, number, number]; // average from, good from, great from (in %)

export const PLATFORMS: { id: Platform; label: string; methods: Method[]; typical: Partial<Record<Method, number>>; bands: Partial<Record<Method, Bands>>; saves?: string; clicks?: boolean }[] = [
  { id: "instagram", label: "Instagram", methods: ["followers", "reach"], typical: { followers: 0.5, reach: 3 }, bands: { followers: [0.25, 1, 3], reach: [1.5, 4, 8] }, saves: "Saves" },
  { id: "tiktok", label: "TikTok", methods: ["views", "followers"], typical: { views: 3.5, followers: 3 }, bands: { views: [1.5, 5, 10], followers: [1, 4, 8] }, saves: "Favourites" },
  { id: "linkedin", label: "LinkedIn", methods: ["reach", "followers"], typical: { reach: 4, followers: 0.5 }, bands: { reach: [2, 5, 10], followers: [0.3, 1, 3] }, clicks: true },
  { id: "facebook", label: "Facebook", methods: ["followers", "reach"], typical: { followers: 0.15, reach: 2 }, bands: { followers: [0.07, 0.3, 1], reach: [1, 3, 6] }, clicks: true },
  { id: "x", label: "X", methods: ["followers", "reach"], typical: { followers: 0.15, reach: 1.5 }, bands: { followers: [0.05, 0.3, 1], reach: [0.75, 2, 4] }, saves: "Bookmarks", clicks: true },
  { id: "youtube", label: "YouTube", methods: ["views", "followers"], typical: { views: 3, followers: 1 }, bands: { views: [1.5, 4, 8], followers: [0.5, 2, 5] } },
];

export const METHOD_INFO: Record<Method, { label: string; short: string; base: string; formula: string; note: string }> = {
  followers: {
    label: "By followers",
    short: "followers",
    base: "followers",
    formula: "interactions ÷ followers × 100",
    note: "The usual way to compare accounts. Works with numbers anyone can see.",
  },
  reach: {
    label: "By reach",
    short: "reach",
    base: "reach",
    formula: "interactions ÷ people reached × 100",
    note: "How the people who saw it reacted. Use reach, or impressions if that's what the platform shows.",
  },
  views: {
    label: "By views",
    short: "views",
    base: "views",
    formula: "interactions ÷ views × 100",
    note: "The standard for video on TikTok and YouTube.",
  },
};

const n = (s: string) => {
  const v = Number(String(s).replace(/[\s,]/g, ""));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

export type Result = {
  rate: number | null;
  interactions: number;
  base: number;
  perPost: number;
  band: "low" | "average" | "good" | "great" | null;
  typical: number;
  bands: Bands;
  parts: { key: string; label: string; value: number }[];
  toGood: number; // extra interactions per post to reach "good"
};

export function calc(platform: Platform, method: Method, v: Inputs): Result {
  const p = PLATFORMS.find((x) => x.id === platform)!;
  const posts = Math.max(1, Math.round(n(v.posts)) || 1);
  const parts = [
    { key: "likes", label: "Likes", value: n(v.likes) },
    { key: "comments", label: "Comments", value: n(v.comments) },
    { key: "shares", label: platform === "linkedin" || platform === "x" ? "Reposts" : "Shares", value: n(v.shares) },
    ...(p.saves ? [{ key: "saves", label: p.saves, value: n(v.saves) }] : []),
    ...(p.clicks ? [{ key: "clicks", label: "Link clicks", value: n(v.clicks) }] : []),
  ];
  const interactions = parts.reduce((a, x) => a + x.value, 0);
  // followers are one number for the account; reach and views add up across posts like interactions do
  const base = method === "followers" ? n(v.followers) * posts : method === "reach" ? n(v.reach) : n(v.views);
  const rate = base && interactions ? (interactions / base) * 100 : null;
  const bands = p.bands[method] ?? [0, 0, 0];
  const band = rate === null ? null : rate >= bands[2] ? "great" : rate >= bands[1] ? "good" : rate >= bands[0] ? "average" : "low";
  const toGood = rate !== null && band !== "good" && band !== "great" ? Math.ceil(((bands[1] / 100) * base - interactions) / posts) : 0;
  return { rate, interactions, base, perPost: interactions / posts, band, typical: p.typical[method] ?? 0, bands, parts, toGood };
}

export const BAND_TEXT = {
  low: "Below average",
  average: "Average",
  good: "Good",
  great: "Excellent",
} as const;
