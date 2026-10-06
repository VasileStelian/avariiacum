import type { City, Service } from "@/config/locations";

// Textele pentru căutare ale paginii /[oras]/[serviciu]/: formulările cu care oamenii caută o avarie
// („pană de curent”, „întrerupere apă”, numele furnizorului), fără să ne dăm drept furnizorul.

export function serviceTitle(city: City, service: Service): string {
  return `${service.searchName} ${city.name} acum: avarii și întreruperi ${city.providers[service.slug].name}`;
}

export function serviceHeading(city: City, service: Service): string {
  return `${service.searchName} ${city.name} acum: avarii raportate pe cartiere`;
}

export function serviceDescription(city: City, service: Service): string {
  const provider = city.providers[service.slug].name;

  return `Avarii și întreruperi ${service.outagePhrase} în ${city.name} acum, raportate de vecini pe cartiere. Nu suntem ${provider}; numărul lor de avarii e pe pagină.`;
}
