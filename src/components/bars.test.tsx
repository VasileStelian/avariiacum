import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Bars } from "./bars";

const START = new Date("2026-10-05T18:00:00Z").getTime();

function points(values: number[]): { start: string; reports: number }[] {
  return values.map((reports, index) => ({ start: new Date(START + index * 15 * 60_000).toISOString(), reports }));
}

function heights(html: string): string[] {
  return [...html.matchAll(/height:(\d+)%/g)].map((match) => match[1] ?? "");
}

describe("Bars", () => {
  it("scales the city chart to its own peak", () => {
    const html = renderToStaticMarkup(<Bars series={points([0, 5, 10])} />);

    expect(heights(html)).toEqual(["2", "50", "100"]);
  });

  it("keeps one report small on mini charts, but follows a big outage instead of filling every bar", () => {
    expect(heights(renderToStaticMarkup(<Bars series={points([0, 1])} mini tone="avarie" />))).toEqual(["2", "25"]);
    expect(heights(renderToStaticMarkup(<Bars series={points([0, 1, 8])} mini tone="avarie" />))).toEqual(["2", "13", "100"]);
  });

  it("colours mini bars with the service status, not with the bucket count", () => {
    expect(renderToStaticMarkup(<Bars series={points([0, 1])} mini tone="avarie" />)).toContain('class="hot"');
    expect(renderToStaticMarkup(<Bars series={points([0, 1])} mini tone="raportari" />)).toContain('class="warm"');
    expect(renderToStaticMarkup(<Bars series={points([0, 1])} mini tone="liniste" />)).not.toMatch(/class="(hot|warm)"/);
  });

  it("marks city chart buckets with at least 3 reports", () => {
    const html = renderToStaticMarkup(<Bars series={points([2, 3])} />);

    expect(html.match(/class="hot"/g)).toHaveLength(1);
  });

  it("can be focused and explains how to explore it", () => {
    const html = renderToStaticMarkup(<Bars series={points([0, 1])} />);

    expect(html).toContain('tabindex="0"');
    expect(html).toContain("săgețile");
  });
});
