// Recommended image sizes per platform (checked against each platform's guidelines, 2026).

export type Size = { id: string; platform: string; label: string; w: number; h: number; on?: boolean };

export const SIZES: Size[] = [
  { id: "ig-square", platform: "Instagram", label: "Square post", w: 1080, h: 1080, on: true },
  { id: "ig-portrait", platform: "Instagram", label: "Portrait post", w: 1080, h: 1350, on: true },
  { id: "ig-story", platform: "Instagram", label: "Story and reel", w: 1080, h: 1920, on: true },
  { id: "li-post", platform: "LinkedIn", label: "Feed image", w: 1200, h: 627, on: true },
  { id: "li-square", platform: "LinkedIn", label: "Square post", w: 1200, h: 1200 },
  { id: "li-banner", platform: "LinkedIn", label: "Profile banner", w: 1584, h: 396 },
  { id: "x-post", platform: "X", label: "Post image", w: 1600, h: 900, on: true },
  { id: "x-header", platform: "X", label: "Header", w: 1500, h: 500 },
  { id: "fb-post", platform: "Facebook", label: "Feed image", w: 1200, h: 630 },
  { id: "fb-cover", platform: "Facebook", label: "Page cover", w: 851, h: 315 },
  { id: "yt-thumb", platform: "YouTube", label: "Thumbnail", w: 1280, h: 720 },
  { id: "yt-banner", platform: "YouTube", label: "Channel banner", w: 2560, h: 1440 },
  { id: "tt-video", platform: "TikTok", label: "Cover", w: 1080, h: 1920 },
  { id: "pin", platform: "Pinterest", label: "Pin", w: 1000, h: 1500 },
  { id: "og", platform: "Website", label: "Link share image", w: 1200, h: 630 },
];

export const PLATFORMS = [...new Set(SIZES.map((s) => s.platform))];
