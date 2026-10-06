import { CITIES, SERVICES } from "@/config/locations";

import { countRo, joinRo } from "./format";
import { OUTAGE_THRESHOLD } from "./status";

const FALLBACK_URL = "https://avariiacum.vercel.app";

// Adresa publică; SITE_URL se setează în Vercel când se leagă domeniul avariiacum.ro.
export function siteUrl(configured: string | undefined): string {
  return (configured || FALLBACK_URL).replace(/\/+$/, "");
}

export function siteDescription(): string {
  return `Raportări anonime de la locuitori despre avariile de apă, curent, gaz și căldură, pe cartiere. ${joinRo(CITIES.map((city) => city.name))}.`;
}

export function sitemapPaths(): string[] {
  return [
    "/",
    "/despre/",
    "/confidentialitate/",
    ...CITIES.flatMap((city) => [
      `/${city.slug}/`,
      ...SERVICES.map((service) => `/${city.slug}/${service.slug}/`),
      ...city.zones.map((zone) => `/${city.slug}/${zone.slug}/`),
    ]),
  ];
}

const REPORTED = { one: "persoană a raportat", many: "persoane au raportat" };

// „apă”, „curent”, „gaz”, „căldură”: substantivul serviciului, fără „de”.
export function shareText(serviceNoun: string, zone: string, city: string, reporters: number): string {
  const lead = reporters >= OUTAGE_THRESHOLD ? `Probabil avarie de ${serviceNoun}` : `Lipsă de ${serviceNoun} raportată`;

  return `${lead} în ${zone}, ${city}: ${countRo(reporters, REPORTED)} în ultima oră.`;
}

export type ShareLinks = {
  whatsapp: string;
  facebook: string;
};

// Linkul e chiar adresa paginii: fără scurtător extern și fără parametri de urmărire.
export function shareLinks(url: string, text: string): ShareLinks {
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
}
