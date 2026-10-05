import "server-only";

// Pe Vercel, x-real-ip și x-forwarded-for sunt puse de platformă (valorile trimise de client sunt
// suprascrise), deci nu pot fi folosite ca să ocolească limita de 2 ore.
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return real || forwarded || "necunoscut";
}
