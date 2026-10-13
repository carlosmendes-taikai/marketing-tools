---
title: "Is my vibe coded app secure? A checklist for Lovable, Base44 and Bolt"
description: A plain-English security checklist for apps built with Lovable, Base44, Bolt, v0 or Replit. The common mistakes, how to spot them, and how to fix each one.
date: 2026-10-14
tool: vibe
---

AI app builders get you from idea to live app in an afternoon. What they don't always do is lock the doors behind you. Most vibe coded apps that end up in the news didn't get "hacked" in any clever way. Someone simply opened the browser's developer tools and found a key, or an open database.

The good news: the common problems are few, they're easy to check, and most take minutes to fix.

## 1. Secret keys in your public code

Everything your app sends to the browser can be read by anyone. That's how the web works. So if your app calls OpenAI, Stripe or an email service directly from the page, the key for that service is sitting in your code for anyone to copy.

**What it costs you:** someone runs up your OpenAI bill, issues refunds through your Stripe account, or sends spam from your email domain.

**How to fix it:** revoke the leaked key and create a new one. Then move the call into a server function: a Supabase Edge Function, a backend function in your builder, or an API route. The page calls your function, and only your function holds the key.

Some keys are meant to be public. Supabase's "anon" key, a Stripe publishable key (pk_live) and a Firebase web config are all safe to ship, as long as the rules behind them are right. That leads to the next point.

## 2. A database anyone can read

Lovable and many other builders use Supabase. Your app talks to the database straight from the browser using the public anon key. That's by design, and it's safe only if **Row Level Security** is turned on for every table, with rules that limit each user to their own rows.

Without those rules, anyone who copies your anon key can read, and sometimes change, every row in the table. Customer emails, orders, private notes. This is the single most common serious problem in vibe coded apps. We explain it properly in [Supabase Row Level Security, explained](/blog/supabase-row-level-security).

## 3. Private files left online

Sometimes a project's .env file (where keys live) or its .git folder ends up published with the site. Both can be downloaded by anyone who knows where to look, and bots look for them constantly.

## 4. Your original source code is public

Source maps are files that turn your app's compressed code back into the code as you wrote it. They're useful while building and a gift to attackers once live: comments, internal names and logic are all readable.

## 5. Missing browser security settings

Six response headers tell browsers to block common attacks, such as other sites loading yours in a hidden frame to trick clicks, or injected scripts. Most hosts don't add them by default. They're set once, in your host's settings, and then forgotten about.

## Check all of this in one go

You can check points 1, 3, 4 and 5 from the outside, in seconds, with the free vibe code audit. It reads your live app the way any browser can, and never logs in or touches your data.

{{tool}}

1. Paste your app's published address.
2. Look at the Security score and anything marked Fix. Leaked keys come first: until they're rotated, nothing else matters.
3. Open each item for the exact fix. The audit also tells you which builder made the app, with tips for it.
4. For point 2, follow the Supabase check in the report. Database rules can't be tested safely from the outside, so check them in your Supabase dashboard (the Security Advisor flags tables without RLS).

## A 10-minute checklist before you share your app

- **Keys:** no secret keys in page code. Any key ever exposed has been rotated.
- **Database:** Row Level Security is on for every table, with a rule for each action (read, insert, update, delete).
- **Sign-up:** if the app isn't public yet, sign-ups are off or invite-only.
- **Files:** no .env, .git or source map files on the live site.
- **Headers:** the six security headers are set on your host.
- **Builder scan:** you've run your builder's own security scan, if it has one, and fixed what it found.
- **Payments:** prices and permissions are checked on the server, never only in the page.

## Frequently asked questions

### Are Lovable apps secure?

They can be. The platform gives you secure building blocks, but security depends on how they're set up: keys kept on the server, and Row Level Security rules on every Supabase table. Check both before you share your app widely.

### Is it safe that my Supabase anon key is visible?

Yes, it's designed to be public. What keeps your data safe is Row Level Security. If a table has RLS turned off, anyone with the anon key can read it.

### How do I know if my API keys are exposed?

Run a free vibe code audit on your live app. It scans your public code for common secret key formats like Stripe, OpenAI, Anthropic, AWS and Supabase service keys, and shows any it finds, masked.

### What should I do if a key leaked?

Revoke it in the service's dashboard right away and create a new one. Then move the call that uses it into a server function, so the new key never reaches the browser. Check the service's logs and billing for anything unusual.
