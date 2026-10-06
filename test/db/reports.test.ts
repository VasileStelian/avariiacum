// Teste pe Postgres real (Supabase local): funcțiile SQL, PostgREST și drepturile de acces.
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createReportsStore } from "@/server/reports-store";

import { localSupabase } from "./local-supabase";

const local = localSupabase();

const sql = postgres(local.dbUrl, { max: 2, onnotice: () => undefined });

const store = createReportsStore(createClient(local.apiUrl, local.secretKey, { auth: { persistSession: false } }));

const anon = createClient(local.apiUrl, local.publishableKey, { auth: { persistSession: false } });

const HASH_A = "a".repeat(64);

const HASH_B = "b".repeat(64);

const HASH_C = "c".repeat(64);

async function insertAt(minutesAgo: number, zone: string, service: string, ipHash: string | null): Promise<void> {
  await sql`
    insert into public.reports (city, zone, service, ip_hash, created_at)
    values ('bacau', ${zone}, ${service}, ${ipHash}, now() - make_interval(mins => ${minutesAgo}))
  `;
}

beforeEach(async () => {
  await sql`truncate public.reports restart identity`;
});

afterAll(async () => {
  await sql.end();
});

describe("submitReport", () => {
  it("accepts the first report and stores only the hash, never the IP", async () => {
    const result = await store.submitReport({ city: "bacau", zone: "republicii", service: "apa", ipHash: HASH_A });

    expect(result).toEqual({ accepted: true });

    const rows = await sql`select city, zone, service, ip_hash from public.reports`;

    expect(rows).toEqual([{ city: "bacau", zone: "republicii", service: "apa", ip_hash: HASH_A }]);
  });

  it("refuses the same person, zone and service within 2 hours and says when to retry", async () => {
    await insertAt(30, "republicii", "apa", HASH_A);

    const result = await store.submitReport({ city: "bacau", zone: "republicii", service: "apa", ipHash: HASH_A });

    expect(result.accepted).toBe(false);

    const [{ expected }] = await sql`select max(created_at) + interval '2 hours' as expected from public.reports`;

    expect(result.accepted === false && result.retryAfter.getTime()).toBe(new Date(expected).getTime());
  });

  it("accepts the same person for another service or another zone", async () => {
    await insertAt(30, "republicii", "apa", HASH_A);

    await expect(store.submitReport({ city: "bacau", zone: "republicii", service: "curent", ipHash: HASH_A })).resolves.toEqual({ accepted: true });
    await expect(store.submitReport({ city: "bacau", zone: "centru", service: "apa", ipHash: HASH_A })).resolves.toEqual({ accepted: true });
  });

  it("accepts the same person again after 2 hours", async () => {
    await insertAt(121, "republicii", "apa", HASH_A);

    await expect(store.submitReport({ city: "bacau", zone: "republicii", service: "apa", ipHash: HASH_A })).resolves.toEqual({ accepted: true });
  });

  it("lets exactly one of several simultaneous identical reports through", async () => {
    const attempts = Array.from({ length: 6 }, () => store.submitReport({ city: "bacau", zone: "republicii", service: "apa", ipHash: HASH_A }));

    const results = await Promise.all(attempts);

    expect(results.filter((result) => result.accepted)).toHaveLength(1);

    const [{ count }] = await sql`select count(*)::int as count from public.reports`;

    expect(count).toBe(1);
  });

  it("rejects values the database does not know, even if the app check is bypassed", async () => {
    await expect(store.submitReport({ city: "bacau", zone: "republicii", service: "internet", ipHash: HASH_A })).rejects.toThrow();
    await expect(store.submitReport({ city: "Bacău", zone: "republicii", service: "apa", ipHash: HASH_A })).rejects.toThrow();
    await expect(store.submitReport({ city: "bacau", zone: "republicii", service: "apa", ipHash: "1.2.3.4" })).rejects.toThrow();
  });
});

describe("cityActivity", () => {
  it("counts distinct people in the last hour per zone and service", async () => {
    await insertAt(5, "republicii", "apa", HASH_A);
    await insertAt(10, "republicii", "apa", HASH_B);
    await insertAt(50, "republicii", "apa", HASH_C);
    await insertAt(20, "mioritei", "curent", HASH_A);

    const activity = await store.cityActivity("bacau");

    const republicii = activity.find((row) => row.zone === "republicii" && row.service === "apa");

    expect(republicii?.reportersLastHour).toBe(3);
    expect(activity.find((row) => row.zone === "mioritei")?.reportersLastHour).toBe(1);
  });

  it("counts a person once even with several reports in the hour", async () => {
    await insertAt(5, "republicii", "apa", HASH_A);
    await insertAt(40, "republicii", "apa", HASH_A);

    const activity = await store.cityActivity("bacau");

    expect(activity[0]?.reportersLastHour).toBe(1);
  });

  it("keeps older reports out of the hour but still gives the time of the last one", async () => {
    await insertAt(90, "republicii", "apa", HASH_A);

    const [row] = await store.cityActivity("bacau");

    expect(row?.reportersLastHour).toBe(0);
    expect(Date.now() - (row?.lastReportAt.getTime() ?? 0)).toBeGreaterThan(89 * 60_000);
  });

  it("ignores reports older than 24 hours and other cities", async () => {
    await insertAt(25 * 60, "republicii", "apa", HASH_A);
    await sql`insert into public.reports (city, zone, service, ip_hash) values ('iasi', 'copou', 'apa', ${HASH_B})`;

    await expect(store.cityActivity("bacau")).resolves.toEqual([]);
  });
});

