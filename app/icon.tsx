import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#4a1616" }}>
        <div style={{ width: 400, height: 400, border: "6px solid #2a0b0b", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <svg width="150" height="240" viewBox="0 0 30 48">
            <path d="M15 2 V46 M3 14 H27" stroke="#e3c88f" strokeWidth="4" strokeLinecap="square" fill="none" />
          </svg>
          <div style={{ position: "absolute", right: 70, top: -6, width: 26, height: 300, background: "#b83a2e" }} />
        </div>
      </div>
    ),
    size,
  );
}
