---
title: Core Web Vitals explained in plain English
description: What LCP, INP and CLS actually measure, what good scores look like, and the practical fixes for each, without the developer jargon.
date: 2026-10-12
tool: speed
---

Core Web Vitals are Google's three measurements of how a page feels to a real person: does the main content load fast, does the page react quickly when you tap, and does it stay still while loading. They're part of how Google judges page experience, and they're a good proxy for whether visitors will stick around.

## The three Core Web Vitals

| Metric | What it measures | Good | Needs work | Poor |
| --- | --- | --- | --- | --- |
| LCP, Largest Contentful Paint | When the main content appears | 2.5 s or less | Up to 4 s | Over 4 s |
| INP, Interaction to Next Paint | How fast the page reacts to taps and clicks | 200 ms or less | Up to 500 ms | Over 500 ms |
| CLS, Cumulative Layout Shift | How much the layout jumps around | 0.1 or less | Up to 0.25 | Over 0.25 |

Google looks at what 75% of your real visitors experience. If three out of four visits are "good", the page passes.

## LCP: when the main content appears

**In plain English:** how long until the biggest thing on screen, usually a hero image or headline block, shows up.

**Common causes of a slow LCP:**

- A huge hero image that isn't compressed or resized.
- The hero image being lazy-loaded, so the browser deliberately waits.
- A slow server that takes ages to send the first byte.
- CSS or fonts that block the page from showing.

**Fixes:** compress and resize the hero image (WebP or AVIF), never lazy-load it, preload it if it's discovered late, and use a fast host with a CDN.

## INP: how quickly the page reacts

**In plain English:** when you tap a button or open a menu, how long until something visibly happens. INP replaced the older FID metric in 2024.

**Common causes of a poor INP:** heavy JavaScript keeping the browser busy, such as big frameworks, chat widgets, tag managers loading many scripts, or complicated sliders.

**Fixes:** remove scripts you don't need, delay third-party scripts until after the page is usable, and break up long JavaScript tasks.

## CLS: how much things jump around

**In plain English:** have you ever gone to tap a link and an ad loaded, pushing everything down, so you tapped the wrong thing? That's layout shift.

**Common causes:** images and videos without set dimensions, ads or embeds that load late, cookie banners that push content, and web fonts that swap in with different sizes.

**Fixes:** always set width and height on images and video, reserve space for ads and embeds, show banners as overlays instead of pushing content, and choose fallback fonts with similar sizing.

## Lab data vs field data

When you test a page you'll see two kinds of numbers:

- **Field data** comes from real Chrome users over the last 28 days. This is what Google uses for ranking. New or low-traffic sites may not have it.
- **Lab data** comes from a single simulated test on a mid-range phone. It's great for finding problems and checking fixes immediately.

{{tool}}

The [page speed audit](/speed) shows both: "What real visitors experience" is the field data, and "How it loads in our test" is the lab data. Fixes show up in the lab test straight away, and in field data over the following weeks.

## Do Core Web Vitals affect rankings?

Yes, as part of Google's page experience signals, but they're not the biggest factor. Relevant, helpful content still wins. Think of Core Web Vitals as a tiebreaker between similar pages, and as a direct influence on how many visitors stay long enough to convert.

For a step-by-step testing routine, see [how to test your website speed](/blog/website-speed-test).

## Frequently asked questions

### What are the three Core Web Vitals?

Largest Contentful Paint (how fast the main content appears), Interaction to Next Paint (how fast the page reacts to input) and Cumulative Layout Shift (how much the layout moves while loading).

### What is a good LCP score?

2.5 seconds or less for at least 75% of visits.

### How do I check my Core Web Vitals?

Run your page through the mktbox page speed audit. It shows real-visitor data from Chrome when available, plus a lab test with plain-English fixes. Google Search Console also has a Core Web Vitals report for your whole site.

### How long do Core Web Vitals take to update?

Lab results change immediately after a fix. Field data is based on the last 28 days of visits, so improvements show up gradually over about a month.
