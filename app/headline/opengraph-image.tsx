import { ogImage, ogSize } from "@/lib/og";

export const alt = "Headline analyzer, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Headline analyzer", "Score your title, hook or subject line before you hit publish.");
}
