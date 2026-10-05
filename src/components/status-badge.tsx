import type { Status } from "@/lib/status";

import { StatusIcon } from "./icons";

const CLASS: Record<Status, string> = { avarie: "st st-bad", raportari: "st st-warn", liniste: "st st-ok" };

// Starea apare mereu ca iconiță + text (sau număr), niciodată doar prin culoare.
export function StatusBadge({ status, children }: { status: Status; children?: React.ReactNode }) {
  return (
    <span className={CLASS[status]}>
      <StatusIcon status={status} />
      {children}
    </span>
  );
}
