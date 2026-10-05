import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";

import { CITIES } from "@/config/locations";
import { siteUrl } from "@/lib/site";

import "./globals.css";

// Fonturi găzduite în repo (subset: latin + ă â î ș ț + punctuație), ca build-ul să nu depindă de
// Google Fonts: o cerere eșuată spre Google a picat build-ul din CI. Licențe OFL în ./fonts.
const display = localFont({
  src: [
    { path: "./fonts/ps-600.woff2", weight: "600" },
    { path: "./fonts/ps-700.woff2", weight: "700" },
  ],
  variable: "--font-display",
});

const body = localFont({
  src: [
    { path: "./fonts/atk-400.woff2", weight: "400" },
    { path: "./fonts/atk-700.woff2", weight: "700" },
  ],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl(process.env.SITE_URL)),
  openGraph: { siteName: "Avarii Acum", locale: "ro_RO", type: "website" },
  title: "Avarii Acum: apă, curent, gaz și căldură, pe cartiere",
  description: "Raportări anonime de la locuitori despre avariile de apă, curent, gaz și căldură, pe cartiere. Bacău și Iași.",
};

// Linkurile interne nu preîncarcă: după o raportare, Next 16 reface preîncărcarea pe segmente, iar
// pentru paginile ISR încă negenerate serverul răspunde 404 (erori în consola utilizatorului).
// Navigarea merge la fel; costul e o mică așteptare la clic. Verificat în test/db/report-flow.test.ts.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="top">
          <div className="top-in">
            <Link prefetch={false} className="mark" href="/">
              Avarii <span>Acum</span>
            </Link>
            <nav className="cities" aria-label="Orașe">
              {CITIES.map((city) => (
                <Link prefetch={false} key={city.slug} href={`/${city.slug}/`}>
                  {city.name}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
        <footer className="foot">
          <p>Avarii Acum nu este furnizorul de apă, curent, gaz sau căldură. Afișăm ce raportează locuitorii.</p>
          <nav className="inline-links" aria-label="Despre site">
            <Link prefetch={false} href="/despre/">
              Despre
            </Link>
            <Link prefetch={false} href="/confidentialitate/">
              Confidențialitate
            </Link>
          </nav>
          <p>
            Făcut de <a href="https://fanvora.ro">Fanvora Digital Studio</a>, Bacău
          </p>
        </footer>
      </body>
    </html>
  );
}
