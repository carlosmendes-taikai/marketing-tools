import { ogImage, ogSize } from "@/lib/og";

export const alt = "Engagement rate calculator, free on mktbox";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Engagement rate calculator", "By followers, reach or views, compared to benchmarks for each platform.");
}
