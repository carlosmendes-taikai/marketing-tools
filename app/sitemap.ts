import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/og";
import { TOOLS } from "@/lib/site";
import { getPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...TOOLS.filter((t) => t.live).map((t) => ({
      url: `${SITE_URL}/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...getPosts().map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T12:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
