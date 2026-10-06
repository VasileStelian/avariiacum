import { describe, expect, it } from "vitest";

import { CITIES, SERVICES, findCity, resolveCitySegment, slugify } from "./locations";

const KEBAB_ASCII = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("slugify", () => {
  it("removes Romanian diacritics and joins words with hyphens", () => {
    expect(slugify("Bistrița-Lac")).toBe("bistrita-lac");
    expect(slugify("George Bacovia")).toBe("george-bacovia");
    expect(slugify("Gherăiești")).toBe("gheraiesti");
    expect(slugify("Mioriței")).toBe("mioritei");
  });

  it("handles the legacy cedilla letters ş and ţ like the comma-below ones", () => {
    expect(slugify("Şerbăneşti")).toBe("serbanesti");
    expect(slugify("Șerbănești")).toBe("serbanesti");
  });
});

describe("services", () => {
  it("are water, power, gas and heating, in this order", () => {
    expect(SERVICES.map((service) => service.slug)).toEqual(["apa", "curent", "gaz", "caldura"]);
  });
});

describe("cities", () => {
  it("have unique, lowercase ASCII slugs", () => {
    const slugs = CITIES.map((city) => city.slug);

    expect(new Set(slugs).size).toBe(slugs.length);

    for (const slug of slugs) {
      expect(slug).toMatch(KEBAB_ASCII);
    }
  });

  it("derive every zone slug from its name, uniquely within the city", () => {
    for (const city of CITIES) {
      const slugs = city.zones.map((zone) => zone.slug);

      expect(new Set(slugs).size, city.slug).toBe(slugs.length);

      for (const zone of city.zones) {
        expect(zone.slug, zone.name).toMatch(KEBAB_ASCII);
        expect(zone.slug, zone.name).toBe(slugify(zone.name));
      }
    }
  });

  it("never reuse a service slug as a zone slug, since both live under /[oras]/", () => {
    const serviceSlugs = new Set<string>(SERVICES.map((service) => service.slug));

    for (const city of CITIES) {
      for (const zone of city.zones) {
        expect(serviceSlugs.has(zone.slug), `${city.slug}/${zone.slug}`).toBe(false);
      }
    }
  });

  it("write names with comma-below ș and ț, not the cedilla ş and ţ", () => {
    const names = CITIES.flatMap((city) => [city.name, ...city.zones.map((zone) => zone.name)]);

    for (const name of names) {
      expect(name).not.toMatch(/[şţŞŢ]/u);
    }
  });

  it("have a definite form of the name for phrases like „în tot Bacăul”", () => {
    for (const city of CITIES) {
      expect(city.nameDefinite.startsWith(city.name.slice(0, -1)), city.slug).toBe(true);
      expect(city.nameDefinite.length, city.slug).toBeGreaterThan(city.name.length);
    }
  });

  it("name a provider for every service in every city", () => {
    for (const city of CITIES) {
      for (const service of SERVICES) {
        expect(city.providers[service.slug].name, `${city.slug}/${service.slug}`).not.toBe("");
      }
    }
  });
});

describe("Bacău", () => {
  it("lists the 12 neighbourhoods from the plan", () => {
    const bacau = findCity("bacau");

    expect(bacau?.zones.map((zone) => zone.name)).toEqual([
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
    ]);
  });

  it("has every provider number checked at an official source, with the date", () => {
    for (const city of CITIES) {
      for (const service of SERVICES) {
        const provider = city.providers[service.slug];

        expect(provider.phone.replace(/ /g, ""), `${city.slug}/${service.slug}`).toMatch(/^0\d{6,9}$/);
        expect(provider.source, `${city.slug}/${service.slug}`).toMatch(/^https:\/\//);
        expect(provider.verified, `${city.slug}/${service.slug}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("uses the free non-stop Delgaz numbers, which differ for power and gas", () => {
    const bacau = findCity("bacau");

    expect(bacau?.providers.curent.phone).toBe("0800 800 929");
    expect(bacau?.providers.gaz.phone).toBe("0800 800 928");
  });
});

describe("Iași", () => {
  it("lists the 22 neighbourhoods found in at least two sources (see docs/PLAN.md)", () => {
    const iasi = findCity("iasi");

    expect(iasi?.name).toBe("Iași");
    expect(iasi?.zones).toHaveLength(22);
    expect(iasi?.zones.map((zone) => zone.name)).toEqual(expect.arrayContaining(["Copou", "Tătărași", "Nicolina", "Păcurari", "Țicău", "CUG", "Podu Roș"]));
  });

  it("has Termo-Service for heating, not Veolia, and ApaVital for water", () => {
    const iasi = findCity("iasi");

    expect(iasi?.providers.caldura.name).toBe("Termo-Service");
    expect(iasi?.providers.apa.name).toBe("ApaVital");
    expect(iasi?.providers.apa.phone).toBe("0232 969");
  });
});

describe("Galați", () => {
  it("lists the 28 neighbourhoods found in at least two sources (see docs/PLAN.md)", () => {
    expect(findCity("galati")?.zones.map((zone) => zone.name)).toEqual([
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
    ]);
  });

  it("has Apa Canal for water and other operators than Delgaz for power and gas", () => {
    const galati = findCity("galati");

    expect(galati?.name).toBe("Galați");
    expect(galati?.providers.apa.name).toBe("Apa Canal");
    expect(galati?.providers.apa.phone).toBe("0236 463 294");
    expect(galati?.providers.curent.name).toBe("Distribuție Energie Electrică");
    expect(galati?.providers.curent.phone).toBe("0800 500 205");
    expect(galati?.providers.gaz.name).toBe("Distrigaz Sud Rețele");
    expect(galati?.providers.gaz.phone).toBe("0800 877 778");
  });

  it("says Calorgal heats only the areas tied to its boiler plants", () => {
    const galati = findCity("galati");

    expect(galati?.providers.caldura.name).toBe("Calorgal");
    expect(galati?.providers.caldura.phoneNote).toContain("doar zonele legate la centralele Calorgal");
  });
});

describe("findCity", () => {
  it("finds a city only by its exact slug", () => {
    expect(findCity("bacau")?.name).toBe("Bacău");
    expect(findCity("BACAU")).toBeUndefined();
    expect(findCity("bacău")).toBeUndefined();
    expect(findCity("cluj")).toBeUndefined();
  });
});

describe("resolveCitySegment", () => {
  const bacau = findCity("bacau");

  it("resolves a service slug to the service", () => {
    expect(bacau && resolveCitySegment(bacau, "apa")).toEqual({ kind: "service", service: SERVICES[0] });
  });

  it("resolves a zone slug to the zone", () => {
    expect(bacau && resolveCitySegment(bacau, "republicii")).toEqual({
      kind: "zone",
      zone: { slug: "republicii", name: "Republicii" },
    });
  });

  it("returns undefined for unknown or non-canonical segments", () => {
    expect(bacau && resolveCitySegment(bacau, "nu-exista")).toBeUndefined();
    expect(bacau && resolveCitySegment(bacau, "Apa")).toBeUndefined();
    expect(bacau && resolveCitySegment(bacau, "")).toBeUndefined();
  });
});
