import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/og";
import { GROUPS, TOOLS } from "@/lib/site";
import { slugify } from "@/lib/markdown";
import tool from "@/components/tool.module.css";
import styles from "./blog.module.css";

export const metadata: Metadata = pageMetadata(
  "Marketing guides: QR codes, UTMs, SEO, email and social",
  "Practical, plain-English guides for marketers, founders and creators, each paired with a free tool you can use straight away.",
  "/blog",
);

export default async function BlogPage() {
  const posts = await getPosts();
  // tools grouped the same way as the Tools menu, each with its guides
  const sections = GROUPS.map((name) => ({
    name,
    id: slugify(name),
    tools: TOOLS.filter((t) => t.live && t.group === name)
      .map((t) => ({ tool: t, posts: posts.filter((p) => p.tool === t.slug) }))
      .filter((g) => g.posts.length),
  })).filter((s) => s.tools.length);

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

      {/* jump straight to a topic instead of scrolling past every group */}
      <nav className={styles.topics} aria-label="Guide topics">
        {sections.map((sec) => (
          <a key={sec.id} href={`#${sec.id}`}>
            {sec.name}
            <span>{sec.tools.reduce((n, g) => n + g.posts.length, 0)}</span>
          </a>
        ))}
      </nav>

      {sections.map((sec, si) => (
        <section key={sec.id} id={sec.id} className={styles.section}>
          <h2 className={styles.sectionTitle}>{sec.name}</h2>
          {sec.tools.map((g, gi) => (
            <div key={g.tool.slug} id={g.tool.slug} className={styles.group} style={{ animationDelay: `${(si * 2 + gi) * 50}ms` }}>
              <div className={styles.groupHead}>
                <h3>{g.tool.name}</h3>
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
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
