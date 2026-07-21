# Inventário de Branches — Consolidação para Master

> **HISTÓRICO — não é um documento ativo.** Recuperado do worktree `Perin_Rev` (nunca havia sido commitado) e movido para cá em 21/07/2026. Foi gerado quando `master` ainda estava em `044eaff`, antes da consolidação das três branches abaixo ter sido de fato executada. As 3 branches (`feat/hero-timelapse-video`, `perf/otimizacao-performance`, `teste/skills-design-emil-taste`) já foram todas incorporadas à master e deletadas — confirmado via `audit/relatorio-arquivos-desnecessarios.md`/raio-x de branches desta sessão (0 commits à frente da master antes da remoção). Mantido só como registro de como a decisão de merge foi analisada na época.

---

> Gerado a partir de `git fetch --all`, `git log`/`git diff --stat` e simulações de merge (`--no-commit --no-ff`, sempre desfeitas com `--abort`/`reset --hard`). Nenhuma branch foi alterada, nenhum merge foi efetivado. `master` local está em sync com `origin/master` (`044eaff`).

## Branches encontradas

| Branch | Local | Remota | Commits à frente da master |
|---|---|---|---|
| `feat/hero-timelapse-video` | ✅ | ✅ (`origin/feat/hero-timelapse-video`) | 5 |
| `perf/otimizacao-performance` | ✅ | ❌ (nunca pushada) | 1 (squash de toda a sessão de otimização) |
| `teste/skills-design-emil-taste` | ✅ | ✅ (`origin/teste/skills-design-emil-taste`) | 5 |

## Tabela do inventário

| Branch | Commits à frente | Arquivos tocados | Propósito (pelo nome/commits) | Testada? |
|---|---|---|---|---|
| `feat/hero-timelapse-video` | 5 | `.claude/skills/*` (6 arquivos, **remoção**), `.gitignore`, `README.md`, `index.html`, `script.js`, `styles.css`, `assets/images/hero-fundo/*` (novo), `assets/videos/*` (4 arquivos novos, mp4+webm), `technical-plan.md`, `implementation-notes.md` | Adiciona vídeo time-lapse em loop como background do Hero (substitui o canvas CSS/SVG atual), com poster de fallback e ajustes de overlay/mobile. Último commit remove `.claude` como submodule e ajusta `.gitignore` | ✅ 107/107 |
| `perf/otimizacao-performance` | 1 | `README.md`, `index.html`, `styles.css`, `script.js`, `package.json`/`package-lock.json`, + ~35 arquivos novos (`_headers`, `fonts/`, `img-originais/`, `src-original/`, `audit/*`, `*.min.css`/`*.min.js`, `RELATORIO-PERFORMANCE.md`) | Otimização completa de performance: imagens responsivas do carrossel, lazy loading, `defer`, fontes self-hosted, cache (`_headers`), minificação manual, **remoção do Bootstrap CDN** (0% de uso real confirmado), redimensionamento de logos. Lighthouse Score 81→97 | ✅ 107/107 (extensivamente testado ao longo de toda a sessão) |
| `teste/skills-design-emil-taste` | 5 | `index.html`, `styles.css`, `package-lock.json`, `assets/images/brand/favicon-*.png` + `apple-touch-icon.png` (4 arquivos novos) | Adiciona favicon completo (16/32/48px + apple-touch-icon) gerado do wordmark da marca, diferencia avatares de depoimento (residencial vs. comercial), aplica `text-wrap`/de-hardcode de `font-family` em SVG, regenera `package-lock.json`, e **também remove o Bootstrap CDN** (`chore: remove unused Bootstrap CDN and dead CSS overrides`) | ✅ 107/107 |

## Simulação de merge contra a master (individual)

| Branch | Merge isolado contra master |
|---|---|
| `feat/hero-timelapse-video` | ✅ **Limpo** — sem conflitos. Atenção: reintroduz a **remoção dos 6 arquivos `.claude/skills/*.md`** que hoje existem na master (a branch os removeu num commit anterior à reorganização feita depois na master) |
| `perf/otimizacao-performance` | ✅ **Limpo** — sem conflitos (a branch já parte do commit atual da master) |
| `teste/skills-design-emil-taste` | ✅ **Limpo** — sem conflitos |

**Todas as três mergeiam limpo isoladamente contra a master.** O risco real aparece nas combinações.

## Simulação de merge combinado (par a par, ordem testada nos dois sentidos)

| Combinação | Resultado |
|---|---|
| `hero` + `perf` (qualquer ordem) | ✅ **Limpo** — tocam `index.html`/`script.js`/`styles.css`, mas em regiões diferentes (hero mexe na seção `#hero`; perf mexe em `<head>`, scripts no fim do body, carrossel de portfólio) |
| `hero` + `teste` (qualquer ordem) | ✅ **Limpo** — mesma razão, regiões não sobrepostas |
| **`perf` + `teste` (qualquer ordem)** | ❌ **CONFLITO** em `index.html` e `package-lock.json` |
| `hero` + `perf` + `teste` (hero e perf primeiro, teste por último) | ❌ Mesmo conflito de `perf`+`teste` se propaga — `hero` não interfere nem resolve |

### Detalhe do conflito `perf` × `teste`

**`index.html`** — conflito em duas regiões, mesma causa raiz: as duas branches resolveram o **mesmo problema (Bootstrap CDN)** de formas diferentes e pararam em pontos diferentes da otimização:

