import type { Metadata } from "next";
import { PendingLink } from "@/components/pending-link";
import { notFound } from "next/navigation";

import { ServiceIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/json-ld";
import { ReportDialog } from "@/components/report-dialog";
import { StatusBadge } from "@/components/status-badge";
import { SERVICES, findCity } from "@/config/locations";
import { clockRo, countRo, telHref } from "@/lib/format";
import { reportProps } from "@/lib/report-props";
import { type Cell, type CityRow, cityView } from "@/lib/views";
import { serverReportsStore } from "@/server/supabase";

// Randare la prima vizită, apoi din cache; se reîmprospătează cel mult o dată pe minut.
export const revalidate = 60;

export function generateStaticParams(): { oras: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[oras]">): Promise<Metadata> {
  const city = findCity((await params).oras);

  if (!city) {
    return {};
  }

  return {
    title: `Avarii în ${city.name} acum: apă, curent, gaz și căldură pe cartiere`,
    description: `Ce raportează locuitorii din ${city.name}, pe cartiere: apă, curent, gaz, apă caldă și căldură. Probabil avarie de la 3 persoane în aceeași oră.`,
    alternates: { canonical: `/${city.slug}/` },
  };
}

function cellLabel(zone: string, cell: Cell): string {
  if (cell.status === "liniste") {
    return `${zone}, ${cell.service.name}: fără raportări`;
  }

  const reported = countRo(cell.reporters, { one: "persoană a raportat", many: "persoane au raportat" });

  return cell.status === "avarie"
    ? `${zone}, ${cell.service.name}: probabil avarie, ${reported} în ultima oră`
    : `${zone}, ${cell.service.name}: ${reported} în ultima oră`;
}

function Row({ citySlug, row, quiet }: { citySlug: string; row: CityRow; quiet: boolean }) {
  return (
    <tr className={quiet ? "quiet" : undefined}>
      <th scope="row">
        <PendingLink href={`/${citySlug}/${row.zone.slug}/`}>{row.zone.name}</PendingLink>
      </th>
      {row.cells.map((cell) => (
        <td key={cell.service.slug} aria-label={cellLabel(row.zone.name, cell)}>
          <StatusBadge status={cell.status}>{cell.status === "liniste" ? null : cell.reporters}</StatusBadge>
        </td>
      ))}
    </tr>
  );
}

export default async function CityPage({ params }: PageProps<"/[oras]">) {
  const city = findCity((await params).oras);

  if (!city) {
    notFound();
  }

  const view = cityView(city, await serverReportsStore().cityActivity(city.slug));

  return (
    <main className="page">
      <Breadcrumbs crumbs={[{ name: city.name, path: `/${city.slug}/` }]} />
      <div className="head">
        <h1>{`Avarii în ${city.name} acum`}</h1>
        <p className="lead">
          {view.headline.outage ? <strong>{view.headline.outage}</strong> : null} {view.headline.isolated} {view.headline.quiet}
        </p>
        <p className="small muted">{`Raportări anonime de la locuitori, ultima oră. Actualizat la ${clockRo(new Date())}.`}</p>
        <ReportDialog {...reportProps(city, "Raportează o problemă")} />
      </div>
      <div className="split">
        <div className="stack">
          <div className="panel">
            <table className="matrix">
              <caption className="sr">{`Starea serviciilor pe cartiere în ${city.name}, ultima oră`}</caption>
              <thead>
                <tr>
                  <th scope="col">Cartier</th>
                  {SERVICES.map((service) => (
                    <th key={service.slug} scope="col">
                      <PendingLink href={`/${city.slug}/${service.slug}/`}>
                        <ServiceIcon slug={service.slug} />
                        <span>{service.shortName}</span>
                      </PendingLink>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.busy.map((row) => (
                  <Row key={row.zone.slug} citySlug={city.slug} row={row} quiet={false} />
                ))}
                {view.busy.length > 0 ? (
                  <tr className="group">
                    <th colSpan={5} scope="rowgroup">
                      Fără raportări în ultima oră
                    </th>
                  </tr>
                ) : null}
                {view.calm.map((row) => (
                  <Row key={row.zone.slug} citySlug={city.slug} row={row} quiet />
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span>
              <StatusBadge status="avarie">3+</StatusBadge> probabil avarie, minim 3 persoane
            </span>
            <span>
              <StatusBadge status="raportari">1</StatusBadge> raportări izolate
            </span>
            <span>
              <StatusBadge status="liniste" /> fără raportări
            </span>
          </div>
        </div>
        <aside className="stack">
          <h2>{`Numere de avarii în ${city.name}`}</h2>
          <p className="small muted">Noi doar adunăm raportările. Ca să rezolve cineva, sună la furnizor.</p>
          <ul className="rows panel">
            {SERVICES.map((service) => (
              <li key={service.slug} className="item">
                <span className="row-title">
                  <ServiceIcon slug={service.slug} />
                  {service.name}
                </span>
                <p className="small muted">
                  {`${city.providers[service.slug].name}: `}
                  <a href={telHref(city.providers[service.slug].phone)}>{city.providers[service.slug].phone}</a>
                  {` (${city.providers[service.slug].phoneNote})`}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
