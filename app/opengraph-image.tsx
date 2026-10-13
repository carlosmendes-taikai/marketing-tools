import { ogImage, ogSize } from "@/lib/og";

export const alt = "mktbox: free marketing tools for marketers, founders and creators.";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Free marketing tools.", "Tools for marketers, founders and creators. Free to use and download, no account required.");
}
