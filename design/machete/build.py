"""Generează machetele v2 (HTML static) din date de exemplu.

Rulare: python3 design/machete/build.py
Iconițele vin din @hugeicons/core-free-icons 4.3.5, extrase în icons.json.
Datele sunt de exemplu (avarie de apă în Republicii), nu reale.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
ICONS = json.loads((HERE / "icons.json").read_text())


def ic(name):
    return ICONS[name]


SERVICES = [  # slug, nume scurt, nume lung, iconiță, furnizor Bacău
    ("apa", "Apă", "Apă", "DropletIcon", "CRAB"),
    ("curent", "Curent", "Curent", "FlashIcon", "Delgaz Grid"),
    ("gaz", "Gaz", "Gaz", "FireIcon", "Delgaz Grid"),
    ("caldura", "Căldură", "Apă caldă și căldură", "HeaterIcon", "Thermoenergy"),
]

ZONES = [  # nume, slug
    ("Republicii", "republicii"), ("Mioriței", "mioritei"), ("George Bacovia", "george-bacovia"),
    ("Centru", "centru"), ("Nord", "nord"), ("CFR", "cfr"), ("Cornișa", "cornisa"),
    ("Izvoare", "izvoare"), ("Bistrița-Lac", "bistrita-lac"), ("Gherăiești", "gheraiesti"),
    ("Șerbănești", "serbanesti"), ("Orizont", "orizont"),
]

# (cartier, serviciu) -> persoane distincte în ultima oră
REPORTS = {("Republicii", "apa"): 7, ("Mioriței", "curent"): 2, ("George Bacovia", "caldura"): 1}

HEAD = """<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Public+Sans:wght@600;700&display=swap">
<link rel="stylesheet" href="machete.css">
</head>
<body>
"""


def top(report_label="Raportează o problemă", city="bacau"):
    cur = lambda c: ' aria-current="page"' if c == city else ""
    return f"""<header class="top"><div class="top-in">
  <a class="mark" href="oras.html">Avarii <span>Acum</span></a>
  <nav class="cities" aria-label="Orașe"><a href="oras.html"{cur('bacau')}>Bacău</a><a href="#"{cur('iasi')}>Iași</a></nav>
  <a class="btn btn-primary" href="raportare.html">{ic('Add01Icon')}{report_label}</a>
</div></header>
"""


def foot(dock_label="Raportează o problemă"):
    dock = f'<div class="dock"><a class="btn btn-primary btn-wide" href="raportare.html">{ic("Add01Icon")}{dock_label}</a></div>' if dock_label else ""
    return f"""<footer class="foot">
  <p>Avarii Acum nu este furnizorul de apă, curent, gaz sau căldură. Afișăm ce raportează locuitorii.</p>
  <a href="despre.html">Despre</a><a href="#">Confidențialitate</a><span>Făcut de <a href="https://fanvora.ro">Fanvora Digital Studio</a>, Bacău</span>
