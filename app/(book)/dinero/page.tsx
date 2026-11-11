"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Pages } from "@/components/Pages";
import { useMoney, useSettings } from "@/lib/hooks";
import { daysBetween, longDate, shortDate, todayYmd, uid } from "@/lib/date";
import type { Client, MoneyDoc, Txn } from "@/lib/types";
import styles from "./dinero.module.css";

const CATEGORIES = ["Comida", "Transporte", "Hogar", "Angélica", "Gimnasio", "Trabajo", "Mascotas", "Ahorro", "Otros"];
const IN_CATEGORIES = ["Cliente", "Venta", "Proyecto", "Otros"];
const STATUS: Record<Client["status"], string> = { active: "Activo", paused: "En pausa", lost: "Perdido" };

const money = (n: number) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function balanceOf(m: MoneyDoc) {
  return m.txns.reduce((s, t) => s + (t.kind === "in" ? t.amount : -t.amount), m.opening);
}

export default function DineroPage() {
  const [m, setM] = useMoney();
  const [settings, setSettings] = useSettings();
  const today = todayYmd();
  const balance = balanceOf(m);
  const daysToPay = settings.payday ? daysBetween(today, settings.payday) : null;
  const perDay = daysToPay && daysToPay > 0 ? balance / daysToPay : null;

  const [kind, setKind] = useState<Txn["kind"]>("out");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(today);

  const txns = useMemo(() => [...m.txns].sort((a, b) => b.date.localeCompare(a.date)), [m.txns]);
  const month = today.slice(0, 7);
  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of m.txns) if (t.kind === "out" && t.date.startsWith(month)) map[t.category] = (map[t.category] ?? 0) + t.amount;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [m.txns, month]);
  const monthOut = byCat.reduce((s, [, v]) => s + v, 0);
  const monthIn = m.txns.filter((t) => t.kind === "in" && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);

  function addTxn(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount.replace(",", "."));
    if (!a || a <= 0) return;
    const t: Txn = { id: uid(), date, kind, amount: Math.round(a * 100) / 100, label: label.trim() || category, category };
    setM((p) => ({ ...p, txns: [...p.txns, t] }));
    setAmount("");
    setLabel("");
  }

  const left = (
    <div className={styles.ledgerPage}>
      <h1 className="h-page">Dinero</h1>

      <div className={styles.balance}>
        <span className={styles.bLabel}>Saldo</span>
        <span className={`num ${styles.bValue}`} data-neg={balance < 0 || undefined}>{money(balance)}</span>
      </div>

      <div className={styles.pay}>
        <label className="field">
          <span>Próximo cobro</span>
          <input
            type="date"
            className="box-input num"
            value={settings.payday ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, payday: e.target.value || undefined }))}
          />
        </label>
        {daysToPay !== null && daysToPay > 0 && perDay !== null && (
          <p className={styles.perDay}>
            Faltan <b className="num">{daysToPay}</b> días. Para llegar, gasta como máximo <b className="num">{money(perDay)}</b> por día.
          </p>
        )}
        {daysToPay === 0 && <p className={styles.perDay}>Hoy es día de cobro.</p>}
      </div>

      <form className={styles.form} onSubmit={addTxn}>
        <div className={styles.kind} role="radiogroup" aria-label="Tipo de movimiento">
          <button type="button" role="radio" className="chip" aria-checked={kind === "out"} onClick={() => { setKind("out"); setCategory(CATEGORIES[0]); }}>
            Gasto
          </button>
          <button type="button" role="radio" className="chip" aria-checked={kind === "in"} onClick={() => { setKind("in"); setCategory(IN_CATEGORIES[0]); }}>
            Ingreso
          </button>
        </div>
        <div className={styles.formRow}>
          <label className="field">
            <span>Monto ($)</span>
            <input className="box-input num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </label>
          <label className="field">
            <span>Categoría</span>
            <select className="box-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {(kind === "out" ? CATEGORIES : IN_CATEGORIES).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.formRow}>
          <label className="field">
            <span>Concepto</span>
            <input className="box-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === "out" ? "Ej. Almuerzo" : "Ej. Pago de cliente"} />
          </label>
          <label className="field">
            <span>Fecha</span>
            <input className="box-input num" type="date" value={date} onChange={(e) => setDate(e.target.value || today)} />
          </label>
        </div>
        <button className="ink-btn" type="submit" disabled={!amount}>
          <Plus aria-hidden /> Anotar {kind === "out" ? "gasto" : "ingreso"}
        </button>
      </form>

      <h2 className="h-sec">Libro</h2>
      <table className={styles.ledger}>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Concepto</th>
            <th scope="col" className={styles.amt}>Entra</th>
            <th scope="col" className={styles.amt}>Sale</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {txns.slice(0, 60).map((t) => (
            <tr key={t.id}>
              <td className="num">{shortDate(t.date)}</td>
              <td>
                {t.label}
                <span className={styles.cat}>{t.category}</span>
              </td>
              <td className={`num ${styles.amt}`}>{t.kind === "in" ? money(t.amount) : ""}</td>
              <td className={`num ${styles.amt} ${styles.out}`}>{t.kind === "out" ? money(t.amount) : ""}</td>
              <td>
                <button className="icon-btn" onClick={() => setM((p) => ({ ...p, txns: p.txns.filter((x) => x.id !== t.id) }))} aria-label={`Borrar ${t.label}`}>
                  <Trash2 />
                </button>
              </td>
            </tr>
          ))}
          <tr className={styles.opening}>
            <td className="num">{shortDate(m.openingDate)}</td>
            <td>Saldo inicial</td>
            <td className={`num ${styles.amt}`}>{money(m.opening)}</td>
            <td />
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );

  const right = (
    <div>
      <h2 className="h-sec">Este mes</h2>
      <dl className={styles.month}>
        <div>
          <dt>Entró</dt>
          <dd className="num">{money(monthIn)}</dd>
        </div>
        <div>
          <dt>Salió</dt>
          <dd className="num">{money(monthOut)}</dd>
        </div>
      </dl>
      {byCat.length > 0 && (
        <ul className={styles.cats}>
          {byCat.map(([c, v]) => (
            <li key={c}>
              <span>{c}</span>
              <span className={styles.catBar} aria-hidden>
                <i style={{ width: `${(v / monthOut) * 100}%` }} />
              </span>
              <span className="num">{money(v)}</span>
            </li>
          ))}
        </ul>
      )}

      <Savings m={m} setM={setM} />
      <Clients m={m} setM={setM} />

      <p className="caption" style={{ marginTop: 24 }}>
        Saldo inicial: {money(m.opening)} el {longDate(m.openingDate)}.{" "}
        <button
          className={styles.linkBtn}
          onClick={() => {
            const v = prompt("Saldo inicial ($)", String(m.opening));
            if (v !== null && !Number.isNaN(Number(v.replace(",", ".")))) setM((p) => ({ ...p, opening: Number(v.replace(",", ".")) }));
          }}
        >
          Corregir
        </button>
      </p>
    </div>
  );

  return <Pages left={left} right={right} />;
}

