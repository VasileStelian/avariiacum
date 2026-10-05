import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Public_Sans } from "next/font/google";
import Link from "next/link";

import { CITIES } from "@/config/locations";

import "./globals.css";

const display = Public_Sans({ subsets: ["latin", "latin-ext"], weight: ["600", "700"], variable: "--font-display" });

// Next nu are metrici pentru acest font, deci nu poate genera o rezervă ajustată; CLS se măsoară la verificare.
const body = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-body",
  fallback: ["system-ui", "Arial", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Avarii Acum: apă, curent, gaz și căldură, pe cartiere",
  description: "Raportări anonime de la locuitori despre avariile de apă, curent, gaz și căldură, pe cartiere. Bacău și Iași.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="top">
          <div className="top-in">
            <Link className="mark" href="/">
              Avarii <span>Acum</span>
            </Link>
            <nav className="cities" aria-label="Orașe">
              {CITIES.map((city) => (
                <Link key={city.slug} href={`/${city.slug}/`}>
                  {city.name}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
        <footer className="foot">
          <p>Avarii Acum nu este furnizorul de apă, curent, gaz sau căldură. Afișăm ce raportează locuitorii.</p>
          <p>
            Făcut de <a href="https://fanvora.ro">Fanvora Digital Studio</a>, Bacău
          </p>
        </footer>
      </body>
    </html>
  );
}
