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

  it("keeps every status label readable: text at least 4.5:1 against its background", async () => {
    const page = await neighbour("198.51.100.9");

    await page.goto(`${BASE}/bacau/centru/`);

    const ratios = await page.evaluate(() => {
      const channel = (value: number): number => {
        const c = value / 255;

        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };

      const luminance = (rgb: string): number => {
        const [r = 0, g = 0, b = 0] = (rgb.match(/\d+/g) ?? []).map(Number);

        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };

      // Doar etichetele cu text; bifa singură din tabel are pragul de 3:1 al iconițelor.
      return [...document.querySelectorAll(".st")].flatMap((badge) => {
        if ((badge.textContent ?? "").trim() === "") {
          return [];
        }

        const fg = luminance(getComputedStyle(badge).color);
        const bgColor = getComputedStyle(badge).backgroundColor;
        const bg = bgColor === "rgba(0, 0, 0, 0)" ? 1 : luminance(bgColor);

        return [(Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)];
      });
    });

    expect(ratios.length).toBeGreaterThan(0);

    for (const ratio of ratios) {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("reports from the home page: city first, then the usual panel", async () => {
    const page = await neighbour("198.51.100.30");

    await page.goto(`${BASE}/`);
    await page.getByRole("button", { name: "Raportează o problemă" }).click();

    const dialog = page.getByRole("dialog");

    expect(await dialog.getByRole("heading", { name: "În ce oraș?" }).isVisible()).toBe(true);

    await dialog.getByRole("button", { name: "Bacău" }).click();
    expect(await page.getByLabel("Cartierul").locator("option", { hasText: "Republicii, Bacău" }).count()).toBe(1);

    await dialog.getByRole("button", { name: "Schimbă orașul" }).click();
    await dialog.getByRole("button", { name: "Iași" }).click();
    await page.getByLabel("Cartierul").selectOption("copou");
    await page.getByRole("radio", { name: "Curent", exact: true }).check();
    await page.getByRole("button", { name: "Trimite raportul" }).click();

    await expect.poll(() => page.getByText("Raport trimis. Mulțumim.").isVisible()).toBe(true);
    expect(await page.getByText("Curent în Copou", { exact: true }).isVisible()).toBe(true);

    const [{ count }] = await sql`select count(*)::int as count from public.reports where city = 'iasi' and zone = 'copou' and service = 'curent'`;

    expect(count).toBe(1);
  }, 30_000);

  it("starts again from the city question after the panel is closed", async () => {
    const page = await neighbour("198.51.100.31");

    await page.goto(`${BASE}/`);
    await page.getByRole("button", { name: "Raportează o problemă" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Bacău" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Închide" }).click();
    await page.getByRole("button", { name: "Raportează o problemă" }).click();

    expect(await page.getByRole("dialog").getByRole("heading", { name: "În ce oraș?" }).isVisible()).toBe(true);
  }, 20_000);

  it("skips the city question on a city's own pages", async () => {
    const page = await neighbour("198.51.100.32");

    await page.goto(`${BASE}/iasi/`);
    await page.getByRole("button", { name: "Raportează o problemă" }).click();

    expect(await page.getByRole("dialog").getByRole("heading", { name: "Ce nu funcționează?" }).isVisible()).toBe(true);
    expect(await page.getByRole("dialog").getByRole("heading", { name: "În ce oraș?" }).count()).toBe(0);
  }, 20_000);

  it("did not log any error in the browser", () => {
    expect([...new Set(errors)]).toEqual([]);
  });
});
