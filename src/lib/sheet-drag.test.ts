import { describe, expect, it } from "vitest";

import { shouldDismiss } from "./sheet-drag";

describe("shouldDismiss", () => {
  const height = 600;

  it("closes when dragged down more than 30% of the sheet", () => {
    expect(shouldDismiss(190, height, 0.1)).toBe(true);
    expect(shouldDismiss(170, height, 0.1)).toBe(false);
  });

  it("closes on a quick downward flick, even over a short distance", () => {
    expect(shouldDismiss(60, height, 0.8)).toBe(true);
  });

  it("does not close on a tiny accidental flick", () => {
    expect(shouldDismiss(12, height, 1.5)).toBe(false);
  });

  it("never closes when dragged up", () => {
    expect(shouldDismiss(-200, height, -2)).toBe(false);
  });
});
