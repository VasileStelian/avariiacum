import "server-only";

import { timingSafeEqual } from "node:crypto";

import type { ReportsStore } from "./reports-store";

const MIN_SECRET_LENGTH = 32;

function sameSecret(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

// Vercel Cron trimite `Authorization: Bearer <CRON_SECRET>`. Fără secret configurat, ruta refuză tot.
export async function runCleanup(authorization: string | null, cronSecret: string | undefined, store: ReportsStore): Promise<Response> {
  if (!cronSecret || cronSecret.length < MIN_SECRET_LENGTH) {
    return Response.json({ error: "CRON_SECRET lipsește sau e prea scurt" }, { status: 500 });
  }

  if (!authorization || !sameSecret(authorization, `Bearer ${cronSecret}`)) {
    return Response.json({ error: "neautorizat" }, { status: 401 });
  }

  const forgotten = await store.forgetOldIpHashes();

  return Response.json({ forgotten });
}
