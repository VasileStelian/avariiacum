# Avarii Acum

Downdetector pentru apă, curent, gaz și căldură, pe cartiere. Bacău + Iași la început.

**Înainte de orice: citește `docs/PLAN.md`** (și `docs/private/STRATEGIE.md`, local, dacă există). Deciziile de acolo sunt luate; nu le redeschide fără motiv nou. Ce e marcat „DE VERIFICAT” se caută la sursă, nu se scrie din memorie.

## Ordinea de lucru

1. Machetele în Stitch (5 ecrane, mobil întâi) → arătate lui Vasile înainte de cod.
2. Schelet Next.js + configurarea orașe/cartiere/servicii + teste.
3. Supabase: schema, RLS, scrierea și citirea pe server.
4. Paginile, raportarea, graficele, cron-ul.
5. Verificare: teste, Playwright la 390 și 1440, `curl` fără JavaScript arată conținutul.
6. Deploy pe Vercel (subdomeniul gratuit) → test o săptămână → domeniul.

## Reguli de proiect

- Commit-uri: `<type>(avarii): <descriere>`.
- Textul din interfață: română cu diacritice complete, ghilimele „...”, fără liniuțe lungi în propoziții, fără alarmism.
- Nicio cheie Supabase în client. Nicio cheie în repo.
- **Jurnal pentru articol:** după fiecare etapă, adaugă în `docs/JURNAL.md` ce s-a făcut, cât a durat și ce s-a stricat. Din el se scrie articolul despre vibe coding; fără jurnal nu există experiență de povestit.

@AGENTS.md
