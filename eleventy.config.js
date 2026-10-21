export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ portfolio: 'portfolio', 'src/assets': 'assets' });
  eleventyConfig.ignores.add('legacy/**');

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data',
    },
  };
}
