import { describe, expect, it } from "vitest";

import { runCleanup } from "./cleanup";
import type { ReportsStore } from "./reports-store";

const SECRET = "cron-secret-for-tests-0123456789abcdef";

function fakeStore(forgotten: number): ReportsStore & { calls: number } {
  const store = {
    calls: 0,
    submitReport: () => Promise.reject(new Error("nefolosit")),
    cityActivity: () => Promise.reject(new Error("nefolosit")),
    reportSeries: () => Promise.reject(new Error("nefolosit")),
    forgetOldIpHashes: () => {
      store.calls += 1;

      return Promise.resolve(forgotten);
    },
  };

  return store;
}

describe("runCleanup", () => {
  it("erases old fingerprints when Vercel sends the right secret", async () => {
    const store = fakeStore(4);

    const response = await runCleanup(`Bearer ${SECRET}`, SECRET, store);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ forgotten: 4 });
    expect(store.calls).toBe(1);
  });

  it("refuses a missing or wrong secret without touching the database", async () => {
    const store = fakeStore(4);

    for (const header of [null, "", SECRET, "Bearer ", `Bearer ${SECRET}x`, `bearer ${SECRET}`]) {
      const response = await runCleanup(header, SECRET, store);

      expect(response.status, String(header)).toBe(401);
    }

    expect(store.calls).toBe(0);
  });

  it("fails closed when CRON_SECRET is not configured", async () => {
    const store = fakeStore(4);

    for (const configured of [undefined, "", "scurt"]) {
      const response = await runCleanup(`Bearer ${configured ?? ""}`, configured, store);

      expect(response.status).toBe(500);
    }

    expect(store.calls).toBe(0);
  });
});
