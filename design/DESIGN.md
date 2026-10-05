# Avarii Acum: sistemul de design

Machetele de referință: `design/machete/` (v2, după trecerea anti-slop; HTML responsive generat de `build.py`). Prima versiune, din Stitch (`projects/16798697749778438142`), stă în `design/stitch/` doar ca istoric.

Serviciu civic, gratuit, anonim. Omul deschide pagina de pe telefon, în bucătărie, fără apă. Trebuie să afle în 3 secunde: e doar la mine sau în tot cartierul?

## Ton

Calm, pe date, fără alarmism. Fără roșu intermitent, fără „ALERTĂ!”, fără majuscule decorative, fără animații. Seamănă cu un serviciu public bine făcut (GOV.UK, Downdetector), nu cu un site de știri.

## Culori

| Rol | Valoare |
|---|---|
| Fundal pagină | `#F5F6F8` |
| Suprafețe (carduri) | `#FFFFFF`, bordură `#E2E5EA` |
| Text principal | `#16191D` |
| Text secundar | `#4A5361` |
| Accent unic (buton „Raportează”, linkuri) | `#1D4ED8`, text alb |
| Bifă discretă („fără raportări”) | `#76927F` (3,4:1 pe alb) |
| Barele graficului | `#868F9C` (3,3:1 pe alb) |

Stări: mereu culoare + iconiță + text, niciodată doar culoare.

| Stare | Text | Fundal | Iconiță | Când |
|---|---|---|---|---|
| Fără probleme raportate | `#166534` | `#ECF5EF` | bifă | 0 rapoarte în ultima oră |
| N raportări | `#8A4B00` | `#FFF3DF` | cerc cu „i” | 1-2 persoane distincte în ultima oră |
| Probabil avarie | `#9F2A14` | `#FCEBE7` | triunghi | minim 3 persoane distincte în ultima oră |

Triunghiul e rezervat stării „Probabil avarie”; butonul de raportare folosește „+”.

Contrastul fiecărei perechi se verifică la implementare (test automat), țintă WCAG AA.

## Tipografie

- Titluri: Public Sans 700, mărimi modeste (H1 28px pe mobil).
- Text: Atkinson Hyperlegible Next, minim 16px, linie 1.5. Cifre cu `tabular-nums`.
- Română cu diacritice complete, ghilimele „...”, fără liniuțe lungi.

## Formă

- Colțuri 8px peste tot. Bottom sheet: 16px doar sus. Dialogul desktop: 12px.
- Carduri doar unde grupează date (un cartier, un serviciu). Restul: spațiu și linii subțiri.
- Ținte de atingere minim 48px. Pe mobil, butonul principal e fix jos, pe toată lățimea, 56px. Pe desktop, butonul stă în antet.

## Iconițe (Hugeicons, `@hugeicons/core-free-icons`)

| Serviciu | Iconiță |
|---|---|
| Apă | `DropletIcon` |
| Curent | `FlashIcon` |
| Gaz | `FireIcon` |
| Apă caldă și căldură | `HeaterIcon` (calorifer) |

Stări: `Alert02Icon` (probabil avarie), `InformationCircleIcon` (sub prag), `Tick02Icon` (fără raportări). Hugeicons e singurul set verificat care are calorifer (Tabler 3.49 și Material Symbols nu au). Fără font de iconițe: în Stitch, fontul a randat o dată textul „RADIATOR” în loc de iconiță.

## Panoul orașului

Tabel cartiere × servicii, nu carduri. Cartierele cu raportări sus; restul sub rândul „Fără raportări în ultima oră”. Celula normală e o bifă discretă; doar celulele cu probleme au culoare și număr. Fiecare celulă are `aria-label` complet („Republicii, Apă: probabil avarie, 7 persoane în ultima oră”). Legenda apare o singură dată, sub tabel. Deasupra tabelului, o frază care spune situația.

## Grafic 24h

Bare verticale subțiri, una la 15 minute (96 bare), `#4A5361`; intervalele peste prag în `#9F2A14`. Axa: „-24h” ... „acum” la dreapta. Fără grilă grea. Sub grafic: „Ultimul raport acum X min”. Minigraficele din pagina cartierului au scară fixă (minim 10), ca un singur raport să nu arate ca o avarie.

## Raportarea

- Mobil: bottom sheet. Desktop: dialog centrat, 520px.
- Cartier (precompletat, „Schimbă”) → serviciu (grilă 2x2) → „Trimite raportul” → „Mulțumim”.
- „Mulțumim” arată situația curentă, numărul de avarii al furnizorului și „Poți raporta din nou după ora X”.

## Ce nu intră

Emoji, ilustrații decorative, logo-iconiță (marca e doar textul „Avarii Acum”), carduri pentru fiecare rând, pastile de filtre, poze stock, hartă (vine mai târziu), reclame (oprite la lansare), bară de navigare jos (Stitch a inventat-o; nu există funcțiile „Istoric” și „Notificări”).
