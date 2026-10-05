import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confidențialitate: ce date păstrează Avarii Acum",
  description: "Ce păstrăm când raportezi o avarie, cât timp, ce rămâne doar pe dispozitivul tău și ce nu facem cu datele.",
  alternates: { canonical: "/confidentialitate/" },
};

export default function PrivacyPage() {
  return (
    <main className="page">
      <article className="doc">
        <div className="head">
          <h1>Confidențialitate</h1>
          <p className="lead">Avarii Acum funcționează fără cont și fără să știe cine ești. Aici e tot ce păstrăm.</p>
          <p className="small muted">Actualizat pe 5 octombrie 2026.</p>
        </div>
        <section className="stack">
          <h2>Când raportezi</h2>
          <p>Salvăm orașul, cartierul, serviciul (apă, curent, gaz sau căldură) și ora raportului. Nu cerem nume, telefon, e-mail sau locație.</p>
        </section>
        <section className="stack">
          <h2>Adresa IP</h2>
          <p>
            Nu salvăm adresa IP. Din ea calculăm o amprentă criptată (HMAC-SHA256, cu o cheie secretă), care ne lasă să verificăm două lucruri: că același dispozitiv nu raportează același serviciu mai des de o dată la 2 ore și că „Probabil avarie” vine de la persoane diferite. Din amprentă nu se poate afla adresa.
          </p>
          <p>Amprenta e ștearsă de o curățenie automată zilnică, pentru rapoartele mai vechi de 24 de ore, deci în cel mult 48 de ore de la raport. Rapoartele rămân fără ea, pentru istoric și statistici pe cartiere.</p>
        </section>
        <section className="stack">
          <h2>Ce rămâne pe dispozitivul tău</h2>
          <p>Cartierul ales ultima dată, ca să nu-l alegi din nou la raportul următor. Stă în memoria locală a browserului, pe dispozitivul tău, și nu ne e trimis decât în raportul pe care îl faci. Îl ștergi din setările browserului (datele site-ului).</p>
        </section>
        <section className="stack">
          <h2>Cookie-uri</h2>
          <p>Nu folosim cookie-uri de urmărire, de analiză sau de reclame.</p>
        </section>
        <section className="stack">
          <h2>Unde stau datele</h2>
          <p>Aplicația rulează pe Vercel (servere în Dublin, Irlanda), iar baza de date e la Supabase (Irlanda). Ca orice site, furnizorul de găzduire poate păstra jurnale tehnice ale cererilor, după propria politică.</p>
          <p>Nu vindem și nu dăm datele nimănui. Furnizorii de utilități nu primesc nimic de la noi.</p>
        </section>
        <section className="stack">
          <h2>Contact</h2>
          <p>
            Întrebări despre date: <a href="mailto:contact@fanvora.ro?subject=Avarii%20Acum%3A%20confiden%C8%9Bialitate">contact@fanvora.ro</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
