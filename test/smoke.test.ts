// Verifică HTML-ul real, servit de `next start` după `next build`, fără să ruleze JavaScript:
// conținutul trebuie să fie în HTML pentru Google, asistenții AI și telefoanele lente.
import { type ChildProcess, spawn } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PORT = 3107;

const BASE = `http://localhost:${PORT}`;

let server: ChildProcess;

async function waitForServer(deadline: number): Promise<void> {
  while (Date.now() < deadline) {
    try {
      await fetch(BASE);

      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw new Error(`next start did not answer on ${BASE}; did you run npm run build?`);
}

beforeAll(async () => {
  server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore" });
  await waitForServer(Date.now() + 20_000);
}, 25_000);

afterAll(() => {
  server.kill();
});

describe("home page HTML", () => {
  it("is served in Romanian with the content already rendered", async () => {
    const response = await fetch(`${BASE}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="ro"');
    expect(html).toContain("Avarii acum în România");
    expect(html).toContain("12 cartiere");
  });

  it("links cities with the trailing slash used by every URL in the plan", async () => {
    const html = await (await fetch(`${BASE}/`)).text();

    expect(html).toContain('href="/bacau/"');
  });

  it("has a title and a description for search results", async () => {
    const html = await (await fetch(`${BASE}/`)).text();

    expect(html).toMatch(/<title>Avarii Acum: [^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]{50,}"/);
  });
});

describe("cron endpoint", () => {
  it("refuses a request without the cron secret", async () => {
    const response = await fetch(`${BASE}/api/cron/curatenie/`);

    expect([401, 500]).toContain(response.status);
  });
});
