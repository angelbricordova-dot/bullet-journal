"use client";

import { useRef, useState } from "react";
import { FileUp, Trash2 } from "lucide-react";
import { Pages } from "@/components/Pages";
import { MonthNav, useMonthDoc } from "./Mes";
import { useDoc, useDocList } from "@/lib/client-store";
import { dayScore, useChallenges, useSettings } from "@/lib/hooks";
import { emptyMonth, monthInfo } from "@/lib/month";
import { useBookMonth } from "@/lib/book";
import type { DayDoc } from "@/lib/types";
import styles from "./resumen.module.css";

interface RealImport {
  fileName: string;
  imported: string;
  headers: string[];
  rows: string[][];
  text?: string;
}

/* ---- tolerant CSV parsing (comma or semicolon, quoted fields) ---- */
function parseCsv(src: string): string[][] {
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : first.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) {
      row.push(cell.trim());
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

function toNumber(s: string): number | null {
  const clean = s.replace(/[^\d,.\-]/g, "");
  if (!clean) return null;
  const norm = clean.includes(",") && clean.lastIndexOf(",") > clean.lastIndexOf(".") ? clean.replace(/\./g, "").replace(",", ".") : clean.replace(/,/g, "");
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

function findCol(headers: string[], re: RegExp) {
  return headers.findIndex((h) => re.test(h.toLowerCase()));
}

export function ResumenSpread() {
  const [ym] = useBookMonth();
  const mi = monthInfo(ym);
  const [doc, setDoc] = useMonthDoc(ym);
  const [settings] = useSettings();
  const [challenges] = useChallenges();
  const { items: days } = useDocList<DayDoc>(`day:${ym}`);
  const [real, setReal] = useDoc<RealImport | null>(`real:${ym}`, null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");

  const habits = settings.habits.filter((h) => h.active);
  const ids = habits.map((h) => h.id);
  const list = Object.values(days);
  const recorded = list.length;
  const perfect = list.filter((d) => dayScore(d, ids) === 1).length;
  const avgScore = recorded ? Math.round((list.reduce((s, d) => s + dayScore(d, ids), 0) / recorded) * 100) : 0;
  const inMonth = (iso: string) => iso.slice(0, 7) === ym || new Date(iso).toISOString().slice(0, 7) === ym;
  const falls = challenges.reduce((s, c) => s + c.falls.filter((f) => inMonth(f.date)).length, 0);
  const wins = challenges.reduce((s, c) => s + c.wins.filter((w) => inMonth(w)).length, 0);
  const best = habits
    .map((h) => ({ h, n: list.filter((d) => d.habits?.[h.id]).length }))
    .sort((a, b) => b.n - a.n);

  async function onFile(f: File) {
    setErr("");
    const text = await f.text();
    try {
      if (/\.json$/i.test(f.name) || text.trim().startsWith("[") || text.trim().startsWith("{")) {
        const data = JSON.parse(text);
        const arr: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : [data];
        const headers = [...new Set(arr.flatMap((o) => Object.keys(o ?? {})))];
        const rows = arr.map((o) => headers.map((h) => String((o as Record<string, unknown>)?.[h] ?? "")));
        setReal({ fileName: f.name, imported: new Date().toISOString(), headers, rows: rows.slice(0, 3000) });
      } else if (/\.(csv|tsv)$/i.test(f.name) || text.includes(",") || text.includes(";")) {
        const rows = parseCsv(text);
        if (rows.length < 2) throw new Error("vacío");
        setReal({ fileName: f.name, imported: new Date().toISOString(), headers: rows[0], rows: rows.slice(1, 3001) });
      } else {
        setReal({ fileName: f.name, imported: new Date().toISOString(), headers: [], rows: [], text: text.slice(0, 20000) });
      }
    } catch {
      setErr("No pude leer ese archivo. Prueba exportarlo como CSV o JSON.");
    }
  }

  // aggregate when we can find an amount column
  let agg: { label: string; total: number }[] = [];
  let totalIn = 0;
  let totalOut = 0;
  if (real && real.headers.length) {
    const amt = findCol(real.headers, /monto|amount|importe|valor|total|cantidad|precio/);
    const cat = findCol(real.headers, /categor|category|tipo|type|concepto|etiqueta/);
    if (amt >= 0) {
      const map = new Map<string, number>();
      for (const r of real.rows) {
        const n = toNumber(r[amt] ?? "");
        if (n === null) continue;
        if (n >= 0) totalIn += n;
        else totalOut += -n;
        const k = cat >= 0 ? r[cat] || "Sin categoría" : "Total";
        map.set(k, (map.get(k) ?? 0) + n);
      }
      agg = [...map.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    }
  }
  const fmt = (n: number) => n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const left = (
    <div>
      <MonthNav />
      <h1 className="h-page">
        Resumen <span className={styles.sub}>{mi.name}</span>
      </h1>

      <dl className={styles.stats}>
        <div>
          <dt>Días escritos</dt>
          <dd className="num">{recorded}</dd>
        </div>
        <div>
          <dt>Perfectos</dt>
          <dd className="num">{perfect}</dd>
        </div>
        <div>
          <dt>Hábitos</dt>
          <dd className="num">{avgScore}%</dd>
        </div>
        <div>
          <dt>Victorias</dt>
          <dd className="num">{wins}</dd>
        </div>
        <div>
          <dt>Caídas</dt>
          <dd className="num">{falls}</dd>
        </div>
      </dl>

      {best.length > 0 && recorded > 0 && (
        <p className={styles.best}>
          Lo más firme: <b>{best[0].h.name}</b> ({best[0].n} días). Lo que más costó: <b>{best[best.length - 1].h.name}</b> ({best[best.length - 1].n}).
        </p>
      )}

      <h2 className="h-sec">Mi resumen del mes</h2>
      <textarea
        className={`ruled ${styles.summary}`}
        value={doc.summary}
        onChange={(e) => setDoc((d) => ({ ...emptyMonth(), ...d, summary: e.target.value }))}
        placeholder="Cómo fue el mes: lo que aprendiste, lo que cambió, lo que viene. Aquí también va el resumen que armemos con tus datos de Real."
        aria-label="Resumen del mes"
      />
    </div>
  );

  const right = (
    <div>
      <h2 className="h-page">Datos de Real</h2>
      <p className="caption" style={{ margin: "6px 0 12px" }}>
        Exporta tus datos desde la app Real (CSV o JSON) y súbelos aquí. Quedan guardados en este mes.
      </p>
      <div className={styles.actions}>
        <button className="ink-btn" onClick={() => fileRef.current?.click()}>
          <FileUp aria-hidden /> {real ? "Reemplazar archivo" : "Subir exportación"}
        </button>
        {real && (
          <button className="ink-btn ghost" onClick={() => confirm("¿Quitar los datos importados de este mes?") && setReal(null)}>
            <Trash2 aria-hidden /> Quitar
          </button>
        )}
        <input ref={fileRef} type="file" accept=".csv,.tsv,.json,.txt,text/csv,application/json,text/plain" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
      {err && <p className={styles.err} role="alert">{err}</p>}

      {real && (
        <>
          <p className={styles.file}>
            {real.fileName} · <span className="num">{real.rows.length}</span> filas
          </p>
          {agg.length > 0 && (
            <>
              <dl className={styles.money}>
                <div>
                  <dt>Entró</dt>
                  <dd className="num">{fmt(totalIn)}</dd>
                </div>
                <div>
                  <dt>Salió</dt>
                  <dd className="num">{fmt(totalOut)}</dd>
                </div>
              </dl>
              <ul className={styles.agg}>
                {agg.slice(0, 12).map((a) => (
                  <li key={a.label}>
                    <span>{a.label}</span>
                    <span className="num" data-neg={a.total < 0 || undefined}>
                      {fmt(a.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {real.text ? (
            <pre className={styles.text}>{real.text}</pre>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {real.headers.map((h, i) => (
                      <th key={i} scope="col">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {real.rows.slice(0, 80).map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td key={j}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );

  return <Pages id={`resumen-${ym}`} left={left} right={right} />;
}
