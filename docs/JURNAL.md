# Jurnalul construcției

Sursa articolului despre vibe coding de pe fanvora.ro. O intrare per etapă: data și ora, ce s-a cerut, ce a ieșit, cât a durat, ce s-a stricat și cum s-a reparat. Cifre exacte, nu impresii.

## 2026-10-05 · Planificarea

- Ideea (Vasile): Downdetector pentru utilități în Bacău, unde cartierele rămân des fără apă.
- Interviu de 12 întrebări → `docs/PLAN.md`.
- Cercetare: volumele de căutare din Bacău și Iași (DataForSEO), SERP-urile pentru „crab bacau” și „apa bacau”, lista cartierelor din Bacău, regulile planurilor gratuite Supabase și Vercel.
- Decizie: Claude Code în loc de Lovable (Lovable e plătit). Next.js randat pe server, ca să nu repetăm problema măsurată la 53% din site-urile românești făcute cu Lovable: HTML gol pentru Google.

## 2026-10-05 · Machetele în Stitch

- Cerut: cele 5 machete din plan, mobil întâi, apoi (cerere nouă pe parcurs) și variantele desktop.
- Făcut: proiect Stitch „Avarii Acum” + sistem de design (Public Sans pentru titluri, Atkinson Hyperlegible Next pentru text, un singur accent albastru cobalt, 3 stări cu culoare + iconiță + text). Regulile sunt scrise în `design/DESIGN.md`, ca să nu depindă de Stitch.
- Rezultat: 12 ecrane (6 mobil la 390px, 6 desktop la 1440px) în `design/stitch/`: HTML-ul exportat din Stitch, corectat de mână, plus capturi randate cu Playwright (0 depășiri orizontale, 0 erori JS). Variantele respinse stau în `design/stitch/respinse/`.
- Timp: 15:50 → 21:07 (5h 17m), cu Vasile plecat de acasă din a doua jumătate; cea mai mare parte a fost așteptare după Stitch, nu lucru.
- Ce s-a stricat:
  - Aproape fiecare generare dă timeout la apel, dar ecranul apare totuși după 2-15 minute. Lista de ecrane (`list_screens`) a rămas goală tot timpul; ecranele se văd doar în `list_projects`, și și acolo cu întârziere.
  - 6 cereri trimise în paralel: păreau pierdute după 9 minute, au apărut toate după ~15.
  - Editările cu timeout se pierd de tot (spre deosebire de generări). Corectura pe panoul orașului a trebuit refăcută.
  - Stitch a inventat lucruri care nu sunt în plan: o bară de navigare jos cu „Istoric” și „Notificări”, un link „Metodologie”, un prag scris greșit („3 rapoarte/oră” în loc de „3 persoane”), o liniuță lungă interzisă. Toate prinse la revizia pe capturi, nu de Stitch.
  - Iconița de calorifer s-a randat o dată ca text uriaș „RDIATOR” (fontul de iconițe nu s-a încărcat). Lecție pentru cod: iconițe SVG, nu font.
  - Panoul de raportare cerut pe mobil a ieșit desktop.
  - Pe la 17:00 Stitch nu a mai răspuns deloc (o cerere a stat 16 minute fără răspuns, apoi erori de conexiune). Lotul desktop a apărut abia pe la 21:00 (generat probabil pe la 18:00, vizibil în listă abia atunci), cu un panou al orașului dublat.
  - Editările care au raportat succes nu apar în HTML-ul exportat (URL-ul de descărcare servește versiunea veche). Corecturile au fost aplicate direct în HTML-ul din repo.
  - Desktopul a inventat alte lucruri: „Alimentare stabilă”, „Presiune normală”, „Date deschise”. Scoase.
- Lecție pentru articol: unealta de design generează rapid, dar verificarea rămâne la om (sau la agent, cu capturile în față). Fără revizie, machetele ar fi promis funcții care nu există.

## 2026-10-05 · Trecerea anti-slop pe machete

