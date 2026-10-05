import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Bars } from "./bars";

function heights(html: string): string[] {
  return [...html.matchAll(/height:(\d+)%/g)].map((match) => match[1] ?? "");
}

describe("Bars", () => {
  it("scales the city chart to its own peak", () => {
    const html = renderToStaticMarkup(<Bars series={[0, 5, 10]} />);

    expect(heights(html)).toEqual(["2", "50", "100"]);
  });

  it("uses a fixed scale on mini charts, so one report stays small and four fill the bar", () => {
    const html = renderToStaticMarkup(<Bars series={[0, 1, 4, 9]} mini tone="avarie" />);

    expect(heights(html)).toEqual(["2", "25", "100", "100"]);
  });

  it("colours mini bars with the service status, not with the bucket count", () => {
    expect(renderToStaticMarkup(<Bars series={[0, 1]} mini tone="avarie" />)).toContain('class="hot"');
    expect(renderToStaticMarkup(<Bars series={[0, 1]} mini tone="raportari" />)).toContain('class="warm"');
    expect(renderToStaticMarkup(<Bars series={[0, 1]} mini tone="liniste" />)).not.toMatch(/class="(hot|warm)"/);
  });

  it("marks city chart buckets with at least 3 reports", () => {
    const html = renderToStaticMarkup(<Bars series={[2, 3]} />);

    expect(html.match(/class="hot"/g)).toHaveLength(1);
  });
});
