# Cum contribui

Mulțumim că vrei să ajuți. Avarii Acum e o aplicație civică gratuită; orice reparație, idee sau cartier lipsă contează.

## Înainte de cod

1. **Deschide un issue** sau comentează pe unul existent, ca să ne înțelegem asupra soluției înainte să scrii cod.
2. **Cartier lipsă?** Ajunge un issue cu orașul, numele cartierului și o sursă (Wikipedia, primărie). Nu e nevoie de cod.

## CLA: obligatoriu

Contribuțiile se acceptă doar după ce semnezi [Acordul de licență pentru contribuitori (CLA)](CLA.md). Îți păstrezi drepturile asupra codului tău, dar îi permiți titularului proiectului să-l licențieze și altfel decât AGPL-3.0 (de exemplu comercial), ca proiectul să se poată susține.

La primul tău pull request, un bot te roagă să semnezi. Comentezi exact:

> Am citit CLA-ul si il semnez

O singură dată, pentru toate contribuțiile viitoare. Până nu semnezi, verificarea „CLA” rămâne roșie și PR-ul nu poate fi unit.

## Cum lucrezi

Ai nevoie de Node 24 și Docker. Pașii de pornire sunt în [README](README.md#rulare-locală).

- **Teste întâi.** Orice schimbare vine cu teste: unitare (`npm test`), iar pentru baza de date, pagini sau raportare, cele din `test/db` (`npm run test:db`, cu Supabase local).
- **Înainte de PR:** `npm run check` trebuie să treacă (lint cu regulile anti-slop, tipuri, teste, build).
- **Commit-uri:** `<tip>(avarii): <descriere>`, de exemplu `fix(avarii): textul stării trece contrastul`. Tipuri: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- **Textul din interfață:** română cu diacritice complete (ș și ț cu virgulă), ghilimele „...”, fără liniuțe lungi în propoziții, fără alarmism.
- **Date verificate la sursă.** Numerele furnizorilor și listele de cartiere vin cu sursa (URL) și data verificării, în `src/config/locations.ts`.
- **Nicio cheie sau parolă în cod.** Secretele stau doar în variabilele de mediu.

## Licența

Proiectul e sub [GNU AGPL-3.0](LICENSE). Numele „Avarii Acum” și sigla nu sunt acoperite de licență.
