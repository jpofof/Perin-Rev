# Oportunidades identificadas para próxima rodada

> Comparação lida diretamente de `audit/lighthouse-antes.report.json` e `audit/lighthouse-depois.report.json` (o `.html` embute o mesmo JSON). Lighthouse 13.4.0 substituiu o painel clássico "Opportunities" pelo grupo "Insights" — a comparação abaixo usa os audits do grupo `insights` (equivalente funcional) e do grupo `diagnostics`. Nenhum código foi alterado nesta etapa.
>
> **Nenhum Lighthouse foi rodado de novo** — apenas leitura dos dois relatórios já existentes.

## Resolvidas nesta branch (perf/otimizacao-performance)

- **Minify CSS** (`unminified-css`) — score 0.5 (3 KiB de economia estimada) → score 1 (0 KiB). Resolvido pela minificação manual (`styles.min.css`).
- **Minify JavaScript** (`unminified-javascript`) — score 0 (6 KiB) → score 1 (0 KiB). Resolvido pela minificação manual (`script.min.js`).
- **Google Fonts como requisição bloqueante** (`render-blocking-insight`) — a entrada `fonts.googleapis.com/css2?...` (870ms de bloqueio, 1.47 KiB) **desapareceu completamente** da lista "depois". Resolvido pelo self-host das fontes em `/fonts`.
- **`styles.css` como requisição bloqueante** (mesmo audit `render-blocking-insight`) — o `wastedMs` desse arquivo caiu de 320ms para 162ms (arquivo bem menor após minificação). Ainda aparece na lista (continua sendo um `<link rel="stylesheet">` clássico, ver pendências), mas o custo caiu quase pela metade.
- **Peso total da página** (`total-byte-weight`) — 312 KiB → 274 KiB (score já era 1 em ambos por estar abaixo do limiar de reprovação, mas o valor absoluto caiu 12%).

## Pendentes (já existiam antes, não foram tratadas)

- **Bootstrap CDN é o maior item de `render-blocking-insight`** — 1269ms → 1125ms de bloqueio (34 KB), ainda o primeiro item da lista "depois". Impacto estimado: **~1.1s de bloqueio de renderização**, o maior item pendente do relatório. Esforço: médio (vendorizar CSS+JS bundle, decidir estrutura de pastas). **Já mapeado — ver Bootstrap CDN** (branch separada, conforme decisão já registrada em `RELATORIO-PERFORMANCE.md`).
- **CSS não utilizado do Bootstrap** (`unused-css-rules`) — 32 KiB → 11 KiB estimados (melhorou em valor absoluto porque o CSS ficou menor após minificação, mas o item em si **é 100% Bootstrap** em ambos os relatórios — `styles.css`/`styles.min.css` próprios não aparecem nessa lista nenhuma vez). **Já mapeado — ver Bootstrap CDN**, não é uma pendência nova e separada.
- **Cache de recursos estáticos** (`cache-insight`) — score 0 em ambos, não resolvido. Impacto estimado: 127 KiB → 163 KiB "sem cache" (piorou em valor absoluto, ver nota de ressalva abaixo). Esforço: **já resolvido no código** (`_headers` criado cobrindo `*.css`, `*.js`, `assets/images/*`, `fonts/*`) — o motivo de aparecer sem melhora é que o Lighthouse rodou contra `npx serve` local, que **não aplica `_headers`** (é uma feature exclusiva do Netlify). Este item só será refletido corretamente rodando o Lighthouse contra o deploy real no Netlify. Não é trabalho pendente, é limitação do ambiente de teste local.
- **Logos com resolução maior que o exibido** (`image-delivery-insight`) — mesmos 3 itens em antes/depois, **nenhum foi tratado** nesta rodada: `logo-perin-navbar.webp` (20,8 KiB de desperdício, exibido em 163×40px), `elektro.webp` (14,1 KiB, logo de cliente), `state-grid.webp` (9,9 KiB, logo de cliente). Impacto estimado: **~44 KiB somados**. Esforço: **baixo** — mesmo processo já aplicado às imagens `placeholder-obra-*` (gerar variante no tamanho de exibição real). Não foram tratados porque o escopo desta rodada, após sua confirmação, ficou restrito às imagens dentro do carrossel de portfólio; estes 3 arquivos ficam fora do carrossel (navbar e carrossel de clientes/logos), então é um item novo e independente para a próxima rodada.
- **Reduce unused CSS além do Bootstrap** — não há item próprio do `styles.css`/`styles.min.css` na lista de CSS não utilizado em nenhum dos dois relatórios; ou seja, o CSS próprio do projeto já está bem aproveitado. Nenhuma ação pendente aqui.
- **`mainthread-work-breakdown`** — score 0 em ambos (não passou nem antes nem depois), 2.9s → 3.0s. Impacto estimado: trabalho de main thread continua acima do ideal. Esforço: alto (exigiria profiling detalhado de GSAP/ScrollTrigger, fora do escopo de otimização de carregamento). Ver também a nota sobre `long-tasks` abaixo — parte do motivo desse número não ter melhorado é explicado ali.
- **`forced-reflow`, `lcp-breakdown-insight`, `network-dependency-tree-insight`** — score 0 em ambos, sem mudança em nenhum dos dois relatórios. Não investigados nesta rodada (fora do escopo de imagens/scripts/fontes/cache tratado). Esforço estimado: médio-alto, provavelmente ligados ao mesmo padrão de cadeia de dependência CSS→JS que também aparece no Bootstrap CDN.

