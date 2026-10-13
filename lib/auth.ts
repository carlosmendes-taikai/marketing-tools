import "server-only";
import { randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { hmac, loadLogin, saveLogin } from "./cms";

// Admin login: one allowed email, a 6-digit code sent to it, then a signed 30-day cookie.
// Codes expire after 10 minutes, work once, and die after 5 wrong tries.

export const ADMIN_EMAIL = "carlos@layerx.xyz";
const COOKIE = "mk_admin";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_GAP_MS = 30_000;

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const codeHash = (code: string) => hmac(`login-code|${code}`);

async function sendEmail(code: string) {
  const send = (from: string) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: ADMIN_EMAIL,
        subject: `${code} is your mktbox login code`,
        text: `Your mktbox admin login code is ${code}\n\nIt works once and expires in ${CODE_MINUTES} minutes. If you didn't ask for it, ignore this email.`,
        html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#141413"><p>Your mktbox admin login code:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p><p style="color:#6b6b66">It works once and expires in ${CODE_MINUTES} minutes. If you didn't ask for it, ignore this email.</p></div>`,
      }),
    });
  let res = await send("mktbox <login@mktbox.xyz>");
  // until mktbox.xyz is verified in Resend, fall back to Resend's shared sender
  if (res.status === 403) res = await send("mktbox <onboarding@resend.dev>");
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
}

/** Emails a fresh code. Other addresses get the same answer but nothing is sent. */
export async function requestCode(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL) return { ok: true };
  const current = await loadLogin();
  if (current?.sentAt && Date.now() - current.sentAt < RESEND_GAP_MS) return { ok: false, error: "A code was just sent. Wait 30 seconds before asking for another." };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await saveLogin({ hash: codeHash(code), expires: Date.now() + CODE_MINUTES * 60_000, attempts: 0, sentAt: Date.now() });
  await sendEmail(code);
  return { ok: true };
}

/** Checks a code and, if right, starts the session. */
export async function verifyCode(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const state = await loadLogin();
  if (!state?.hash || state.expires < Date.now()) return { ok: false, error: "That code has expired. Ask for a new one." };
  if (state.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many wrong tries. Ask for a new code." };
  if (!same(codeHash(code.replace(/\D/g, "")), state.hash)) {
    await saveLogin({ ...state, attempts: state.attempts + 1 });
    const left = MAX_ATTEMPTS - state.attempts - 1;
    return { ok: false, error: left ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Ask for a new code." };
  }
  await saveLogin(null); // single use
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  (await cookies()).set(COOKIE, `${expires}.${hmac(`session|${expires}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return { ok: true };
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, sig] = value.split(".");
  return Number(expires) > Date.now() && !!sig && same(sig, hmac(`session|${expires}`));
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}
