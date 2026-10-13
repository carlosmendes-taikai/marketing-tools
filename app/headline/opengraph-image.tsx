import { ogImage, ogSize } from "@/lib/og";

export const alt = "Headline analyzer, free on mktbox";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Headline analyzer", "Score your title, hook or subject line before you hit publish.");
}
