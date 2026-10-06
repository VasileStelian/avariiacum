import "server-only";

import { createHmac } from "node:crypto";

// Sub 32 de caractere, cineva cu baza de date ar putea încerca toate cele ~4 miliarde de IPv4.
const MIN_SECRET_LENGTH = 32;

// Adresa IP nu se salvează niciodată; doar amprenta HMAC. Cu cheia, amprenta unui IPv4 se poate inversa
// încercând toate adresele, de aceea pg_cron o șterge după 2 ore (supabase/migrations, #48).
export function hashIp(ip: string, secret: string): string {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`IP_HASH_SECRET trebuie să aibă cel puțin ${MIN_SECRET_LENGTH} de caractere`);
  }

  return createHmac("sha256", secret).update(ip).digest("hex");
}
