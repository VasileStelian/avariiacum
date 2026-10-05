import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("home page", () => {
  const html = renderToStaticMarkup(<Home />);

  it("has a single h1 for the whole country", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Avarii acum în România");
  });

  // Bara finală o adaugă Next la build (trailingSlash); o verifică test/smoke.test.ts pe HTML-ul real.
  it("links every configured city to its page", () => {
    expect(html).toMatch(/href="\/bacau\/?"/);
    expect(html).toContain(">Bacău<");
  });

  it("says how many neighbourhoods each city covers", () => {
    expect(html).toContain("12 cartiere");
  });
});
