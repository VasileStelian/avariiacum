"use client";

import { useRef, useState } from "react";

import { intervalLabel } from "@/lib/format";
import { OUTAGE_THRESHOLD, type Status } from "@/lib/status";

// Începutul intervalului (text ISO, ca să treacă de la server la browser) și câte rapoarte au fost.
export type ChartPoint = {
  start: string;
  reports: number;
};

// Minigraficele au scară de minim 4: un raport rămâne o bară mică, dar la o avarie mare scara urcă
// după vârf, ca să se vadă cum a crescut (înainte, toate barele ajungeau pline).
const MINI_FLOOR = 4;

const TONE: Record<Status, string | undefined> = { avarie: "hot", raportari: "warm", liniste: undefined };

function barClass(reports: number, mini: boolean, tone: Status, active: boolean): string | undefined {
  const base = reports === 0 ? undefined : mini ? TONE[tone] : reports >= OUTAGE_THRESHOLD ? "hot" : undefined;

  return active ? [base, "on"].filter(Boolean).join(" ") : base;
}

// 96 de bare, câte una la 15 minute, cea mai veche în stânga. Hover (mouse), tap (atingere) sau
// săgețile (tastatură) arată intervalul și numărul de rapoarte.
export function Bars({ series, mini = false, tone = "liniste" }: { series: readonly ChartPoint[]; mini?: boolean; tone?: Status }) {
  const area = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const values = series.map((point) => point.reports);
  const peak = mini ? Math.max(MINI_FLOOR, ...values) : Math.max(1, ...values);
  const point = active === null ? undefined : series[active];
  const label = point ? intervalLabel(new Date(point.start), point.reports) : null;
  const position = active === null ? 0 : ((active + 0.5) / series.length) * 100;

  function pick(clientX: number): void {
    const rect = area.current?.getBoundingClientRect();

    if (!rect || rect.width === 0) {
      return;
    }

    setActive(Math.min(series.length - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * series.length))));
  }

  function move(key: string): void {
    const last = series.length - 1;
    const current = active ?? last;
    const next = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: last }[key];

    if (key === "Escape") {
      setActive(null);
    } else if (next !== undefined) {
      setActive(Math.min(last, Math.max(0, active === null ? last : next)));
    }
  }

  return (
    <div className="chart-area">
      <div
        ref={area}
        className={mini ? "bars mini" : "bars"}
        role="group"
        tabIndex={0}
        aria-label="Rapoarte pe intervale de 15 minute, ultimele 24 de ore. Folosește săgețile stânga și dreapta ca să afli fiecare interval."
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") {
            pick(event.clientX);
          }
        }}
        onPointerDown={(event) => pick(event.clientX)}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            setActive(null);
          }
        }}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) {
            event.preventDefault();
            move(event.key);
          }
        }}
      >
        {series.map((entry, index) => (
          <i
            key={entry.start}
            aria-hidden="true"
            className={barClass(entry.reports, mini, tone, index === active)}
            style={{ height: `${Math.round(Math.max(Math.min(entry.reports / peak, 1) * 100, 2))}%` }}
          />
        ))}
      </div>
      <p className="chart-tip" hidden={label === null} aria-hidden="true" style={{ left: `${position}%`, transform: `translateX(-${position}%)` }}>
        {label}
      </p>
      <span className="sr" aria-live="polite">
        {label ?? ""}
      </span>
    </div>
  );
}

export function Axis({ middle }: { middle?: string }) {
  return middle ? (
    <div className="axis">
      <span>-24h</span>
      <span>{middle}</span>
      <b>acum</b>
    </div>
  ) : (
    <div className="axis">
      <span>-24h</span>
      <span>-18h</span>
      <span>-12h</span>
      <span>-6h</span>
      <b>acum</b>
    </div>
  );
}
