import type { ReportDialogProps } from "@/components/report-dialog";
import { type City, SERVICES } from "@/config/locations";

// Doar ce are nevoie formularul în browser: nume și slug-uri, fără nimic secret.
export function reportProps(city: City, label: string, preset: { zone?: string; service?: string } = {}): ReportDialogProps {
  return {
    city: { slug: city.slug, name: city.name },
    zones: city.zones.map((zone) => ({ slug: zone.slug, name: zone.name })),
    services: SERVICES.map((service) => ({
      slug: service.slug,
      name: service.name,
      noun: service.outagePhrase.replace(/^de /, ""),
      provider: city.providers[service.slug].name,
      phone: city.providers[service.slug].phone,
    })),
    zone: preset.zone,
    service: preset.service,
    label,
  };
}
