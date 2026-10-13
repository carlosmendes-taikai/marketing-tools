---
title: Link preview not showing? How to fix it on LinkedIn, Facebook, WhatsApp and Slack
description: Why your link preview is missing, shows the wrong image or an old title, and how to fix it and force each platform to refresh.
date: 2026-10-11
tool: preview
---

You paste your link into LinkedIn and get no image. Or WhatsApp shows last month's title. Or Slack shows nothing at all. Link previews fail for a handful of predictable reasons, and almost all of them are fixable in minutes.

## Step 1: see what the platforms see

Before changing anything, find out what's actually wrong.

{{tool}}

Paste the page into the [link preview checker](/preview). It reads your page the way LinkedIn, X, WhatsApp, Slack and Facebook do, shows each card side by side, and lists the problems in plain English with the fix. It also gives you corrected tags to copy.

## The most common causes

### 1. Missing Open Graph tags

Without `og:title`, `og:description` and `og:image`, platforms guess, often badly, or show nothing. Add the tags (see [Open Graph tags](/blog/open-graph-tags) for a copy-paste example).

### 2. The image can't be loaded

The `og:image` address is broken, uses a relative path like `/images/share.jpg` instead of a full `https://` address, sits behind a login, or is blocked by your server or firewall. Open the image address in a private browser window: if you can't see it, neither can LinkedIn.

### 3. The image is too small or too heavy

Images under about 600 pixels wide get shown as a tiny thumbnail or skipped. Very large files time out. Use 1200 × 630 and keep it under 1 MB. Details in [Open Graph image size](/blog/open-graph-image-size).

### 4. The platform cached an old version

Platforms store a copy of your preview the first time someone shares the link, sometimes for days. If you fixed your tags afterwards, they'll keep showing the old version until you refresh it.

### 5. Your site blocks bots

Some security settings, firewalls and "bot protection" features block the crawlers platforms use to build previews. If the checker can't reach your page, the platforms probably can't either. Ask your host to allow social media crawlers.

### 6. The page needs JavaScript to show its tags

If your tags are added by JavaScript after the page loads, many platforms never see them, because they read the raw HTML. The tags need to be in the page as it's first sent from the server.

## How to refresh the preview on each platform

- **LinkedIn:** use LinkedIn's **Post Inspector** (search "LinkedIn Post Inspector"), paste your link and inspect it. This refreshes LinkedIn's copy.
- **Facebook:** use the **Sharing Debugger** in Meta for Developers, paste the link and click **Scrape again**.
- **X:** X refreshes previews on its own over time. Previewing the post in the composer usually shows the latest version.
- **WhatsApp:** WhatsApp caches previews heavily. A quick workaround is sharing the link with a small harmless parameter at the end, like `?v=2`, which WhatsApp treats as a new link.
- **Slack:** Slack caches unfurls for a while. Adding a parameter like `?v=2` gets a fresh preview immediately.

The `?v=2` trick works almost everywhere, as long as your site ignores unknown parameters, which nearly all do.

## A quick checklist

- `og:title`, `og:description` and `og:image` are present.
- The image address is a full `https://` URL that opens in a private window.
- The image is 1200 × 630 and under 1 MB.
- `twitter:card` is set to `summary_large_image`.
- The tags are in the page's HTML, not added later by JavaScript.
- You refreshed the platform's cache after making changes.

## Frequently asked questions

### Why is my link preview not showing on LinkedIn?

Usually missing Open Graph tags, an image LinkedIn can't load, or an old cached version. Check the page with a link preview checker, fix the tags, then refresh LinkedIn's copy with Post Inspector.

### Why does WhatsApp show an old preview of my link?

WhatsApp caches previews. Share the link with a small parameter added, like `?v=2`, and WhatsApp will fetch a fresh one.

### How do I refresh a Facebook link preview?

Paste the link into Facebook's Sharing Debugger and click Scrape again.

### Why does my preview have no image?

The `og:image` tag is missing, the address isn't a full public `https://` URL, or the image is too small or heavy. The link preview checker tells you which.
