"use client";

// Apare când datele nu pot fi citite (de exemplu, baza de date nu răspunde).
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page">
      <div className="head">
        <h1>Nu putem afișa datele acum</h1>
        <p className="lead">Încearcă din nou peste un minut. Pentru o avarie urgentă, sună direct la furnizor.</p>
      </div>
      <p>
        <button type="button" className="btn" onClick={reset}>
          Încearcă din nou
        </button>
      </p>
    </main>
  );
}
