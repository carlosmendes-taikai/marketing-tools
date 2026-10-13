---
title: "Open Graph image size: the right dimensions for every platform"
description: The best Open Graph image size for LinkedIn, Facebook, X, WhatsApp and Slack, plus file size limits and how to design a share image that isn't cropped.
date: 2026-10-12
tool: preview
---

Your share image is the biggest thing in a link preview, and the most likely to go wrong: a logo cropped in half, text cut off at the edges, or a blurry thumbnail. The fix is mostly about using the right size and keeping important content away from the edges.

## The short answer: 1200 × 630

If you only remember one thing, make your Open Graph image **1200 × 630 pixels** (a 1.91 to 1 ratio). It works well on nearly every platform.

## Open Graph image sizes by platform

| Platform | Recommended size | Ratio | Notes |
| --- | --- | --- | --- |
| Facebook | 1200 × 630 | 1.91:1 | Minimum 600 × 315 for the large card |
| LinkedIn | 1200 × 627 | 1.91:1 | Small images show as a small thumbnail |
| X (Twitter) | 1200 × 628 | about 1.91:1 | Needs `twitter:card` set to `summary_large_image` |
| WhatsApp | 1200 × 630 | 1.91:1 | Keep the file light, ideally under about 300 KB |
| Slack | 1200 × 630 | 1.91:1 | Shown smaller, so bold visuals work best |
| Discord, iMessage, Teams | 1200 × 630 | 1.91:1 | Follow the same standard |

## File size and format

- **Format:** JPG for photos, PNG for graphics with text and flat colours. WebP works on most platforms but JPG and PNG are the safest bets.
- **File size:** keep it under about 1 MB, and much smaller for WhatsApp. Platforms ignore images that are too heavy, and some time out on slow servers.
- **Never under 600 pixels wide.** Small images get shown as a tiny thumbnail or skipped.

## Design rules so nothing gets cropped

Platforms crop slightly differently, and some round the corners or overlay text. Design for that:

1. **Keep a safe zone.** Put text and logos in the central area, with roughly 60 to 80 pixels of breathing room on every side.
2. **Big, short text.** Your image will often be seen at a third of its size on phones. Five words at a large size beat a paragraph.
3. **High contrast.** Dark text on light backgrounds, or the reverse. Avoid thin fonts.
4. **Don't repeat the title.** The platform already shows your title under the image. Use the image for a visual, a key number or a short hook.
5. **Make one per page** for your important pages. A generic logo image on every page gets ignored.

## How to make and check your share image

{{tool}}

1. Make your image at 1200 × 630, or turn an existing image into the right size with the [image resizer](/resize), which has a "Link share image" preset and lets you drag to choose the crop.
2. Add it to your page's `og:image` tag, with `og:image:width` and `og:image:height`. See [Open Graph tags](/blog/open-graph-tags) for the exact code.
3. Run the page through the [link preview checker](/preview). It reports the real image size, warns if it will be cropped or is too heavy, and shows it on six platforms at once.

## Frequently asked questions

### What is the best Open Graph image size?

1200 × 630 pixels. It works well on Facebook, LinkedIn, X, WhatsApp, Slack and most other platforms.

### Why is my Open Graph image cropped?

The image doesn't match the 1.91 to 1 ratio, or important content sits too close to the edges. Use 1200 × 630 and keep text and logos in the centre.

### What's the maximum file size for an Open Graph image?

Limits vary by platform, but keeping it under 1 MB is safe almost everywhere, and smaller is better for WhatsApp.

### Can I use a square image for link previews?

You can, but most platforms will either crop it into a wide shape or show it as a small thumbnail. A 1200 × 630 image gives you the large card.
