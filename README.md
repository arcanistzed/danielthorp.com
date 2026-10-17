# Daniel Thorp

Personal website at <https://danielthorp.com>. Built with [Astro](https://astro.build).

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build locally
npm run images   # Regenerate icons and the social card
```

The icons and social card in `public/` are committed. After changing
`public/og-image.svg` or `src/assets/favicon.png`, run `npm run images` and
commit the results.

## Content

- Current status: `src/data/now.ts`. The "Updated" date comes from the file's
  last commit.
- Experience and skills: `src/data/experience.ts`.
- Projects: `src/data/projects.ts`. Only public repositories are listed.
- Writing is fetched from the Substack feed at build time, with a fallback list
  in `src/components/home/Writing.astro`. A GitHub Actions workflow
  (`.github/workflows/rebuild.yml`) triggers a Cloudflare rebuild every Monday;
  it needs the deploy hook URL in the `CLOUDFLARE_DEPLOY_HOOK` repository
  secret.

## License

The code in this repository is licensed under the [MIT License](LICENSE).
All site content and writing remain © Daniel Thorp unless otherwise noted.
