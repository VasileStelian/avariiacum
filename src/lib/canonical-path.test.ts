import { describe, expect, it } from "vitest";

import { canonicalPath } from "./canonical-path";

describe("canonicalPath", () => {
  it("lowercases addresses typed with capitals", () => {
    expect(canonicalPath("/Bacau/")).toBe("/bacau/");
    expect(canonicalPath("/BACAU/Apa/")).toBe("/bacau/apa/");
    expect(canonicalPath("/bacau/Republicii")).toBe("/bacau/republicii");
  });

  it("leaves canonical addresses alone", () => {
    expect(canonicalPath("/")).toBeNull();
    expect(canonicalPath("/bacau/apa/")).toBeNull();
  });
});