- Cerut (Vasile): „arată bine, dar se vede că e vibecoded”; anti-slop pe machete acum și în cod de la pasul 2.
- Diagnostic: 12 carduri identice pentru cartiere, „Fără probleme raportate” repetat de 9 ori, rând de filtre-pastilă, logo-picătură, cip monospace, cerc verde centrat. Toate tic-uri de generator, nu decizii.
- Făcut: machetele rescrise de mână ca HTML responsive (`design/machete/`, generate de `build.py` din date de exemplu), un fișier pe pagină pentru 390 și 1440. Panoul orașului a devenit tabel cartiere × servicii, cum scria de la început în plan. Iconițe din Hugeicons (singurul set găsit cu calorifer).
- Verificat cu Playwright: 12 capturi, 0 depășiri orizontale, fonturile încărcate, 0 erori. Contrastul calculat: bifele și barele aveau 2,7:1 și 1,8:1, sub pragul de 3:1; corectate.
- Prins la revizia capturilor: un singur raport de căldură urca bara la maxim în minigrafic și arăta ca o avarie (scara se ajusta după maxim). Acum scara e fixă.
- Timp: 21:08 → 21:18 (10 min), fără Stitch. Comparativ: prima versiune, prin Stitch, a durat peste 5 ore, mai ales din așteptare.
- Lecție pentru articol: unealta de design dă un prim draft bun, dar „aspectul de AI” vine din valorile implicite (card pentru orice, pastile peste tot). Se repară cu decizii de conținut, nu cu alte culori.

## 2026-10-05 · Repo-ul pe GitHub

- Făcut: repo public https://github.com/VasileStelian/avariiacum, licență AGPL-3.0 (detectată de GitHub), README, `.gitignore` cu `.env*` din primul commit.
- Decizie: strategia (motivele Fanvora, datele de căutare, planul de lansare și de reclame) a ieșit din `docs/PLAN.md` în `docs/private/`, ignorat de git. Motiv: un jurnalist care deschide codul trebuie să vadă o unealtă civică, nu un plan de SEO.
- Backlog-ul din plan a devenit 7 issue-uri (#1-#7), plus etichete. Două sunt P1 și blochează lansarea: cartierele din Iași și numerele de avarii.
- Verificat înainte de push: căutare după chei, tokenuri, emailuri și căi locale în fișierele din commit; nimic găsit.
- Timp: aproximativ 10 minute (21:30 la final).

## 2026-10-05 · Pasul 2: scheletul Next.js și configurarea

- Cerut: proiectul Next.js, configurarea orașelor, cartierelor și serviciilor, cu teste; anti-slop din primul commit.
- Făcut (PR pentru #8): Next.js 16.3.8, TypeScript strict, Node 24; oxlint 1.87.0 cu pluginul anti-slop vendorizat; Vitest. Configurarea (`src/config/locations.ts`): Bacău cu 12 cartiere, 4 servicii, furnizori fără telefon până la verificare. Pagina principală și layout-ul cu fonturile și culorile din design. CI pe GitHub care rulează tot.
- Teste: 17 unitare + 3 pe HTML-ul real servit de `next start`, fără JavaScript. Testul de coliziune verificat prin mutație: un cartier „Gaz” îl face să pice.
- Ce s-a stricat:
  - Vitest 5 a refuzat să se instaleze: scheletul fixa tipurile pentru Node 20, proiectul rulează pe Node 24. Aliniate.
  - Instalarea eșuată a oprit lanțul de comenzi, așa că fișierul de configurare oxlint nu s-a scris. Lint-ul „trecea” pentru că nu verifica nimic. Prins cu un fișier de probă cu încălcări cunoscute; de reținut: o unealtă de verificare se testează și ea.
  - În teste, `next/link` scoate bara finală din adrese (setarea vine doar la build). Verificarea s-a mutat pe HTML-ul real.
  - Testul pe HTML-ul real a găsit „12<!-- --> cartiere”: React pune un comentariu între număr și text. Reparat.
  - Next nu are metrici pentru fontul Atkinson Hyperlegible Next, deci nu poate face fontul de rezervă ajustat; de măsurat CLS la verificare.
- Ideile noi ale lui Vasile (date oficiale de la furnizori, partajare cu imagine, raportare dintr-un clic) au devenit issue-urile #9, #10, #11.
- Timp: 21:20 → 21:41.
