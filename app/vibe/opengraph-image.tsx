import { ogImage, ogSize } from "@/lib/og";

export const alt = "Vibe code audit, free on mktbox";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Vibe code audit", "SEO, security and speed checks for Lovable, Base44 and Bolt apps.");
}
