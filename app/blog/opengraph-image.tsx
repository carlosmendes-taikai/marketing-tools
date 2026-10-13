import { ogImage, ogSize } from "@/lib/og";

export const alt = "Marketing guides from mktbox";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Marketing guides", "Plain-English guides, each paired with a free tool you can use straight away.");
}
