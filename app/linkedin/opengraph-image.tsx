import { ogImage, ogSize } from "@/lib/og";

export const alt = "LinkedIn post formatter, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("LinkedIn post formatter", "Bold, italic and lists, plus exactly where \"…more\" cuts your post.");
}
