import "server-only";
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Key/value document store.
 * Production: Postgres (Neon via the Vercel Marketplace) — reads DATABASE_URL or POSTGRES_URL.
 * Local development without a database: a JSON file in .data/ (git-ignored).
 */

export const KEY_RE = /^[a-z0-9][a-z0-9:_-]{0,79}$/;

type Row = { key: string; value: unknown; updated_at: string };

const dbUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export function storeMode(): "postgres" | "file" | "missing" {
  if (dbUrl()) return "postgres";
  return process.env.NODE_ENV === "production" ? "missing" : "file";
}

let ready: Promise<void> | null = null;
function sql() {
  const q = neon(dbUrl());
  if (!ready) {
    ready = q`CREATE TABLE IF NOT EXISTS journal_docs (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`.then(() => undefined).catch((e) => { ready = null; throw e; });
  }
  return { q, ready };
}

/* ---------- file fallback ---------- */
const FILE = path.join(process.cwd(), ".data", "store.json");
let fileCache: Record<string, Row> | null = null;
async function readFile(): Promise<Record<string, Row>> {
  if (fileCache) return fileCache;
  try {
    fileCache = JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    fileCache = {};
  }
  return fileCache!;
}
async function writeFile() {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(fileCache ?? {}));
}

function missing(): never {
  throw new Error("DB_MISSING");
}

export async function getDoc(key: string): Promise<Row | null> {
  const mode = storeMode();
  if (mode === "missing") missing();
  if (mode === "file") return (await readFile())[key] ?? null;
  const { q, ready } = sql();
  await ready;
  const rows = (await q`SELECT key, value, updated_at FROM journal_docs WHERE key = ${key}`) as Row[];
  return rows[0] ?? null;
}

export async function listDocs(prefix: string): Promise<Row[]> {
  const mode = storeMode();
  if (mode === "missing") missing();
  if (mode === "file") {
    const all = await readFile();
    return Object.values(all).filter((r) => r.key.startsWith(prefix)).sort((a, b) => a.key.localeCompare(b.key));
  }
  const { q, ready } = sql();
  await ready;
  const like = prefix.replace(/[%_\\]/g, (c) => `\\${c}`) + "%";
  return (await q`SELECT key, value, updated_at FROM journal_docs WHERE key LIKE ${like} ORDER BY key`) as Row[];
}

export async function putDoc(key: string, value: unknown): Promise<string> {
  const mode = storeMode();
  if (mode === "missing") missing();
  const now = new Date().toISOString();
  if (mode === "file") {
    const all = await readFile();
    all[key] = { key, value, updated_at: now };
    await writeFile();
    return now;
  }
  const { q, ready } = sql();
  await ready;
  const rows = (await q`
    INSERT INTO journal_docs (key, value, updated_at) VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    RETURNING updated_at`) as { updated_at: string }[];
  return rows[0]?.updated_at ?? now;
}

export async function deleteDoc(key: string): Promise<void> {
  const mode = storeMode();
  if (mode === "missing") missing();
  if (mode === "file") {
    const all = await readFile();
    delete all[key];
    await writeFile();
    return;
  }
  const { q, ready } = sql();
  await ready;
  await q`DELETE FROM journal_docs WHERE key = ${key}`;
}

export async function allDocs(): Promise<Row[]> {
  return listDocs("");
}
