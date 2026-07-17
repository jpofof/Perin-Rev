# Consolidação de Branches — Master Local

> Master local consolidada a partir de `origin/master` (`044eaff`) + 3 branches, na ordem definida pelo usuário. **Nenhum push foi feito.** Detalhes de cada branch individualmente em `audit/inventario-branches.md`. Ganho de performance detalhado em `RELATORIO-PERFORMANCE.md`.

## Branches mergeadas, nesta ordem

1. **`feat/hero-timelapse-video`** (5 commits) — fast-forward, sem conflito.
2. **`perf/otimizacao-performance`** (1 commit) — merge commit `a5efbfe`, sem conflito.
3. **`teste/skills-design-emil-taste`** (5 commits) — merge commit `1379a6e`, **conflito esperado** em `index.html` e `package-lock.json`, resolvido manualmente conforme instrução.

## O que foi preservado de cada branch

### `feat/hero-timelapse-video`
- Vídeo time-lapse em loop no Hero (`assets/videos/*.mp4`/`*.webm`, poster `.webp`), overlay e ajustes de enquadramento mobile.
- **Efeito colateral esperado:** reintroduziu a remoção dos 6 arquivos `.claude/skills/*.md` (a branch os removeu num commit anterior à reorganização de assets feita depois na master). Sinalizado no inventário antes do merge; usuário optou por prosseguir na ordem definida sem alterar esse ponto.

### `perf/otimizacao-performance`
- Todas as otimizações das 3 rodadas: imagens responsivas do carrossel (`srcset`), lazy loading, `defer` nos scripts, fontes self-hosted (`/fonts`), `_headers` de cache, minificação manual (`styles.min.css`/`script.min.js`), remoção do Bootstrap CDN (0% de uso real, investigado em `audit/bootstrap-uso-real.md`), redimensionamento dos 3 logos superdimensionados.
- `RELATORIO-PERFORMANCE.md`, toda a pasta `audit/` desta sessão, `src-original/` e `img-originais/` (backups) preservados integralmente.

### `teste/skills-design-emil-taste`
- Favicon completo (`favicon-16/32/48.png`, `apple-touch-icon.png`) + tags `<link rel="icon">`/`<link rel="apple-touch-icon">` no `<head>`.
- Avatares de depoimento diferenciados (`testimonial-avatar-residential`/`testimonial-avatar-commercial`, SVGs distintos por segmento).
- `text-wrap: balance` (h1/h2) e `text-wrap: pretty` (p) como rede de segurança contra palavras órfãs; remoção de `font-family="Manrope"` hardcoded em `<text>` de SVG, agora herdado via regra `svg text` ligada ao token `--font-primary`.
- **Não preservado por ser redundante:** a remoção do Bootstrap feita nesta branch (commit `b28b0ed`) não teve efeito próprio no resultado final — o Bootstrap já tinha sido removido por `perf` de forma mais completa (investigação de uso real + preconnect + regressão de testes). O commit em si permanece no histórico da branch, só não gerou uma segunda remoção redundante no merge.

## Como o conflito foi resolvido

### `index.html`

**Região 1 — `<head>` (favicon vs. fontes/CSS):**
- Mantido de `perf`: ausência de Bootstrap CDN, `preconnect` para `cdnjs.cloudflare.com`, `preload` da fonte do hero (`fonts/manrope-latin.woff2`), `<link rel="stylesheet" href="styles.min.css">`.
- Incorporado de `teste`, por cima, sem remover nada de `perf`: as 4 tags `<link rel="icon">`/`apple-touch-icon">` do favicon.
- Descartado de `teste`: `<link rel="preconnect" href="https://fonts.googleapis.com">`/`fonts.gstatic.com` e o `<link>` do Google Fonts via CDN (obsoletos desde que `perf` fez self-host das fontes), e a referência a `styles.css` não minificado.

**Região 2 — bloco de scripts finais:**
- Mantida integralmente a versão de `perf`: GSAP + ScrollTrigger + `script.min.js`, todos com `defer`.
- Descartada a versão de `teste`: mesmos scripts sem `defer` e sem minificação (regressão em relação ao que `perf` já tinha resolvido).

