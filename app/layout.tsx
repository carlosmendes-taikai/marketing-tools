import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE_NAME } from "@/lib/site";
import { SITE_URL } from "@/lib/og";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} · Free marketing tools, no paywall`,
    template: `%s · ${SITE_NAME}`,
  },
  description: "Small free tools that each do one job well. No account, nothing to upgrade.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: `${SITE_NAME} · Free marketing tools, no paywall`,
    description: "Small free tools that each do one job well. No account, nothing to upgrade.",
    url: "/",
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${schibsted.variable} ${plexMono.variable}`}>
      <body>
        <Nav />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
