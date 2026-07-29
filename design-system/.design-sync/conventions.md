## Perin Design System — build conventions

No provider or wrapper is required — every component (`Button`, `Card`, `Badge`) renders standalone, reading only CSS custom properties from `:root`.

**Styling idiom:** BEM-ish class names prefixed `pds-` (`pds-button`, `pds-button--solid`, `pds-card`, `pds-card--stat`, `pds-card__stat-number`, `pds-badge`). Variants are a modifier class (`pds-<block>--<variant>`), never a prop-driven inline style. All colors, radii, and fonts come from CSS custom properties defined in `tokens.css` — always reference the token (`var(--color-accent-primary)`, `var(--radius-pill)`, `var(--font-primary)`), never a hex/px literal, so a token change propagates everywhere.

**Source of truth:** the live site at repo root (`../index.html` / `../styles.css`) — this package (`design-system/src/`) formalizes what's already in production there. Component source: `src/components/<Name>/<Name>.tsx` + co-located `<Name>.css`. Tokens: `src/tokens.css`, mirrored from the site's `:root` (update the site first, this package second — never the reverse).

**Build snippet** (from `src/examples/usage.tsx`, the canonical composition):

```tsx
import { Badge, Button, Card } from '@perin/design-system';

<Badge>Sobre Nós</Badge>

<Card variant="accent">
  <h3>Solicite seu orçamento</h3>
  <Button variant="glass" href="#contact">Solicitar Orçamento</Button>
</Card>

<Card variant="stat" number="12+" label="Anos de atuação" />
```

`Button` renders an `<a>` when `href` is given, a `<button>` otherwise — same component, same variants (`solid`/`glass`/`outline`), never two separate components for link vs. action. `glass` variant is designed to sit over a dark/accent background (see `Card variant="accent"` above); `solid`/`outline` are for light backgrounds. `Card`'s `stat` variant is a distinct prop shape (`number` + `label`, no `children`) — the other variants (`default`/`accent`) take `children` instead.
