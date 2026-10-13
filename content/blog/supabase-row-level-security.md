---
title: "Supabase Row Level Security, explained for vibe coders"
description: Row Level Security decides who can read and change your Supabase data. What it is, why apps built with Lovable and Bolt depend on it, and how to check yours.
date: 2026-10-14
tool: vibe
---

If you built your app with Lovable, Bolt or another AI builder, there's a good chance your data lives in Supabase. And there's one setting that decides whether that data is private or readable by anyone on the internet: Row Level Security, or RLS.

## Why your app needs it

Most apps have a server in the middle that decides what each user may see. Apps built on Supabase often skip that middle layer. The page in the browser talks straight to the database, using a key that's in your public code: the anon key.

That's a deliberate, sensible design. But it means the database itself has to enforce the rules. If it doesn't, anyone who opens your app, copies the anon key from the code, and calls the database directly gets whatever the table holds.

Row Level Security is how the database enforces those rules.

## What RLS actually does

With RLS turned on, a table returns nothing by default. You then add **policies**: small rules that say who can do what. For example:

- Anyone can **read** published blog posts.
- A signed-in user can **read** only their own orders.
- A signed-in user can **insert** a note only for themselves.
- Nobody can **delete** invoices from the browser.

Each policy is checked for every row, on every request, inside the database. It doesn't matter what the page does. The database simply won't hand over rows the rules don't allow.

## The three most common mistakes

1. **RLS turned off.** The table is fully open. This often happens when a table was created by hand, or in a quick fix that was meant to be temporary.
2. **RLS on, but a policy that allows everything.** A rule like "true" for reading lets anyone read every row. It's the same as RLS off, just harder to spot.
3. **Reads protected, writes forgotten.** The select policy is right, but there's no rule stopping users updating other people's rows, or changing their own role or plan.

## How to check your project

1. In the Supabase dashboard, open **Table Editor**. Tables without RLS show a warning label.
2. Open the **Security Advisor** (under Advisors). It lists tables with RLS off, and other risky settings.
3. For each table, open **Authentication**, then **Policies**, and read every rule out loud: "who can do what to which rows". If a rule doesn't name the user (usually with auth.uid()), ask yourself if everyone should really have it.
4. Test with a second account. Sign in as user B and try to open something that belongs to user A, by changing an ID in the address or the request.

In an AI builder, you can also ask in plain words: "Enable Row Level Security on every table and add policies so users can only read and change their own rows."

## Check the rest from the outside

Database rules can only be checked safely from inside your Supabase project. Everything else, like leaked secret keys, files left online and missing security settings, can be checked from the outside in seconds.

{{tool}}

1. Paste your app's address into the free vibe code audit.
2. If the app talks to Supabase, the report tells you, and walks you through the checks above.
3. Fix anything marked Fix first, especially a Supabase **service_role** key in your public code. That key ignores RLS completely, so it must never reach the browser.

## A simple policy pattern to start from

For a table where each row belongs to one user (with a user_id column), these four rules cover most apps:

- **Read:** a user can read rows where user_id matches their own ID.
- **Insert:** a user can insert rows only with their own user_id.
- **Update:** a user can update only their own rows, and can't change user_id.
- **Delete:** a user can delete only their own rows, or nobody can delete from the browser.

Ask your builder to write them, then read them back to check they say exactly this.

## Frequently asked questions

### What is Row Level Security in Supabase?

It's a Postgres feature that checks rules on every row before returning or changing it. With RLS on, a table shares nothing until you add policies that say who can read, insert, update or delete which rows.

### Is RLS on by default in Supabase?

Tables created in the Supabase dashboard have it turned on by default, but tables created other ways, or changed later, may not. Always check every table in the Table Editor or Security Advisor.

### Is the Supabase anon key a secret?

No. It's meant to be public, and it's in your app's code by design. RLS is what protects your data. The service_role key is the secret one: it bypasses RLS and must never appear in your page code.

### How do I test if my Supabase data is exposed?

Check every table in Supabase's Security Advisor, then sign in with a second account and try to reach the first account's data. The mktbox vibe code audit can't safely test your database, but it checks everything else from the outside.
