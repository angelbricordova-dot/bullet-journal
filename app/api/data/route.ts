import { NextResponse, connection } from "next/server";
import { deleteDoc, getDoc, KEY_RE, listDocs, putDoc } from "@/lib/store";

function fail(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === "DB_MISSING") {
    return NextResponse.json({ error: "db_missing" }, { status: 503 });
  }
  console.error("[data]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}

const noStore = { headers: { "Cache-Control": "no-store" } };

/** GET /api/data?key=settings  or  /api/data?prefix=day:2026- */
export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const prefix = url.searchParams.get("prefix");
  try {
    if (key) {
      if (!KEY_RE.test(key)) return NextResponse.json({ error: "bad_key" }, { status: 400 });
      const row = await getDoc(key);
      return NextResponse.json({ key, value: row?.value ?? null, updated: row?.updated_at ?? null }, noStore);
    }
    if (prefix !== null && /^[a-z0-9:_-]{1,40}$/.test(prefix)) {
      const rows = await listDocs(prefix);
      return NextResponse.json({ items: rows.map((r) => ({ key: r.key, value: r.value, updated: r.updated_at })) }, noStore);
    }
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}

/** PUT /api/data  { key, value } */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const key = String(body?.key ?? "");
    if (!KEY_RE.test(key)) return NextResponse.json({ error: "bad_key" }, { status: 400 });
    if (body.value === undefined) return NextResponse.json({ error: "no_value" }, { status: 400 });
    const updated = await putDoc(key, body.value);
    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    return fail(e);
  }
}

/** DELETE /api/data?key=board:abc */
export async function DELETE(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!KEY_RE.test(key)) return NextResponse.json({ error: "bad_key" }, { status: 400 });
  try {
    await deleteDoc(key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
