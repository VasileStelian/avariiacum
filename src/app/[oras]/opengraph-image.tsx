import { notFound } from "next/navigation";

import { findCity } from "@/config/locations";
import { cityView } from "@/lib/views";
import { OG_SIZE, statusImage } from "@/server/og";
import { serverReportsStore } from "@/server/supabase";

export const revalidate = 60;

export const size = OG_SIZE;

export const contentType = "image/png";

export const alt = "Starea apei, curentului, gazului și căldurii pe cartiere, după raportările locuitorilor";

export default async function Image({ params }: { params: Promise<{ oras: string }> }) {
  const city = findCity((await params).oras);

  if (!city) {
    notFound();
  }

  const view = cityView(city, await serverReportsStore().cityActivity(city.slug));
  const headline = view.headline.outage ?? view.headline.isolated ?? view.headline.quiet ?? "";
  const status = view.headline.outage ? "avarie" : view.headline.isolated ? "raportari" : "liniste";

  return statusImage(`Avarii în ${city.name} acum`, headline, status, "Raportări anonime de la locuitori, pe cartiere");
}
