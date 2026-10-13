import { SITE_NAME, AUTHOR, GITHUB_URL } from "@/lib/site";
import styles from "./chrome.module.css";

export function Footer() {
  return (
    <footer className={styles.footerOuter}>
      <div className="wrap">
        <div className={styles.footer}>
        <span>
          {SITE_NAME} · built by {AUTHOR}
        </span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          Open source on GitHub
        </a>
        </div>
      </div>
    </footer>
  );
}
