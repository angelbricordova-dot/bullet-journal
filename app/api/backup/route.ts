import { NextResponse, connection } from "next/server";
import { allDocs, KEY_RE, putDoc } from "@/lib/store";

/** Full export of every document. */
export async function GET() {
  await connection();
  try {
    const rows = await allDocs();
    const data = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return new NextResponse(JSON.stringify({ app: "bitacora", version: 1, exported: new Date().toISOString(), data }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="bitacora-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const db = e instanceof Error && e.message === "DB_MISSING";
    return NextResponse.json({ error: db ? "db_missing" : "server_error" }, { status: db ? 503 : 500 });
  }
}

/** Restore: { data: { key: value } } — overwrites matching keys. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.app !== "bitacora" || typeof body.data !== "object") {
      return NextResponse.json({ error: "bad_file" }, { status: 400 });
    }
    let n = 0;
    for (const [key, value] of Object.entries(body.data as Record<string, unknown>)) {
      if (!KEY_RE.test(key)) continue;
      await putDoc(key, value);
      n++;
    }
    return NextResponse.json({ ok: true, restored: n });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
