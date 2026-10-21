# Daniel Thorp

Personal website at <https://danielthorp.com>. Built with [Astro](https://astro.build).

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build locally
npm run images   # Regenerate icons, the social card, and the headshot
```

The icons, social card, and headshot in `public/` are committed. After changing
`public/og-image.svg`, `src/assets/favicon.png`, or `src/assets/profile.png`,
run `npm run images` and commit the results.

## Content

- One-sentence description (meta description, structured data, and
  `llms.txt`): `src/data/site.ts`. Keep it under 160 characters.
- Current status: `src/data/now.ts`. The "Updated" date comes from the file's
  last commit, and the build fails if a role or status is too long for the
  board.
- Experience: `src/data/experience.ts`.
- Projects: `src/data/projects.ts`. Only public repositories are listed; add
  `url` for a live site.
- Writing (the "Opinion" section) is fetched from the Substack feed at build
  time, with a fallback list of the newest posts in
  `src/components/home/Writing.astro`. Update that list when you publish.
- `/llms.txt` is a plain-text summary built from the same data files.

## Rebuilds

A GitHub Actions workflow (`.github/workflows/rebuild.yml`) runs three times a
day. It triggers a Cloudflare rebuild when the newest Substack post isn't on
the live site yet, or when the last build couldn't read the feed and fell back
to the hand-written list. Running it by hand always rebuilds. It needs the
Cloudflare deploy hook URL in the `CLOUDFLARE_DEPLOY_HOOK` repository secret.

## License

The code in this repository is licensed under the [MIT License](LICENSE).
All site content and writing remain © Daniel Thorp unless otherwise noted.
