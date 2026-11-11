import type { Metadata, Viewport } from "next";
import { Archivo, IM_Fell_English, IM_Fell_English_SC } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"] });
const fell = IM_Fell_English({ variable: "--font-fell", weight: "400", style: ["normal", "italic"], subsets: ["latin"] });
const fellSC = IM_Fell_English_SC({ variable: "--font-fell-sc", weight: "400", subsets: ["latin"] });

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
const prePaint = `try{var s=JSON.parse(localStorage.getItem('bitacora:settings')||'null');var d=document.documentElement;d.dataset.cover=(s&&s.cover)||'oxblood';d.dataset.paper=(s&&s.paper)||'ruled';}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      data-cover="oxblood"
      data-paper="ruled"
      className={`${archivo.variable} ${fell.variable} ${fellSC.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaint }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
