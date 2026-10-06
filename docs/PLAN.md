# Avarii Acum: planul versiunii 1

Decis cu Vasile pe 5 octombrie 2026, după un interviu de 12 întrebări. Ce e aici e **decis**; nu se redeschide fără motiv nou. Ce e marcat **DE VERIFICAT** nu se scrie din memorie, se caută la sursă. Strategia, datele de căutare și planul de lansare stau în `docs/private/` (local, nu intră în repo).

## Ce este

Un Downdetector gratuit pentru utilități, pe cartiere. Omul alege cartierul, raportează ce nu are (apă, curent, gaz, apă caldă și căldură) și vede un grafic pe 24 de ore. Fără conturi, fără plăți.

Povestea: în Bacău rămân des cartiere fără apă. Vasile e din IT, știe Downdetector, a vrut același lucru pentru utilitățile orașului.

## Deciziile

| Subiect | Decizie | De ce |
|---|---|---|
| Stack | **Next.js (App Router, randat pe server) + Supabase (Postgres) + Vercel** | HTML complet pentru Google și asistenții AI; backend minim |
| Orașe | **Bacău + Iași** din prima zi; **Galați** din 6 oct 2026 (#46), apoi restul Moldovei (#44) | Iași are de ~5 ori mai multe căutări pentru avarii; Galați, cel mai mare oraș din Moldova fără pagină, are probleme repetate cu apa |
| Adrese | `/bacau/`, `/bacau/republicii/`, `/bacau/apa/` | Scop național mai târziu, fără mutări de URL |
| Zone | **Listă fixă de cartiere** + link „Lipsește cartierul tău? Spune-ne” | Destui oameni pe zonă cât să iasă grafic; harta vine mai târziu |
| Servicii | **Apă, Curent, Gaz, Apă caldă și căldură (CET)** | CET = termoficare (Thermoenergy Bacău, Termo-Service Iași); sezonul începe în octombrie |
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

**Iași (22)**: Alexandru cel Bun, Aviației, Bucium, Bularga, Canta, Cantemir, Centru, Copou, CUG, Dacia, Frumoasa, Galata, Mircea cel Bătrân, Moara de Vânt, Nicolina, Păcurari, Podu Roș, Sărărie, Socola, Tătărași, Tudor Vladimirescu, Țicău.
Nu există o listă oficială; sursele diferă (Wikipedia spune că limitele „nu sunt stabilite clar”). Am păstrat cartierele care apar în cel puțin două din: ro.wikipedia.org/wiki/Cartiere_din_Iași (secțiunea „Listă”, 36 de nume), ro.wikipedia.org/wiki/Format:Cartiere_din_Iași (27) și apix.ro (17, 2022). Verificat pe 5 oct 2026. Zonele industriale și cartierele mici au rămas pe dinafară, ca pragul de 3 persoane să poată fi atins; se adaugă la cerere.

**Galați (28)**: Aurel Vlaicu, Bariera Traian, Barboși, Bădălan, Centru, Dimitrie Cantemir, Filești, Gară, I.C. Frimu, Mazepa, Micro 13, Micro 14, Micro 16 (Țiglina 3), Micro 17, Micro 18, Micro 19, Micro 20, Micro 21, Micro 38, Micro 39, Micro 40, Piața Centrală, Port, Siderurgiștilor Vest, Traian Nord, Țiglina, Valea Orașului, Zona Veche (Lozoveni).
Nici aici nu există o listă oficială accesibilă (stratul de cartiere al hărții primăriei nu s-a putut deschide). Fiecare cartier apare în cel puțin două surse independente, iar Wikipedia (ro, en) contează ca una singură: ro.wikipedia.org/wiki/Galați și Lista_cartierelor_din_municipiul_Galați, galati.wiki/cartiere, bvau.ro (InfoGhid „Cartiere gălățene”), galateni.net, filtrele de zonă de pe storia.ro și imobiliare.ro, jurnalul de intervenții interventii.apa-canal.ro, presa locală. Verificat pe 6 oct 2026.
Decizii: părțile numerotate sunt comasate (Țiglina 1-2, Mazepa 1-2, Micro 13 A-B, Micro 39 A-C, Aurel Vlaicu I-II), cum le anunță Apa Canal; Micro 16 (Țiglina 3) rămâne separat, fiindcă e pe altă rețea de apă decât Țiglina 1-2; Micro 17 și 18 rămân separate, fiindcă anunțurile de avarii le numesc separat; Dimitrie Cantemir intră (e pe teritoriul Brăilei, dar administrat și alimentat cu apă de Galați); Vânători, comună separată, nu intră. Doar într-o singură sursă: Arcașilor, Petru Rareș, Valea Cătușei, Crinul; „Aviației” și „Dunărea” au limite contradictorii între surse.

Slug-uri fără diacritice: `bistrita-lac`, `george-bacovia`, `serbanesti`, `gheraiesti`, `mioritei`, `cornisa`. Un singur loc de adevăr pentru orașe, cartiere și servicii (un fișier de configurare), din care se generează toate paginile.

## Furnizorii și numerele de avarii

Verificate pe 5 octombrie 2026, pe site-urile oficiale (sursele sunt și în `src/config/locations.ts`):

| Serviciu | Bacău | Iași |
|---|---|---|
| Apă | CRAB: 0372 401 301, call center, tasta 1 pentru avarii ([apabacau.ro](https://www.apabacau.ro/)) | ApaVital: 0232 969, call center L-V 07-21, weekend 08-20; avarii@apavital.ro ([apavital.ro/contact](https://www.apavital.ro/contact)) |
| Curent | Delgaz Grid: 0800 800 929, gratuit, non-stop ([delgaz.ro/despre-noi/contact](https://delgaz.ro/despre-noi/contact)) | la fel |
| Gaz | Delgaz Grid: 0800 800 928, gratuit, non-stop (aceeași sursă) | la fel |
| Apă caldă și căldură | Thermoenergy: 0234 585 050, dispecerat non-stop ([thermoenergy.ro](https://thermoenergy.ro/)) | Termo-Service (nu mai e Veolia): 0232 232 360, linie de informații, nu dispecerat ([tsiasi.ro](https://tsiasi.ro/noutati-si-comunicate/numere-de-telefon)) |

**Galați** (verificat pe 6 oct 2026; alți operatori decât în Bacău și Iași):

| Serviciu | Galați |
|---|---|
| Apă | Apa Canal S.A. Galați: 0236 463 294, dispecerat 24/7 ([apa-canal.ro/contact](https://www.apa-canal.ro/contact)). Call center-ul 0336 390 272 are program de birou. |
| Curent | Distribuție Energie Electrică Romania, Sucursala Galați (fostă Muntenia Nord): telverde 0800 500 205; sau prefixul județului + 929 ([distributie-energie.ro](https://www.distributie-energie.ro/sucursala-galati-2/)) |
| Gaz | Distrigaz Sud Rețele: 0800 877 778, gratuit, non-stop ([distrigazsud-retele.ro](https://www.distrigazsud-retele.ro/companie/contact/)) |
| Apă caldă și căldură | Calorgal (al Consiliului Local): 0725 257 824, dispecerat ([calorgal.ro/contact](https://www.calorgal.ro/contact/)). CET-ul s-a închis în 2017; Calorgal are 28 de centrale de cvartal, cam 6.000 de apartamente. Pagina spune că nu acoperă tot orașul. |

Pe fiecare pagină de serviciu: „Nu suntem [furnizor]. Pentru avarii, sună la: [număr]”, cu sursa și data verificării. Numele furnizorului poate apărea descriptiv în titlu (ex. „Apă Bacău acum: avarii CRAB raportate pe cartiere”), dar pagina nu trebuie să pară site-ul lor oficial.

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

## Cron

**pg_cron în Supabase, la 15 minute** (`sterge-amprente-ip`): `forget_old_ip_hashes()` face null amprentele mai vechi de **2 ore**, cât cere limita. Cu cheia HMAC, o amprentă IPv4 se poate inversa încercând toate adresele, deci trebuie să trăiască cât mai puțin (#48, semnalat pe Reddit; înainte: până la 48 de ore).

**Vercel, zilnic** (Hobby permite un singur cron pe zi): `/api/cron/curatenie`, protejat cu `CRON_SECRET` (Vercel trimite `Authorization: Bearer <CRON_SECRET>`). Ține Supabase activ și rulează aceeași ștergere, ca rezervă.

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
- #44 Orașele mari din Moldova; #46 Galați
