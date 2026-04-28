# skillsetc · site

The static site that turns the seven-chapter field guide at the repo root into a premium editorial-dark website.

> **All commands run in Docker.** No `npm install`, `node`, or `astro` required on the host.

## Production (build + serve via nginx → `http://localhost:8080`)

```bash
docker compose up --build site
```

The first build takes a few minutes (npm install + `astro build` + Pagefind indexing). Subsequent builds are cached.

To stop:

```bash
docker compose down
```

## Development (hot-reload Astro dev server → `http://localhost:4321`)

```bash
docker compose --profile dev up --build dev
```

Source files are bind-mounted; edits to `src/**` reload the page automatically. `node_modules` lives inside the container so the host stays clean.

## Structure

```
site/
├── astro.config.mjs       # Astro 5 + MDX + sitemap + Pagefind + Tailwind 4 (vite)
├── package.json           # deps locked at semver-major
├── Dockerfile             # multi-stage prod (node-build → nginx-serve)
├── Dockerfile.dev         # dev container (Astro dev server, hot-reload)
├── docker-compose.yml     # `site` service (prod) + `dev` profile (hot-reload)
├── nginx.conf             # static-asset caching + security headers
├── public/                # static assets (favicon, OG image)
└── src/
    ├── content/docs/      # the six MDX chapters
    ├── content.config.ts  # collection schema (Astro 5)
    ├── data/nav.ts        # sidebar tree
    ├── layouts/           # BaseLayout · LandingLayout · DocLayout
    ├── components/        # Header · Sidebar · Toc · Hero · ConceptCard · …
    ├── pages/             # index.astro · 404.astro · docs/[...slug].astro
    ├── styles/            # global.css (@theme tokens) · prose.css · shiki.css
    └── lib/               # nav · headings · format helpers
```

## Tech

- **Astro 5** — content collections, MDX, View Transitions, zero JS by default
- **Tailwind CSS 4** — design tokens via `@theme {}` in CSS (no `tailwind.config.js`)
- **Shiki** (`vesper` theme) — built into Astro for code syntax highlighting
- **Pagefind** — client-side full-text search, ~250–400 KB index
- **Inter / Newsreader / JetBrains Mono** — self-hosted via fontsource-variable

## Deploy

Any static host works. The production image's `dist/` is at `/usr/share/nginx/html` inside the `site` container; copy it out with:

```bash
docker compose run --rm --no-deps -v "$(pwd)/dist-export:/export" site sh -c 'cp -r /usr/share/nginx/html/* /export/'
```

Or push the image to a registry and run it as-is.
