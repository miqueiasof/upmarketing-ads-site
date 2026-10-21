import site from './src/_data/site.json' with { type: 'json' };

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ portfolio: 'portfolio', 'src/assets': 'assets' });
  eleventyConfig.ignores.add('legacy/**');

  eleventyConfig.addFilter('absoluteUrl', (path) => new URL(path || '/', site.url).href);
  // `</` escaped so inline JSON-LD can never close the <script> tag early
  eleventyConfig.addFilter('jsonld', (obj) => JSON.stringify(obj).replace(/<\//g, '<\\/'));

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data',
    },
  };
}
