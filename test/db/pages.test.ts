// Paginile reale (după `npm run build`), servite de `next start` legat de Supabase local,
// citite fără JavaScript: ce vede Google și un telefon lent.
import { type ChildProcess, spawn } from "node:child_process";
import { rmSync } from "node:fs";

import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { localSupabase } from "./local-supabase";

const local = localSupabase();

const sql = postgres(local.dbUrl, { max: 1, onnotice: () => undefined });

const PORT = 3109;

const BASE = `http://localhost:${PORT}`;

let server: ChildProcess | undefined;

async function seed(): Promise<void> {
  await sql`truncate public.reports restart identity`;

  const rows: [string, string, number, string][] = [
    ["republicii", "apa", 4, "a"],
    ["republicii", "apa", 9, "b"],
    ["republicii", "apa", 20, "c"],
    ["republicii", "apa", 41, "d"],
    ["mioritei", "curent", 12, "e"],
    ["mioritei", "curent", 30, "f"],
    ["bistrita-lac", "apa", 35, "1"],
    ["george-bacovia", "caldura", 120, "2"],
  ];

  for (const [zone, service, minutesAgo, letter] of rows) {
    await sql`
      insert into public.reports (city, zone, service, ip_hash, created_at)
      values ('bacau', ${zone}, ${service}, ${letter.repeat(64)}, now() - make_interval(mins => ${minutesAgo}))
    `;
  }
}

async function page(path: string): Promise<{ status: number; html: string }> {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });

  return { status: response.status, html: await response.text() };
}

beforeAll(async () => {
  await seed();

  // Next păstrează paginile ISR pe disc între porniri și servește întâi versiunea veche
  // (stale-while-revalidate). Fără ștergere, testul ar citi pagini generate pe alte date.
  rmSync(".next/server/route-cache", { recursive: true, force: true });

  server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "ignore",
    env: { ...process.env, SUPABASE_URL: local.apiUrl, SUPABASE_SECRET_KEY: local.secretKey },
  });

  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    try {
      await fetch(BASE);

      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw new Error("next start nu răspunde; ai rulat npm run build?");
}, 25_000);

afterAll(async () => {
  server?.kill();
  await sql.end();
});

describe("/bacau/", () => {
  it("says the situation first, in the HTML", async () => {
    const { status, html } = await page("/bacau/");

    expect(status).toBe(200);
    expect(html).toContain("<h1>Avarii în Bacău acum</h1>");
    expect(html).toContain("Probabil avarie de apă în Republicii.");
    expect(html).toContain("Raportări izolate în Mioriței și Bistrița-Lac.");
  });

  it("describes every table cell for screen readers, with Romanian agreement", async () => {
    const { html } = await page("/bacau/");

    expect(html).toContain('aria-label="Republicii, Apă: probabil avarie, 4 persoane au raportat în ultima oră"');
    expect(html).toContain('aria-label="Mioriței, Curent: 2 persoane au raportat în ultima oră"');
    expect(html).toContain('aria-label="Centru, Gaz: fără raportări"');
  });

  it("puts the zones with reports above the quiet ones", async () => {
    const { html } = await page("/bacau/");

    expect(html.indexOf(">Republicii<")).toBeLessThan(html.indexOf("Fără raportări în ultima oră"));
    expect(html.indexOf("Fără raportări în ultima oră")).toBeLessThan(html.indexOf(">Centru<"));
  });

  it("has its own title and canonical URL", async () => {
    const { html } = await page("/bacau/");

    expect(html).toContain("<title>Avarii în Bacău acum: apă, curent, gaz și căldură pe cartiere</title>");
    expect(html).toContain('<link rel="canonical" href="');
    expect(html).toMatch(/rel="canonical" href="[^"]*\/bacau\/"/);
  });
});

describe("/bacau/apa/", () => {
  it("shows the city-wide situation and the affected zones", async () => {
    const { status, html } = await page("/bacau/apa/");

    expect(status).toBe(200);
    expect(html).toContain("Probabil avarie în Republicii: 4 persoane în ultima oră.");
    expect(html).toContain(">Bistrița-Lac<");
    expect(html).toContain("Avarii apă: CRAB");
    expect(html).toContain("Nu suntem CRAB");
    expect(html).toContain('href="tel:0372401301"');
    expect(html).toContain("call center, tasta 1 pentru avarii");
    expect(html).toContain('href="https://www.apabacau.ro/"');
  });

  it("draws 96 bars of 15 minutes", async () => {
    const { html } = await page("/bacau/apa/");
    const chart = html.slice(html.indexOf('class="bars"'));

    expect(chart.slice(0, chart.indexOf("</div>")).match(/<i /g)).toHaveLength(96);
  });

  it("names the provider in the title without pretending to be them", async () => {
    const { html } = await page("/bacau/apa/");

    expect(html).toContain("<title>Apă Bacău acum: avarii CRAB raportate pe cartiere</title>");
  });
});

describe("/bacau/republicii/", () => {
  it("shows the four services with the outage first in the sentence", async () => {
    const { status, html } = await page("/bacau/republicii/");

    expect(status).toBe(200);
    expect(html).toContain("Probabil avarie de apă: 4 vecini au raportat în ultima oră.");

    for (const name of ["Apă", "Curent", "Gaz", "Apă caldă și căldură"]) {
      expect(html).toContain(name);
    }
  });
});