describe("reportSeries", () => {
  it("returns 96 buckets of 15 minutes, oldest first, with zeros", async () => {
    // „acum” cade mereu în ultimul interval; „acum 1 minut” nu, în primul minut al unui sfert de oră.
    await insertAt(0, "republicii", "apa", HASH_A);
    await insertAt(0, "republicii", "apa", HASH_B);
    await insertAt(25 * 60, "republicii", "apa", HASH_C);

    const series = await store.reportSeries("bacau", "apa", null);

    expect(series).toHaveLength(96);
    expect(series.at(-1)?.reports).toBe(2);
    expect(series.reduce((sum, point) => sum + point.reports, 0)).toBe(2);
  });

  it("gives the start of each interval, 15 minutes apart, the last one being the current quarter hour", async () => {
    const series = await store.reportSeries("bacau", "apa", null);
    const starts = series.map((point) => point.start.getTime());

    for (let index = 1; index < starts.length; index += 1) {
      expect((starts[index] ?? 0) - (starts[index - 1] ?? 0)).toBe(15 * 60_000);
    }

    const last = starts.at(-1) ?? 0;

    expect(Date.now() - last).toBeGreaterThanOrEqual(0);
    expect(Date.now() - last).toBeLessThan(15 * 60_000);
  });

  it("filters by zone when asked", async () => {
    await insertAt(5, "republicii", "apa", HASH_A);
    await insertAt(5, "centru", "apa", HASH_B);

    const zoneSeries = await store.reportSeries("bacau", "apa", "republicii");

    expect(zoneSeries.reduce((sum, point) => sum + point.reports, 0)).toBe(1);
  });
});

describe("forgetOldIpHashes", () => {
  // Cu cheia, amprenta unui IPv4 se poate inversa încercând toate adresele; o păstrăm doar cât o cere
  // limita de 2 ore (#48).
  it("erases fingerprints older than 2 hours and keeps the reports", async () => {
    await insertAt(125, "republicii", "apa", HASH_A);
    await insertAt(115, "republicii", "apa", HASH_B);

    await expect(store.forgetOldIpHashes()).resolves.toBe(1);

    const rows = await sql`select ip_hash from public.reports order by created_at`;

    expect(rows.map((row) => row.ip_hash)).toEqual([null, HASH_B]);
  });

  it("keeps the 2 hour limit working right after the cleanup", async () => {
    await insertAt(115, "republicii", "apa", HASH_A);
    await store.forgetOldIpHashes();

    await expect(store.submitReport({ city: "bacau", zone: "republicii", service: "apa", ipHash: HASH_A })).resolves.toMatchObject({ accepted: false });
  });

  it("runs every 15 minutes inside Postgres, so it needs no second Vercel cron", async () => {
    const jobs = await sql`select schedule, command, active from cron.job where jobname = 'sterge-amprente-ip'`;

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ schedule: "*/15 * * * *", active: true });
    expect(jobs[0].command).toContain("public.forget_old_ip_hashes()");
  });
});

describe("privileges, layer by layer", () => {
  const FUNCTIONS = [
    "public.submit_report(text, text, text, text)",
    "public.city_activity(text)",
    "public.report_series(text, text, text)",
    "public.forget_old_ip_hashes()",
  ];

  it("keeps row level security on for the reports table", async () => {
    const [{ enabled }] = await sql`select relrowsecurity as enabled from pg_class where oid = 'public.reports'::regclass`;

    expect(enabled).toBe(true);
  });

  for (const role of ["anon", "authenticated"]) {
    it(`gives ${role} no table privileges and no function execute`, async () => {
      const [table] = await sql`
        select
          has_table_privilege(${role}, 'public.reports', 'select') as can_select,
          has_table_privilege(${role}, 'public.reports', 'insert') as can_insert,
          has_table_privilege(${role}, 'public.reports', 'update') as can_update,
          has_table_privilege(${role}, 'public.reports', 'delete') as can_delete
      `;

      expect(table).toEqual({ can_select: false, can_insert: false, can_update: false, can_delete: false });

      for (const signature of FUNCTIONS) {
        const [{ allowed }] = await sql`select has_function_privilege(${role}, ${signature}, 'execute') as allowed`;

        expect(allowed, `${role} ${signature}`).toBe(false);
      }
    });
  }

  it("lets only the server role execute the functions", async () => {
    for (const signature of FUNCTIONS) {
      const [{ allowed }] = await sql`select has_function_privilege('service_role', ${signature}, 'execute') as allowed`;

      expect(allowed, signature).toBe(true);
    }
  });
});

describe("public key (what a browser would have)", () => {
  it("cannot read reports", async () => {
    await insertAt(5, "republicii", "apa", HASH_A);

    const { data, error } = await anon.from("reports").select("*");

    expect(error !== null || data?.length === 0).toBe(true);
  });

  it("cannot insert reports directly", async () => {
    const { error } = await anon.from("reports").insert({ city: "bacau", zone: "republicii", service: "apa", ip_hash: HASH_A });

    expect(error).not.toBeNull();

    const [{ count }] = await sql`select count(*)::int as count from public.reports`;

    expect(count).toBe(0);
  });

  it("cannot call any of the functions", async () => {
    const calls = [
      anon.rpc("submit_report", { p_city: "bacau", p_zone: "republicii", p_service: "apa", p_ip_hash: HASH_A }),
      anon.rpc("city_activity", { p_city: "bacau" }),
      anon.rpc("report_series", { p_city: "bacau", p_service: "apa", p_zone: null }),
      anon.rpc("forget_old_ip_hashes"),
    ];

    for (const { error } of await Promise.all(calls)) {
      expect(error).not.toBeNull();
    }
  });
});
