# Avarii Acum: planul versiunii 1

Decis cu Vasile pe 5 octombrie 2026, după un interviu de 12 întrebări. Ce e aici e **decis**; nu se redeschide fără motiv nou. Ce e marcat **DE VERIFICAT** nu se scrie din memorie, se caută la sursă. Strategia, datele de căutare și planul de lansare stau în `docs/private/` (local, nu intră în repo).

## Ce este

Un Downdetector gratuit pentru utilități, pe cartiere. Omul alege cartierul, raportează ce nu are (apă, curent, gaz, apă caldă și căldură) și vede un grafic pe 24 de ore. Fără conturi, fără plăți.

Povestea: în Bacău rămân des cartiere fără apă. Vasile e din IT, știe Downdetector, a vrut același lucru pentru utilitățile orașului.

## Deciziile

| Subiect | Decizie | De ce |
|---|---|---|
| Stack | **Next.js (App Router, randat pe server) + Supabase (Postgres) + Vercel** | HTML complet pentru Google și asistenții AI; backend minim |
| Orașe | **Bacău + Iași** din prima zi | Iași are de ~5 ori mai multe căutări pentru avarii |
| Adrese | `/bacau/`, `/bacau/republicii/`, `/bacau/apa/` | Scop național mai târziu, fără mutări de URL |
| Zone | **Listă fixă de cartiere** + link „Lipsește cartierul tău? Spune-ne” | Destui oameni pe zonă cât să iasă grafic; harta vine mai târziu |
| Servicii | **Apă, Curent, Gaz, Apă caldă și căldură (CET)** | CET = termoficare (Thermoenergy Bacău, Veolia Iași); sezonul începe în octombrie |
| Conturi | **Niciunul**, raportare anonimă | Nimeni nu-și face cont ca să spună că nu are apă |
| Anti-abuz | 1 raport per (serviciu, cartier) la 2 ore per dispozitiv/IP; IP salvat doar ca hash HMAC; **alertă doar la ≥3 raportori distincți în ultima oră** | Un troll singur nu poate declanșa nimic |
| Turnstile | Pregătit în cod, **oprit** (flag) | Se pornește doar dacă apar abuzuri |
| Sfârșitul avariei | **Se stinge singură**: fără buton „A revenit” | Tăcerea e semnalul; nimic de manipulat |
| Grafic | Ultimele 24h, intervale de 15 minute; „ultimul raport acum X min” | Ca Downdetector |
| Actualizare | Pagini în cache (ISR) cu revalidare la **60 s** + revalidare la raport nou; fără realtime | Downdetector nu are nevoie de websocket |
| Bază de date | **Supabase free + Vercel Cron zilnic** | Supabase pune pe pauză proiectele free după 7 zile fără interogări; cron-ul zilnic le ține vii |
| Domeniu | **avariiacum.ro** (îl cumpără Vasile înainte de lansare) | Liber la 5 oct 2026; nume național, orașul stă în URL |
| Design | **Stitch** (MCP `mcp__stitch`), 5 machete; aprobate 5 oct 2026, apoi o trecere anti-slop | Vezi `design/DESIGN.md` |
| Iconițe | **Hugeicons** (`@hugeicons/core-free-icons`); căldura = calorifer (`HeaterIcon`) | Are calorifer; Tabler și Material Symbols nu au |
| Partajare | Buton „Trimite linkul vecinilor” pe „Mulțumim” (partajarea nativă a telefonului, fără urmărire) | Adăugat la machete, aprobat de Vasile |
| Lint | **install-anti-slop** (reguli oxlint) din primul commit al proiectului Next.js | Cerut de Vasile, 5 oct 2026 |
| Reclame | „Susținut de” + un card pe ecranul „Mulțumim”, **oprite** până la 2-4 săptămâni după lansare | La lansare, unealta e doar civică |
| Cod | **GitHub public, AGPL-3.0**; numele „Avarii Acum” și sigla **nu** intră în licență | Credit garantat, nicio clonă comercială închisă |

### Fapte verificate (5 oct 2026)

- Supabase Free: proiectul se pune pe pauză după 7 zile cu activitate scăzută. Sursa: supabase.com/docs/guides/platform/free-project-pausing
- Vercel Hobby: cron permis, **o dată pe zi**, precizie ±59 min, până la 100 de joburi. Sursa: vercel.com/docs/cron-jobs/usage-and-pricing
- Nu folosi GitHub Actions ca ping de rezervă: workflow-urile programate se dezactivează după 60 de zile fără activitate în repo.

## Cartierele

**Bacău (12)**: Centru, Republicii, Nord, CFR, Cornișa, Izvoare, Mioriței, George Bacovia, Bistrița-Lac, Gherăiești, Șerbănești, Orizont.
Sursa: ro.wikipedia.org/wiki/Listă_de_cartiere_din_Bacău (10) + storia.ro, articolul „cele mai bune cartiere din Bacău” (Nord, Orizont). OpenStreetMap nu are cartierele marcate.

**Iași**: **DE VERIFICAT**. Se caută lista cu sursă (Wikipedia, primărie), nu din memorie.

Slug-uri fără diacritice: `bistrita-lac`, `george-bacovia`, `serbanesti`, `gheraiesti`, `mioritei`, `cornisa`. Un singur loc de adevăr pentru orașe, cartiere și servicii (un fișier de configurare), din care se generează toate paginile.

## Furnizorii și numerele de avarii

**DE VERIFICAT la sursa oficială** înainte de lansare, cu data verificării scrisă lângă număr:

