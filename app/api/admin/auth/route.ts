import { NextResponse } from "next/server";
import { requestCode, signOut, verifyCode } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string; email?: string; code?: string };
  try {
    if (body.action === "request") {
      const result = await requestCode(String(body.email ?? ""));
      return NextResponse.json(result, { status: result.ok ? 200 : 429 });
    }
    if (body.action === "verify") {
      const result = await verifyCode(String(body.code ?? ""));
      return NextResponse.json(result, { status: result.ok ? 200 : 401 });
    }
    if (body.action === "logout") {
      await signOut();
      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Something went wrong sending the code. Try again in a minute." }, { status: 500 });
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
