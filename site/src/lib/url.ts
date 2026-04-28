// Prefix root-relative URLs with the configured Astro `base` so links work
// when the site is hosted at a sub-path (e.g., GitHub Pages /skillsetc/).
//
// Usage:
//   import { withBase } from '~/lib/url';
//   <a href={withBase('/docs/skills')}>...</a>

const BASE_RAW = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

export function withBase(path: string): string {
  if (!path) return path;
  // External URLs and protocol-relative links: untouched
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }
  // Hash-only links: untouched
  if (path.startsWith('#')) return path;
  // Already has the base prefix: untouched
  if (BASE_RAW && path.startsWith(BASE_RAW + '/')) return path;
  // Relative path (no leading slash): untouched
  if (!path.startsWith('/')) return path;
  return `${BASE_RAW}${path}`;
}

export const BASE = BASE_RAW;
