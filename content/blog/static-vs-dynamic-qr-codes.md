---
title: "Static vs dynamic QR codes: why \"free\" QR codes stop working"
description: The real difference between static and dynamic QR codes, why some free QR codes break after a trial, and how to choose the right one.
date: 2026-10-12
tool: qr
---

You printed 2,000 flyers with a QR code. Three weeks later someone tells you it opens an error page asking you to "reactivate your subscription". This happens to small businesses every day, and it comes down to one choice most generators never explain: static or dynamic.

## What a static QR code is

A static QR code stores your content directly in the pattern. If it's a link, the link itself is encoded in the squares. If it's wifi, the network name and password are in there.

That means:

- **It never expires.** There's no server in the middle to switch off.
- **It's private.** No company sees who scans it or when.
- **It can't be edited.** If the link changes, you need a new code.
- **It doesn't count scans by itself.** (There's an easy workaround, below.)

## What a dynamic QR code is

A dynamic QR code stores a short link owned by the QR company, something like `qr.example.com/x7Fk2`. When someone scans it, their phone visits that short link first, the company records the scan, then forwards them to your real page.

That means:

- **You can change where it points** after printing.
- **You get scan statistics** in their dashboard.
- **It depends on that company forever.** If you stop paying, close your account, or they shut down, every printed code breaks.

## Why "free" QR codes stop working

Many generators make dynamic codes by default, even when you just wanted a simple link. They're free during a trial, and the dashboard looks great. Then the trial ends and the redirect is switched off or sent to a "please upgrade" page.

You didn't do anything wrong. You just weren't told that your code was rented, not owned.

{{tool}}

## Which one should you use?

**Use a static code when:**

- The destination won't change (your homepage, a menu page, wifi, a contact card).
- It's printed on something permanent or expensive: packaging, signage, business cards.
- You don't want to depend on a subscription.

**Consider a dynamic code when:**

- You genuinely need to change the destination after printing, for example a code on a product box that should point to a different campaign every season.
- You're happy to pay for it for as long as the printed material exists.

For most people, static is the better choice. And there's a simple way to get the two main benefits of dynamic codes without the lock-in.

## Get tracking and flexibility without a dynamic code

**For tracking:** add UTM tags to your link before you make the code. Instead of `yoursite.com/menu`, encode `yoursite.com/menu?utm_source=flyer&utm_medium=qr&utm_campaign=spring`. Google Analytics then counts every scan as its own source, in your own account, forever. Our [UTM builder](/utm) does this in one click and even has a "Printed QR" preset. More on this in [what UTM parameters are](/blog/what-are-utm-parameters).

**For flexibility:** point the code at a page on your own website that you control, like `yoursite.com/scan`. If plans change, you update that page or set up a redirect on your own site. You keep the flexibility, and nobody else holds the switch.

## Frequently asked questions

### Do static QR codes expire?

No. A static QR code keeps working as long as the content inside it is valid, for example as long as the website it points to exists.

### Can I edit a static QR code after printing?

Not the code itself. But if it points to a page on your own website, you can change that page or redirect it, which has the same effect.

### Are mktbox QR codes static or dynamic?

Static. Every code is generated in your browser with your content stored inside it, so it never expires and nobody else can switch it off.

### How do I count scans on a static QR code?

Add UTM tags to the link before making the code. Each scan then appears in Google Analytics under the source, medium and campaign you chose.
