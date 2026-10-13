import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { SpeedStudio } from "./SpeedStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free page speed audit in plain English",
  "Check how fast your website loads on phones and desktop, see your SEO basics, and get a short list of what to fix first. Powered by Google Lighthouse. Free, no account.",
  "/speed",
);

export default function SpeedPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Page speed audit</span>
          </span>
        </h1>
      </header>
      <SpeedStudio />
      <RelatedGuides tool="speed" />
    </main>
  );
}
