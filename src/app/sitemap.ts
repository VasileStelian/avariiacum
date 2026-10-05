import type { MetadataRoute } from "next";

import { siteUrl, sitemapPaths } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl(process.env.SITE_URL);

  return sitemapPaths().map((path) => ({ url: `${base}${path}` }));
}
