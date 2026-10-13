---
title: "Open Graph tags: how to control your link previews"
description: What Open Graph tags are, which ones you need, copy-paste examples, and how to check that LinkedIn, X, WhatsApp and Slack show your links the way you want.
date: 2026-10-13
tool: preview
---

When you paste a link into LinkedIn, Slack or WhatsApp, a card appears with an image, a title and a short description. That card is built from **Open Graph tags**, a few lines of code in your page. When they're missing, apps guess, and the result is a cropped logo, a random sentence or no preview at all.

## What Open Graph tags are

Open Graph is a standard Facebook introduced so any web page can describe itself when shared. Nearly every platform now reads it: LinkedIn, Facebook, WhatsApp, Slack, Discord, iMessage, Teams and more. X reads them too, alongside its own `twitter:` tags.

The tags live in the `<head>` of your page and look like this:

```html
<meta property="og:title" content="Spring menu at Bakery Co" />
<meta property="og:description" content="Eight new pastries, available until June." />
<meta property="og:image" content="https://bakery.co/images/spring-share.jpg" />
<meta property="og:url" content="https://bakery.co/spring-menu" />
```

## The tags you actually need

| Tag | What it does |
| --- | --- |
| `og:title` | The headline of your card. Keep it under about 60 characters. |
| `og:description` | One or two sentences under the title. Around 110 to 155 characters. |
| `og:image` | The share image. 1200 × 630 pixels works almost everywhere. |
| `og:url` | The main address of the page, so shares and likes count in one place. |
| `og:site_name` | Your brand name, shown above the title on some platforms. |
| `og:type` | Usually `website`, or `article` for blog posts. |
| `twitter:card` | Set to `summary_large_image` so X shows the big image. |

Also keep a normal `<title>` and `<meta name="description">`. Google uses those for search results.

## A complete, copy-paste example

```html
<title>Spring menu · Bakery Co</title>
<meta name="description" content="Eight new pastries, available until June." />
<link rel="canonical" href="https://bakery.co/spring-menu" />

<meta property="og:type" content="website" />
<meta property="og:url" content="https://bakery.co/spring-menu" />
<meta property="og:site_name" content="Bakery Co" />
<meta property="og:title" content="Spring menu at Bakery Co" />
<meta property="og:description" content="Eight new pastries, available until June." />
<meta property="og:image" content="https://bakery.co/images/spring-share.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
```

Two rules people often miss: the image address must be a **full URL** starting with `https://`, and the image must be **publicly reachable**, not behind a login.

## How to check your tags

You don't need to post a link to see how it looks. A preview checker reads your page the same way the platforms do.

{{tool}}

1. Paste your page into the [link preview checker](/preview).
2. See your card as it appears on **LinkedIn, X, WhatsApp, Slack, Facebook** and in **Google search**, side by side.
3. Read the share score and the list of problems, such as a missing image, an image that will be cropped, or a title that gets cut off.
4. Copy the **fixed tags, ready to paste**, generated from your page, and add them to your site or send them to your developer.

## Where to add the tags

- **WordPress:** SEO plugins like Yoast or Rank Math have a "Social" tab per page.
- **Webflow, Framer, Squarespace, Wix:** each page's settings have SEO and social sharing fields.
- **Shopify:** most themes set them from the product title, description and featured image.
- **Custom sites:** add them to the page's `<head>`, or ask your developer to generate them per page.

After changing tags, platforms may still show the old preview for a while because they cache it. See [why your link preview isn't showing](/blog/link-preview-not-showing) for how to refresh it, and [Open Graph image size](/blog/open-graph-image-size) for image dimensions.

## Frequently asked questions

### What are Open Graph tags?

Meta tags in a web page's code that tell LinkedIn, Facebook, WhatsApp, Slack and other apps which title, description and image to show when the page is shared.

### Do Open Graph tags help SEO?

Not directly for rankings. But a good preview gets more clicks when your page is shared, which drives more traffic and links.

### Does X (Twitter) use Open Graph tags?

Yes. X reads Open Graph tags, and you should add `twitter:card` set to `summary_large_image` so it shows the large image format.

### How do I check my Open Graph tags?

Paste your page into the mktbox link preview checker. It shows how the link looks on each platform and lists anything that needs fixing.
