import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import pagefind from 'astro-pagefind';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeBasePath from './src/lib/rehype-base-path.mjs';

const buildDate = new Date().toISOString().slice(0, 10);

// Site + base — overridable from env so the same config works locally,
// in Docker (root '/'), and on GitHub Pages (sub-path).
const site = process.env.SITE_URL ?? 'http://localhost';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.BUILD_DATE': JSON.stringify(buildDate),
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'vesper',
      wrap: false,
    },
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['heading-anchor'], 'aria-label': 'Permalink' },
          content: { type: 'text', value: '#' },
        },
      ],
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      [rehypeBasePath, { base }],
    ],
  },
  experimental: { clientPrerender: true },
});
