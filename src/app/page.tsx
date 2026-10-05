import Link from "next/link";

import { CITIES } from "@/config/locations";

export default function Home() {
  return (
    <main className="page">
      <div className="head">
        <h1>Avarii acum în România</h1>
        <p className="lead">Vezi ce raportează vecinii despre apă, curent, gaz și căldură, pe cartiere.</p>
      </div>
      <ul className="rows panel">
        {CITIES.map((city) => (
          <li key={city.slug}>
            <Link className="row-link" href={`/${city.slug}/`}>
              <span className="row-name">{city.name}</span>
              <span className="muted">{`${city.zones.length} cartiere`}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
