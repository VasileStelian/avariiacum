import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export type NewReport = {
  city: string;
  zone: string;
  service: string;
  ipHash: string;
};

export type SubmitResult = { accepted: true } | { accepted: false; retryAfter: Date };

export type ZoneActivity = {
  zone: string;
  service: string;
  reportersLastHour: number;
  lastReportAt: Date;
};

export type SeriesPoint = {
  start: Date;
  reports: number;
};

export type ReportsStore = {
  submitReport: (report: NewReport) => Promise<SubmitResult>;
  cityActivity: (city: string) => Promise<ZoneActivity[]>;
  reportSeries: (city: string, service: string, zone: string | null) => Promise<SeriesPoint[]>;
  forgetOldIpHashes: () => Promise<number>;
};

// PostgREST întoarce JSON netipizat; îl decodăm aici, la graniță.
const timestamp = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

const SubmitRows = z
  .tuple([
    z.union([
      z.object({ accepted: z.literal(true), retry_after: z.null() }),
      z.object({ accepted: z.literal(false), retry_after: timestamp }),
    ]),
  ])
  .transform(([row]): SubmitResult => (row.accepted ? { accepted: true } : { accepted: false, retryAfter: row.retry_after }));

const ActivityRows = z.array(
  z
    .object({ zone: z.string(), service: z.string(), reporters_last_hour: z.int().nonnegative(), last_report_at: timestamp })
    .transform((row): ZoneActivity => ({
      zone: row.zone,
      service: row.service,
      reportersLastHour: row.reporters_last_hour,
      lastReportAt: row.last_report_at,
    })),
);

const SeriesRows = z
  .array(z.object({ bucket_start: timestamp, reports: z.int().nonnegative() }).transform((row): SeriesPoint => ({ start: row.bucket_start, reports: row.reports })))
  .length(96);

const ForgottenCount = z.int().nonnegative();

type RpcResult = { data: z.core.util.JSONType | null; error: { message: string } | null };

function decode<T>(operation: string, schema: z.ZodType<T>, result: RpcResult): T {
  if (result.error) {
    throw new Error(`reports-store ${operation}: ${result.error.message}`);
  }

  const parsed = schema.safeParse(result.data);

  if (!parsed.success) {
    throw new Error(`reports-store ${operation}: răspuns neașteptat: ${parsed.error.message}`);
  }

  return parsed.data;
}

export function createReportsStore(client: SupabaseClient): ReportsStore {
  return {
    async submitReport(report) {
      const result = await client.rpc("submit_report", {
        p_city: report.city,
        p_zone: report.zone,
        p_service: report.service,
        p_ip_hash: report.ipHash,
      });

      return decode("submit_report", SubmitRows, result);
    },

    async cityActivity(city) {
      return decode("city_activity", ActivityRows, await client.rpc("city_activity", { p_city: city }));
    },

    async reportSeries(city, service, zone) {
      return decode("report_series", SeriesRows, await client.rpc("report_series", { p_city: city, p_service: service, p_zone: zone }));
    },

    async forgetOldIpHashes() {
      return decode("forget_old_ip_hashes", ForgottenCount, await client.rpc("forget_old_ip_hashes"));
    },
  };
}
