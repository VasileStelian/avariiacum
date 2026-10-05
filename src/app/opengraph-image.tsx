import { CITIES } from "@/config/locations";
import { OG_SIZE, statusImage } from "@/server/og";

export const size = OG_SIZE;

export const contentType = "image/png";

export const alt = "Avarii Acum: ce raportează vecinii despre apă, curent, gaz și căldură, pe cartiere";

// Imaginea implicită; paginile orașului, serviciului și cartierului au propria imagine, cu starea curentă.
export default function Image() {
  return statusImage(
    CITIES.map((city) => city.name).join(" și "),
    "Ce raportează vecinii despre apă, curent, gaz și căldură, pe cartiere",
    "neutru",
    "Gratuit, fără cont, raportări anonime",
  );
}
