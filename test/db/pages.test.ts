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
