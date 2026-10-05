import "server-only";

import { z } from "zod";

import { SERVICES, findCity } from "@/config/locations";

import type { ReportsStore } from "./reports-store";

export type ReportInput = {
  city: string;
  zone: string;
  service: string;
};

// Trimis înapoi browserului: doar valori serializabile (datele ca text ISO).
export type ReportOutcome =
  | ({ status: "trimis"; reporters: number; retryAfter: string } & ReportInput)
  | ({ status: "prea-devreme"; retryAfter: string } & ReportInput)
  | { status: "invalid" }
  | { status: "eroare" };

export type ReportDeps = {
  store: ReportsStore;
  ipHash: string;
  revalidate: (path: string) => void;
  now: () => Date;
};

const LIMIT_MS = 2 * 60 * 60 * 1000;

const Fields = z.object({ oras: z.string(), cartier: z.string(), serviciu: z.string() });

// Formularul vine din browser: orașul, cartierul și serviciul trebuie să existe în configurare.
export function parseReportForm(data: FormData): ReportInput | null {
  const parsed = Fields.safeParse({ oras: data.get("oras"), cartier: data.get("cartier"), serviciu: data.get("serviciu") });

  if (!parsed.success) {
    return null;
  }

  const city = findCity(parsed.data.oras);
  const zone = city?.zones.find((candidate) => candidate.slug === parsed.data.cartier);
  const service = SERVICES.find((candidate) => candidate.slug === parsed.data.serviciu);

  return city && zone && service ? { city: city.slug, zone: zone.slug, service: service.slug } : null;
}

export async function handleReport(report: ReportInput, deps: ReportDeps): Promise<ReportOutcome> {
  try {
    const result = await deps.store.submitReport({ ...report, ipHash: deps.ipHash });

    if (!result.accepted) {
      return { status: "prea-devreme", ...report, retryAfter: result.retryAfter.toISOString() };
    }

    // Paginile stau în cache; fără regenerare, cine raportează nu și-ar vedea raportul (vezi JURNAL, pasul 4a).
    for (const path of [`/${report.city}/`, `/${report.city}/${report.zone}/`, `/${report.city}/${report.service}/`]) {
      deps.revalidate(path);
    }

    const activity = await deps.store.cityActivity(report.city);
    const row = activity.find((candidate) => candidate.zone === report.zone && candidate.service === report.service);

    return {
      status: "trimis",
      ...report,
      reporters: Math.max(row?.reportersLastHour ?? 0, 1),
      retryAfter: new Date(deps.now().getTime() + LIMIT_MS).toISOString(),
    };
  } catch (error) {
    // Fără IP sau amprentă în log; doar cauza.
    console.error("raportare eșuată", error instanceof Error ? error.message : "eroare necunoscută");

    return { status: "eroare" };
  }
}
