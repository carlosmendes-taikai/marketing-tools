import { ogImage, ogSize } from "@/lib/og";

export const alt = "Keyword ideas, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Keyword ideas", "What people actually type into Google about your topic.");
}