</footer>
{dock}
</body>
</html>
"""


def status(n, long=False):
    if n >= 3:
        text = {True: f"Probabil avarie: {n} persoane", False: n, "label": "Probabil avarie"}[long]
        return f'<span class="st st-bad">{ic("Alert02Icon")}{text}</span>'
    if n >= 1:
        word = "raportare" if n == 1 else "raportări"
        return f'<span class="st st-warn">{ic("InformationCircleIcon")}{str(n) + " " + word if long else n}</span>'
    return f'<span class="st st-ok">{ic("Tick02Icon")}{"Fără raportări" if long else ""}</span>'


def cell_label(zone, svc_name, n):
    if n >= 3:
        return f"{zone}, {svc_name}: probabil avarie, {n} persoane în ultima oră"
    if n >= 1:
        return f"{zone}, {svc_name}: {n} {'raportare' if n == 1 else 'raportări'} în ultima oră"
    return f"{zone}, {svc_name}: fără raportări"


def bars(series, mini=False):
    # scară fixă la minigrafice: un singur raport nu are voie să arate ca o avarie
    peak = max(max(series), 10 if mini else 1)
    out = []
    for v in series:
        cls = ' class="hot"' if v >= 3 else (' class="warm"' if v >= 1 and mini else "")
        out.append(f'<i{cls} style="height:{max(v / peak * 100, 2):.0f}%"></i>')
    return f'<div class="bars{" mini" if mini else ""}" aria-hidden="true">{"".join(out)}</div>'


QUIET = [0] * 96
WATER = [0] * 70 + [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 3, 4, 6, 7, 9, 8, 7, 7][: 26]
HEAT = [0] * 88 + [1] + [0] * 7
CITY_WATER = [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] * 3 + [0] * 22 + [1, 0, 2, 3, 5, 7, 9, 11, 10, 9, 9, 8, 1, 0][:14]
CITY_WATER = (CITY_WATER + [0] * 96)[:96]


def axis():
    return '<div class="axis"><span>-24h</span><span>-18h</span><span>-12h</span><span>-6h</span><b>acum</b></div>'


def write(name, html):
    (HERE / name).write_text(html)


# ---------- Panoul orașului ----------
def page_oras():
    head_cells = "".join(
        f'<th scope="col"><a href="serviciu-apa.html">{ic(i)}<span>{short}</span></a></th>'
        for _, short, _, i, _ in SERVICES
    )

    def row(zone, slug, quiet=False):
        cells = "".join(
            f'<td aria-label="{cell_label(zone, long, REPORTS.get((zone, s), 0))}">{status(REPORTS.get((zone, s), 0))}</td>'
            for s, _, long, _, _ in SERVICES
        )
        return f'<tr{" class=\"quiet\"" if quiet else ""}><th scope="row"><a href="cartier.html">{zone}</a></th>{cells}</tr>'

    busy = [z for z in ZONES if any((z[0], s[0]) in REPORTS for s in SERVICES)]
    calm = [z for z in ZONES if z not in busy]
    rows = "".join(row(*z) for z in busy)
    rows += f'<tr class="matrix-group"><th colspan="5" scope="rowgroup">Fără raportări în ultima oră</th></tr>'
    rows += "".join(row(*z, quiet=True) for z in calm)

    providers = "".join(
        f'<li><div class="row-top"><span class="row-name" style="font-size:16px">{ic(i)}{long}</span></div>'
        f'<p class="small muted">{prov}: număr de verificat la sursă</p></li>'
        for _, _, long, i, prov in SERVICES
    )

    html = HEAD.format(title="Avarii în Bacău acum: apă, curent, gaz, căldură pe cartiere") + top() + f"""<main class="page">
  <div class="head">
    <h1>Avarii în Bacău acum</h1>
    <p class="lead"><strong>Probabil avarie de apă în Republicii.</strong> Raportări izolate în Mioriței și George Bacovia.</p>
    <p class="small muted">Raportări anonime de la locuitori, ultima oră. Actualizat acum 1 min.</p>
  </div>
  <div class="split">
    <div class="stack">
      <div class="panel">
        <table class="matrix">
          <caption class="sr">Starea serviciilor pe cartiere în Bacău, ultima oră</caption>
          <thead><tr><th scope="col">Cartier</th>{head_cells}</tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      <div class="legend">
        <span>{status(7)} probabil avarie, minim 3 persoane</span>
        <span>{status(2)} raportări izolate</span>
        <span>{status(0)} fără raportări</span>
      </div>
      <p class="small"><a href="#">Lipsește cartierul tău? Spune-ne</a></p>
    </div>
    <aside class="stack">
      <h2>Numere de avarii în Bacău</h2>
      <p class="small muted">Noi doar adunăm raportările. Ca să rezolve cineva, sună la furnizor.</p>
      <ul class="rows panel">{providers}</ul>
    </aside>
  </div>
