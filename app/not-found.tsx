import Link from "next/link";
import { TOOLS } from "@/lib/site";
import ui from "@/components/tool.module.css";
import styles from "./notfound.module.css";

// Anyone who lands on a dead link gets the tools and guides, not a dead end.
export default function NotFound() {
  return (
    <main className="wrap">
      <header className={ui.head}>
        <h1>
          <span className={ui.line}>
            <span>Page not found</span>
          </span>
        </h1>
      </header>
      <p className={styles.lead}>That address doesn&apos;t exist, or it moved. Here&apos;s everything that does:</p>
      <div className={styles.tools}>
        {TOOLS.filter((t) => t.live).map((t) => (
          <Link key={t.slug} href={`/${t.slug}`}>
            {t.name}
          </Link>
        ))}
      </div>
      <div className={styles.actions}>
        <Link href="/" className={ui.primary}>
          All tools
        </Link>
        <Link href="/blog" className={ui.secondary}>
          Guides
        </Link>
      </div>
    </main>
  );
}
