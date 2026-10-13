---
title: How to make a QR code for free (no signup, no expiry)
description: A step-by-step guide to making a styled QR code for free, without an account, a trial or a code that stops working next month.
date: 2026-10-13
tool: qr
---

Search for "free QR code generator" and you'll find dozens of sites that let you design a beautiful code, then ask for an email, a subscription or a credit card the moment you click download. Worse, some of them hand you a code that quietly stops working when your "free trial" ends.

This guide shows you how to make a QR code that is actually free: no account, no paywall at the download step, and no expiry date. It takes about a minute.

## What you need before you start

Decide what the code should do when someone scans it. The most common options are:

- **Open a website or landing page.** The classic use: menus, flyers, packaging, event posters.
- **Join a wifi network.** Guests scan and connect, no password typing. We cover this in detail in [how to make a QR code for your wifi](/blog/wifi-qr-code).
- **Save a contact.** The phone offers to add your name, number and email to its contacts.
- **Send an email, SMS or WhatsApp message.** Handy for "text us to book" or support codes.
- **Add an event to the calendar,** or **open a location** in Maps.

If it's a link, have the final address ready. If you want to track how many people scan it, add campaign tags to the link first with a [UTM builder](/utm), so scans show up in Google Analytics as their own source.

## How to make the QR code, step by step

{{tool}}

1. **Open the [free QR code generator](/qr)** and pick what the code should open: link, wifi, contact, email, SMS, call, WhatsApp, location or event.
2. **Fill in the details.** For a link, paste the address. For wifi, type the network name and password. The preview updates as you type.
3. **Pick a style.** Start from a preset (Classic, Soft, Dots, Leaf, Twilight or Badge), then change the dot shape, the corner shapes, the colours, or add a gradient.
4. **Add your logo** if you like. It sits in the middle, and the generator switches to the highest error correction so the code still scans.
5. **Add a frame** with a call to action such as "Scan me" or "See the menu". Codes with a short instruction get scanned more than bare ones.
6. **Download.** Choose PNG for screens and quick prints (up to 4096 pixels wide), or SVG for professional print, which stays sharp at any size.

That's it. No email box, no "upgrade to download in high resolution".

## Why this QR code never expires

There are two kinds of QR codes, and the difference matters more than the design.

A **static QR code** stores your content directly in the pattern. The link, the wifi password or the contact card is written into the black and white squares themselves. Nothing sits in between, so nothing can be switched off.

A **dynamic QR code** stores a short redirect link that belongs to the company that made it. When you scan it, you hit their server first, which forwards you to your real page. That's how they count scans, and it's also how they hold your printed code hostage: stop paying and the redirect stops working.

The generator on mktbox only makes static codes. Read more in [static vs dynamic QR codes](/blog/static-vs-dynamic-qr-codes).

## Design tips that keep your code scannable

Styling is fun, but a QR code that doesn't scan is worse than no code at all. Keep these rules in mind:

- **Contrast matters most.** Dark dots on a light background scan everywhere. Light codes on dark backgrounds work on most phones, but some older scanners struggle. The generator warns you when contrast gets too low.
- **Keep the logo under about a third of the code.** QR codes can lose up to 30% of their pattern and still scan at the highest error correction, but the logo also hides the dots around it. If the generator warns that the logo is large, test it.
- **Leave a quiet border.** The empty margin around the code helps phones find it. Don't crop it off or place it right against busy artwork.
- **Size for distance.** A useful rule of thumb is that the code should be about one tenth of the scanning distance. A code read from 1 metre away should be roughly 10 cm wide. Never print smaller than about 2 cm.
- **Shorter content, simpler code.** A long URL produces a denser pattern that's harder to scan when small. Use a short, clean link where you can.

## Test before you print

Always scan the final file with two phones, ideally one iPhone and one Android, before sending anything to print. Scan it from the distance people will actually use, and in the lighting where it will hang. If it takes more than a second to read, increase the size or the contrast.

## Frequently asked questions

### Is this QR code generator really free?

Yes. There is no account, no trial and no paywall on download. You can make as many codes as you like, in PNG or SVG.

### Will my QR code expire?

No. The codes are static, which means your content is stored in the code itself. As long as the page it points to exists, the code works.

### Can I track how many people scan my QR code?

Not inside the code itself, because static codes don't pass through a tracking server. Instead, add UTM tags to the link before you make the code. Every scan then shows up in Google Analytics under the source and campaign you chose.

### What file format should I use for printing?

Use SVG for print. It's a vector file, so it stays sharp at any size, from a business card to a billboard. PNG is fine for screens, slides and small prints.
