"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { clientIp } from "@/server/client-ip";
import { hashIp } from "@/server/ip-hash";
import { type ReportOutcome, handleReport, parseReportForm } from "@/server/report";
import { serverReportsStore } from "@/server/supabase";

export async function submitReport(_previous: ReportOutcome | null, data: FormData): Promise<ReportOutcome> {
  const report = parseReportForm(data);

  if (!report) {
    return { status: "invalid" };
  }

  let ipHash: string;

  try {
    ipHash = hashIp(clientIp(await headers()), process.env.IP_HASH_SECRET ?? "");
  } catch (error) {
    console.error("raportare: IP_HASH_SECRET lipsește sau e prea scurt", error instanceof Error ? error.message : "");

    return { status: "eroare" };
  }

  return handleReport(report, {
    store: serverReportsStore(),
    ipHash,
    revalidate: (path) => revalidatePath(path),
    now: () => new Date(),
  });
}
