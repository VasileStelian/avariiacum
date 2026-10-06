import { runCleanup } from "@/server/cleanup";
import { serverReportsStore } from "@/server/supabase";

// Rulat zilnic de Vercel Cron (vercel.json): prin interogare ține proiectul Supabase free activ.
// Amprentele IP le șterge pg_cron la 15 minute; ștergerea de aici e doar rezervă.
export function GET(request: Request): Promise<Response> {
  return runCleanup(request.headers.get("authorization"), process.env.CRON_SECRET, serverReportsStore());
}
