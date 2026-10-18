// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://danielthorp.com',
  // The site is rebuilt only when its content changes (a commit or a new
  // Substack post), so the build time is when the page last changed.
  integrations: [sitemap({ lastmod: new Date() })]
});
