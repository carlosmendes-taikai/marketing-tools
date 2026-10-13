import { Bento } from "@/components/Bento";
import type { Metadata } from "next";
import styles from "./home.module.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main className="wrap">
      <section className={styles.hero}>
        <h1 className={styles.title}>
          <span className={styles.line}>
            <span style={{ animationDelay: "0.05s" }}>
              Free <span className={styles.mark}>marketing</span> tools.
            </span>
          </span>
        </h1>
        <p className={styles.sub}>
          Tools for marketers, founders and creators. <span>Free to use, free to download, no account.</span>
        </p>
      </section>
      <Bento />
    </main>
  );
}
