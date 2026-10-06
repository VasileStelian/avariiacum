import { describe, expect, it } from "vitest";

import { CITIES, SERVICES, type City, type Service } from "@/config/locations";

import { serviceDescription, serviceHeading, serviceTitle } from "./service-meta";

function city(slug: string): City {
  const found = CITIES.find((candidate) => candidate.slug === slug);

  if (!found) {
    throw new Error(`no city ${slug}`);
  }

  return found;
}

function service(slug: string): Service {
  const found = SERVICES.find((candidate) => candidate.slug === slug);

  if (!found) {
    throw new Error(`no service ${slug}`);
  }

  return found;
}

describe("serviceTitle", () => {
  it("leads with the service and city, then outages and the provider people search for", () => {
    expect(serviceTitle(city("bacau"), service("apa"))).toBe("Apă Bacău acum: avarii și întreruperi CRAB");
    expect(serviceTitle(city("iasi"), service("apa"))).toBe("Apă Iași acum: avarii și întreruperi ApaVital");
  });

  it("says „Pană de curent”, the way people search for a power cut", () => {
    expect(serviceTitle(city("bacau"), service("curent"))).toBe("Pană de curent Bacău acum: avarii și întreruperi Delgaz Grid");
  });

  it("keeps the heating provider of each city", () => {
    expect(serviceTitle(city("iasi"), service("caldura"))).toBe("Apă caldă și căldură Iași acum: avarii și întreruperi Termo-Service");
  });
});

describe("serviceHeading", () => {
  it("uses the searched name and says the reports are per neighbourhood", () => {
    expect(serviceHeading(city("bacau"), service("curent"))).toBe("Pană de curent Bacău acum: avarii raportate pe cartiere");
    expect(serviceHeading(city("iasi"), service("gaz"))).toBe("Gaz Iași acum: avarii raportate pe cartiere");
  });
});

describe("serviceDescription", () => {
  it("names the interruption, the city and that we are not the provider", () => {
    expect(serviceDescription(city("iasi"), service("apa"))).toBe(
      "Avarii și întreruperi de apă în Iași, raportate de locuitori pe cartiere în ultima oră. Nu suntem ApaVital; numărul lor de avarii e pe pagină.",
    );
  });

  it("fits in a search result snippet for every city and service", () => {
    for (const each of CITIES) {
      for (const one of SERVICES) {
        expect(serviceDescription(each, one).length).toBeLessThanOrEqual(160);
      }
    }
  });
});
