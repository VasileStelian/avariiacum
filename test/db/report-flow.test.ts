// E2E: fluxul principal al aplicației, în browser real, pe build-ul real și Supabase local.
// Trei vecini (trei IP-uri) raportează lipsa apei în Republicii; pagina trebuie să se schimbe imediat.
import { type ChildProcess, spawn } from "node:child_process";
import { rmSync } from "node:fs";

import { type Browser, type Page, chromium } from "playwright";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { localSupabase } from "./local-supabase";

const local = localSupabase();

const sql = postgres(local.dbUrl, { max: 1, onnotice: () => undefined });

const PORT = 3114;

const BASE = `http://localhost:${PORT}`;

let server: ChildProcess | undefined;

let browser: Browser;

const errors: string[] = [];

// Fiecare vecin are propriul IP; local, nimic nu suprascrie antetul (pe Vercel, platforma îl pune).
async function neighbour(ip: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: { "x-real-ip": ip } });
  const page = await context.newPage();

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  return page;
}

async function reportWater(page: Page): Promise<void> {
  await page.goto(`${BASE}/bacau/republicii/`);
  await page.getByRole("button", { name: "Raportează în Republicii" }).click();
  await page.getByRole("radio", { name: "Apă", exact: true }).check();
  await page.getByRole("button", { name: "Trimite raportul" }).click();
}

beforeAll(async () => {
  await sql`truncate public.reports restart identity`;
  rmSync(".next/server/route-cache", { recursive: true, force: true });

  server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "ignore",
    env: { ...process.env, SUPABASE_URL: local.apiUrl, SUPABASE_SECRET_KEY: local.secretKey, IP_HASH_SECRET: "e2e-secret-with-at-least-32-characters" },
  });

  browser = await chromium.launch();

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
}, 30_000);

afterAll(async () => {
  await browser?.close();
  server?.kill();
  await sql.end();
});

describe("reporting a water outage", () => {
  it("thanks the first neighbour and shows the page updated right away", async () => {
    const page = await neighbour("198.51.100.1");

    await reportWater(page);

    await expect.poll(() => page.getByText("Raport trimis. Mulțumim.").isVisible()).toBe(true);
    expect(await page.getByText("1 persoană a raportat în ultima oră, inclusiv tu.").isVisible()).toBe(true);

    await page.goto(`${BASE}/bacau/republicii/`);

    expect(await page.locator(".lead").textContent()).toContain("Raportări izolate pentru apă");
  }, 20_000);

  it("refuses the same neighbour a second time and says when to retry", async () => {
    const page = await neighbour("198.51.100.1");

    await reportWater(page);

    await expect.poll(() => page.getByRole("dialog").getByRole("alert").textContent()).toMatch(/Ai raportat deja apă în acest cartier\. Poți raporta din nou după ora \d\d:\d\d\./);

    const [{ count }] = await sql`select count(*)::int as count from public.reports`;

    expect(count).toBe(1);
  }, 20_000);

  it("turns into a probable outage at the third neighbour, on every page", async () => {
    for (const ip of ["198.51.100.2", "198.51.100.3"]) {
      const page = await neighbour(ip);

      await reportWater(page);
      await expect.poll(() => page.getByText("Raport trimis. Mulțumim.").isVisible()).toBe(true);
    }

    const page = await neighbour("198.51.100.4");

    await page.goto(`${BASE}/bacau/`);
    expect(await page.locator(".lead").textContent()).toContain("Probabil avarie de apă în Republicii.");

    await page.goto(`${BASE}/bacau/apa/`);
    expect(await page.locator(".lead").textContent()).toContain("Probabil avarie în Republicii: 3 persoane în ultima oră.");
  }, 30_000);

  it("remembers the neighbourhood for the next report from the city page", async () => {
    const page = await neighbour("198.51.100.1");

    await page.goto(`${BASE}/bacau/republicii/`);
    await page.evaluate(() => window.localStorage.setItem("avariiacum:bacau:cartier", "republicii"));
    await page.goto(`${BASE}/bacau/`);
    await page.getByRole("button", { name: "Raportează o problemă" }).click();

    await expect.poll(() => page.getByLabel("Cartierul").inputValue()).toBe("republicii");
  }, 20_000);

  it("did not log any error in the browser", () => {
    expect([...new Set(errors)]).toEqual([]);
  });
});
