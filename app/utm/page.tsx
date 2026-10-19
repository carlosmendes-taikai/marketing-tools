import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { UtmStudio } from "./UtmStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free UTM builder with QR codes",
  "Build tagged campaign links for Google Analytics in seconds. One link, one per channel or hundreds from a spreadsheet, each with a QR code. Free, no account.",
  "/utm",
);

export default function UtmPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>UTM builder</span>
          </span>
        </h1>
      </header>
      <UtmStudio />
      <RelatedGuides tool="utm" />
    </main>
  );
}
