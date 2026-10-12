import type { Metadata } from "next";
import { KeywordStudio } from "./KeywordStudio";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = {
  title: "Free keyword ideas tool, questions people ask",
  description:
    "Find the questions and phrases people type into Google and YouTube about any topic. Hundreds of keyword ideas, grouped and exportable to CSV. Free, no account.",
};

export default function KeywordsPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Keyword ideas</span>
          </span>
        </h1>
      </header>
      <KeywordStudio />
    </main>
  );
}
