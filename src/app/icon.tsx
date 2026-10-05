import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };

export const contentType = "image/png";

// Iconița din tab: inițiala pe albastrul accentului, fără grafică desenată de mână.
export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1D4ED8", color: "#FFFFFF", fontSize: 44, fontWeight: 700, borderRadius: 14 }}>A</div>,
    size,
  );
}
