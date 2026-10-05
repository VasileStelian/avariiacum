// Pragul din plan: „Probabil avarie” doar la cel puțin 3 persoane distincte în ultima oră.
export const OUTAGE_THRESHOLD = 3;

export type Status = "liniste" | "raportari" | "avarie";

export function statusFor(reportersLastHour: number): Status {
  if (reportersLastHour >= OUTAGE_THRESHOLD) {
    return "avarie";
  }

  return reportersLastHour >= 1 ? "raportari" : "liniste";
}
