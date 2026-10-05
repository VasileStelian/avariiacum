import { describe, expect, it } from "vitest";

import { clientIp } from "./client-ip";

describe("clientIp", () => {
  it("prefers x-real-ip, set by Vercel", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.7", "x-forwarded-for": "203.0.113.1" }))).toBe("198.51.100.7");
  });

  it("falls back to the first address in x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": " 203.0.113.1 , 10.0.0.1" }))).toBe("203.0.113.1");
  });

  it("uses one shared value when no address is known, so the limit still applies", () => {
    expect(clientIp(new Headers())).toBe("necunoscut");
    expect(clientIp(new Headers({ "x-forwarded-for": " , " }))).toBe("necunoscut");
  });
});
