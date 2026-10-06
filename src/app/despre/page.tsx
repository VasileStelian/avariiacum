import type { Metadata } from "next";
import { PendingLink } from "@/components/pending-link";

import { StatusBadge } from "@/components/status-badge";
import { CITIES } from "@/config/locations";
import { OUTAGE_THRESHOLD } from "@/lib/status";

export const metadata: Metadata = {
  title: "Despre Avarii Acum: cum funcționează și cine l-a făcut",
  description: "O aplicație născută din povestea unui băcăuan rămas fără apă: vecinii spun pe cartiere ce nu funcționează. Gratuit, fără cont.",
  alternates: { canonical: "/despre/" },
};

export default function AboutPage() {
  return (
    <main className="page">
      <article className="doc">
        <div className="head">
          <h1>Despre Avarii Acum</h1>
          <p className="lead">{`Un loc unde vecinii spun ce nu funcționează: apă, curent, gaz, apă caldă și căldură. Gratuit, fără cont, pe cartiere. Începem cu ${CITIES.map((city) => city.name).join(" și ")}.`}</p>
        </div>
        <section className="stack">
          <h2>O aplicație născută din povestea unui băcăuan</h2>
          <p>
            Ideea a pornit de la un băcăuan care tocmai se mutase în chirie. După vreo săptămână, a dat drumul la robinet și apa abia curgea. Prima întrebare a fost: e doar la mine sau e iar
            problemă cu apa în Bacău? Proprietarul nu știa, iar vecinii nu-i cunoștea încă.
          </p>
          <p>
            Răspunsul l-a aflat abia după-amiaza, la o plimbare prin oraș. În zona Narcisa erau puse pe stradă rezervoare mari cu apă, iar oamenii veneau cu găleți și bidoane să care apa acasă.
            Abia atunci s-a prins că nu era țeava lui.
          </p>
          <p>În Bacău, „are cineva apă?” e aproape un salut. Avarii Acum e locul pentru întrebarea asta, ca să nu mai afli de la rezervoarele din stradă.</p>
        </section>
        <section className="stack">
          <h2>Cum funcționează</h2>
          <p>Alegi cartierul și serviciul care lipsește. Durează câteva secunde.</p>
          <p>{`Când cel puțin ${OUTAGE_THRESHOLD} persoane diferite raportează același lucru în aceeași oră, afișăm „Probabil avarie”. Un singur raport nu schimbă nimic pentru ceilalți.`}</p>
          <p>Nu există buton „A revenit”. Când rapoartele se opresc, starea dispare singură.</p>
        </section>
        <section className="stack">
          <h2>Ce înseamnă stările</h2>
          <p>
            <StatusBadge status="avarie">Probabil avarie</StatusBadge> {`cel puțin ${OUTAGE_THRESHOLD} persoane diferite în ultima oră`}
          </p>
          <p>
            <StatusBadge status="raportari">Raportări izolate</StatusBadge> 1 sau 2 persoane, sub prag
          </p>
          <p>
            <StatusBadge status="liniste">Fără raportări</StatusBadge> nimeni nu a raportat în ultima oră
          </p>
        </section>
        <section className="stack">
          <h2>Ce nu suntem</h2>
          <p>Nu suntem CRAB, ApaVital, Delgaz Grid, Thermoenergy sau Termo-Service și nu primim date de la ei. Pentru avarii, sună la furnizor; numărul e pe pagina fiecărui serviciu.</p>
        </section>
        <section className="stack">
          <h2>Ce păstrăm</h2>
          <p>
            Cartierul, serviciul și ora. Adresa IP nu o salvăm; păstrăm doar o amprentă criptată, ca să nu se poată raporta de mai multe ori, ștearsă în cel mult 48 de ore. Fără cookie-uri de urmărire.{" "}
            <PendingLink href="/confidentialitate/">
              Detalii despre confidențialitate
            </PendingLink>
          </p>
        </section>
        <section className="stack">
          <h2>Cine a făcut aplicația</h2>
          <p>
            <a href="https://fanvora.ro">Fanvora Digital Studio</a>, din Bacău. Codul e public pe <a href="https://github.com/VasileStelian/avariiacum">GitHub</a>, sub licența AGPL-3.0.
          </p>
        </section>
        <section className="stack">
          <h2>Lipsește cartierul tău?</h2>
          <p>
            Scrie-ne la <a href="mailto:contact@fanvora.ro?subject=Avarii%20Acum%3A%20cartier%20lips%C4%83">contact@fanvora.ro</a> cu orașul și numele cartierului, și îl adăugăm.
          </p>
        </section>
      </article>
    </main>
  );
}
