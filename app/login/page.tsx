"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { roman } from "@/lib/date";
import { useHydrated } from "@/lib/useHydrated";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "wrong" | "config" | "error" | "open">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw || state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        setState("open");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeout(() => router.replace("/hoy"), reduce ? 0 : 1100);
        return;
      }
      const j = await res.json().catch(() => ({}));
      setState(j.error === "not_configured" ? "config" : res.status === 401 ? "wrong" : "error");
      setPw("");
      inputRef.current?.focus();
    } catch {
      setState("error");
    }
  }

  const hydrated = useHydrated();
  const year = hydrated ? roman(new Date().getFullYear()) : "";

  return (
    <main className={styles.desk}>
      <div className={styles.stage} data-open={state === "open" || undefined}>
        {/* first page, revealed when the cover swings open */}
        <div className={styles.firstPage} aria-hidden>
          <p className="engraved">Este cuaderno pertenece a</p>
          <p className={styles.owner}>un hombre en proceso de cambio</p>
          <p className="quote">«Nuevas son cada mañana.»</p>
        </div>

        <div className={styles.cover}>
          <div className={styles.tooling} aria-hidden />
          <h1 className={styles.title}>Bitácora</h1>
          <div className={styles.plate}>
            <span>Disciplina · Fe</span>
            <span className={styles.year}>{year}</span>
          </div>

          <form className={styles.form} onSubmit={submit}>
            <label htmlFor="pw" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.slot} data-wrong={state === "wrong" || undefined}>
              <input
                ref={inputRef}
                id="pw"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  if (state === "wrong") setState("idle");
                }}
                aria-invalid={state === "wrong"}
                aria-describedby="pw-msg"
              />
              <button type="submit" aria-label="Abrir el cuaderno" disabled={!pw || state === "busy"}>
                {state === "busy" ? <LoaderCircle className={styles.spin} /> : <ArrowRight />}
              </button>
            </div>
            <p id="pw-msg" className={styles.msg} role="status">
              {state === "wrong" && "Esa no es. Inténtalo otra vez."}
              {state === "config" && "Falta configurar APP_PASSWORD y AUTH_SECRET en Vercel."}
              {state === "error" && "No se pudo conectar. Revisa tu internet."}
            </p>
          </form>
        </div>
        <div className={styles.ribbonTail} aria-hidden />
      </div>
    </main>
  );
}
