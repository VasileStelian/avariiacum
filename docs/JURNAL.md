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

## 2026-10-05 · Pasul 3 (Supabase) și 4a (paginile de citire)

- Pasul 3 (PR #14): tabelul de rapoarte cu RLS, funcții SQL pentru raportare (limita de 2 ore, atomică), activitate, seria pe 24h și ștergerea amprentelor IP; cron zilnic. Testate pe Supabase local, în Docker. Mutații prinse: fără blocaj pică testul de concurență; un drept dat cheii publice pică testul de drepturi. Primul test de drepturi NU prindea mutația (apărarea pe straturi o masca); rescris strat cu strat.
- Vasile a creat proiectul Supabase (Irlanda) și l-a legat la Vercel și GitHub, cu migrările aplicate automat la merge pe `main`. Funcțiile Vercel mutate în Dublin, lângă baza de date.
- Pasul 4a (PR pentru #15): paginile orașului (tabel cartiere × servicii), serviciului și cartierului, cu date reale, cache 60 s, 404, adrese cu majuscule redirecționate.
- Ce s-a stricat:
  - **Am raportat greșit CI-ul verde pe PR #14.** Am citit codul de ieșire al comenzii care urmărea CI-ul, nu al CI-ului. Jobul `check` picase: configurarea testelor pe HTML includea și testele de bază de date. Prins abia când aceeași eroare a apărut local. Lecție: statusul se citește din sursă (`gh pr checks`), nu dintr-un rezumat.
  - Un test de pagini a picat intermitent. Cauza, dovedită A/B: Next 16 ține paginile ISR pe disc între porniri și servește întâi versiunea veche. Testul golește acum cache-ul. Consecința pentru produs: după un raport nou, pagina trebuie regenerată explicit (pasul 4b).
  - React pune comentarii în textul interpolat („Avarii în <!-- -->Bacău”); titlurile au devenit șiruri unice.
  - Pe macOS, cache-ul găsea `/bacau/Apa/` ca `/bacau/apa/` (sistem de fișiere fără majuscule). Rezolvat cu redirecționare spre litere mici.
  - Minigraficul de apă abia se vedea la 7 persoane (scara 10 era prea mare); corectat la 4, cu culoarea stării.
  - Acordul numeralelor: „20 de persoane”, „1 persoană a raportat”; prinse de teste, nu de ochi.
  - Deploy-ul de previzualizare Vercel pe PR #14 a picat; cauza necunoscută până la logarea în Vercel.
- Timp: 21:40 → 22:13.

## 2026-10-05 · Producția și pasul 4b (raportarea)

- Producția: Vercel nu construia aplicația (proiectul fusese creat cu presetul „Other”, înainte să existe Next.js); reparat în `vercel.json`. Variabilele de mediu nu existau deloc; adăugate din terminal, cheia secretă Supabase trimisă direct din CLI-ul Supabase în Vercel, fără să apară pe ecran. Prima încercare a eșuat de trei ori: cheia venea mascată (fără `--reveal`), apoi Vercel nu aștepta valoarea venită din rețea. Merge #12 → #14 → #16; migrarea s-a aplicat singură în Supabase; site-ul răspunde pe avariiacum.vercel.app, cu funcțiile în Dublin.
- Pasul 4b (PR pentru #17): raportarea, cu acțiune pe server, panou de jos, „Mulțumim”, cartierul ținut minte (#11).
- Test E2E: trei „vecini” cu IP-uri diferite raportează din browser; la al treilea, pagina orașului spune „Probabil avarie de apă în Republicii.” Durează sub 5 secunde.
- Ce s-a stricat:
  - E2E-ul a găsit 28 de erori în consola browserului după o raportare: preîncărcarea pe segmente a Next 16 dă 404 pe paginile încă negenerate. Navigarea mergea, dar utilizatorul ar fi văzut erori. Preîncărcarea oprită pe linkurile interne.
  - Testul nu putea da clic pe plăcuța „Apă” (un input transparent stă peste ea, intenționat). Corect era să aleagă radio-ul după nume, cum face un cititor de ecran.
  - Anunțătorul de rută al Next are tot `role="alert"`; testul trebuie să caute în dialog.
- Timp: 22:45 → 22:49.

## 2026-10-05 · Pasul 4c, datele verificate și lansarea pe Vercel

- Cerut (Vasile): „dă merge, termină aplicația, dă deploy și dă-mi linkul”.
- Pasul 4c (PR #20): Despre, Confidențialitate, sitemap, robots, BreadcrumbList, imaginea de partajare generată cu starea curentă, WhatsApp și Facebook pe „Mulțumim”, 404 și pagină de eroare în română, iconiță.
- Datele (PR #21, #22): un agent separat a verificat pe site-urile oficiale numerele de avarii și cartierele din Iași, cu URL și citat pentru fiecare. Planul greșea: la Iași, termoficarea nu mai e la Veolia, ci la Termo-Service. ApaVital are call center cu program, nu non-stop; Termo-Service are doar o linie de informații. Pentru cartierele din Iași nu există o listă oficială; au intrat cele 22 care apar în cel puțin două surse.
- Ce s-a stricat:
  - Confidențialitatea promitea „ștearsă după 24 de ore”, dar cron-ul rulează o dată pe zi; textul corect e „în cel mult 48 de ore”. Prins la scrierea paginii, din cod, nu din machete.
  - În imaginea de partajare, „ă” apărea subțire în titlul îngroșat: generatorul ia litera din primul font care o are. Rezolvat cu fișiere de font complete; prins doar pe captură.
  - Build-ul din CI a picat când descărcarea fonturilor de la Google a eșuat (GitHub Actions era degradat). Fonturile sunt acum în repo, subset de 13-15 KB; a dispărut și riscul de deplasare a textului.
  - Pagina 404 pentru un oraș necunoscut e un schelet în HTML (textul vine cu JavaScript); acceptat, documentat.
  - GitHub Actions degradat: joburi „neacceptate de runner”, rulate din nou.
- Timp: 23:10 → 23:40.

## 2026-10-06 · Feedback la clic pe internet lent

- Cerut (Vasile): „pe internet lent nu sunt sigur dacă aplicația mi-a preluat inputul”.
- Făcut (PR pentru #29): apăsare vizibilă din CSS pe butoane, plăcuțe și rânduri (merge înainte de JavaScript); linkul apăsat pulsează cât se încarcă pagina (useLinkStatus, fără deplasare de layout); panoul de raportare se deschide și fără JavaScript (comenzile native ale butoanelor, commandfor); „Trimite” arată „Se încarcă…” până e gata pagina, apoi un indicator la trimitere și, după 4 s, „Rețeaua e lentă. Raportul tău e pe drum”. Animațiile se opresc pentru cine are mișcarea redusă din sistem.
- Teste: rețeaua încetinită artificial în Chromium (pagina nouă întârziată 2 s, trimiterea 5 s) și JavaScript oprit.
- Ce s-a stricat: testul de apăsare pica constant fiindcă apăsarea pe „Raportează” devenea clic și deschidea panoul, care bloca restul paginii. Testul ridică acum degetul în altă parte.
- Timp: 08:51.

## 2026-10-06 · Raportarea de pe pagina principală și graficul interactiv

- Cerut (Vasile): buton de raportare și pe pagina principală, cu alegerea orașului înainte de formular; hover pe bare pe desktop (tap pe telefon) ca să se vadă intervalul; întrebare: au barele înălțime variabilă?
- Făcut (PR #32): pe pagina principală, panoul întreabă „În ce oraș?”, apoi arată formularul obișnuit, cu „Schimbă orașul”. Paginile unui oraș sar peste întrebare.
- Făcut (PR #34): hover, tap sau săgeți pe o bară arată „21:15–21:30: 7 rapoarte”. Răspuns la întrebare: da, înălțimea e numărul de rapoarte din sfertul de oră, față de vârful graficului; roșu de la 3 rapoarte.
- Date demo locale: 351 de rapoarte pe 24 de ore (avarii în desfășurare, avarii trecute, plângeri răzlețe), ca să se vadă graficul plin. Așa s-a văzut un defect: minigraficele din pagina cartierului se umpleau complet la o avarie mare (scara fixă de 4). Acum scara are minim 4, dar urcă după vârf.
- Ce s-a stricat: un test căuta „Curent în Copou” și găsea și „...din nou curent în Copou” din textul mic; testele de bază de date șterg datele demo, care trebuie reîncărcate după rulare.
- Timp: 09:35.

## 2026-10-06 · Formulările căutate în paginile de serviciu

- Cerut (Vasile): cuvintele cheie să fie efectiv în pagini.
- Făcut (PR pentru #43): pagina de curent se numește „Pană de curent Bacău acum”, cum caută oamenii, nu „Curent Bacău”. Titlurile spun „avarii și întreruperi” și numele furnizorului; descrierile spun „întreruperi de apă / de curent / de gaz / de căldură”. Textele vin din configurare (`searchName`) și dintr-un singur modul, testat unitar, cu limita de 160 de caractere pentru descriere.
- Tot azi: issue #44 cu orașele mari din Moldova, cu populația de la recensământul din 2021.
- Ce s-a stricat: nimic în cod. Mailurile de eșec din GitHub erau de la testul CLA cu contul svasile26 (Vercel nu face preview pentru commit-uri din afara echipei) și de la prima rulare a acțiunii CLA, care creează fișierul de semnături și raportează mereu eroare.
- Timp: 19:00 → 19:20.
