import { describe, expect, it } from "vitest";

import { clockRo, countRo, joinRo, timeAgo } from "./format";

describe("joinRo", () => {
  it("joins Romanian lists with commas and a final „și”", () => {
    expect(joinRo([])).toBe("");
    expect(joinRo(["Nord"])).toBe("Nord");
    expect(joinRo(["Nord", "CFR"])).toBe("Nord și CFR");
    expect(joinRo(["Nord", "CFR", "Centru"])).toBe("Nord, CFR și Centru");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-05T18:00:00Z");
  const minutesBefore = (minutes: number): Date => new Date(now.getTime() - minutes * 60_000);

  it("says „acum” for the last minute", () => {
    expect(timeAgo(minutesBefore(0.5), now)).toBe("acum");
  });

  it("counts minutes under an hour", () => {
    expect(timeAgo(minutesBefore(1), now)).toBe("acum 1 min");
    expect(timeAgo(minutesBefore(4), now)).toBe("acum 4 min");
    expect(timeAgo(minutesBefore(59), now)).toBe("acum 59 min");
  });

  it("uses hours and minutes from one hour up", () => {
    expect(timeAgo(minutesBefore(60), now)).toBe("acum 1 h");
    expect(timeAgo(minutesBefore(110), now)).toBe("acum 1 h 50 min");
    expect(timeAgo(minutesBefore(23 * 60 + 5), now)).toBe("acum 23 h 5 min");
  });

  it("does not show a negative time for a clock slightly ahead", () => {
    expect(timeAgo(new Date(now.getTime() + 30_000), now)).toBe("acum");
  });
});

describe("clockRo", () => {
  it("shows the time in Romania, not in the server's time zone", () => {
    expect(clockRo(new Date("2026-10-05T18:45:00Z"))).toBe("21:45");
    expect(clockRo(new Date("2026-01-15T18:45:00Z"))).toBe("20:45");
  });
});

describe("countRo", () => {
  const people = { one: "persoană", many: "persoane" };

  it("uses the singular for one", () => {
    expect(countRo(1, people)).toBe("1 persoană");
  });

  it("uses the plural without „de” from 2 to 19, and for 0", () => {
    expect(countRo(0, people)).toBe("0 persoane");
    expect(countRo(7, people)).toBe("7 persoane");
    expect(countRo(19, people)).toBe("19 persoane");
  });

  it("adds „de” from 20 on, except when the last two digits are 01 to 19", () => {
    expect(countRo(20, people)).toBe("20 de persoane");
    expect(countRo(45, people)).toBe("45 de persoane");
    expect(countRo(100, people)).toBe("100 de persoane");
    expect(countRo(101, people)).toBe("101 persoane");
    expect(countRo(119, people)).toBe("119 persoane");
    expect(countRo(120, people)).toBe("120 de persoane");
  });
});
