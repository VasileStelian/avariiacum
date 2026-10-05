import "server-only";

import { createClient } from "@supabase/supabase-js";

import { type ReportsStore, createReportsStore } from "./reports-store";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variabila de mediu ${name} lipsește`);
  }

  return value;
}

// Cheia secretă Supabase stă doar pe server (variabile de mediu Vercel); browserul nu primește nicio cheie.
export function serverReportsStore(): ReportsStore {
  const client = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return createReportsStore(client);
}
