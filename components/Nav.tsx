import Link from "next/link";
import { SITE_NAME, GITHUB_URL } from "@/lib/site";
import styles from "./chrome.module.css";

export function Nav() {
  return (
    <nav className={styles.navOuter}>
      <div className={`wrap ${styles.nav}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.mark} aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
          {SITE_NAME}
        </Link>
        <div className={styles.links}>
          <Link href="/#tools">Tools</Link>
          <a href={GITHUB_URL} className={styles.dark} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
