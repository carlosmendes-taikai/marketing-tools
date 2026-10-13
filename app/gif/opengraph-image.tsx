import { ogImage, ogSize } from "@/lib/og";

export const alt = "GIF animator, free on mktbox";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("GIF animator", "Turn a logo or banner into a subtle animated GIF.");
}
