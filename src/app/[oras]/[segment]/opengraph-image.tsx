import { notFound } from "next/navigation";

import { findCity, resolveCitySegment } from "@/config/locations";
import { serviceView, zoneView } from "@/lib/views";
import { OG_SIZE, statusImage } from "@/server/og";
import { serverReportsStore } from "@/server/supabase";

export const revalidate = 60;

export const size = OG_SIZE;

export const contentType = "image/png";

export const alt = "Starea serviciului sau a cartierului, după raportările locuitorilor din ultima oră";

export default async function Image({ params }: { params: Promise<{ oras: string; segment: string }> }) {
  const { oras, segment } = await params;
  const city = findCity(oras);
  const target = city && resolveCitySegment(city, segment);

  if (!city || !target) {
    notFound();
  }

  const activity = await serverReportsStore().cityActivity(city.slug);

  if (target.kind === "service") {
    const view = serviceView(city, target.service.slug, activity);
    const status = view.affected.some((row) => row.status === "avarie") ? "avarie" : view.affected.length > 0 ? "raportari" : "liniste";

    return statusImage(`${target.service.name} în ${city.name}`, view.headline, status, `Nu suntem ${city.providers[target.service.slug].name}. Raportări anonime de la locuitori.`);
  }

  const view = zoneView(city, target.zone.slug, activity);
  const status = view.services.some((row) => row.status === "avarie") ? "avarie" : view.services.some((row) => row.status === "raportari") ? "raportari" : "liniste";

  return statusImage(`${target.zone.name}, ${city.name}`, view.headline, status, "Apă, curent, gaz și căldură: ce raportează vecinii");
}
