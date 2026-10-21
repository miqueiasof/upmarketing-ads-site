// Computed SEO data for every page under src/services/.
const SITE_URL = 'https://upmarketingads.com';

export default {
  lang: 'en',
  extraCss: ['/assets/css/pages.css'],
  eleventyComputed: {
    title: (data) => data.service?.title ?? data.title,
    description: (data) => data.service?.description ?? data.description,
    canonical: (data) => (data.service ? `/services/${data.service.slug}/` : data.canonical),
    ogImage: (data) => (data.service ? `/assets/img/og/${data.service.slug}.jpg` : data.ogImage),
    jsonld: (data) => {
      const s = data.service;
      if (!s) return data.jsonld;
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Service',
            name: s.name,
            serviceType: s.name,
            description: s.description,
            url: `${SITE_URL}/services/${s.slug}/`,
            areaServed: { '@type': 'City', name: 'London' },
            provider: { '@type': 'ProfessionalService', name: 'UP Marketing Ads', url: SITE_URL, areaServed: 'London' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_URL}/services/` },
              { '@type': 'ListItem', position: 3, name: s.name, item: `${SITE_URL}/services/${s.slug}/` },
            ],
          },
        ],
      };
    },
  },
};
