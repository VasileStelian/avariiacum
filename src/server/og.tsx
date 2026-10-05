import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import type { Status } from "@/lib/status";

export const OG_SIZE = { width: 1200, height: 630 };

const COLORS: Record<Status, { fg: string; bg: string }> = {
  avarie: { fg: "#9F2A14", bg: "#FCEBE7" },
  raportari: { fg: "#8A4B00", bg: "#FFF3DF" },
  liniste: { fg: "#166534", bg: "#ECF5EF" },
};

const font = (file: string): Promise<Buffer> => readFile(join(process.cwd(), "assets/fonts", file));

// Imaginea de previzualizare la partajare (WhatsApp, Facebook): starea curentă, mare și lizibilă.
export async function statusImage(place: string, headline: string, status: Status, footer: string): Promise<ImageResponse> {
  // Fișiere complete (latin + latin-ext într-unul): cu subseturi separate, generatorul lua „ă” din
  // primul font care o avea, adică din cel subțire, și în titlul îngroșat.
  const [regular, bold] = await Promise.all([font("PublicSans-Regular.ttf"), font("PublicSans-Bold.ttf")]);

  const tone = COLORS[status];

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F5F6F8", padding: 64, fontFamily: "Public Sans" }}>
      <div style={{ display: "flex", fontSize: 36, fontFamily: "Public Sans Bold", color: "#16191D" }}>
        Avarii <span style={{ color: "#1D4ED8", marginLeft: 10 }}>Acum</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", fontSize: 40, color: "#4A5361" }}>{place}</div>
        <div style={{ display: "flex", fontSize: 64, fontFamily: "Public Sans Bold", lineHeight: 1.15, color: tone.fg, background: tone.bg, padding: "28px 36px", borderRadius: 16 }}>{headline}</div>
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#4A5361" }}>{footer}</div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Public Sans", data: regular, weight: 400 },
        { name: "Public Sans Bold", data: bold, weight: 700 },
      ],
    },
  );
}