function Savings({ m, setM }: { m: MoneyDoc; setM: (f: (p: MoneyDoc) => MoneyDoc) => void }) {
  const [amt, setAmt] = useState("");
  const pct = m.goal.amount > 0 ? Math.min(1, m.goal.saved / m.goal.amount) : 0;
  return (
    <section>
      <h2 className="h-sec">{m.goal.name}</h2>
      <p className={styles.goalLine}>
        <b className="num">{money(m.goal.saved)}</b> de <span className="num">{money(m.goal.amount)}</span>
      </p>
      <div className={styles.goalBar} role="img" aria-label={`${Math.round(pct * 100)}% de la meta`}>
        <i style={{ width: `${pct * 100}%` }} />
      </div>
      <form
        className={styles.inline}
        onSubmit={(e) => {
          e.preventDefault();
          const a = Number(amt.replace(",", "."));
          if (!a) return;
          setM((p) => ({
            ...p,
            goal: { ...p.goal, saved: Math.round((p.goal.saved + a) * 100) / 100 },
            txns: [...p.txns, { id: uid(), date: todayYmd(), kind: a > 0 ? "out" : "in", amount: Math.abs(a), label: a > 0 ? "Apartado al fondo" : "Retiro del fondo", category: "Ahorro" }],
          }));
          setAmt("");
        }}
      >
        <input className="box-input num" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Monto a apartar" aria-label="Monto a apartar" />
        <button className="ink-btn" type="submit" disabled={!amt}>Apartar</button>
      </form>
      <p className="caption" style={{ marginTop: 6 }}>Apartar lo descuenta de tu saldo disponible. Primero tú, después los gastos.</p>
    </section>
  );
}

function Clients({ m, setM }: { m: MoneyDoc; setM: (f: (p: MoneyDoc) => MoneyDoc) => void }) {
  const [name, setName] = useState("");
  const [monthly, setMonthly] = useState("");
  const total = m.clients.filter((c) => c.status === "active").reduce((s, c) => s + c.monthly, 0);

  return (
    <section>
      <div className={styles.secHead}>
        <h2 className="h-sec">Clientes</h2>
        <span className="caption">
          Activos: <b className="num">{money(total)}</b>/mes
        </span>
      </div>
      <ul className={styles.clients}>
        {m.clients.map((c) => (
          <li key={c.id} data-status={c.status}>
            <span className={styles.cName}>{c.name}</span>
            <span className="num">{money(c.monthly)}</span>
            <select
              className={styles.status}
              value={c.status}
              onChange={(e) => setM((p) => ({ ...p, clients: p.clients.map((x) => (x.id === c.id ? { ...x, status: e.target.value as Client["status"] } : x)) }))}
              aria-label={`Estado de ${c.name}`}
            >
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button className="icon-btn" onClick={() => confirm(`¿Borrar a ${c.name}?`) && setM((p) => ({ ...p, clients: p.clients.filter((x) => x.id !== c.id) }))} aria-label={`Borrar ${c.name}`}>
              <Trash2 />
            </button>
          </li>
        ))}
        {m.clients.length === 0 && <li className="caption">Anota tus clientes actuales y lo que te pagan al mes.</li>}
      </ul>
      <form
        className={styles.inline}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setM((p) => ({ ...p, clients: [...p.clients, { id: uid(), name: name.trim(), monthly: Number(monthly.replace(",", ".")) || 0, status: "active" }] }));
          setName("");
          setMonthly("");
        }}
      >
        <input className="box-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cliente" aria-label="Nombre del cliente" />
        <input className="box-input num" style={{ maxWidth: 110 }} inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="$/mes" aria-label="Pago mensual" />
        <button className="ink-btn" type="submit" aria-label="Agregar cliente">
          <Plus aria-hidden />
        </button>
      </form>
    </section>
  );
}
