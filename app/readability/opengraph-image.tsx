import { ogImage, ogSize } from "@/lib/og";

export const alt = "Readability checker, free on mktbox";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Readability checker", "Reading level, long sentences, filler words and buzzwords, highlighted as you type.");
}
