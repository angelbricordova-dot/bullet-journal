import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#4a1616" }}>
        <svg width="60" height="96" viewBox="0 0 30 48">
          <path d="M15 2 V46 M3 14 H27" stroke="#e3c88f" strokeWidth="4" strokeLinecap="square" fill="none" />
        </svg>
      </div>
    ),
    size,
  );
}
