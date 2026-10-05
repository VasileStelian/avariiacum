import { describe, expect, it } from "vitest";

import { handleReport, parseReportForm } from "./report";
import type { NewReport, ReportsStore, SubmitResult, ZoneActivity } from "./reports-store";

const HASH = "a".repeat(64);

const NOW = new Date("2026-10-05T18:00:00Z");

type FakeStore = ReportsStore & { submitted: NewReport[] };

function fakeStore(result: SubmitResult | Error, activity: ZoneActivity[] = []): FakeStore {
  const store: FakeStore = {
    submitted: [],
    submitReport: (report) => {
      store.submitted.push(report);

      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    },
    cityActivity: () => Promise.resolve(activity),
    reportSeries: () => Promise.reject(new Error("nefolosit")),
    forgetOldIpHashes: () => Promise.reject(new Error("nefolosit")),
  };

  return store;
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }

  return data;
}

describe("parseReportForm", () => {
  it("accepts a city, zone and service that exist in the configuration", () => {
    expect(parseReportForm(form({ oras: "bacau", cartier: "republicii", serviciu: "apa" }))).toEqual({ city: "bacau", zone: "republicii", service: "apa" });
  });

  it("rejects anything not in the configuration", () => {
    const cases: Record<string, string>[] = [
      { oras: "cluj", cartier: "republicii", serviciu: "apa" },
      { oras: "bacau", cartier: "copou", serviciu: "apa" },
      { oras: "bacau", cartier: "republicii", serviciu: "internet" },
      { oras: "bacau", cartier: "", serviciu: "apa" },
      { oras: "bacau", serviciu: "apa" },
    ];

    for (const fields of cases) {
      expect(parseReportForm(form(fields)), JSON.stringify(fields)).toBeNull();
    }
  });

  it("does not accept a service slug as a zone", () => {
    expect(parseReportForm(form({ oras: "bacau", cartier: "gaz", serviciu: "apa" }))).toBeNull();
  });
});

describe("handleReport", () => {
  const report = { city: "bacau", zone: "republicii", service: "apa" } as const;

  it("saves the report with the IP fingerprint and refreshes the three pages that show it", async () => {
    const store = fakeStore({ accepted: true }, [{ zone: "republicii", service: "apa", reportersLastHour: 8, lastReportAt: NOW }]);
    const refreshed: string[] = [];

    const outcome = await handleReport(report, { store, ipHash: HASH, revalidate: (path) => refreshed.push(path), now: () => NOW });

    expect(store.submitted).toEqual([{ ...report, ipHash: HASH }]);
    expect(refreshed.toSorted()).toEqual(["/bacau/", "/bacau/apa/", "/bacau/republicii/"]);
    expect(outcome).toEqual({ status: "trimis", ...report, reporters: 8, retryAfter: "2026-10-05T20:00:00.000Z" });
  });

  it("counts at least the reporter when the activity read lags behind", async () => {
    const store = fakeStore({ accepted: true }, []);

    const outcome = await handleReport(report, { store, ipHash: HASH, revalidate: () => undefined, now: () => NOW });

    expect(outcome.status === "trimis" && outcome.reporters).toBe(1);
  });

  it("says when the same person can report again, without refreshing pages", async () => {
    const retryAfter = new Date("2026-10-05T19:10:00Z");
    const refreshed: string[] = [];

    const outcome = await handleReport(report, { store: fakeStore({ accepted: false, retryAfter }), ipHash: HASH, revalidate: (path) => refreshed.push(path), now: () => NOW });

    expect(outcome).toEqual({ status: "prea-devreme", ...report, retryAfter: retryAfter.toISOString() });
    expect(refreshed).toEqual([]);
  });

  it("returns a calm error instead of throwing when the database fails", async () => {
    const outcome = await handleReport(report, { store: fakeStore(new Error("conexiune pierdută")), ipHash: HASH, revalidate: () => undefined, now: () => NOW });

    expect(outcome).toEqual({ status: "eroare" });
  });
});
