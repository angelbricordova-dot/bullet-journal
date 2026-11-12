import type { Metadata, Viewport } from "next";
import { Archivo, Cinzel, Courier_Prime, IM_Fell_English, IM_Fell_English_SC, Kalam, Oswald, Special_Elite, Spectral } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"] });
const fell = IM_Fell_English({ variable: "--font-fell", weight: "400", style: ["normal", "italic"], subsets: ["latin"] });
const fellSC = IM_Fell_English_SC({ variable: "--font-fell-sc", weight: "400", subsets: ["latin"] });
// alternative type sets, chosen in Ajustes (not preloaded)
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], preload: false });
const spectral = Spectral({ variable: "--font-spectral", weight: ["400", "600"], style: ["normal", "italic"], subsets: ["latin"], preload: false });
const elite = Special_Elite({ variable: "--font-elite", weight: "400", subsets: ["latin"], preload: false });
const courier = Courier_Prime({ variable: "--font-courier", weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], preload: false });
const kalam = Kalam({ variable: "--font-kalam", weight: ["400", "700"], subsets: ["latin"], preload: false });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Bitácora",
  description: "Diario personal: retos, hábitos, fe y progreso.",
  applicationName: "Bitácora",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Bitácora", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#15100c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Apply the saved cover and paper before first paint (no flash).
const prePaint = `try{var s=JSON.parse(localStorage.getItem('bitacora:settings')||'null');var d=document.documentElement;d.dataset.cover=(s&&s.cover)||'oxblood';d.dataset.paper=(s&&s.paper)||'ruled';d.dataset.font=(s&&s.font)||'clasico';d.dataset.hints=(s&&s.hints===false)?'off':'on';}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      data-cover="oxblood"
      data-paper="ruled"
      data-font="clasico"
      className={[archivo, fell, fellSC, cinzel, spectral, elite, courier, kalam, oswald].map((f) => f.variable).join(" ")}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaint }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
