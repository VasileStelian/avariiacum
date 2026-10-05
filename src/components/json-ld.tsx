import { siteUrl } from "@/lib/site";

type Crumb = {
  name: string;
  path: string;
};

// Firimiturile, ca date structurate (schema.org BreadcrumbList); `<` e escapat ca să nu închidă scriptul.
export function Breadcrumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  const base = siteUrl(process.env.SITE_URL);

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${base}${crumb.path}` })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }} />;
}
