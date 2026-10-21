// Computed SEO data for every page under src/london/. No postal address anywhere — areaServed only.
const SITE_URL = 'https://upmarketingads.com';

const business = (areaServed) => ({
  '@type': 'ProfessionalService',
  name: 'UP Marketing Ads',
  url: SITE_URL,
  telephone: '+447547020024',
  areaServed,
  knowsLanguage: ['en', 'pt', 'fr'],
});

export default {
  lang: 'en',
  extraCss: ['/assets/css/pages.css'],
  eleventyComputed: {
    title: (data) => data.area?.title ?? data.title,
    description: (data) => data.area?.description ?? data.description,
    canonical: (data) => (data.area ? `/london/${data.area.slug}/` : data.canonical),
    ogImage: (data) => (data.area ? `/assets/img/og/london-${data.area.slug}.jpg` : data.ogImage),
    jsonld: (data) => {
      const a = data.area;
      if (!a) {
        return {
          '@context': 'https://schema.org',
          '@graph': [business({ '@type': 'City', name: 'London' })],
        };
      }
      return {
        '@context': 'https://schema.org',
        '@graph': [
          business({ '@type': 'Place', name: `${a.name}, London` }),
          {
            '@type': 'FAQPage',
            mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'London', item: `${SITE_URL}/london/` },
              { '@type': 'ListItem', position: 3, name: a.name, item: `${SITE_URL}/london/${a.slug}/` },
            ],
          },
        ],
      };
    },
  },
};
