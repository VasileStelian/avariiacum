// Conexiunea la Supabase local (`npx supabase start`). Cheile sunt cele demo, publice, ale CLI-ului;
// le citim la rulare ca să nu stea în repo.
import { execFileSync } from "node:child_process";

export type LocalSupabase = {
  apiUrl: string;
  dbUrl: string;
  publishableKey: string;
  secretKey: string;
};

type StatusOutput = {
  API_URL?: string;
  DB_URL?: string;
  PUBLISHABLE_KEY?: string;
  SECRET_KEY?: string;
};

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`supabase status nu a dat ${name}; rulează npx supabase start`);
  }

  return value;
}

export function localSupabase(): LocalSupabase {
  const raw = execFileSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  // SAFETY: forma documentată a `supabase status -o json`; fiecare câmp e verificat de `required` mai jos.
  const status = JSON.parse(raw) as StatusOutput;

  return {
    apiUrl: required(status.API_URL, "API_URL"),
    dbUrl: required(status.DB_URL, "DB_URL"),
    publishableKey: required(status.PUBLISHABLE_KEY, "PUBLISHABLE_KEY"),
    secretKey: required(status.SECRET_KEY, "SECRET_KEY"),
  };
}
