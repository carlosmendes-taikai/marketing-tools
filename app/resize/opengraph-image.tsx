import { ogImage, ogSize } from "@/lib/og";

export const alt = "Image resizer, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Image resizer", "One image, every social size, one zip. It never leaves your device.");
}
