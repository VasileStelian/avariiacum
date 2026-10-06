export type Noun = {
  one: string;
  many: string;
};

export function joinRo(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join("");
  }

  return `${items.slice(0, -1).join(", ")} și ${items.at(-1)}`;
}

// În română, numeralele de la 20 cer „de” („20 de persoane”), în afară de cele care se termină în 01-19.
export function countRo(count: number, noun: Noun): string {
  if (count === 1) {
    return `1 ${noun.one}`;
  }

  const lastTwo = count % 100;
  const needsDe = count >= 20 && (lastTwo === 0 || lastTwo >= 20);

  return `${count} ${needsDe ? "de " : ""}${noun.many}`;
}

export function timeAgo(then: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);

  if (minutes < 1) {
    return "acum";
  }

  if (minutes < 60) {
    return `acum ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `acum ${hours} h` : `acum ${hours} h ${rest} min`;
}

const CLOCK = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function clockRo(date: Date): string {
  return CLOCK.format(date);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

const REPORTS: Noun = { one: "raport", many: "rapoarte" };

const QUARTER_MS = 15 * 60_000;

// „21:15–21:30: 7 rapoarte”, pentru o bară de 15 minute din grafic.
export function intervalLabel(start: Date, reports: number): string {
  const range = `${clockRo(start)}–${clockRo(new Date(start.getTime() + QUARTER_MS))}`;

  return `${range}: ${reports === 0 ? "niciun raport" : countRo(reports, REPORTS)}`;
}
