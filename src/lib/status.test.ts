import { describe, expect, it } from "vitest";

import { OUTAGE_THRESHOLD, statusFor } from "./status";

describe("statusFor", () => {
  it("uses the plan's threshold of 3 distinct people in the last hour", () => {
    expect(OUTAGE_THRESHOLD).toBe(3);
  });

  it("is quiet when nobody reported", () => {
    expect(statusFor(0)).toBe("liniste");
  });

  it("shows isolated reports below the threshold", () => {
    expect(statusFor(1)).toBe("raportari");
    expect(statusFor(2)).toBe("raportari");
  });

  it("flags a probable outage from the threshold up", () => {
    expect(statusFor(3)).toBe("avarie");
    expect(statusFor(40)).toBe("avarie");
  });

  it("treats impossible counts as quiet instead of inventing an outage", () => {
    expect(statusFor(-1)).toBe("liniste");
    expect(statusFor(Number.NaN)).toBe("liniste");
  });
});
