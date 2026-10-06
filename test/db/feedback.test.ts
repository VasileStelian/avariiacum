// Feedback la clic pe internet lent (issue #29): rețeaua e încetinită artificial în browser.
import { type ChildProcess, spawn } from "node:child_process";
import { rmSync } from "node:fs";

import { type Browser, type BrowserContext, chromium } from "playwright";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { localSupabase } from "./local-supabase";

const local = localSupabase();

const sql = postgres(local.dbUrl, { max: 1, onnotice: () => undefined });

const PORT = 3122;

const BASE = `http://localhost:${PORT}`;

let server: ChildProcess | undefined;

let browser: Browser;

async function context(javaScriptEnabled = true): Promise<BrowserContext> {
  return browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled, extraHTTPHeaders: { "x-real-ip": "198.51.100.77" } });
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

describe("on a slow connection", () => {
  it("marks the tapped neighbourhood link as loading until the page arrives", async () => {
    const ctx = await context();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/bacau/`);
    await page.waitForLoadState("networkidle");

    // Cererea pentru pagina nouă (RSC) întârzie 2 secunde.
    await page.route("**/bacau/republicii/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.getByRole("link", { name: "Republicii", exact: true }).click();

    await expect.poll(() => page.locator('a:has(.link-hint[data-pending="true"])').count(), { timeout: 1000 }).toBe(1);
    await expect.poll(() => page.locator("h1").textContent(), { timeout: 10_000 }).toBe("Republicii, Bacău: avarii acum");
    expect(await page.locator('.link-hint[data-pending="true"]').count()).toBe(0);

    await ctx.close();
  }, 20_000);

  it("shows the report is on its way while the server answers slowly", async () => {
    const ctx = await context();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/bacau/republicii/`);
    await page.waitForLoadState("networkidle");

    // Acțiunea de pe server (POST pe aceeași adresă) întârzie 5 secunde.
    await page.route("**/bacau/republicii/", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      await route.continue();
    });

    await page.getByRole("button", { name: "Raportează în Republicii" }).click();
    await page.getByRole("radio", { name: "Gaz", exact: true }).check();
    await page.getByRole("button", { name: "Trimite raportul" }).click();

    const submit = page.locator('form.report-form button[type="submit"]');

    await expect.poll(() => submit.textContent(), { timeout: 1000 }).toContain("Se trimite");
    expect(await submit.getAttribute("aria-busy")).toBe("true");
    await expect.poll(() => page.getByText("Rețeaua e lentă").isVisible(), { timeout: 6000 }).toBe(true);
    await expect.poll(() => page.getByText("Raport trimis. Mulțumim.").isVisible(), { timeout: 10_000 }).toBe(true);

    await ctx.close();
  }, 25_000);
});

describe("before JavaScript has loaded", () => {
  it("still opens the report panel, and says the form is loading", async () => {
    const ctx = await context(false);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/bacau/republicii/`);
    await page.getByRole("button", { name: "Raportează în Republicii" }).click();

    expect(await page.locator("dialog#raporteaza").evaluate((dialog: HTMLDialogElement) => dialog.open)).toBe(true);

    const submit = page.locator('form.report-form button[type="submit"]');

    expect(await submit.textContent()).toContain("Se încarcă");
    expect(await submit.isDisabled()).toBe(true);

    await ctx.close();
  }, 20_000);
});

describe("pressing", () => {
  it("visibly pushes buttons, tiles and rows while the finger is down", async () => {
    const ctx = await context();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/bacau/`);

    for (const selector of [".report-cta .btn", ".matrix tbody th a"]) {
      const element = page.locator(selector).first();
      const before = await element.evaluate((node) => getComputedStyle(node).transform);
      const box = await element.boundingBox();

      await page.mouse.move((box?.x ?? 0) + 5, (box?.y ?? 0) + 5);
      await page.mouse.down();
      // după tranziția de 80 ms din CSS
      await page.waitForTimeout(150);

      const during = await element.evaluate((node) => getComputedStyle(node).transform);

      // ridicat în altă parte, ca apăsarea să nu devină clic (altfel „Raportează” deschide panoul)
      await page.mouse.move(2, 2);
      await page.mouse.up();

      expect(during, selector).not.toBe(before);
    }

    await ctx.close();
  }, 20_000);
});
