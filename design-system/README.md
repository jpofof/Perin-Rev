# @perin/design-system

Design system da Perin Construções — tokens e componentes React extraídos do site institucional (`../index.html` / `../styles.css`). Fonte da verdade continua sendo o site; este pacote formaliza o que já está em produção lá.

## Instalação e build

```bash
cd design-system
npm install
npm run build
```

Gera `dist/index.js` (ESM) + `dist/index.css` + `dist/index.d.ts`.

## Componentes (v0.1 — núcleo essencial)

| Componente | Extraído de | Variantes |
|---|---|---|
| `Button` | `.hero-button-secondary`, `.nav-link-highlight`, `.form-submit-button`, `.cta-principal-btn-secundario` | `solid` (verde sólido), `glass` (fluid glass sobre fundo escuro), `outline` (contorno sobre fundo claro) |
| `Card` | `.about-image-frame`, `.stat-card`, `.hero-contact-card` | `default`, `stat` (número + rótulo), `accent` (fundo verde) |
| `Badge` | `.section-tag` | — |

## Uso

```tsx
import { Button, Card, Badge } from '@perin/design-system';

<Badge>Sobre Nós</Badge>

<Button variant="solid" href="#contact">Solicitar Orçamento</Button>

<Card variant="stat" number="12+" label="Anos de atuação" />
```

Ver `src/examples/usage.tsx` para um exemplo de composição completo.

## Tokens

Todas as cores/fontes/espaçamentos vivem em `src/tokens.css`, espelhando o `:root` de `../styles.css`. Ao mudar um token no site, atualize aqui também (não o inverso — o site é a fonte da verdade).

## Escopo desta versão

Só os 3 primitivos mais reaproveitados no site foram portados nesta primeira versão, para manter o pacote pequeno e bem testado. Candidatos para uma próxima rodada: `Input`/`Select` (formulário de contato), `Accordion` (FAQ), `Tabs` (segmentos de serviços).

## Histórico de mudanças

- **v0.1.0** — criação do pacote: tokens + `Button`, `Card`, `Badge` extraídos do site Perin_Rev.
