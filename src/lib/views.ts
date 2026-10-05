// Transformă activitatea din baza de date în ce afișează paginile. Funcții pure, fără I/O.
import { type City, SERVICES, type Service, type Zone } from "@/config/locations";
import type { ZoneActivity } from "@/server/reports-store";

import { countRo, joinRo } from "./format";
import { type Status, statusFor } from "./status";

const PEOPLE = { one: "persoană", many: "persoane" };

const NEIGHBOURS = { one: "vecin a raportat", many: "vecini au raportat" };

const QUIET = "Nicio problemă raportată în ultima oră.";

export type Cell = {
  service: Service;
  reporters: number;
  status: Status;
};

export type CityRow = {
  zone: Zone;
  cells: Cell[];
};

export type CityView = {
  headline: { outage: string | null; isolated: string | null; quiet: string | null };
  busy: CityRow[];
  calm: CityRow[];
};

export type AffectedZone = {
  zone: Zone;
  reporters: number;
  status: Status;
  lastReportAt: Date;
};

export type ServiceView = {
  headline: string;
  affected: AffectedZone[];
  quietZones: string[];
  lastReportAt: Date | null;
};

export type ZoneService = {
  service: Service;
  reporters: number;
  status: Status;
  lastReportAt: Date | null;
};

export type ZoneView = {
  headline: string;
  services: ZoneService[];
};

const SEVERITY: Record<Status, number> = { avarie: 2, raportari: 1, liniste: 0 };

function lookup(activity: readonly ZoneActivity[]): (zone: string, service: string) => ZoneActivity | undefined {
  const byKey = new Map(activity.map((row) => [`${row.zone}|${row.service}`, row]));

  return (zone, service) => byKey.get(`${zone}|${service}`);
}

function worst(cells: readonly Cell[]): Cell | undefined {
  return cells.toSorted((a, b) => SEVERITY[b.status] - SEVERITY[a.status] || b.reporters - a.reporters)[0];
}

export function cityView(city: City, activity: readonly ZoneActivity[]): CityView {
  const find = lookup(activity);

  const rows = city.zones.map((zone): CityRow => ({
    zone,
    cells: SERVICES.map((service) => {
      const reporters = find(zone.slug, service.slug)?.reportersLastHour ?? 0;

      return { service, reporters, status: statusFor(reporters) };
    }),
  }));

  const busy = rows
    .filter((row) => row.cells.some((cell) => cell.status !== "liniste"))
    .toSorted((a, b) => {
      const wa = worst(a.cells);
      const wb = worst(b.cells);

      return SEVERITY[wb?.status ?? "liniste"] - SEVERITY[wa?.status ?? "liniste"] || (wb?.reporters ?? 0) - (wa?.reporters ?? 0);
    });

  const outageParts = SERVICES.flatMap((service) => {
    const zones = busy.filter((row) => row.cells.some((cell) => cell.service === service && cell.status === "avarie")).map((row) => row.zone.name);

    return zones.length > 0 ? [`${service.outagePhrase} în ${joinRo(zones)}`] : [];
  });

  const isolatedZones = busy.filter((row) => worst(row.cells)?.status === "raportari").map((row) => row.zone.name);

  return {
    headline: {
      outage: outageParts.length > 0 ? `Probabil avarie ${joinRo(outageParts)}.` : null,
      isolated: isolatedZones.length > 0 ? `Raportări izolate în ${joinRo(isolatedZones)}.` : null,
      quiet: busy.length === 0 ? QUIET : null,
    },
    busy,
    calm: rows.filter((row) => !busy.includes(row)),
  };
}

export function serviceView(city: City, serviceSlug: string, activity: readonly ZoneActivity[]): ServiceView {
  const service = SERVICES.find((candidate) => candidate.slug === serviceSlug);
  const zonesBySlug = new Map(city.zones.map((zone) => [zone.slug, zone]));
  const forService = activity.filter((row) => row.service === serviceSlug && zonesBySlug.has(row.zone));

  const affected = forService
    .flatMap((row): AffectedZone[] => {
      const zone = zonesBySlug.get(row.zone);

      return zone && row.reportersLastHour > 0
        ? [{ zone, reporters: row.reportersLastHour, status: statusFor(row.reportersLastHour), lastReportAt: row.lastReportAt }]
        : [];
    })
    .toSorted((a, b) => SEVERITY[b.status] - SEVERITY[a.status] || b.reporters - a.reporters);

  const outages = affected.filter((row) => row.status === "avarie");
  const [firstOutage] = outages;

  let headline = `Nicio problemă ${service?.aboutPhrase ?? ""} raportată în ultima oră.`;

  if (outages.length === 1 && firstOutage) {
    headline = `Probabil avarie în ${firstOutage.zone.name}: ${countRo(firstOutage.reporters, PEOPLE)} în ultima oră.`;
  } else if (outages.length > 1) {
    headline = `Probabil avarie în ${joinRo(outages.map((row) => row.zone.name))}.`;
  } else if (affected.length > 0) {
    headline = `Raportări izolate în ${joinRo(affected.map((row) => row.zone.name))}.`;
  }

  const latest = forService.toSorted((a, b) => b.lastReportAt.getTime() - a.lastReportAt.getTime())[0];

  return {
    headline,
    affected,
    quietZones: city.zones.filter((zone) => !affected.some((row) => row.zone === zone)).map((zone) => zone.name),
    lastReportAt: latest?.lastReportAt ?? null,
  };
}

export function zoneView(city: City, zoneSlug: string, activity: readonly ZoneActivity[]): ZoneView {
  const find = lookup(activity);

  const services = SERVICES.map((service): ZoneService => {
    const row = find(zoneSlug, service.slug);
    const reporters = row?.reportersLastHour ?? 0;

    return { service, reporters, status: statusFor(reporters), lastReportAt: row?.lastReportAt ?? null };
  });

  const outages = services.filter((row) => row.status === "avarie");
  const isolated = services.filter((row) => row.status === "raportari");
  const [firstOutage] = outages;

  let headline = QUIET;

  if (outages.length === 1 && firstOutage) {
    headline = `Probabil avarie ${firstOutage.service.outagePhrase}: ${countRo(firstOutage.reporters, NEIGHBOURS)} în ultima oră.`;
  } else if (outages.length > 1) {
    headline = `Probabil avarie ${joinRo(outages.map((row) => row.service.outagePhrase))} în ultima oră.`;
  } else if (isolated.length > 0) {
    headline = `Raportări izolate ${joinRo(isolated.map((row) => row.service.outagePhrase.replace(/^de /, "pentru ")))} în ultima oră.`;
  }

  return { headline, services };
}
