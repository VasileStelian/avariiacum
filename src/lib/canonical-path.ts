// Toate adresele sunt cu litere mici (/bacau/apa/); cine scrie /Bacau/Apa/ e trimis la forma canonică.
export function canonicalPath(pathname: string): string | null {
  const lower = pathname.toLowerCase();

  return lower === pathname ? null : lower;
}
