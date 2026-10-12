import { Bento } from "@/components/Bento";
import styles from "./home.module.css";

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
        <p className={styles.sub}>No paywall at the end.</p>
      </section>
      <Bento />
    </main>
  );
}
