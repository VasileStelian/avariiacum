import type { CityReport } from "@/components/report-dialog";
import { type City, SERVICES } from "@/config/locations";

// Doar ce are nevoie formularul în browser: nume și slug-uri, fără nimic secret.
export function cityReport(city: City, preset: { zone?: string; service?: string } = {}): CityReport {
  return {
    city: { slug: city.slug, name: city.name },
    zones: city.zones.map((zone) => ({ slug: zone.slug, name: zone.name })),
    services: SERVICES.map((service) => ({
      slug: service.slug,
      name: service.name,
      noun: service.outagePhrase.replace(/^de /, ""),
      provider: city.providers[service.slug].name,
      phone: city.providers[service.slug].phone,
      phoneNote: city.providers[service.slug].phoneNote,
    })),
    zone: preset.zone,
    service: preset.service,
  };
}
