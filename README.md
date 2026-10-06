# Avarii Acum

Downdetector pentru apă, curent, gaz, apă caldă și căldură, pe cartiere. Locuitorii raportează anonim ce nu funcționează; când cel puțin 3 persoane diferite din același cartier raportează în aceeași oră, pagina afișează „Probabil avarie”. Starea dispare singură când rapoartele se opresc.

**Online:** https://avariiacum.ro (Bacău, Iași și Galați)

## Cum funcționează

- Fără cont. Se salvează doar orașul, cartierul, serviciul și ora; adresa IP devine o amprentă HMAC, ștearsă în cel mult 48 de ore.
- Același dispozitiv poate raporta același serviciu în același cartier o dată la 2 ore (verificat atomic în baza de date).
- Paginile sunt randate pe server și puse în cache 60 de secunde; un raport nou le regenerează imediat. Conținutul e în HTML, fără JavaScript.
- Pe fiecare pagină de serviciu e numărul de avarii al furnizorului, verificat pe site-ul oficial (sursa și data sunt afișate).

## Rulare locală

Ai nevoie de Node 24 și Docker.

```bash
npm ci
npm run db:start                 # Supabase local, în Docker
npx supabase status -o env       # URL-ul și cheia secretă locale
cp .env.example .env.local       # completează SUPABASE_URL, SUPABASE_SECRET_KEY, IP_HASH_SECRET, CRON_SECRET
npm run dev
```

## Teste

```bash
npm run check     # lint (oxlint + anti-slop), typecheck, teste unitare, build, test pe HTML-ul servit
npm run test:db   # după npm run build: baza de date, paginile și fluxul de raportare în Chromium (Supabase local)
```

## Unde sunt lucrurile

- `src/config/locations.ts`: orașele, cartierele, serviciile și furnizorii, cu sursele datelor.
- `supabase/migrations/`: tabelul de rapoarte și funcțiile SQL (RLS activ, nimic accesibil din browser).
- `design/`: sistemul de design și machetele.
- `docs/PLAN.md`: deciziile; `docs/JURNAL.md`: cum a fost construită aplicația, pas cu pas.

## Contribuții

Contribuțiile sunt binevenite, cu [CLA](CLA.md) semnat (un comentariu la primul pull request). Pașii și regulile sunt în [CONTRIBUTING.md](CONTRIBUTING.md).

## Ce nu este

Avarii Acum nu este furnizorul de apă, curent, gaz sau căldură și nu primește date de la furnizori. Pentru avarii, sunați la furnizor.

## Licența

Codul e publicat sub [GNU AGPL-3.0](LICENSE). Numele „Avarii Acum” și sigla nu sunt acoperite de licență. Fonturile (Public Sans, Atkinson Hyperlegible Next) sunt sub SIL Open Font License; licențele sunt lângă fișiere.

Făcut de [Fanvora Digital Studio](https://fanvora.ro), Bacău.
