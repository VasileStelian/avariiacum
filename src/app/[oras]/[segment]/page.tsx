import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Axis, Bars } from "@/components/bars";
import { ServiceIcon } from "@/components/icons";
import { ReportDialog } from "@/components/report-dialog";
import { StatusBadge } from "@/components/status-badge";
import { type City, SERVICES, type Service, type Zone, findCity, resolveCitySegment } from "@/config/locations";
import { countRo, joinRo, timeAgo } from "@/lib/format";
import { reportProps } from "@/lib/report-props";
import { serviceView, zoneView } from "@/lib/views";
import { serverReportsStore } from "@/server/supabase";

// Randare la prima vizită, apoi din cache; se reîmprospătează cel mult o dată pe minut.
export const revalidate = 60;

export function generateStaticParams(): { oras: string; segment: string }[] {
  return [];
}

const PEOPLE = { one: "persoană", many: "persoane" };

async function resolve(params: PageProps<"/[oras]/[segment]">["params"]) {
  const { oras, segment } = await params;
  const city = findCity(oras);
  const target = city && resolveCitySegment(city, segment);

  return city && target ? { city, target } : null;
}

export async function generateMetadata({ params }: PageProps<"/[oras]/[segment]">): Promise<Metadata> {
  const resolved = await resolve(params);

  if (!resolved) {
    return {};
  }

  const { city, target } = resolved;

  if (target.kind === "service") {
    const provider = city.providers[target.service.slug];

    return {
      title: `${target.service.name} ${city.name} acum: avarii ${provider.name} raportate pe cartiere`,
      description: `Unde nu e ${target.service.name.toLowerCase()} în ${city.name}, după raportările locuitorilor din ultima oră, pe cartiere. Nu suntem ${provider.name}; numărul lor de avarii e pe pagină.`,
      alternates: { canonical: `/${city.slug}/${target.service.slug}/` },
    };
  }

  return {
    title: `${target.zone.name}, ${city.name}: avarii acum la apă, curent, gaz și căldură`,
    description: `Ce raportează vecinii din cartierul ${target.zone.name}, ${city.name}, în ultimele 24 de ore: apă, curent, gaz, apă caldă și căldură.`,
    alternates: { canonical: `/${city.slug}/${target.zone.slug}/` },
  };
}