## Novas (surgiram após as mudanças, investigadas)

- **`long-tasks` — de 3 tarefas longas (204/93/86 ms) para 5 tarefas (181/109/65/59/51 ms)**. Investigado: apesar do maior número de itens, a métrica que realmente importa para responsividade (**TBT — Total Blocking Time**) **caiu** de 220ms para 103ms, e o audit `long-tasks` em si mantém score 1 (informativo, não reprova) em ambos os relatórios — não é uma regressão de aprovação. Causa provável: `defer` nos 4 `<script>` mudou o momento em que o JS é parseado/executado em relação ao FCP; a remoção da requisição bloqueante do Google Fonts também adiantou o momento em que a página fica interativa. Isso reorganiza a linha do tempo de execução, fragmentando o que antes era processado como blocos maiores em tarefas menores e mais numerosas — mas dentro da janela de cálculo do TBT, o resultado líquido é menos tempo bloqueando a thread principal. Não requer ação — é efeito colateral esperado e positivo do `defer`, não um problema novo.
- **`cache-insight` "piorou" em KiB (127→163 KiB)** — já explicado na seção de pendentes acima: é artefato do teste local (`npx serve` ignora `_headers`), não uma regressão real. As fontes (`inter-latin.woff2`, `manrope-latin.woff2`, 73 KiB somados) entraram nessa lista simplesmente por serem recursos novos sem cache **no servidor de teste local** — no Netlify real, o `_headers` já criado cobre `fonts/*` com `max-age=31536000, immutable`.

## Regressões (score de audit que passava e passou a reprovar)

**Nenhuma.** Comparação programática de todos os `auditRefs` da categoria `performance` entre os dois relatórios confirma: nenhum audit teve `score` reduzido de "antes" para "depois". Os dois itens que pioraram em valor absoluto (`cache-insight` em KiB, `long-tasks` em contagem) mantiveram o mesmo `score` (0 e 1, respectivamente) em ambos os relatórios — não são regressões de aprovação/reprovação, apenas mudanças de valor numérico com causas identificadas acima.

---

## Atualização — Rodada 2 (remoção do Bootstrap)

> Comparação `audit/lighthouse-depois.report.json` (fim da rodada 1) vs. `audit/lighthouse-pos-bootstrap.report.json` (após remover `<link>` CSS + `<script>` do Bootstrap de `index.html`). Investigação prévia em `audit/bootstrap-uso-real.md` confirmou 0% de uso real (nenhuma classe CSS, nenhum componente JS) — decisão do usuário foi remover, não vendorizar.

### Itens marcados como pendentes na Rodada 1 — status atualizado

- **Bootstrap CDN em `render-blocking-insight`** — ✅ **Resolvido.** O item `cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css` (1125ms de bloqueio, 34 KB) desapareceu completamente da lista. Sobra apenas `styles.min.css` (162ms, inalterado desde a rodada 1).
- **CSS não utilizado do Bootstrap** (`unused-css-rules`) — ✅ **Resolvido.** Score 0,5→**1**, economia estimada 11 KiB → **0 KiB**. Não há mais nenhum item nessa lista (era 100% Bootstrap, confirmado na rodada 1).
- **`mainthread-work-breakdown`** — ⚠️ **Ainda pendente.** Score continua 0 (reprovado). Valor: 2,9s (antes) → 3,0s (depois rodada 1) → **3,2s** (pós-Bootstrap). Não piorou por causa da remoção do Bootstrap (Bootstrap não usa main thread via JS, já que nunca foi chamado); a variação entre as três medições é ruído do ambiente local de teste. Continua exigindo profiling de GSAP/ScrollTrigger para uma investigação futura — esforço alto.
- **`forced-reflow-insight` / `lcp-breakdown-insight` / `network-dependency-tree-insight`** — resultado misto:
  - `forced-reflow-insight`: ainda score 0, sem mudança.
  - `lcp-breakdown-insight`: ✅ **Resolvido** — score 0 → **1**. A remoção do maior CSS bloqueante (Bootstrap) tirou pressão da cadeia crítica até o LCP.
  - `network-dependency-tree-insight`: ainda score 0, sem mudança (a cadeia de dependência de `styles.min.css` → fontes ainda existe, só ficou mais curta).

### Novo item pendente identificado

- **Logos com resolução maior que o exibido** (`image-delivery-insight`) — **ainda pendente**, mesmos 3 itens (`logo-perin-navbar.webp`, `elektro.webp`, `state-grid.webp`), ~44 KiB. Não fazia parte do escopo desta rodada (só Bootstrap). Mantido como pendência de baixo esforço para próxima rodada.

### Métricas de página (Rodada 1 "depois" → pós-remoção do Bootstrap)

| Métrica | Depois (Rodada 1) | Pós-Bootstrap (Rodada 2) |
|---|---|---|
| Performance Score | 89 | **98** |
| LCP | 2.9s | **2.4s** |
| TBT | 100ms | **50ms** |
| FCP | 2.2s | **1.2s** |
| Speed Index | 4.8s | **1.7s** |
| Peso total | 274 KiB | **217 KiB** |
| Requisições | 15 | **13** |

### Regressões (Rodada 1 → Rodada 2)

**Nenhuma.** Comparação programática de todos os `auditRefs` da categoria `performance` confirma: nenhum audit teve `score` reduzido entre `lighthouse-depois` e `lighthouse-pos-bootstrap`.
