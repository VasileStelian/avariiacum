import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Adresele din plan au bară la final: /bacau/, /bacau/apa/, /bacau/republicii/
  trailingSlash: true,
};

export default nextConfig;
