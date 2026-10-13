---
title: UTM naming conventions for Google Analytics 4
description: A simple UTM naming system that keeps Google Analytics 4 reports clean, including the exact source and medium values GA4 expects for each channel.
date: 2026-10-11
tool: utm
---

UTM tags only help if they're consistent. When one person writes `Facebook`, another writes `fb`, and the agency writes `facebook.com`, your reports fill up with duplicates and nobody trusts the numbers. A short naming convention, agreed once, fixes it for good.

## Why naming matters more in GA4

Google Analytics 4 sorts traffic into **channels** (Organic Social, Paid Social, Email, Paid Search and so on) using rules that read your `utm_source` and `utm_medium` values. If your values don't match what GA4 expects, visits land in **Unassigned**, where they're almost useless.

So the most important part of your convention is the medium.

## The medium values GA4 understands

| Channel in GA4 | Use this medium | Notes |
| --- | --- | --- |
| Organic Social | `social` | With a social source like `linkedin` or `instagram` |
| Paid Social | `paid_social` | For promoted posts and social ads |
| Email | `email` | Newsletters and email campaigns |
| Paid Search | `cpc` | Google Ads, Bing Ads |
| Display | `display` | Banner ads |
| Referral | `referral` | Partner sites, guest posts |
| Affiliates | `affiliate` | Affiliate links |
| Offline | `offline` or `print` | QR codes on print, flyers |

Stick to these and GA4 slots your traffic into the right channel automatically.

## A naming convention you can copy

**1. Always lowercase.** UTM values are case sensitive in GA4.

**2. Use underscores between words, never spaces.** `spring_launch`, not `Spring Launch`. Spaces turn into `%20` and look messy in reports.

**3. Source is the platform, in one word.** `linkedin`, `instagram`, `facebook`, `x`, `tiktok`, `youtube`, `newsletter`, `google`.

**4. Medium is the channel type,** from the table above.

**5. Campaign follows a pattern:** `[topic]_[month or quarter]_[year]`. For example `spring_menu_apr_2026` or `webinar_q3_2026`. Anyone can understand it a year later.

**6. Content describes the link or creative:** `hero_button`, `footer_link`, `video_a`, `video_b`. Use it for A/B tests and for emails with several links.

**7. Write it down.** Keep the rules and approved values in a shared doc or sheet, and make it the only source of truth.

## Example: one campaign across channels

For a spring menu launch:

| Channel | Source | Medium | Campaign |
| --- | --- | --- | --- |
| LinkedIn post | `linkedin` | `social` | `spring_menu_apr_2026` |
| Instagram ad | `instagram` | `paid_social` | `spring_menu_apr_2026` |
| Newsletter | `newsletter` | `email` | `spring_menu_apr_2026` |
| Google Ads | `google` | `cpc` | `spring_menu_apr_2026` |
| Printed flyer | `qr` | `offline` | `spring_menu_apr_2026` |

Same campaign name everywhere, so you can compare channels side by side in one report.

## Build consistent links automatically

{{tool}}

The [UTM builder](/utm) applies these conventions for you:

- **Channel presets** fill in source and medium with the values GA4 expects.
- **Tidy tags** lowercases everything and turns spaces into underscores.
- **One per channel** creates a matching link for every channel in a campaign at once, so the campaign name is identical everywhere.
- **Saved links** keep a record of every link you made, exportable as a CSV for your team.

If you're new to UTMs, start with [what UTM parameters are](/blog/what-are-utm-parameters).

## Frequently asked questions

### What medium should I use for social media in GA4?

Use `social` for organic posts and `paid_social` for promoted posts and ads, with the platform name as the source.

### Why is my UTM traffic showing as Unassigned in GA4?

Usually the medium doesn't match GA4's channel rules, for example `Social Media` or `newsletter` as a medium. Use the standard values like `social`, `email` and `cpc`.

### Should UTM parameters be uppercase or lowercase?

Always lowercase. GA4 treats different capitalisation as different values, which splits your data.

### Can I fix UTM mistakes after the fact?

Not for past data in standard reports. You can only correct new links going forward, which is why agreeing on a convention early matters.
