import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPost, getPosts, TOOL_MARKER } from "@/lib/blog";
import { pageMetadata, SITE_URL } from "@/lib/og";
import { SITE_NAME, AUTHOR, TOOLS } from "@/lib/site";
import { ToolCta } from "@/components/ToolCta";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "../blog.module.css";

// every post is prerendered from generateStaticParams; unknown slugs 404
export const instant = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const base = pageMetadata(post.title, post.description, `/blog/${post.slug}`);
  return { ...base, openGraph: { ...base.openGraph, type: "article", publishedTime: post.date, authors: [AUTHOR] } };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const tool = TOOLS.find((t) => t.slug === post.tool);
  const [before, after] = post.html.includes(TOOL_MARKER) ? post.html.split(TOOL_MARKER) : [post.html, ""];
  const url = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      image: `${url}/opengraph-image`,
      mainEntityOfPage: url,
      author: { "@type": "Person", name: AUTHOR, url: "https://mendes.cc" },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 2, name: post.title, item: url },
      ],
    },
    ...(post.faq.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]
      : []),
  ];

  return (
    <main className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.layout}>
        <article className={styles.article}>
          <header className={styles.header}>
            <Link href="/blog" className={styles.back}>
              ← All guides
            </Link>
            <h1>{post.title}</h1>
            <p className={styles.lead}>{post.description}</p>
            <p className={styles.meta}>
              {AUTHOR} · {formatDate(post.date)} · {post.minutes} min read
            </p>
          </header>
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: before }} />
          {tool && after && <ToolCta slug={tool.slug} />}
          {after && <div className={styles.prose} dangerouslySetInnerHTML={{ __html: after }} />}
          {tool && <ToolCta slug={tool.slug} variant="end" />}
        </article>

        {post.toc.length > 2 && (
          <aside className={styles.toc}>
            <b>On this page</b>
            <ol>
              {post.toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`}>{t.text}</a>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
      <RelatedGuides tool={post.tool} exclude={post.slug} title="Keep reading" />
    </main>
  );
}