| Serviciu | Bacău | Iași |
|---|---|---|
| Apă | CRAB, Compania Regională de Apă Bacău (apabacau.ro) | ApaVital |
| Curent | Delgaz Grid | Delgaz Grid |
| Gaz | Delgaz Grid | Delgaz Grid |
| Apă caldă și căldură (CET) | Thermoenergy | Veolia Energie Iași |

Pe fiecare pagină de serviciu: „Nu suntem [furnizor]. Pentru avarii, sună la: [număr]”. Numele furnizorului poate apărea descriptiv în titlu (ex. „Apă Bacău acum: avarii CRAB raportate pe cartiere”), dar pagina nu trebuie să pară site-ul lor oficial.

## Paginile versiunii 1

| Ruta | Conținut | Căutarea țintă |
|---|---|---|
| `/` | „Avarii acum în România”, lista orașelor | brand |
| `/[oras]/` | Panoul orașului: cartiere × servicii, starea fiecăruia, grafic 24h, buton mare „Raportează” | „apa bacau”, „apavital iasi” |
| `/[oras]/[serviciu]/` | Un serviciu pe tot orașul, cartierele afectate, numărul oficial de avarii | „crab bacau”, „avarie apa bacau”, „intrerupere apa iasi”, „thermoenergy bacau” |
| `/[oras]/[cartier]/` | Un cartier, cele 4 servicii, grafice, raportare | „apa republicii bacau” |
| `/despre/` | Cum funcționează pragul, cine a făcut aplicația (Fanvora Digital Studio, link), contact | — |
| `/confidentialitate/` | Ce se păstrează: cartier, serviciu, oră. Hash-ul de IP se șterge după 24h. Fără cookie-uri de urmărire | — |

**Raportarea**: panou care urcă de jos (bottom sheet). Cartier → serviciu → trimite → „Mulțumim” (aici stă cardul de reclamă, oprit).

Rutele `[serviciu]` și `[cartier]` stau la același nivel sub `[oras]`: slug-urile serviciilor (`apa`, `curent`, `gaz`, `caldura`) nu au voie să coincidă cu un slug de cartier. Un test verifică asta.

Fiecare pagină: titlu și descriere unice, H1 unic, canonical, date structurate unde au sens, sitemap.xml, robots.txt, `lang="ro"`. Conținutul trebuie să fie în HTML-ul brut (verificare: `curl` fără JavaScript arată textul).

## Modelul de date (propunere, se rafinează la implementare)

```sql
create table reports (
  id bigint generated always as identity primary key,
  city text not null,
  zone text not null,
  service text not null check (service in ('apa','curent','gaz','caldura')),
  created_at timestamptz not null default now(),
  ip_hash text            -- HMAC(IP, secret); se face null după 24h de cron
);
create index on reports (city, zone, service, created_at desc);
```

- **Toate citirile și scrierile pe server** (Server Components, Server Actions / Route Handlers) cu cheia de serviciu. Clientul nu primește nicio cheie Supabase. RLS activ, fără politici pentru `anon`.
- **Limita de 2 ore** se verifică pe server înainte de insert (același `ip_hash` + oraș + cartier + serviciu în ultimele 2h → refuz politicos, fără eroare urâtă).
- **Alerta**: `count(distinct ip_hash)` în ultimele 60 de minute ≥ 3, per (oraș, cartier, serviciu).
- **Graficul**: rapoarte grupate pe intervale de 15 minute, ultimele 24h.
- Oraș, cartier și serviciu se validează contra configurației, nu doar contra constrângerii din DB.

## Cron (Vercel, zilnic)

`/api/cron/curatenie`, protejat cu `CRON_SECRET` (Vercel trimite `Authorization: Bearer <CRON_SECRET>`):
1. `update reports set ip_hash = null where created_at < now() - interval '24 hours'`
2. Asta e și interogarea care ține Supabase activ.

Rapoartele rămân pentru istoric (subiecte de presă).

## Design (Stitch)

5 machete: panoul orașului, pagina de serviciu, pagina de cartier, panoul de raportare (+ ecranul „Mulțumim”), „Despre”. Mobil întâi: oamenii raportează de pe telefon, din bucătărie, cu robinetul deschis.

Codul HTML se extrage direct prin `mcp__stitch` (get_screen). Dacă nu merge, Vasile dă copy-paste din Stitch.

Ton: calm, pe date, fără alarmism (fără roșu intermitent, fără „ALERTĂ!”). Culorile de stare trebuie să treacă contrastul WCAG AA și să nu depindă doar de culoare (text + iconiță).

## Reclame (oprite la lansare)

- Un spațiu „Susținut de” și un card pe ecranul „Mulțumim”, dintr-o listă în configurare.
- Linkurile au `rel="sponsored noopener"`.
- Un flag de configurare le pornește. Nicio rețea de reclame terță (fără AdSense: cookie-uri, consimțământ, viteză).

## Licența

- `LICENSE`: AGPL-3.0.
- README: „Numele «Avarii Acum» și sigla nu sunt acoperite de licență.”
- Secretele doar în variabilele de mediu Vercel. `.env*` în `.gitignore` din primul commit.

## Backlog

Urmărit în issue-uri GitHub: https://github.com/VasileStelian/avariiacum/issues

- #1 Lista cartierelor din Iași, cu sursă (P1)
- #2 Numerele de avarii ale furnizorilor, verificate la sursă (P1)
- #3 Harta orașului cu zone pe care se poate da clic
- #4 Pornirea Cloudflare Turnstile, dacă apar abuzuri
- #5 Alte orașe
- #6 Pornirea spațiului „Susținut de”
- #7 Buton „A revenit”, doar dacă îl cer utilizatorii
