import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/og";
import { TOOLS } from "@/lib/site";
import tool from "@/components/tool.module.css";
import styles from "./blog.module.css";

export const metadata: Metadata = pageMetadata(
  "Marketing guides: QR codes, UTMs, SEO, email and social",
  "Practical, plain-English guides for marketers, founders and creators, each paired with a free tool you can use straight away.",
  "/blog",
);

export default async function BlogPage() {
  const posts = await getPosts();
  const groups = TOOLS.filter((t) => t.live)
    .map((t) => ({ tool: t, posts: posts.filter((p) => p.tool === t.slug) }))
    .filter((g) => g.posts.length);

  return (
    <main className="wrap">
      <header className={tool.head}>
        <h1>
          <span className={tool.line}>
            <span>Guides</span>
          </span>
        </h1>
      </header>
      <p className={styles.intro}>Plain-English guides for the jobs our tools do. Read the how and why, then do it in one click.</p>

      {groups.map((g, gi) => (
        <section key={g.tool.slug} className={styles.group} style={{ animationDelay: `${gi * 60}ms` }}>
          <div className={styles.groupHead}>
            <h2>{g.tool.name}</h2>
            <Link href={`/${g.tool.slug}`}>Open the tool →</Link>
          </div>
          <div className={styles.cards}>
            {g.posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
                {/* eslint-disable-next-line @next/next/no-img-element -- already a sized PNG from our own route */}
                <img className={styles.thumb} src={p.cover} alt={p.coverAlt} width={1200} height={630} loading="lazy" />
                <b>{p.title}</b>
                <span>{p.description}</span>
                <small>{p.minutes} min read</small>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
