import { ogImage, ogSize } from "@/lib/og";

export const alt = "mktbox privacy";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Privacy", "No accounts, no ads, nothing sold. Most tools run in your browser.");
}
