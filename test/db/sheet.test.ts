// Panoul de jos de pe mobil (#36): tras cu degetul, atingeri simulate prin Chrome DevTools Protocol.
import { type ChildProcess, spawn } from "node:child_process";
import { rmSync } from "node:fs";

import { type Browser, type CDPSession, type Page, chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { localSupabase } from "./local-supabase";

const local = localSupabase();

const PORT = 3126;

const BASE = `http://localhost:${PORT}`;

let server: ChildProcess | undefined;

let browser: Browser;

async function phone(): Promise<{ page: Page; touch: CDPSession }> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();

  return { page, touch: await ctx.newCDPSession(page) };
}

// Trage cu degetul de la (x, y) în jos cu `distance` pixeli, în `steps` pași, la `stepMs` între ei.
async function swipe(touch: CDPSession, x: number, y: number, distance: number, steps: number, stepMs: number): Promise<void> {
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });

  for (let step = 1; step <= steps; step += 1) {
    await new Promise((resolve) => setTimeout(resolve, stepMs));
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + (distance * step) / steps }] });
  }

  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function openPanel(page: Page): Promise<{ x: number; y: number }> {
  await page.goto(`${BASE}/bacau/republicii/`);
  await page.getByRole("button", { name: "Raportează în Republicii" }).click();

  const grab = await page.locator("dialog#raporteaza .grab").boundingBox();

  return { x: (grab?.x ?? 0) + (grab?.width ?? 0) / 2, y: (grab?.y ?? 0) + (grab?.height ?? 0) / 2 };
}

const isOpen = (page: Page): Promise<boolean> => page.locator("dialog#raporteaza").evaluate((dialog: HTMLDialogElement) => dialog.open);

beforeAll(async () => {
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
});

describe("bottom sheet on a phone", () => {
  it("closes when dragged down by the handle", async () => {
    const { page, touch } = await phone();
    const handle = await openPanel(page);

    await swipe(touch, handle.x, handle.y, 320, 12, 16);

    await expect.poll(() => isOpen(page)).toBe(false);
  }, 20_000);

  it("follows the finger and goes back up when let go early", async () => {
    const { page, touch } = await phone();
    const handle = await openPanel(page);

    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [handle] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: handle.x, y: handle.y + 40 }] });
    await new Promise((resolve) => setTimeout(resolve, 150));
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: handle.x, y: handle.y + 80 }] });
    // pe ecran tactil, Chrome livrează mișcările o dată la un cadru de animație
    await new Promise((resolve) => setTimeout(resolve, 100));

    const during = await page.locator("dialog#raporteaza").evaluate((dialog) => new DOMMatrixReadOnly(getComputedStyle(dialog).transform).m42);

    expect(during).toBeGreaterThan(40);

    await new Promise((resolve) => setTimeout(resolve, 300));
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

    expect(await isOpen(page)).toBe(true);
    await expect.poll(() => page.locator("dialog#raporteaza").evaluate((dialog) => new DOMMatrixReadOnly(getComputedStyle(dialog).transform).m42)).toBe(0);
  }, 20_000);

  it("closes when the dimmed page behind it is tapped", async () => {
    const { page } = await phone();

    await openPanel(page);
    await page.touchscreen.tap(195, 60);

    await expect.poll(() => isOpen(page)).toBe(false);
  }, 20_000);

  it("does not close when the form inside is tapped", async () => {
    const { page } = await phone();

    await openPanel(page);
    await page.getByRole("radio", { name: "Gaz", exact: true }).tap();

    expect(await isOpen(page)).toBe(true);
  }, 20_000);
});

describe("dialog on desktop", () => {
  it("is not dragged away by its title", async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    await page.goto(`${BASE}/bacau/republicii/`);
    await page.getByRole("button", { name: "Raportează în Republicii" }).click();

    const title = await page.locator("dialog#raporteaza h2").boundingBox();

    await page.mouse.move((title?.x ?? 0) + 10, (title?.y ?? 0) + 5);
    await page.mouse.down();
    await page.mouse.move((title?.x ?? 0) + 10, (title?.y ?? 0) + 400, { steps: 10 });
    await page.mouse.up();

    expect(await isOpen(page)).toBe(true);
  }, 20_000);
});
