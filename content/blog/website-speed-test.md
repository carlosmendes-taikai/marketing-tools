---
title: How to test your website speed and fix what's slowing it down
description: Run a free website speed test, understand the results in plain English, and fix the issues that make the biggest difference first.
date: 2026-10-13
tool: speed
---

A slow website quietly costs you. Visitors leave before the page appears, Google ranks you lower, and your ads pay for clicks that never see your offer. The good news: testing your speed is free, and most of the gains come from a handful of fixes.

## Why website speed matters

- **People leave.** On phones especially, every extra second of loading loses visitors. Many won't wait three seconds for a page they found on social media.
- **Google uses it.** Page experience signals, including Core Web Vitals, are part of how Google ranks pages.
- **It affects sales and sign-ups.** Faster pages consistently convert better, because fewer people drop off before they even see your offer.

## How to run a free website speed test

{{tool}}

1. Open the [free page speed audit](/speed) and paste your page address. Test your most important pages, not just the homepage: the landing pages your ads and posts point to.
2. Choose **Phone** first. Most traffic is mobile, and phones are where speed problems hurt most. Then check **Desktop**.
3. Wait 20 to 60 seconds while Google Lighthouse loads your page on a simulated mid-range phone over a mobile connection.
4. Read the report. It translates Google's jargon into plain English and lists **what to fix first**, ordered by how much time each fix saves.

The audit uses Google's own Lighthouse engine, the same one behind PageSpeed Insights, so the scores match what Google sees.

## How to read the results

**Four scores out of 100:** Speed, SEO, Accessibility and Best practices. 90 and above is good, 50 to 89 needs work, below 50 is poor.

**What real visitors experience.** If your site gets enough Chrome traffic, you'll see data from real visitors over the last 28 days. This is what Google uses for ranking, and it matters more than the lab test.

**How it loads in our test:**

- **Main content appears** (Largest Contentful Paint): when the biggest image or text block shows up. Aim for under 2.5 seconds.
- **First thing appears** (First Contentful Paint): when visitors see anything at all.
- **Page freezes for** (Total Blocking Time): how long the page ignores taps while scripts run.
- **Layout jumps** (Cumulative Layout Shift): how much things move around while loading. Aim for under 0.1.

We explain these in more depth in [Core Web Vitals in plain English](/blog/core-web-vitals-explained).

## The fixes that matter most

### 1. Shrink your images

Images are the most common cause of slow pages. Resize them to the size they're actually displayed at, compress them, and use modern formats like WebP or AVIF, which are often 25 to 50% smaller than JPG or PNG. Our [image resizer](/resize) exports WebP at exact sizes.

### 2. Lazy-load what's below the fold

Images further down the page don't need to load immediately. Lazy loading tells the browser to wait until the visitor scrolls near them. But never lazy-load your main hero image, since that delays the most important content.

### 3. Remove scripts you don't need

Chat widgets, heatmaps, old tracking pixels and plugins all add weight. Audit them every few months and remove anything you don't actively use. Load the rest after the page appears where possible.

### 4. Stop files from blocking the page

Some CSS and JavaScript must finish loading before anything shows. Your developer can load non-critical files later, and inline the small amount of CSS needed for the first screen.

### 5. Use caching and a fast host

Tell browsers to keep files for longer so returning visitors load less. Use a host with a CDN, which serves your site from servers near your visitors.

### 6. Reserve space for images and embeds

Give images, ads and embeds a fixed width and height so the layout doesn't jump when they load. This directly improves your layout shift score.

## How often to test

Test after every significant change: a new theme, a new plugin, a new tracking tool or a redesigned landing page. And re-test your top pages every few months, because sites tend to get slower over time as things get added.

## Frequently asked questions

### How do I test my website speed for free?

Paste your address into the mktbox page speed audit. It runs Google Lighthouse and explains the results in plain English, with a prioritised list of fixes.

### What is a good website speed score?

90 or above is good. But focus on the real-visitor metrics: main content showing within 2.5 seconds and a layout shift under 0.1.

### Why is my mobile score lower than desktop?

The mobile test simulates a mid-range phone on a slower mobile connection, which is much harder than a desktop on fast internet. Since most visitors are on phones, the mobile score is the one to improve.

### Does website speed affect SEO?

Yes. Core Web Vitals are part of Google's page experience signals. Speed alone won't outrank better content, but between similar pages, the faster one has an edge.
