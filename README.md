# Ryan A / Ryah

Personal portfolio and Vexa homepage at **https://ryah.github.io/**.

Plain HTML, CSS, and a small optional theme toggle. No dependencies or build step.
GitHub Pages serves the root of `main`; `.nojekyll` keeps the files as written.

## Edit the site

- `index.html`: personal introduction, selected projects, research, and about text.
- `vexa/index.html`: Vexa overview, project links, and expandable FAQ. Replace the release-information paragraph with a current download and setup guide when ready.
- `assets/site.css`: shared layout, typography, responsive rules, and light/dark theme variables.
- `assets/theme.js`: optional theme preference; system theme is the default.
- `assets/*.webp`: optimized copies of Ryah’s supplied Vexa promotional artwork.
- `research/telewire/`: public whitepaper HTML/PDF/Markdown, token evidence, and comparison fixtures. No private preset source is included.

To add a project, copy the `article.project` block in `index.html`, update its text, image, and links, and add a folder with an `index.html` if it needs its own page. Use relative links so a local preview works too.

## Preview

From this folder, run `python -m http.server 8000` and open http://localhost:8000.
Check both themes and a narrow phone viewport after editing.

## Update the research

The published whitepaper is an unchanged copy of the public HTML edition from FrankenSIM (v1.4, November 3, 2026). When updating it, copy its companion `token-evidence.py` and `.json`, plus the linked `trp-base-comparison` files. Keep relative paths intact. The whitepaper retains its own authorship and evidence disclosures.

## Publish

Commit and push to `main`. GitHub Pages should use **Deploy from a branch → main → / (root)** in the repository’s Settings → Pages. No custom domain is required.

The site contains no analytics, remote fonts, runtime packages, or external image dependencies.
