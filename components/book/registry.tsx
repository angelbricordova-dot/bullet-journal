"use client";

import type { ComponentType } from "react";
import { PortadaSpread } from "../spreads/Portada";
import { HoySpread } from "../spreads/Hoy";
import { MesSpread } from "../spreads/Mes";
import { TrackersSpread } from "../spreads/Trackers";
import { RetosSpread } from "../spreads/Retos";
import { FeSpread } from "../spreads/Fe";
import { LibrosSpread } from "../spreads/Libros";
import { ResumenSpread } from "../spreads/Resumen";
import { AjustesSpread } from "../spreads/Ajustes";

export const SPREAD_COMPONENTS: ComponentType[] = [
  PortadaSpread,
  HoySpread,
  MesSpread,
  TrackersSpread,
  RetosSpread,
  FeSpread,
  LibrosSpread,
  ResumenSpread,
  AjustesSpread,
];
