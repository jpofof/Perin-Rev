# design-sync notes

Repo-specific gotchas for future re-syncs of `@perin/design-system`.

- **Build entry:** use `--entry ./dist/index.js` (matches `package.json`'s `main`/`module`). `./dist/index.es.js` does not exist and silently falls back to `[NO_DIST]` synthesis from `src/`.
- **Card `Stat` story:** needs `overrides.Card.cardMode: "column"` in `config.json` — without it, three side-by-side stat cards trigger `[GRID_OVERFLOW]`. A targeted rebuild (`preview-rebuild.mjs --components Card`) is enough to confirm the fix; column mode can't re-trigger the wide flag.
- **`readmeHeader` path:** must be relative to config home (the dir containing `.design-sync/`), i.e. `".design-sync/conventions.md"` — a bare `"conventions.md"` resolves to the wrong location.
- **Source of truth ordering:** the live site (`../index.html`/`../styles.css`) is authoritative; `design-system/src/` formalizes it. Update the site first if tokens/components diverge.

## Re-sync risks

- If `Button`/`Card`/`Badge` props change shape, previews in `.design-sync/previews/*.tsx` need matching updates or grading will regress.
- If a 4th component is added to the package, it needs its own preview file authored (not auto-generated) before the next sync — this skill doesn't invent stories.
