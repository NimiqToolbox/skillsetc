// Rewrites root-relative `<a href="/...">` and `<img src="/...">` in markdown
// to include Astro's configured `base` prefix — so links resolve under
// /<base>/<path> on GitHub Pages or any sub-path host.
//
// Usage in astro.config.mjs:
//   import rehypeBasePath from './src/lib/rehype-base-path.mjs';
//   rehypePlugins: [[rehypeBasePath, { base: '/skillsetc' }]]

import { visit } from 'unist-util-visit';

export default function rehypeBasePath({ base = '' } = {}) {
  const prefix = String(base).replace(/\/+$/, '');
  if (!prefix) return () => () => {};

  const ATTR_BY_TAG = {
    a: 'href',
    img: 'src',
    source: 'src',
    video: 'src',
    audio: 'src',
    link: 'href',
    iframe: 'src',
  };

  return () => (tree) => {
    visit(tree, 'element', (node) => {
      const attr = ATTR_BY_TAG[node.tagName];
      if (!attr) return;
      const v = node.properties?.[attr];
      if (typeof v !== 'string') return;
      // Skip external, hash-only, already-prefixed, and non-root paths
      if (/^([a-z]+:)?\/\//i.test(v)) return;
      if (v.startsWith('mailto:') || v.startsWith('tel:')) return;
      if (v.startsWith('#')) return;
      if (!v.startsWith('/')) return;
      if (v.startsWith(prefix + '/')) return;
      node.properties[attr] = prefix + v;
    });
  };
}
