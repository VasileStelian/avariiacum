import { describe, expect, it } from "vitest";

import { hashIp } from "./ip-hash";

const SECRET = "test-secret-with-enough-length-32b";

describe("hashIp", () => {
  it("returns 64 lowercase hex characters (HMAC-SHA256)", () => {
    expect(hashIp("192.0.2.10", SECRET)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable for the same IP and secret, so the 2-hour limit can match", () => {
    expect(hashIp("192.0.2.10", SECRET)).toBe(hashIp("192.0.2.10", SECRET));
  });

  it("differs between IPs and between secrets", () => {
    expect(hashIp("192.0.2.10", SECRET)).not.toBe(hashIp("192.0.2.11", SECRET));
    expect(hashIp("192.0.2.10", SECRET)).not.toBe(hashIp("192.0.2.10", `${SECRET}x`));
  });

  it("refuses a short secret, which would make the hash easy to reverse for IPv4", () => {
    expect(() => hashIp("192.0.2.10", "scurt")).toThrow(/IP_HASH_SECRET/);
  });
});
