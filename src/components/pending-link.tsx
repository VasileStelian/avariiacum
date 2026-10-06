"use client";

import Link, { useLinkStatus } from "next/link";

// Element mereu prezent, fără dimensiune: CSS-ul stilizează linkul-părinte (`a:has(...)`) cât timp
// pagina nouă se încarcă, fără să miște nimic în pagină.
function LinkHint() {
  const { pending } = useLinkStatus();

  return <span className="link-hint" data-pending={pending ? "true" : "false"} aria-hidden="true" />;
}

// Linkurile interne nu preîncarcă (vezi layout.tsx); pe internet lent, asta arată că s-a apăsat.
export function PendingLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link prefetch={false} href={href} className={className}>
      {children}
      <LinkHint />
    </Link>
  );
}
