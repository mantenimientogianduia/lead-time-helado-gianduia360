import { NextResponse } from "next/server";
import { getPool } from "@/lib/db/pool";

export const runtime = "nodejs";

export async function GET() {
  try {
    await getPool().query("select 1");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/salud", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
