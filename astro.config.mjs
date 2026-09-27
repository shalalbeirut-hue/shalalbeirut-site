import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';

// Paths for the private apps (staff system, customer account, invoice and survey pages).
const PRIVATE = ['/app/', '/my/', '/i/', '/r/'];

export default defineConfig({
  site: 'https://shalalbeirut.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    preact(),
    sitemap({
      filter: (page) => !page.includes('/404') && !PRIVATE.some((p) => new URL(page).pathname.startsWith(p)),
      i18n: { defaultLocale: 'ar', locales: { ar: 'ar-KW', en: 'en-KW' } },
    }),
  ],
});
