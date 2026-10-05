import {
  Alert02Icon,
  DropletIcon,
  FireIcon,
  FlashIcon,
  HeaterIcon,
  InformationCircleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { ServiceSlug } from "@/config/locations";
import type { Status } from "@/lib/status";

const SERVICE_ICONS = { apa: DropletIcon, curent: FlashIcon, gaz: FireIcon, caldura: HeaterIcon } as const;

const STATUS_ICONS = { avarie: Alert02Icon, raportari: InformationCircleIcon, liniste: Tick02Icon } as const;

export function ServiceIcon({ slug, size = 20 }: { slug: ServiceSlug; size?: number }) {
  return <HugeiconsIcon className="i" icon={SERVICE_ICONS[slug]} size={size} strokeWidth={1.5} aria-hidden="true" />;
}

export function StatusIcon({ status }: { status: Status }) {
  return <HugeiconsIcon className="i" icon={STATUS_ICONS[status]} size={16} strokeWidth={1.8} aria-hidden="true" />;
}