</main>
""" + foot()
    write("oras.html", html)


# ---------- Un serviciu în tot orașul ----------
def page_serviciu():
    calm = ", ".join(z for z, _ in ZONES if z not in ("Republicii", "Bistrița-Lac"))
    others = "".join(
        f'<a class="btn btn-ghost" href="#">{ic(i)}{short}</a>' for s, short, _, i, _ in SERVICES if s != "apa"
    )
    html = HEAD.format(title="Apă Bacău acum: avarii raportate pe cartiere") + top("Raportează lipsa apei") + f"""<main class="page">
  <nav class="crumbs" aria-label="Ești aici"><a href="oras.html">Bacău</a><span aria-hidden="true">/</span><span>Apă</span></nav>
  <div class="head">
    <h1>Apă Bacău acum: avarii raportate pe cartiere</h1>
    <p class="lead"><strong>Probabil avarie în Republicii:</strong> 7 persoane fără apă în ultima oră.</p>
  </div>
  <div class="split">
    <div class="stack">
      <section class="panel chart" aria-labelledby="g">
        <div class="chart-top"><h2 id="g">Raportări în ultimele 24 de ore</h2><span class="small muted">la 15 minute</span></div>
        {bars(CITY_WATER)}
        {axis()}
        <p class="small muted">Ultimul raport acum 4 min</p>
      </section>
      <h2>Cartiere cu raportări</h2>
      <ul class="rows panel">
        <li><div class="row-top"><a class="row-name" href="cartier.html">Republicii</a>{status(7, True)}</div><p class="small muted">primul raport acum 1 h 50 min, ultimul acum 4 min</p></li>
        <li><div class="row-top"><a class="row-name" href="#">Bistrița-Lac</a>{status(1, True)}</div><p class="small muted">acum 35 min</p></li>
      </ul>
      <p class="small muted"><strong style="color:var(--ink)">Fără raportări:</strong> {calm}.</p>
    </div>
    <aside class="stack">
      <section class="panel provider" aria-labelledby="p">
        <h2 id="p">Avarii apă: CRAB</h2>
        <p class="small muted">Compania Regională de Apă Bacău. Nu suntem CRAB; sună-i ca să afle și ei.</p>
        <p class="num">număr de verificat la sursă</p>
        <a class="small" href="#">apabacau.ro</a>
      </section>
      <p class="small muted">Afișăm „Probabil avarie” când cel puțin 3 persoane diferite din același cartier raportează în aceeași oră. Starea dispare singură când rapoartele se opresc.</p>
      <div class="inline-links">{others}</div>
    </aside>
  </div>
</main>
""" + foot("Raportează lipsa apei")
    write("serviciu-apa.html", html)


# ---------- Un cartier, 4 servicii ----------
def cartier_main():
    series = {"apa": WATER, "curent": QUIET, "gaz": QUIET, "caldura": HEAT}
    last = {"apa": "ultimul raport acum 4 min", "curent": "niciun raport azi", "gaz": "niciun raport azi", "caldura": "ultimul raport acum 2 h"}
    items = ""
    for s, _, long, i, _ in SERVICES:
        n = REPORTS.get(("Republicii", s), 0)
        link = '<a class="small" href="serviciu-apa.html">Apa în tot Bacăul</a>' if s == "apa" else ""
        items += f"""<li>
        <div class="row-top"><span class="row-name">{ic(i)}{long}</span>{status(n, True)}</div>
        {bars(series[s], mini=True)}
        <div class="axis"><span>-24h</span><span>{last[s]}</span><b>acum</b></div>{link}
      </li>"""
    zones = "".join(f'<a href="#">{z}</a>' for z, _ in ZONES if z != "Republicii")
    return f"""<main class="page">
  <nav class="crumbs" aria-label="Ești aici"><a href="oras.html">Bacău</a><span aria-hidden="true">/</span><span>Republicii</span></nav>
  <div class="head">
    <h1>Republicii, Bacău: avarii acum</h1>
    <p class="lead"><strong>Probabil avarie de apă:</strong> 7 vecini au raportat în ultima oră.</p>
  </div>
  <div class="split">
    <ul class="rows panel">{items}</ul>
    <aside class="stack">
      <h2>Alte cartiere din Bacău</h2>
      <div class="inline-links">{zones}</div>
      <p class="small muted">Starea „Probabil avarie” apare la cel puțin 3 persoane diferite în aceeași oră și dispare singură.</p>
    </aside>
  </div>
