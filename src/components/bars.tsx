import { OUTAGE_THRESHOLD, type Status } from "@/lib/status";

// Minigraficele au scară fixă: un raport rămâne o bară mică, patru umplu bara.
const MINI_SCALE = 4;

const TONE: Record<Status, string | undefined> = { avarie: "hot", raportari: "warm", liniste: undefined };

function barClass(value: number, mini: boolean, tone: Status): string | undefined {
  if (value === 0) {
    return undefined;
  }

  if (mini) {
    return TONE[tone];
  }

  return value >= OUTAGE_THRESHOLD ? "hot" : undefined;
}

// 96 de bare, câte una la 15 minute, cea mai veche în stânga. Graficul e decorativ pentru cititoarele
// de ecran; aceeași informație apare în text lângă el.
export function Bars({ series, mini = false, tone = "liniste" }: { series: readonly number[]; mini?: boolean; tone?: Status }) {
  const peak = mini ? MINI_SCALE : Math.max(...series, 1);

  return (
    <div className={mini ? "bars mini" : "bars"} aria-hidden="true">
      {series.map((value, index) => (
        <i
          // Poziția e identitatea barei: seria are mereu 96 de intervale fixe.
          key={index}
          className={barClass(value, mini, tone)}
          style={{ height: `${Math.round(Math.max(Math.min(value / peak, 1) * 100, 2))}%` }}
        />
      ))}
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
