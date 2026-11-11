"use client";

import { useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ensureLoaded, writeDoc } from "@/lib/client-store";

type Scene = {
  elements: readonly Record<string, unknown>[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

const PAPER = "#f4eddc";
const INK = "#1c2333";

export default function Board({ id }: { id: string }) {
  const [scene, setScene] = useState<Scene | null>(null);
  const lastSig = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    ensureLoaded<Scene>(`board:${id}`).then((s) => {
      if (!alive) return;
      const sc = s ?? { elements: [] };
      lastSig.current = signature(sc.elements) + ":" + Object.keys(sc.files ?? {}).length;
      setScene(sc);
    });
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [id]);

  if (!scene) return <p className="caption" style={{ padding: 24 }}>Abriendo el lienzo…</p>;

  return (
    <Excalidraw
      langCode="es-ES"
      theme="light"
      initialData={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        elements: scene.elements as any,
        appState: {
          viewBackgroundColor: PAPER,
          currentItemStrokeColor: INK,
          currentItemFontFamily: 1,
          ...(scene.appState ?? {}),
          collaborators: new Map(),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        files: (scene.files ?? {}) as any,
        scrollToContent: true,
      }}
      UIOptions={{
        canvasActions: { loadScene: false, export: { saveFileToDisk: true }, saveToActiveFile: false, toggleTheme: false },
      }}
      onChange={(elements, appState, files) => {
        const sig = signature(elements as unknown as Record<string, unknown>[]) + ":" + Object.keys(files).length;
        if (sig === lastSig.current) return;
        lastSig.current = sig;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const live = elements.filter((e) => !e.isDeleted);
          const used = new Set(live.map((e) => (e as { fileId?: string }).fileId).filter(Boolean));
          const keptFiles = Object.fromEntries(Object.entries(files).filter(([fid]) => used.has(fid)));
          writeDoc(`board:${id}`, {
            elements: live,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              gridModeEnabled: appState.gridModeEnabled,
              currentItemStrokeColor: appState.currentItemStrokeColor,
            },
            files: keptFiles,
          });
        }, 1200);
      }}
    />
  );
}

function signature(elements: readonly Record<string, unknown>[]): string {
  let n = 0;
  for (const e of elements) n += Number(e.version ?? 0) + (e.isDeleted ? 1 : 0);
  return `${elements.length}:${n}`;
}
