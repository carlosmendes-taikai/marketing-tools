import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { GifStudio } from "./GifStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free GIF animator: animate a logo or banner",
  "Turn a logo or banner into a subtle animated GIF: shine, float, pulse, fade, wipe, zoom or drop in. Transparent backgrounds, made in your browser. Free.",
  "/gif",
);

export default function GifPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>GIF animator</span>
          </span>
        </h1>
      </header>
      <GifStudio />
      <RelatedGuides tool="gif" />
    </main>
  );
}
