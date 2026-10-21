// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://danielthorp.com',
  // The site is rebuilt only when its content changes (a commit or a new
  // Substack post), so the build time is when the page last changed.
  integrations: [sitemap({ lastmod: new Date() })],
  // The display serif for the hero and headings, fetched from Fontsource at
  // build time and served from this site, so the name looks the same on every
  // platform. Layout.astro preloads the upright Latin file, since the name is
  // the first thing on screen.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Source Serif 4',
      cssVariable: '--font-display',
      // Static faces: a browser fetches only the ones the page uses.
      weights: ['400', '600', '700'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Palatino', 'Times New Roman', 'serif'],
    },
  ],
});
