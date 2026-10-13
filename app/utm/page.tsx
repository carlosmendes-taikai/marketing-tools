import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { UtmStudio } from "./UtmStudio";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free UTM builder with QR codes",
  "Build tagged campaign links for Google Analytics in seconds. One link or one per channel, a QR code for each, and a saved library. Free, no account.",
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
    </main>
  );
}