</main>
"""


def page_cartier():
    html = HEAD.format(title="Republicii, Bacău: avarii acum") + top("Raportează în Republicii") + cartier_main() + foot("Raportează în Republicii")
    write("cartier.html", html)


# ---------- Raportarea și „Mulțumim” (peste pagina cartierului) ----------
def overlay(name, title, inner):
    html = HEAD.format(title=title) + top("Raportează în Republicii") + cartier_main() + foot(None).replace("</body>\n</html>\n", "") + f"""<div class="scrim"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="t">
  <div class="grab" aria-hidden="true"></div>
{inner}
</div>
</body>
</html>
"""
    write(name, html)


def page_raportare():
    tiles = "".join(
        f'<button class="tile" role="radio" aria-checked="{"true" if s == "apa" else "false"}">{ic(i)}{long}</button>'
        for s, _, long, i, _ in SERVICES
    )
    overlay("raportare.html", "Raportează o problemă: Avarii Acum", f"""  <div class="sheet-head"><h2 id="t">Ce nu funcționează?</h2><button class="x" aria-label="Închide">{ic('Cancel01Icon')}</button></div>
  <div class="field"><span class="label">Cartierul</span><div class="where">{ic('Location01Icon')}<span>Republicii, Bacău</span><a href="#">Schimbă</a></div></div>
  <div class="field"><span class="label" id="sv">Serviciul</span><div class="tiles" role="radiogroup" aria-labelledby="sv">{tiles}</div></div>
  <p class="fine">Raportul e anonim: nu cerem nume, telefon sau locație. Poți raporta același serviciu o dată la 2 ore.</p>
  <button class="btn btn-primary btn-wide">Trimite raportul</button>""")


def page_multumim():
    overlay("multumim.html", "Raport trimis: Avarii Acum", f"""  <div class="sheet-head"><div class="done-head">{ic('Tick02Icon')}<h2 id="t" style="color:var(--ink)">Raport trimis. Mulțumim.</h2></div><button class="x" aria-label="Închide">{ic('Cancel01Icon')}</button></div>
  <div class="panel now">
    <div class="row-top"><span class="row-name" style="font-size:17px">{ic('DropletIcon')}Apă în Republicii</span>{status(8, 'label')}</div>
    <p class="small">8 persoane au raportat în ultima oră, inclusiv tu.</p>
  </div>
  <div class="provider" style="padding:0">
    <p class="small muted">Nu suntem CRAB. Ca să afle și ei, sună la dispecerat:</p>
    <p class="num">număr de verificat la sursă</p>
  </div>
  <div class="btns">
    <a class="btn btn-primary btn-wide" href="cartier.html">Vezi situația din Republicii</a>
    <button class="btn btn-ghost btn-wide">{ic('Share08Icon')}Trimite linkul vecinilor</button>
  </div>
  <p class="fine">Poți raporta din nou apa în Republicii după ora 16:42.</p>""")


# ---------- Despre ----------
def page_despre():
    html = HEAD.format(title="Despre Avarii Acum") + top(city="") + f"""<main class="page">
  <article class="doc">
    <div class="head">
      <h1>Despre Avarii Acum</h1>
      <p class="lead">Un loc unde vecinii spun ce nu funcționează: apă, curent, gaz, apă caldă și căldură. Gratuit, fără cont, pe cartiere. Începem cu Bacău și Iași.</p>
    </div>
    <section>
      <h2>Cum funcționează</h2>
      <ul class="how">
        <li>{ic('Location01Icon')}<p>Alegi cartierul și serviciul care lipsește. Durează câteva secunde.</p></li>
        <li>{ic('Alert02Icon')}<p>Când cel puțin 3 persoane diferite raportează același lucru în aceeași oră, afișăm „Probabil avarie”. Un singur raport nu schimbă nimic pentru ceilalți.</p></li>
        <li>{ic('Tick02Icon')}<p>Nu există buton „A revenit”. Când rapoartele se opresc, starea dispare singură.</p></li>
      </ul>
    </section>
    <section>
      <h2>Ce înseamnă stările</h2>
      <div class="states">
        <div>{status(7, True)}<span class="small muted">minim 3 persoane diferite în ultima oră</span></div>
        <div>{status(2, True)}<span class="small muted">1 sau 2 persoane, sub prag</span></div>
        <div>{status(0, True)}<span class="small muted">nimeni nu a raportat în ultima oră</span></div>
      </div>
    </section>
    <section>
      <h2>Ce nu suntem</h2>
      <p>Nu suntem CRAB, ApaVital, Delgaz, Thermoenergy sau Veolia și nu primim date de la ei. Pentru avarii, sună la furnizor; numerele sunt pe fiecare pagină de serviciu.</p>
    </section>
    <section>
      <h2>Ce păstrăm</h2>
      <p>Cartierul, serviciul și ora. Adresa IP doar ca amprentă criptată, ștearsă după 24 de ore. Fără cookie-uri de urmărire. <a href="#">Politica de confidențialitate</a></p>
    </section>
    <section>
      <h2>Cine a făcut aplicația</h2>
      <p><a href="https://fanvora.ro">Fanvora Digital Studio</a>, din Bacău. Codul e public pe <a href="#">GitHub</a>.</p>
    </section>
    <section>
      <h2>Lipsește cartierul tău?</h2>
      <p>Scrie-ne la adresa care va fi publicată aici și îl adăugăm.</p>
    </section>
  </article>
</main>
""" + foot(None)
    write("despre.html", html)


if __name__ == "__main__":
    page_oras()
    page_serviciu()
    page_cartier()
    page_raportare()
    page_multumim()
    page_despre()
    print("ok")
