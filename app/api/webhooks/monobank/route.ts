import { NextResponse } from "next/server";

export async function POST() {
  // TODO: verify X-Sign signature before processing
  return NextResponse.json({ ok: true });
}
