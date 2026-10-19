import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { EngagementStudio } from "./EngagementStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free engagement rate calculator",
  "Work out the engagement rate for Instagram, TikTok, LinkedIn, Facebook, X and YouTube by followers, reach or views, and compare it to benchmarks.",
  "/engagement",
);

export default function EngagementPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Engagement rate calculator</span>
          </span>
        </h1>
      </header>
      <EngagementStudio />
      <RelatedGuides tool="engagement" />
    </main>
  );
}