async function ServicePage({ city, service }: { city: City; service: Service }) {
  const store = serverReportsStore();
  const [activity, series] = await Promise.all([store.cityActivity(city.slug), store.reportSeries(city.slug, service.slug, null)]);
  const view = serviceView(city, service.slug, activity);
  const provider = city.providers[service.slug];
  const now = new Date();

  return (
    <main className="page">
      <nav className="crumbs" aria-label="Ești aici">
        <Link prefetch={false} href={`/${city.slug}/`}>{city.name}</Link>
        <span aria-hidden="true">/</span>
        <span>{service.name}</span>
      </nav>
      <div className="head">
        <h1>{`${service.name} ${city.name} acum: avarii raportate pe cartiere`}</h1>
        <p className="lead">{view.affected.some((row) => row.status === "avarie") ? <strong>{view.headline}</strong> : view.headline}</p>
        <ReportDialog {...reportProps(city, `Raportează ${service.missingPhrase}`, { service: service.slug })} />
      </div>
      <div className="split">
        <div className="stack">
          <section className="panel chart" aria-labelledby="grafic">
            <div className="chart-top">
              <h2 id="grafic">Raportări în ultimele 24 de ore</h2>
              <span className="small muted">la 15 minute</span>
            </div>
            <Bars series={series} />
            <Axis />
            <p className="small muted">{view.lastReportAt ? `Ultimul raport ${timeAgo(view.lastReportAt, now)}` : "Niciun raport în ultimele 24 de ore"}</p>
          </section>
          {view.affected.length > 0 ? (
            <>
              <h2>Cartiere cu raportări</h2>
              <ul className="rows panel">
                {view.affected.map((row) => (
                  <li key={row.zone.slug} className="item">
                    <div className="row-top">
                      <Link prefetch={false} className="row-title" href={`/${city.slug}/${row.zone.slug}/`}>
                        {row.zone.name}
                      </Link>
                      <StatusBadge status={row.status}>
                        {row.status === "avarie" ? `Probabil avarie: ${countRo(row.reporters, PEOPLE)}` : countRo(row.reporters, { one: "raportare", many: "raportări" })}
                      </StatusBadge>
                    </div>
                    <p className="small muted">{`ultimul raport ${timeAgo(row.lastReportAt, now)}`}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {view.quietZones.length > 0 ? (
            <p className="small muted">
              <strong>Fără raportări în ultima oră:</strong> {`${joinRo(view.quietZones)}.`}
            </p>
          ) : null}
        </div>
        <aside className="stack">
          <section className="panel provider" aria-labelledby="furnizor">
            <h2 id="furnizor">{`Avarii ${service.shortName.toLowerCase()}: ${provider.name}`}</h2>
            <p className="small muted">{`${provider.fullName === provider.name ? "" : `${provider.fullName}. `}Nu suntem ${provider.name}; sună-i ca să afle și ei.`}</p>
            <p className="num">{provider.phone ?? "număr de verificat la sursă"}</p>
          </section>
          <p className="small muted">
            Afișăm „Probabil avarie” când cel puțin 3 persoane diferite din același cartier raportează în aceeași oră. Starea dispare singură când rapoartele se opresc.
          </p>
          <nav className="inline-links" aria-label="Alte servicii">
            {SERVICES.filter((other) => other !== service).map((other) => (
              <Link prefetch={false} key={other.slug} className="btn" href={`/${city.slug}/${other.slug}/`}>
                <ServiceIcon slug={other.slug} />
                {other.shortName}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </main>
  );
}

async function ZonePage({ city, zone }: { city: City; zone: Zone }) {
  const store = serverReportsStore();

  const [activity, ...series] = await Promise.all([
    store.cityActivity(city.slug),
    ...SERVICES.map((service) => store.reportSeries(city.slug, service.slug, zone.slug)),
  ]);

  const view = zoneView(city, zone.slug, activity);
  const now = new Date();

  return (
    <main className="page">
      <nav className="crumbs" aria-label="Ești aici">
        <Link prefetch={false} href={`/${city.slug}/`}>{city.name}</Link>
        <span aria-hidden="true">/</span>
        <span>{zone.name}</span>
      </nav>
      <div className="head">
        <h1>{`${zone.name}, ${city.name}: avarii acum`}</h1>
        <p className="lead">{view.services.some((row) => row.status === "avarie") ? <strong>{view.headline}</strong> : view.headline}</p>
        <ReportDialog {...reportProps(city, `Raportează în ${zone.name}`, { zone: zone.slug })} />
      </div>
      <div className="split">
        <ul className="rows panel">
          {view.services.map((row, index) => (
            <li key={row.service.slug} className="item">
              <div className="row-top">
                <span className="row-title">
                  <ServiceIcon slug={row.service.slug} />
                  {row.service.name}
                </span>
                <StatusBadge status={row.status}>
                  {row.status === "avarie" ? `Probabil avarie: ${countRo(row.reporters, PEOPLE)}` : null}
                  {row.status === "raportari" ? countRo(row.reporters, { one: "raportare", many: "raportări" }) : null}
                  {row.status === "liniste" ? "Fără raportări" : null}
                </StatusBadge>
              </div>
              <Bars series={series[index] ?? []} mini tone={row.status} />
              <Axis middle={row.lastReportAt ? `ultimul raport ${timeAgo(row.lastReportAt, now)}` : "niciun raport azi"} />
              {row.status === "liniste" ? null : (
                <Link prefetch={false} className="small" href={`/${city.slug}/${row.service.slug}/`}>
                  {`${row.service.shortName} în tot ${city.nameDefinite}`}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <aside className="stack">
          <h2>{`Alte cartiere din ${city.name}`}</h2>
          <nav className="inline-links" aria-label="Alte cartiere">
            {city.zones
              .filter((other) => other !== zone)
              .map((other) => (
                <Link prefetch={false} key={other.slug} href={`/${city.slug}/${other.slug}/`}>
                  {other.name}
                </Link>
              ))}
          </nav>
          <p className="small muted">Starea „Probabil avarie” apare la cel puțin 3 persoane diferite în aceeași oră și dispare singură.</p>
        </aside>
      </div>
    </main>
  );
}

export default async function SegmentPage({ params }: PageProps<"/[oras]/[segment]">) {
  const resolved = await resolve(params);

  if (!resolved) {
    notFound();
  }

  const { city, target } = resolved;

  return target.kind === "service" ? <ServicePage city={city} service={target.service} /> : <ZonePage city={city} zone={target.zone} />;
}
