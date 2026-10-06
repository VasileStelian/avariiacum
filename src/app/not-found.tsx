import { PendingLink } from "@/components/pending-link";

import { CITIES } from "@/config/locations";

export default function NotFound() {
  return (
    <main className="page">
      <div className="head">
        <h1>Pagina nu există</h1>
        <p className="lead">Poate adresa are o greșeală, sau cartierul nu e încă în listă.</p>
      </div>
      <nav className="inline-links" aria-label="Unde poți merge">
        <PendingLink href="/">
          Pagina principală
        </PendingLink>
        {CITIES.map((city) => (
          <PendingLink key={city.slug} href={`/${city.slug}/`}>
            {`Avarii în ${city.name}`}
          </PendingLink>
        ))}
        <a href="mailto:contact@fanvora.ro?subject=Avarii%20Acum%3A%20cartier%20lips%C4%83">Lipsește cartierul tău? Scrie-ne</a>
      </nav>
    </main>
  );
}
