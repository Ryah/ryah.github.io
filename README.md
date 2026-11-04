# Ryan A / Ryah

Personal portfolio and Vexa homepage at **https://ryah.github.io/**.

Plain HTML, CSS, and optional JavaScript for themes, specimen lighting, scroll reveals, and an inspiration die. No dependencies or build step.
GitHub Pages serves the root of `main`; `.nojekyll` keeps the files as written.

## Edit the site

- `index.html`: personal introduction, distinct Vexa and TeleWire projects, related AetherKit SDK feature, and about text.
- `vexa/index.html`: Vexa overview, core simulation philosophy, six source-backed feature highlights, related AetherKit SDK, project links, and expandable FAQ. Replace the release-information paragraph with a current download and setup guide when ready.
- `aetherkit/index.html`: introductory author guide with section navigation, annotated arc and hook examples, tracks, state/dice concepts, and troubleshooting. Links to the public SDK for the full syntax and integration contract.
- `assets/site.css`: shared layout, typography, responsive rules, and light/dark theme variables.
- `assets/theme.js`: saved theme preference, specimen lighting, progressive scroll reveals, and the interactive d20 inspiration toy. Dark is the brand default; visitors can choose a light version.
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

The portfolio stays personal, with Vexa as the main project, TeleWire TRP-AO as a separate prompting-style project, and AetherKit SDK as a related card-authoring project. Vexa is a SillyTavern/Lumiverse AI roleplay preset written in TeleWire TRP-AO; the style and the preset are distinct. The portfolio, `/vexa/`, and `/aetherkit/` share the design. The SDK guide uses a sticky contents sidebar on desktop and an in-flow contents list on phones. Existing routes, research files, metadata, and release-status information are preserved.

The hero has a short entrance sequence. Sections reveal once as they enter view. The Reanimate button toggles specimen lighting and exposes its state with `aria-pressed`. The d20 can be rolled again during a transition. There are no constant animation loops or audio. `prefers-reduced-motion` disables motion, and dice results appear immediately. Reduced transparency and increased contrast also have CSS fallbacks. Without JavaScript, navigation, content, research downloads, and native FAQ still work; JavaScript-only controls stay hidden. The theme preference persists when browser storage is available.

## Update the research

The published whitepaper is an unchanged copy of the public HTML edition from FrankenSIM (v1.4, November 3, 2026). When updating it, copy its companion `token-evidence.py` and `.json`, plus the linked `trp-base-comparison` files. Keep relative paths intact. The whitepaper retains its own authorship and evidence disclosures.

## Publish

Commit and push to `main`. GitHub Pages should use **Deploy from a branch → main → / (root)** in the repository’s Settings → Pages. No custom domain is required.

The site contains no analytics, remote fonts, runtime packages, or external image dependencies.

## Feature copy sources

The Vexa feature summaries were checked against the local active Alpha v4 preset and the newer Lumiverse Alpha v5 snapshot in the FrankenSIM workspace. They describe prompt rules and design intent, not new live-runtime acceptance results. The highlights cover Aether Matrix/Dam, Sola/Tide, ARC Engine, Chekhov's Gun, Antithesis, and Atlas/World Turns. Private preset text is not copied into this public site.

AetherKit descriptions link to the [public SDK reference](https://github.com/Ryah/ST-Freaky-D20-Preset/blob/main/AetherKit-SDK.md). That document uses the earlier FrankenSIM name. It describes Flags, Specs, Hooks, persistent custom state, and custom dice; setup and version-specific integration remain in the reference rather than being presented as universal compatibility claims.

Vexa?s worldview section and the AetherKit guide are adapted from the public SDK reference, reviewed November 3, 2026. Philosophy belongs to Vexa; SDK-specific authoring guidance lives at `/aetherkit/`. The two small card-text examples are original illustrations of the documented syntax, not tested runtime fixtures. The guide describes prompt-driven behavior and retains version/setup caveats.

Antithesis routing copy was checked against the local `Preset - VEXA.json` in FrankenSIM on November 3, 2026: distributed function blocks, scene-dependent dispatch, and router hook checks. The site describes this experimental prompt architecture without reproducing private procedures. Decorative lightning bolts are inline SVGs using the current text color.
