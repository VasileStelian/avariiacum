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

  it("has no provider phone number until it is checked at the source (issue #2)", () => {
    const bacau = findCity("bacau");

    for (const service of SERVICES) {
      expect(bacau?.providers[service.slug].phone).toBeNull();
    }
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