**Resto do arquivo:** teve merge automático sem conflito — preserva simultaneamente o vídeo do hero (`feat`), o markup dos avatares de depoimento e o `text-wrap` (`teste`), e todas as otimizações de imagem/carrossel (`perf`).

### `styles.css`
Merge automático sem conflito em nenhuma das combinações testadas — as regras de `teste` (avatares, `text-wrap`, `svg text`) e de `perf` (nenhuma mudança de `perf` neste arquivo colidiu) coexistem sem sobreposição de linha.

### `package-lock.json`
Não resolvido manualmente, conforme instrução: aceito `--ours` (versão de `perf`, que já continha as `devDependencies` novas de otimização) como placeholder, `git commit` para fechar o merge, depois `rm package-lock.json && npm install` para regenerar do zero a partir do `package.json` já mesclado. O lockfile regenerado ficou **idêntico** ao que já estava commitado — nenhuma dependência de `teste` ficou de fora (a única mudança de `teste` em `package.json`/lockfile era a "regeneração" em si, sem dependência nova).

## Verificações explícitas pós-merge

- ✅ Favicons: 4 arquivos em `assets/images/brand/` + 4 tags `<link>` no `<head>`.
- ✅ Avatares de depoimento: `testimonial-avatar-residential`/`testimonial-avatar-commercial` presentes no `index.html`.
- ✅ `text-wrap`/`svg text`: `text-wrap: balance`/`pretty` em `styles.css:97,101`; regra `svg text` em `styles.css:131`; zero ocorrências de `font-family="Manrope"` hardcoded restantes.
- ✅ Bootstrap: `grep -rn "bootstrap" --include="*.html"` retorna **zero** no `index.html` real — a única ocorrência no repo é em `src-original/index.html` (backup intencional pré-minificação da rodada de performance, não é o site publicado).

## Testes rodados após cada merge

| Etapa | 107 testes | 65 regressão |
|---|---|---|
| Após `feat/hero-timelapse-video` | ✅ 107/107 | — |
| Após `perf/otimizacao-performance` | ✅ 107/107 | ✅ 65/65 |
| Após `teste/skills-design-emil-taste` (conflito resolvido) | ✅ 107/107 | ✅ 65/65 |

## Métricas de Lighthouse — evolução da consolidação

| Etapa | Score | LCP | TBT | Peso total | Requisições |
|---|---|---|---|---|---|
| Antes da consolidação (fim da rodada 3 de `perf`, sem hero video) | 97 | 2.4s | 50ms | 191 KiB | 13 |
| Após merge do hero video (Passo 2) | 95 | 2.7s | 100ms | **5.370 KiB** | 15 |
| Após merge final (favicon + avatares + text-wrap) | 95 | 2.6s | 110ms | 5.370 KiB | 15 |

**A queda de peso/score entre a 1ª e a 2ª linha é esperada e não é regressão do trabalho de otimização** — é o custo inerente de adicionar ~5,1 MB de vídeo MP4/WebM no Hero, uma feature funcional separada, mergeada por cima do trabalho de performance. O favicon e os avatares (3ª linha) não tiveram impacto adicional relevante no score (95→95, variações de LCP/TBT dentro do ruído normal do ambiente de teste local).

Relatórios completos: `audit/lighthouse-pos-hero-merge.report.html` (após Passo 2) e `audit/lighthouse-consolidacao-final.report.html` (após Passo 3, estado final).

## Pendência já identificada (fora do escopo desta consolidação)

O merge do hero video tornou o peso da página real (~5,1 MB de vídeo) uma nova frente de otimização em aberto — não investigada nesta tarefa (era só consolidação de branches). Recomendo tratar como rodada futura se a performance do Hero com vídeo precisar ser otimizada (compressão adicional dos MP4/WebM, lazy-load do vídeo, ou servir uma resolução menor).

## Estado atual

- Master local com os 3 merges aplicados, testes passando, **nenhum push feito**.
- Nenhuma das 3 branches (`feat/hero-timelapse-video`, `perf/otimizacao-performance`, `teste/skills-design-emil-taste`) foi deletada — todas seguem intactas para sua decisão posterior.
- Pronta para sua revisão antes do push.
