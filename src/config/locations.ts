// Singurul loc de adevăr pentru orașe, cartiere, servicii și furnizori.
// Toate paginile (/[oras]/, /[oras]/[serviciu]/, /[oras]/[cartier]/) se generează de aici.

export type ServiceSlug = "apa" | "curent" | "gaz" | "caldura";

export type Service = {
  slug: ServiceSlug;
  name: string;
  shortName: string;
  // „Probabil avarie de apă”
  outagePhrase: string;
  // „Nicio problemă cu apa”
  aboutPhrase: string;
  // „Raportează lipsa apei”
  missingPhrase: string;
};

export type Zone = {
  slug: string;
  name: string;
};

export type Provider = {
  name: string;
  fullName: string;
  phone: string;
  // ce fel de linie e: „gratuit, non-stop”, „call center, tasta 1 pentru avarii”
  phoneNote: string;
  // pagina oficială de unde e luat numărul și data verificării (AAAA-LL-ZZ)
  source: string;
  verified: string;
};

export type City = {
  slug: string;
  name: string;
  // forma articulată: „în tot Bacăul”
  nameDefinite: string;
  zones: readonly Zone[];
  providers: Readonly<Record<ServiceSlug, Provider>>;
};

export type CitySegment = { kind: "service"; service: Service } | { kind: "zone"; zone: Zone };

export const SERVICES: readonly Service[] = [
  { slug: "apa", name: "Apă", shortName: "Apă", outagePhrase: "de apă", aboutPhrase: "cu apa", missingPhrase: "lipsa apei" },
  { slug: "curent", name: "Curent", shortName: "Curent", outagePhrase: "de curent", aboutPhrase: "cu curentul", missingPhrase: "lipsa curentului" },
  { slug: "gaz", name: "Gaz", shortName: "Gaz", outagePhrase: "de gaz", aboutPhrase: "cu gazul", missingPhrase: "lipsa gazului" },
  { slug: "caldura", name: "Apă caldă și căldură", shortName: "Căldură", outagePhrase: "de căldură", aboutPhrase: "cu căldura", missingPhrase: "lipsa căldurii" },
];

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function zones(names: readonly string[]): Zone[] {
  return names.map((name) => ({ slug: slugify(name), name }));
}

// Delgaz Grid acoperă curentul și gazul în Bacău și Iași; numerele de urgență diferă.
const DELGAZ_CURENT: Provider = {
  name: "Delgaz Grid",
  fullName: "Delgaz Grid",
  phone: "0800 800 929",
  phoneNote: "gratuit, non-stop",
  source: "https://delgaz.ro/despre-noi/contact",
  verified: "2026-10-05",
};

const DELGAZ_GAZ: Provider = {
  name: "Delgaz Grid",
  fullName: "Delgaz Grid",
  phone: "0800 800 928",
  phoneNote: "gratuit, non-stop",
  source: "https://delgaz.ro/despre-noi/contact",
  verified: "2026-10-05",
};

// Bacău: ro.wikipedia.org/wiki/Listă_de_cartiere_din_Bacău (10) + storia.ro (Nord, Orizont).
// Iași: cartierele care apar în cel puțin două din ro.wikipedia.org/wiki/Cartiere_din_Iași (lista),
// ro.wikipedia.org/wiki/Format:Cartiere_din_Iași și apix.ro (2022), verificate pe 5 oct 2026. Vezi docs/PLAN.md.
export const CITIES: readonly City[] = [
  {
    slug: "bacau",
    name: "Bacău",
    nameDefinite: "Bacăul",
    zones: zones([
      "Centru",
      "Republicii",
      "Nord",
      "CFR",
      "Cornișa",
      "Izvoare",
      "Mioriței",
      "George Bacovia",
      "Bistrița-Lac",
      "Gherăiești",
      "Șerbănești",
      "Orizont",
    ]),
    providers: {
      apa: {
        name: "CRAB",
        fullName: "Compania Regională de Apă Bacău",
        phone: "0372 401 301",
        phoneNote: "call center, tasta 1 pentru avarii",
        source: "https://www.apabacau.ro/",
        verified: "2026-10-05",
      },
      curent: DELGAZ_CURENT,
      gaz: DELGAZ_GAZ,
      caldura: {
        name: "Thermoenergy",
        fullName: "Thermoenergy",
        phone: "0234 585 050",
        phoneNote: "dispecerat, non-stop",
        source: "https://thermoenergy.ro/",
        verified: "2026-10-05",
      },
    },
  },
  {
    slug: "iasi",
    name: "Iași",
    nameDefinite: "Iașiul",
    zones: zones([
      "Alexandru cel Bun",
      "Aviației",
      "Bucium",
      "Bularga",
      "Canta",
      "Cantemir",
      "Centru",
      "Copou",
      "CUG",
      "Dacia",
      "Frumoasa",
      "Galata",
      "Mircea cel Bătrân",
      "Moara de Vânt",
      "Nicolina",
      "Păcurari",
      "Podu Roș",
      "Sărărie",
      "Socola",
      "Tătărași",
      "Tudor Vladimirescu",
      "Țicău",
    ]),
    providers: {
      apa: {
        name: "ApaVital",
        fullName: "ApaVital",
        phone: "0232 969",
        phoneNote: "call center: luni-vineri 07-21, weekend 08-20; avarii@apavital.ro",
        source: "https://www.apavital.ro/contact",
        verified: "2026-10-05",
      },
      curent: DELGAZ_CURENT,
      gaz: DELGAZ_GAZ,
      caldura: {
        name: "Termo-Service",
        fullName: "Termo-Service",
        phone: "0232 232 360",
        phoneNote: "linie de informații despre termoficare, nu dispecerat",
        source: "https://tsiasi.ro/noutati-si-comunicate/numere-de-telefon",
        verified: "2026-10-05",
      },
    },
  },
];

export function findCity(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug);
}

// /[oras]/[segment]/ poate fi un serviciu sau un cartier; testele garantează că nu se suprapun.
export function resolveCitySegment(city: City, segment: string): CitySegment | undefined {
  const service = SERVICES.find((candidate) => candidate.slug === segment);

  if (service) {
    return { kind: "service", service };
  }

  const zone = city.zones.find((candidate) => candidate.slug === segment);

  return zone && { kind: "zone", zone };
}
