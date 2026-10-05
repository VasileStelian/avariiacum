import { describe, expect, it } from "vitest";

import { findCity } from "@/config/locations";
import type { ZoneActivity } from "@/server/reports-store";

import { cityView, serviceView, zoneView } from "./views";

const bacau = findCity("bacau");

if (!bacau) {
  throw new Error("Bacău lipsește din configurare");
}

const now = new Date("2026-10-05T18:00:00Z");

function activity(zone: string, service: string, reporters: number, minutesAgo = 5): ZoneActivity {
  return { zone, service, reportersLastHour: reporters, lastReportAt: new Date(now.getTime() - minutesAgo * 60_000) };
}

describe("cityView", () => {
  it("is quiet when nobody reported", () => {
    const view = cityView(bacau, []);

    expect(view.headline).toEqual({ outage: null, isolated: null, quiet: "Nicio problemă raportată în ultima oră." });
    expect(view.busy).toEqual([]);
    expect(view.calm.map((row) => row.zone.name)).toHaveLength(12);
  });

  it("puts zones with reports first, outages before isolated ones, and keeps the rest in config order", () => {
    const view = cityView(bacau, [activity("mioritei", "curent", 2), activity("republicii", "apa", 7), activity("george-bacovia", "caldura", 1)]);

    expect(view.busy.map((row) => row.zone.name)).toEqual(["Republicii", "Mioriței", "George Bacovia"]);
    expect(view.calm.map((row) => row.zone.name)).toEqual(["Centru", "Nord", "CFR", "Cornișa", "Izvoare", "Bistrița-Lac", "Gherăiești", "Șerbănești", "Orizont"]);
  });

  it("gives every row one cell per service, in service order", () => {
    const view = cityView(bacau, [activity("republicii", "apa", 7)]);

    expect(view.busy[0]?.cells.map((cell) => [cell.service.slug, cell.status, cell.reporters])).toEqual([
      ["apa", "avarie", 7],
      ["curent", "liniste", 0],
      ["gaz", "liniste", 0],
      ["caldura", "liniste", 0],
    ]);
  });

  it("writes the situation in plain Romanian", () => {
    const view = cityView(bacau, [activity("republicii", "apa", 7), activity("nord", "curent", 4), activity("mioritei", "curent", 2), activity("george-bacovia", "caldura", 1)]);

    expect(view.headline).toEqual({
      outage: "Probabil avarie de apă în Republicii și de curent în Nord.",
      isolated: "Raportări izolate în Mioriței și George Bacovia.",
      quiet: null,
    });
  });

  it("treats reports older than an hour as quiet in the table", () => {
    const view = cityView(bacau, [activity("republicii", "apa", 0, 90)]);

    expect(view.busy).toEqual([]);
    expect(view.headline.quiet).not.toBeNull();
  });

  it("ignores zones and services that are no longer in the configuration", () => {
    const view = cityView(bacau, [activity("cartier-sters", "apa", 9), activity("republicii", "internet", 9)]);

    expect(view.busy).toEqual([]);
  });
});

describe("serviceView", () => {
  it("lists zones with reports in the last hour, outages first, and names the quiet ones", () => {
    const view = serviceView(bacau, "apa", [activity("bistrita-lac", "apa", 1, 35), activity("republicii", "apa", 7, 4), activity("nord", "curent", 5)]);

    expect(view.affected.map((row) => [row.zone.name, row.status, row.reporters])).toEqual([
      ["Republicii", "avarie", 7],
      ["Bistrița-Lac", "raportari", 1],
    ]);
    expect(view.quietZones).toHaveLength(10);
    expect(view.quietZones).not.toContain("Republicii");
    expect(view.headline).toBe("Probabil avarie în Republicii: 7 persoane în ultima oră.");
  });

  it("gives the last report time across the city for this service", () => {
    const view = serviceView(bacau, "apa", [activity("republicii", "apa", 7, 4), activity("nord", "apa", 0, 300)]);

    expect(view.lastReportAt?.getTime()).toBe(now.getTime() - 4 * 60_000);
  });

  it("is calm and says so when nobody reported this service", () => {
    const view = serviceView(bacau, "gaz", [activity("republicii", "apa", 7)]);

    expect(view.affected).toEqual([]);
    expect(view.headline).toBe("Nicio problemă cu gazul raportată în ultima oră.");
    expect(view.lastReportAt).toBeNull();
  });
});

describe("zoneView", () => {
  it("gives the four services with status and last report", () => {
    const view = zoneView(bacau, "republicii", [activity("republicii", "apa", 7, 4), activity("republicii", "caldura", 0, 120), activity("nord", "gaz", 5)]);

    expect(view.services.map((row) => [row.service.slug, row.status, row.reporters, row.lastReportAt?.getTime() ?? null])).toEqual([
      ["apa", "avarie", 7, now.getTime() - 4 * 60_000],
      ["curent", "liniste", 0, null],
      ["gaz", "liniste", 0, null],
      ["caldura", "liniste", 0, now.getTime() - 120 * 60_000],
    ]);
    expect(view.headline).toBe("Probabil avarie de apă: 7 vecini au raportat în ultima oră.");
  });

  it("is calm when the zone has no reports in the last hour", () => {
    expect(zoneView(bacau, "centru", []).headline).toBe("Nicio problemă raportată în ultima oră.");
  });
});
