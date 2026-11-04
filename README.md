# Ryan A / Ryah

Personal portfolio and Vexa homepage at **https://ryah.github.io/**.

Plain HTML, CSS, and optional JavaScript for themes, specimen lighting, scroll reveals, and an inspiration die. No dependencies or build step.
GitHub Pages serves the root of `main`; `.nojekyll` keeps the files as written.

## Edit the site

- `index.html`: personal introduction, selected projects, research, and about text.
- `vexa/index.html`: Vexa overview, project links, and expandable FAQ. Replace the release-information paragraph with a current download and setup guide when ready.
- `assets/site.css`: shared layout, typography, responsive rules, and light/dark theme variables.
- `assets/theme.js`: saved theme preference specimen lighting, progressive scroll reveals, and the interactive d20 inspiration toy. Dark is the brand default; visitors can choose a light version.
- `assets/fonts/`: self-hosted Space Grotesk with its Open Font License.
- `assets/*.webp`: optimized copies of Ryah’s supplied Vexa promotional artwork.
- `research/telewire/`: public whitepaper HTML/PDF/Markdown, token evidence, and comparison fixtures. No private preset source is included.

To add a project, copy the `article.project` block in `index.html`, update its text, image, and links, and add a folder with an `index.html` if it needs its own page. Use relative links so a local preview works too.

## Preview

From this folder, run `python -m http.server 8000` and open http://localhost:8000.
Check both themes and a narrow phone viewport after editing.

## Design and motion

Vexa's core palette is Obsidian `#101014`, Electric Magenta `#C0188A`, Toxic Green `#70FF38`, Deep Plum `#48143E`, Gunmetal `#41434A`, and Pale Rose `#E4B4A9`. Shared CSS variables also supply readable text and a pale rose daylight theme.

The art direction is Cyberpunk Gothic / Neon Frankenstein: oversized Space Grotesk typography, a tilted specimen portrait with orbital rings, metallic panels, and a floating frosted navigation surface. This is a CSS web approximation of translucent material, not an Apple framework. Panels use a 28px radius and controls use pill shapes; the portrait has its own specimen arch.

The portfolio stays personal, with Vexa as the main project and TeleWire as a separate research feature. Both `/` and `/vexa/` share the design. Existing routes, research files, metadata, and release-status information are preserved.

The hero has a short entrance sequence. Sections reveal once as they enter view. The Reanimate button toggles specimen lighting and exposes its state with `aria-pressed`. The d20 can be rolled again during a transition. There are no constant animation loops or audio. `prefers-reduced-motion` disables motion, and dice results appear immediately. Reduced transparency and increased contrast also have CSS fallbacks. Without JavaScript, navigation, content, research downloads, and native FAQ still work; JavaScript-only controls stay hidden. The theme preference persists when browser storage is available.

## Update the research

The published whitepaper is an unchanged copy of the public HTML edition from FrankenSIM (v1.4, November 3, 2026). When updating it, copy its companion `token-evidence.py` and `.json`, plus the linked `trp-base-comparison` files. Keep relative paths intact. The whitepaper retains its own authorship and evidence disclosures.

## Publish

Commit and push to `main`. GitHub Pages should use **Deploy from a branch → main → / (root)** in the repository’s Settings → Pages. No custom domain is required.

The site contains no analytics, remote fonts, runtime packages, or external image dependencies.
