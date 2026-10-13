import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { PostStudio } from "./PostStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free LinkedIn post formatter and preview",
  "Write LinkedIn posts with bold, italic and lists, and see exactly where the post cuts off with \"…more\" on phone and desktop. Free, no account.",
  "/linkedin",
);

export default function LinkedinPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>LinkedIn post formatter</span>
          </span>
        </h1>
      </header>
      <PostStudio />
      <RelatedGuides tool="linkedin" />
    </main>
  );
}
