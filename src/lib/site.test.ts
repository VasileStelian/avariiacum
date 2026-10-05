import { describe, expect, it } from "vitest";

import { shareLinks, shareText, siteUrl, sitemapPaths } from "./site";

describe("siteUrl", () => {
  it("uses SITE_URL when set, without a trailing slash", () => {
    expect(siteUrl("https://avariiacum.ro/")).toBe("https://avariiacum.ro");
  });

  it("falls back to the Vercel address until the domain is bought", () => {
    expect(siteUrl(undefined)).toBe("https://avariiacum.vercel.app");
    expect(siteUrl("")).toBe("https://avariiacum.vercel.app");
  });
});

describe("sitemapPaths", () => {
  const paths = sitemapPaths();

  it("lists the home, the info pages and every city, service and zone page with a trailing slash", () => {
    expect(paths).toContain("/");
    expect(paths).toContain("/despre/");
    expect(paths).toContain("/confidentialitate/");
    expect(paths).toContain("/bacau/");
    expect(paths).toContain("/bacau/apa/");
    expect(paths).toContain("/bacau/caldura/");
    expect(paths).toContain("/bacau/republicii/");
    expect(paths).toContain("/bacau/serbanesti/");
  });

  it("has no duplicates and nothing outside the configuration", () => {
    expect(new Set(paths).size).toBe(paths.length);

    for (const path of paths) {
      expect(path).toMatch(/^\/([a-z0-9-]+\/){0,2}$/);
    }
  });

  it("covers 3 info pages + per city: the city, 4 services and its zones", () => {
    expect(paths.filter((path) => path.startsWith("/bacau/"))).toHaveLength(1 + 4 + 12);
  });
});

describe("shareText", () => {
  it("says probable outage only from the threshold, with Romanian agreement", () => {
    expect(shareText("apă", "Republicii", "Bacău", 8)).toBe("Probabil avarie de apă în Republicii, Bacău: 8 persoane au raportat în ultima oră.");
    expect(shareText("apă", "Republicii", "Bacău", 1)).toBe("Lipsă de apă raportată în Republicii, Bacău: 1 persoană a raportat în ultima oră.");
    expect(shareText("curent", "Nord", "Bacău", 21)).toBe("Probabil avarie de curent în Nord, Bacău: 21 de persoane au raportat în ultima oră.");
  });
});

describe("shareLinks", () => {
  it("builds WhatsApp and Facebook links with the text and URL encoded, and no tracking", () => {
    const links = shareLinks("https://avariiacum.ro/bacau/republicii/", "Probabil avarie de apă în Republicii, Bacău.");

    expect(links.whatsapp).toBe(
      "https://wa.me/?text=Probabil%20avarie%20de%20ap%C4%83%20%C3%AEn%20Republicii%2C%20Bac%C4%83u.%20https%3A%2F%2Favariiacum.ro%2Fbacau%2Frepublicii%2F",
    );
    expect(links.facebook).toBe("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Favariiacum.ro%2Fbacau%2Frepublicii%2F");
    expect(`${links.whatsapp}${links.facebook}`).not.toMatch(/utm_/);
  });
});