1. **`<head>`** — `teste` adiciona os `<link rel="icon">` do favicon (novo, não existe em `perf`) **e mantém** Google Fonts via CDN + `styles.css` não minificado. `perf` já não tem mais Google Fonts (self-hosted em `/fonts`) e referencia `styles.min.css`. Não é um conflito de "escolher um lado" — a resolução correta precisa **combinar os dois**: manter os favicons de `teste` + manter as fontes locais/minificação de `perf`.
2. **Fim do `<body>`** — `teste` mantém `script.js` sem `defer` e sem minificação; `perf` já tem `script.js` → `script.min.js` com `defer`. Mesma natureza: precisa combinar (manter a referência minificada/deferred de `perf`).

**`package-lock.json`** — conflito mecânico: `teste` regenerou o lockfile num commit próprio (`chore: regenerate package-lock.json`), `perf` adicionou `devDependencies` novas (`lighthouse`, `terser`, `clean-css-cli`, `html-minifier-terser`, `sharp-cli`). Resolução não é um merge de texto — depois de resolver, é necessário rodar `npm install` de novo para regenerar o lockfile a partir do `package.json` combinado.

**`styles.css`** — nas três combinações testadas, o merge automático desse arquivo **sempre teve sucesso sem conflito** (as mudanças de `teste` e `perf` em `styles.css` não se sobrepõem linha a linha), mas vale revisão manual pós-merge já que ambas as branches tocam nele por motivos relacionados ao Bootstrap.

## Branch que parece obsoleta / já implicitamente resolvida

**Nenhuma branch está totalmente obsoleta**, mas há sobreposição parcial a resolver conscientemente:

- A remoção do Bootstrap em `teste/skills-design-emil-taste` (commit `b28b0ed`) foi feita **de forma independente e provavelmente sem saber** da investigação e remoção já feita (com muito mais rigor — investigação de 0% de uso real documentada em `audit/bootstrap-uso-real.md`) em `perf/otimizacao-performance`. Ao mergear as duas, a remoção de `teste` se torna redundante — o resultado final (Bootstrap fora) é o mesmo, mas o merge vai exigir escolher manualmente qual "versão pós-Bootstrap" do `index.html` prevalece em cada trecho (ver detalhe do conflito acima). Recomendo revisar o commit `6b43344` (`feat: apply text-wrap and de-hardcode SVG font-family`) e `95ce634` (avatares de depoimento) de `teste` isoladamente, pois essas mudanças em `styles.css`/`index.html` **não têm equivalente em `perf`** e precisam ser preservadas no merge.

## Ordem de merge sugerida

**Não decidi sozinho por haver ambiguidade real** — duas ordens razoáveis, cada uma com trade-off diferente:

### Opção 1 — `feat/hero-timelapse-video` → `perf/otimizacao-performance` → `teste/skills-design-emil-taste`
- **Prós:** os dois primeiros merges são 100% automáticos, sem intervenção. Só o último merge (`teste`) exige resolução manual, e nesse ponto o `index.html` já está no estado final "otimizado" (minificado, deferred, fontes locais) — ao resolver o conflito, fica mais claro que a tarefa é "adicionar os favicons e as demais features de `teste` por cima do que já foi otimizado", preservando as otimizações de performance como base.
- **Contras:** ao resolver o conflito, é preciso ter cuidado para não perder a remoção do Bootstrap feita por `teste` de um jeito compatível — mas como o resultado final (Bootstrap fora) é idêntico em ambas, o risco real é baixo, só exige atenção ao juntar os favicons.

### Opção 2 — `feat/hero-timelapse-video` → `teste/skills-design-emil-taste` → `perf/otimizacao-performance`
- **Prós:** os dois primeiros merges são automáticos. O conflito final acontece ao mergear `perf`, e como `perf` é a branch mais testada/documentada desta sessão (3 rodadas de validação, Lighthouse, testes visuais), resolver o conflito "por cima" dela (isto é, garantir que as otimizações de `perf` prevalecem, incorporando só os favicons de `teste` que faltam) pode ser mais natural de auditar.
- **Contras:** o `RELATORIO-PERFORMANCE.md` e os relatórios Lighthouse em `audit/` foram gerados **contra o estado do site sem os favicons/demais features de `teste`** — se `teste` for mergeada antes, os números de Lighthouse já registrados ficam associados a um estado do `index.html` ligeiramente diferente do que vai pra produção (embora favicon não deva ter impacto real de performance).

**Ambas as ordens exigem a mesma resolução manual de conflito em `index.html`/`package-lock.json`** — a diferença é só qual branch "está por baixo" no momento da resolução, ou seja, uma questão de fluxo de trabalho/auditoria, não de risco técnico. `feat/hero-timelapse-video` deve vir primeiro em qualquer ordem, já que não conflita com nenhuma das outras duas e resolve independentemente.

**Ponto de atenção adicional para qualquer ordem escolhida:** o merge de `feat/hero-timelapse-video` reintroduz a remoção dos arquivos `.claude/skills/*.md` — confirmar antes se isso é intencional (a master já os tem restaurados desde a reorganização de assets) ou se deve ser resolvido mantendo os arquivos.

## Aguardando decisão

Nenhum merge foi efetivado. Aguardando você escolher a ordem (Opção 1, Opção 2, ou outra) e autorizar branch por branch.
