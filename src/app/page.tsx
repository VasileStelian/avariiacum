import { PendingLink } from "@/components/pending-link";
import { ReportDialog } from "@/components/report-dialog";

import { CITIES } from "@/config/locations";
import { cityReport } from "@/lib/report-props";

export default function Home() {
  return (
    <main className="page">
      <div className="head">
        <h1>Avarii acum în România</h1>
        <p className="lead">Vezi ce raportează vecinii despre apă, curent, gaz și căldură, pe cartiere.</p>
        <ReportDialog label="Raportează o problemă" cities={CITIES.map((city) => cityReport(city))} />
      </div>
      <ul className="rows panel">
        {CITIES.map((city) => (
          <li key={city.slug}>
            <PendingLink className="row-link" href={`/${city.slug}/`}>
              <span className="row-name">{city.name}</span>
              <span className="muted">{`${city.zones.length} cartiere`}</span>
            </PendingLink>
          </li>
        ))}
      </ul>
    </main>
  );
}
