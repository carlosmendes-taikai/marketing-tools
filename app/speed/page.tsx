import type { Metadata } from "next";
import { SpeedStudio } from "./SpeedStudio";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = {
  title: "Free page speed audit in plain English",
  description:
    "Check how fast your website loads on phones and desktop, see your SEO basics, and get a short list of what to fix first. Powered by Google Lighthouse. Free, no account.",
};

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
    </main>
  );
}
