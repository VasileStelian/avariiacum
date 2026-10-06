// Singurul loc de adevăr pentru orașe, cartiere, servicii și furnizori.
// Toate paginile (/[oras]/, /[oras]/[serviciu]/, /[oras]/[cartier]/) se generează de aici.

export type ServiceSlug = "apa" | "curent" | "gaz" | "caldura";

export type Service = {
  slug: ServiceSlug;
  name: string;
  shortName: string;
  // cum caută oamenii în Google: „Pană de curent Bacău”, nu „Curent Bacău”
  searchName: string;
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
  { slug: "apa", name: "Apă", shortName: "Apă", searchName: "Apă", outagePhrase: "de apă", aboutPhrase: "cu apa", missingPhrase: "lipsa apei" },
  { slug: "curent", name: "Curent", shortName: "Curent", searchName: "Pană de curent", outagePhrase: "de curent", aboutPhrase: "cu curentul", missingPhrase: "lipsa curentului" },
  { slug: "gaz", name: "Gaz", shortName: "Gaz", searchName: "Gaz", outagePhrase: "de gaz", aboutPhrase: "cu gazul", missingPhrase: "lipsa gazului" },
  { slug: "caldura", name: "Apă caldă și căldură", shortName: "Căldură", searchName: "Apă caldă și căldură", outagePhrase: "de căldură", aboutPhrase: "cu căldura", missingPhrase: "lipsa căldurii" },
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
// Galați: cartierele care apar în cel puțin două surse independente (Wikipedia, galati.wiki, BV „V.A. Urechia”,
// galateni.net, storia.ro, imobiliare.ro, jurnalul de intervenții Apa Canal, presa), verificate pe 6 oct 2026.
// Părțile numerotate (Țiglina 1-2, Mazepa 1-2, Micro 39 A-C) sunt comasate, cum le anunță Apa Canal. Vezi docs/PLAN.md.
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
  {
    slug: "galati",
    name: "Galați",
    nameDefinite: "Galațiul",
    zones: zones([
      "Aurel Vlaicu",
      "Bariera Traian",
      "Barboși",
      "Bădălan",
      "Centru",
      "Dimitrie Cantemir",
      "Filești",
      "Gară",
      "I.C. Frimu",
      "Mazepa",
      "Micro 13",
      "Micro 14",
      "Micro 16 (Țiglina 3)",
      "Micro 17",
      "Micro 18",
      "Micro 19",
      "Micro 20",
      "Micro 21",
      "Micro 38",
      "Micro 39",
      "Micro 40",
      "Piața Centrală",
      "Port",
      "Siderurgiștilor Vest",
      "Traian Nord",
      "Țiglina",
      "Valea Orașului",
      "Zona Veche (Lozoveni)",
    ]),
    providers: {
      apa: {
        name: "Apa Canal",
        fullName: "Apa Canal S.A. Galați",
        phone: "0236 463 294",
        phoneNote: "dispecerat, 24/7",
        source: "https://www.apa-canal.ro/contact",
        verified: "2026-10-06",
      },
      curent: {
        name: "Distribuție Energie Electrică",
        fullName: "Distribuție Energie Electrică Romania, Sucursala Galați",
        phone: "0800 500 205",
        phoneNote: "telverde pentru deranjamente, zona Muntenia Nord; sau prefixul județului + 929 (0236 929)",
        source: "https://www.distributie-energie.ro/sucursala-galati-2/",
        verified: "2026-10-06",
      },
      gaz: {
        name: "Distrigaz Sud Rețele",
        fullName: "Distrigaz Sud Rețele",
        phone: "0800 877 778",
        phoneNote: "gratuit, non-stop",
        source: "https://www.distrigazsud-retele.ro/companie/contact/",
        verified: "2026-10-06",
      },
      caldura: {
        name: "Calorgal",
        fullName: "Calorgal S.R.L. Galați",
        phone: "0725 257 824",
        phoneNote: "dispecerat; Calorgal încălzește doar zonele legate la centralele Calorgal, nu tot orașul",
        source: "https://www.calorgal.ro/contact/",
        verified: "2026-10-06",
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