describe("unknown addresses", () => {
  it("answer 404 for an unknown city, service or zone", async () => {
    for (const path of ["/cluj/", "/bacau/nu-exista/", "/bacau/apa-rece/"]) {
      expect((await page(path)).status, path).toBe(404);
    }
  });

  it("send addresses typed with capitals to the lowercase one", async () => {
    const response = await fetch(`${BASE}/Bacau/Apa/`, { redirect: "manual" });

    expect(response.status).toBe(308);
    expect(new URL(response.headers.get("location") ?? "", BASE).pathname).toBe("/bacau/apa/");
  });

  it("redirect to the address with the trailing slash", async () => {
    const response = await fetch(`${BASE}/bacau`, { redirect: "manual" });

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("/bacau/");
  });
});

describe("info pages", () => {
  it("/despre/ explains the threshold and gives a real contact for a missing neighbourhood", async () => {
    const { status, html } = await page("/despre/");

    expect(status).toBe(200);
    expect(html).toContain("<h1>Despre Avarii Acum</h1>");
    expect(html).toContain("cel puțin 3 persoane diferite");
    expect(html).toContain('href="mailto:contact@fanvora.ro');
  });

  it("/confidentialitate/ says what is kept, for how long, and what stays in the browser", async () => {
    const { status, html } = await page("/confidentialitate/");

    expect(status).toBe(200);
    expect(html).toContain("<h1>Confidențialitate</h1>");
    expect(html).toContain("24 de ore");
    expect(html).toContain("pe dispozitivul tău");
    expect(html).not.toMatch(/Google Analytics|cookie de urmărire activ/);
  });

  it("are linked from every page footer", async () => {
    const { html } = await page("/bacau/");

    expect(html).toContain('href="/despre/"');
    expect(html).toContain('href="/confidentialitate/"');
  });
});

describe("search engines", () => {
  it("serves a sitemap with every page and the public address", async () => {
    const response = await fetch(`${BASE}/sitemap.xml`);
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(xml).toContain("<loc>https://avariiacum.vercel.app/bacau/republicii/</loc>");
    expect(xml.match(/<loc>/g)).toHaveLength(3 + (1 + 4 + 12) + (1 + 4 + 22));
  });

  it("serves robots.txt that keeps crawlers out of the API and points to the sitemap", async () => {
    const text = await (await fetch(`${BASE}/robots.txt`)).text();

    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Sitemap: https://avariiacum.vercel.app/sitemap.xml");
  });

  it("describes the breadcrumb of a service page as structured data", async () => {
    const { html } = await page("/bacau/apa/");
    const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1] ?? "";

    expect(JSON.parse(json)).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, name: "Bacău", item: "https://avariiacum.vercel.app/bacau/" },
        { position: 2, name: "Apă", item: "https://avariiacum.vercel.app/bacau/apa/" },
      ],
    });
  });
});

describe("sharing", () => {
  it("gives city, service and zone pages a generated preview image", async () => {
    for (const path of ["/bacau/", "/bacau/apa/", "/bacau/republicii/"]) {
      const { html } = await page(path);
      const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];

      expect(image, path).toBeDefined();

      const response = await fetch(new URL(new URL(image ?? "").pathname + new URL(image ?? "").search, BASE));

      expect(response.status, path).toBe(200);
      expect(response.headers.get("content-type"), path).toBe("image/png");
    }
  });
});

describe("default preview image", () => {
  it("gives the home and info pages a neutral image", async () => {
    for (const path of ["/", "/despre/", "/confidentialitate/"]) {
      const { html } = await page(path);
      const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? "";

      expect(image, path).toMatch(/\/opengraph-image/);

      const response = await fetch(new URL(new URL(image).pathname + new URL(image).search, BASE));

      expect(response.headers.get("content-type"), path).toBe("image/png");
    }
  });

  it("keeps the status image on city pages", async () => {
    const { html } = await page("/bacau/");

    expect(html).toMatch(/<meta property="og:image" content="[^"]*\/bacau\/opengraph-image/);
  });
});

describe("error pages", () => {
  it("say „pagina nu există” in Romanian, with a way back", async () => {
    // Adresă fără rută: pagina 404 completă, în HTML.
    const unmatched = await page("/a/b/c/d/");

    expect(unmatched.status).toBe(404);
    expect(unmatched.html).toContain("<h1>Pagina nu există</h1>");
    expect(unmatched.html).toContain('href="/"');

    // Oraș necunoscut: Next 16 trimite un schelet, iar textul vine în payload (apare cu JavaScript).
    const unknownCity = await page("/cluj/");

    expect(unknownCity.status).toBe(404);
    expect(unknownCity.html).toContain("Pagina nu există");
    expect(unknownCity.html).not.toContain("This page could not be found");
  });

  it("has an icon, so browsers do not get a 404 for it", async () => {
    const { html } = await page("/");
    const icon = html.match(/<link rel="icon" href="([^"]+)"/)?.[1];

    expect(icon).toBeDefined();
    expect((await fetch(`${BASE}${icon}`)).status).toBe(200);
  });
});
