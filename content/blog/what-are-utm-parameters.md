---
title: What are UTM parameters? A simple guide with examples
description: What UTM parameters are, what each one means, real examples for social, email, ads and print, and how to build tagged links in seconds.
date: 2026-10-13
tool: utm
---

You posted on LinkedIn, sent a newsletter and ran an Instagram ad, and traffic went up. Which one worked? Without UTM parameters, Google Analytics often can't tell you. It lumps visits into vague buckets like "direct" or "referral". UTM parameters fix that by labelling every link you share.

## What UTM parameters are

UTM parameters are short tags added to the end of a link. They don't change the page people land on. They just tell your analytics where the visitor came from.

Here's a link without tags:

```
https://bakery.co/spring-menu
```

And the same link with UTM parameters:

```
https://bakery.co/spring-menu?utm_source=instagram&utm_medium=social&utm_campaign=spring_launch
```

When someone clicks the second one, Google Analytics records the visit as coming from Instagram, via social, for the spring launch campaign.

## The five UTM parameters

| Parameter | What it means | Example |
| --- | --- | --- |
| `utm_source` | Where the visit comes from: the site, app or newsletter | `linkedin`, `newsletter`, `google` |
| `utm_medium` | The type of channel | `social`, `email`, `cpc`, `referral` |
| `utm_campaign` | The campaign or launch name | `spring_launch`, `black_friday_2026` |
| `utm_content` | Tells apart links in the same place | `header_button`, `footer_link` |
| `utm_term` | The paid keyword, for search ads | `qr code generator` |

Source, medium and campaign are the ones you'll use on every link. Content and term are optional. Google Analytics 4 also supports `utm_id` for matching campaign IDs from ad platforms.

## UTM parameter examples

**A LinkedIn post:**
`?utm_source=linkedin&utm_medium=social&utm_campaign=spring_launch`

**A newsletter, with two links to the same page:**
`?utm_source=newsletter&utm_medium=email&utm_campaign=october_digest&utm_content=hero_image`
`?utm_source=newsletter&utm_medium=email&utm_campaign=october_digest&utm_content=text_link`

**A Google Ads campaign:**
`?utm_source=google&utm_medium=cpc&utm_campaign=brand_search&utm_term=bakery+lisbon`

**A QR code on a printed flyer:**
`?utm_source=qr&utm_medium=offline&utm_campaign=spring_flyer`

The last one is a neat trick: QR codes don't normally tell you how many people scanned them, but a tagged link inside one does. See [static vs dynamic QR codes](/blog/static-vs-dynamic-qr-codes).

## How to build UTM links in seconds

Typing tags by hand invites typos, and one typo splits your data into two campaigns. A builder is faster and keeps things consistent.

{{tool}}

1. Paste your link into the [free UTM builder](/utm).
2. Click the channel you're sharing on, such as LinkedIn, Newsletter or Google Ads. Source and medium fill in automatically, using the values Google Analytics expects.
3. Type a campaign name. It's tidied automatically, so "Spring Launch 2026" becomes `spring_launch_2026`.
4. Copy the link, or switch to **One per channel** to get a tagged link for every channel at once.
5. Download a QR code for any link, and save your links to reuse later.

## Where to see the results

In Google Analytics 4, go to **Reports**, then **Acquisition**, then **Traffic acquisition**. Change the dimension to **Session source / medium** or **Session campaign** to see your tagged visits.

## Common UTM mistakes

- **Inconsistent spelling.** `LinkedIn`, `linkedin` and `linked-in` show up as three different sources. Pick lowercase and stick to it.
- **Tagging internal links.** Never add UTMs to links between pages on your own site. They overwrite where the visitor originally came from.
- **Vague campaign names.** `campaign1` means nothing in six months. Use descriptive names with a date.
- **Missing medium.** Without it, Google Analytics often files visits under "Unassigned".

For a full naming system your whole team can follow, see [UTM naming conventions for Google Analytics 4](/blog/utm-naming-conventions-ga4).

## Frequently asked questions

### What are UTM parameters used for?

They label links so your analytics can tell exactly which platform, channel and campaign each visit came from.

### Do UTM parameters affect SEO?

No. Google ignores them for ranking. Just don't use them on internal links between pages of your own site.

### Are UTM parameters case sensitive?

Yes. Google Analytics treats "LinkedIn" and "linkedin" as different values, so always use lowercase.

### Which UTM parameters are required?

Use source, medium and campaign on every link. Content and term are optional.
