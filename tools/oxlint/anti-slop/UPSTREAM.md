# anti-slop: proveniență

- Sursa: skill-ul local `install-anti-slop` (`~/.claude/skills/install-anti-slop/assets/anti-slop`), copiat cu `scripts/install.mjs` pe 5 oct 2026.
- Commit de upstream: necunoscut (directorul skill-ului nu e repo git și nu declară sursa).
- Amprenta copiei originale: SHA-256 peste `shasum -a 256` al tuturor fișierelor din acest director, sortate, înainte de adăugarea acestui fișier: `2cf66fa1be860828766b671ac50f7cadea0b5bff27359c1b27693586b4cb95aa`.
- Căi instalate: `tools/oxlint/anti-slop/` (plugin generic, `index.ts`); `effect/` copiat, dar neactivat (proiectul nu depinde de `effect`).
- Dependențe: `oxlint` și `@oxlint/plugins` la 1.87.0, fixate exact.
- Abateri intenționate: niciuna în cod. `tools/oxlint/package.json` (în afara copiei) declară `"type": "module"`, ca Node să nu mai avertizeze la încărcarea `index.ts`. `.oxlintrc.json` ignoră în plus `.next/**` (build) și `design/**` (machete statice, nu cod de aplicație).
- `vendor/eslint-stylistic/LICENSE` și `vendor/eslint-stylistic/UPSTREAM.md` păstrate.
