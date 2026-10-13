import { ogImage, ogSize } from "@/lib/og";

export const alt = "Page speed audit, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Page speed audit", "A plain-English report on what is slowing your site down.");
}
