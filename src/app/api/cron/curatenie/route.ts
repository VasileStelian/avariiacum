import { runCleanup } from "@/server/cleanup";
import { serverReportsStore } from "@/server/supabase";

// Rulat zilnic de Vercel Cron (vercel.json). Șterge amprentele IP mai vechi de 24 de ore și,
// prin interogare, ține proiectul Supabase free activ.
export function GET(request: Request): Promise<Response> {
  return runCleanup(request.headers.get("authorization"), process.env.CRON_SECRET, serverReportsStore());
}
