# Relatório de Arquivos Desnecessários / Órfãos / Resquícios de Debug

> Auditoria somente-leitura. Nenhum arquivo foi apagado ou modificado além deste relatório.
> Data: 2026-07-21

---

## 1. Assets órfãos reais (fora de pasta de backup)

Busca: cada arquivo em `assets/` foi grepado (pelo nome do arquivo) em `index.html`, `styles.css` e `script.js`. Os dados de portfólio no `script.js` (objeto de projetos do carrossel, linhas ~790-831) usam **apenas** `assets/images/placeholders/placeholder-obra-0X.webp` — nenhuma imagem dentro de `assets/images/portfolio/portfolio-projeto-*/` ou `portfolio-duvidas/` é referenciada em lugar nenhum do código-fonte. Da mesma forma, as variantes `-desktop.webp` / `-mobile.webp` dos placeholders não são usadas — só a versão base (`placeholder-obra-0X.webp`) aparece no `script.js`.

| Caminho | Qtd. arquivos | Tamanho |
|---|---|---|
| `assets/images/portfolio/` (11 pastas `portfolio-projeto-01..11` + `portfolio-duvidas`) | 77 arquivos `.webp` | **30,4 MB** |
| `assets/images/placeholders/placeholder-obra-0[1-5]-desktop.webp` | 5 | 1,13 MB |
| `assets/images/placeholders/placeholder-obra-0[1-5]-mobile.webp` | 5 | 0,42 MB |
| **Total órfãos reais** | **87 arquivos** | **≈ 32,0 MB** |

Parecem ser resquício de uma versão anterior do carrossel de portfólio (antes da migração para o esquema de 5 placeholders reaproveitados por projeto, conforme documentado no `AGENTS.md`). Se a intenção é usar fotos reais no futuro, considere mover essa pasta inteira para uma pasta de backup (`img-originais/` ou similar) em vez de apagar — mas hoje ela não é servida ao usuário final.

---

## 2. Órfãos "intencionais" dentro de pastas de backup

As pastas abaixo já são claramente de backup/originais e não deveriam mesmo estar referenciadas no site — não são candidatos a remoção, apenas confirmação de que estão isoladas corretamente:

| Pasta | Conteúdo | Tamanho |
|---|---|---|
| `img-originais/` | `hero-section-fundo.mp4` + subpastas `brand/`, `clients/`, `placeholders/` (versões originais pré-otimização) | 4,4 MB |
| `originais-nao-webp/` | PNG/JPG originais (logos, fotos de trabalho, screenshot) antes da conversão para webp | 1,7 MB |
| `src-original/` | Cópia histórica de `index.html` / `script.js` / `styles.css` (snapshot anterior) | 212 KB |

Total em pastas de backup reconhecidas: **≈ 6,3 MB** — nenhuma ação recomendada, apenas manutenção do hábito de não deixar essas pastas irem para produção/deploy (confirme se `_headers`/build de deploy as exclui).

---

## 3. Pasta `audit/` — classificação

Tamanho total da pasta: **7,8 MB**.

| Arquivo | Tamanho | Classificação |
|---|---|---|
| `diagnostico.md` | 7,4 KB | Histórico útil (diagnóstico inicial) |
| `diagnostico-mobile-hero-secao-carrossel.md` | 15,0 KB | Histórico útil |
| `diagnostico-producao-real.md` | 10,1 KB | Histórico útil |
| `fase1-salto-scroll.md` | 25,8 KB | Histórico útil (investigação do salto de scroll) |
| `fase-perf-real.md` | 17,6 KB | Histórico útil (investigação do travamento Safari iOS — causa raiz) |
| `isolamento-query-params.md` | 24,2 KB | Histórico útil (documenta a infraestrutura `?isolate=`, já removida do código — mantém o registro da investigação) |
| `bootstrap-uso-real.md` | 7,8 KB | Histórico útil |
| `checklist-pendencias-mobile.md` | 644 B | Histórico útil (checklist curto, baixo custo de manter) |
| `proximas-oportunidades.md` | 9,8 KB | Histórico útil |
| `verificacao-producao-ab2b2ae.md` | 8,1 KB | Histórico útil |
| `debug-scroll-jump-snippet.js` | 4,7 KB | Histórico útil (snippet usado na investigação do salto de scroll, referenciado pela documentação acima) |
| `lighthouse-producao-real.report.html` + `.json` | 438,8 KB + 316,1 KB | **Manter** (snapshot mais recente, 17/07 13:15 — validação final) |
| `lighthouse-desktop-pos-fix.report.json` | 651,7 KB | **Manter** (snapshot mais recente, 17/07 12:33) |
| `lighthouse-mobile-pos-fix.report.json` | 533,9 KB | **Manter** (snapshot mais recente, 17/07 12:33) |
| `lighthouse-antes.report.html` + `.json` | 431,8 KB + 334,6 KB | **Transitório** — superado por snapshots mais novos (16/07 20:39) |
| `lighthouse-depois.report.html` + `.json` | 428,0 KB + 327,7 KB | **Transitório** — superado (16/07 20:39) |
| `lighthouse-pos-bootstrap.report.html` + `.json` | 446,4 KB + 330,0 KB | **Transitório** — superado (16/07 20:39) |
| `lighthouse-pos-logos.report.html` + `.json` | 427,2 KB + 310,4 KB | **Transitório** — superado (16/07 20:39) |
| `lighthouse-pos-hero-merge.report.html` + `.json` | 540,9 KB + 422,9 KB | **Transitório** — superado (16/07 21:00) |
| `lighthouse-consolidacao-final.report.html` + `.json` | 542,1 KB + 424,9 KB | **Transitório** — superado (16/07 21:00) |
| `lighthouse-hero-fix-final.report.html` + `.json` | 463,2 KB + 351,5 KB | **Transitório** — superado (16/07 21:43) |

Critério: usei o histórico do git (`git log --format=%ai`) para ordenar os snapshots Lighthouse por data/hora real de commit. Os 3 mais recentes (`producao-real`, `desktop-pos-fix`, `mobile-pos-fix`, todos de 17/07) representam a validação final pós-correção e valem a pena manter como prova de resultado. Os 7 pares anteriores (16/07) são etapas intermediárias do mesmo processo de otimização, já superadas — cada um documenta um passo que o próximo relatório já incorpora.

**Total transitório candidato a remoção em `audit/`: ≈ 5,65 MB** (7 pares de relatórios Lighthouse intermediários).

---

## 4. Infraestrutura de debug ainda presente no código

| Item | Onde | Status | Recomendação |
|---|---|---|---|
| `?isolate=...`, `no-blur-only`, `no-animation-only`, `no-geometries` | — | **Não encontrado** em `.html`/`.css`/`.js` — confirmado removido (coerente com o commit "fix: reduz blur pesado..."). Só existe menção histórica em `audit/isolamento-query-params.md`. | Nenhuma ação — já limpo. |
| `?debug=scroll` (IIFE `initScrollJumpDebug`) | `script.js:19-194` | **Ainda presente.** Autocontido, só ativa com `?debug=scroll`/`?debug=all` na URL, não roda para usuário normal. Contém `console.trace`/`console.log` dentro do bloco condicional. | O próprio comentário do código (linha 19) já diz "remover apos diagnostico". Se o salto de scroll já foi confirmado e corrigido, **remover** o bloco inteiro (176 linhas) — é código morto de investigação, não infraestrutura oficial de app. |
| `?debug=perf` / `?debug=all` (IIFE `initPerfDebug`, heartbeat) | `script.js:196-405` | **Ainda presente.** Idem acima — self-descrito como "DEBUG TEMPORARIO — FASE 2, travamento real no Safari iOS (remover apos diagnostico)". Depende do helper global `__perfCheckpoint()` (linhas 7-17) usado em checkpoints espalhados por `initPage()`. | Se a causa raiz do travamento Safari iOS já foi corrigida (commit do blur), **remover** o bloco `initPerfDebug` inteiro (~210 linhas) e os pontos de chamada `__perfCheckpoint(...)` espalhados em `initPage()`, e o helper em si. Confirme antes que não há mais necessidade de reabrir essa investigação — se houver dúvida, manter mais um ciclo é aceitável, mas o próprio código já se marca como removível. |

Nenhum desses dois blocos aparece referenciado em `index.html` (não há `<script>` extra nem atributo dependente deles) nem em `tests/` — a remoção é segura do ponto de vista de acoplamento.

---

## 5. `console.log` / `console.trace` / `console.debug` — fonte

| Arquivo:linha | Trecho | Classificação |
|---|---|---|
| `script.js:80` | `console.trace('[DEBUG-SCROLL] ' + label);` | Parte do bloco de debug temporário (`?debug=scroll`) — remover junto com o bloco (item 4). |
| `script.js:193` | `console.log('[DEBUG-SCROLL] instrumentacao ativa...')` | Idem. |
| `script.js:405` | `console.log('[DEBUG-PERF] instrumentacao ativa...')` | Parte do bloco de debug temporário (`?debug=perf`) — remover junto com o bloco (item 4). |
| `script.js:1791` | `console.error('[Perin Form] Submission error:', err);` | **Oficial** — tratamento de erro do formulário de contato, mantém contexto sem vazar dado sensível. Manter. |
| `script.js:1815` | `console.warn('[Perin Form] Honeypot triggered...')` | **Oficial** — log de segurança (anti-bot). Manter. |
| `scripts/install-git-hooks.js:35` | `console.log('[install-git-hooks] ... instalado em ...')` | **Oficial** — feedback de script de setup, roda só em `npm run prepare`. Manter. |
| `scripts/check-min-freshness.js` (múltiplas linhas) | `console.error('[check-min-freshness] ...')` | **Oficial** — script de CI/hook que barra commit com `.min` desatualizado. Manter. |
| `src-original/script.js:1231,1255` | mesmos logs oficiais do form, mas na cópia de backup | Dentro de pasta de backup — não conta como ativo em produção. |

**Resumo:** 3 ocorrências esquecidas de investigação (todas dentro dos blocos `?debug=scroll`/`?debug=perf` já marcados para remoção), o restante é infraestrutura oficial (erro de formulário, honeypot, scripts de build/CI).

---

## 6. Blocos de código morto comentado

Não foram encontrados blocos de código comentado (JS/CSS/HTML) que representem código morto — os comentários existentes no `script.js` e `styles.css` são documentação ativa (explicam decisões, valores de design tokens, ou marcam os dois blocos de debug do item 4). Não há necessidade de limpeza adicional aqui além da remoção dos blocos de debug já apontados.

---

## 7. Duplicidades

### 7.1 Assets
- Já coberto no item 1: `placeholder-obra-0X.webp` tem 3 versões (base, `-desktop`, `-mobile`) mas só a base é referenciada — as outras duas são duplicidade órfã.
- Vídeos (`construction-timelapse.mp4/.webm` e as versões `-reverse`) — todas as 4 variantes são referenciadas em `index.html` (múltiplos formatos para fallback de navegador), **não são duplicidade órfã**.

### 7.2 `devDependencies` (`package.json`) sem uso encontrado
Verificado via grep em `scripts/`, `tests/`, `jest.config.js` e `package.json` (campo `scripts`):

| Dependência | Uso encontrado? |
|---|---|
| `jest`, `jest-environment-jsdom` | Sim — `test`/`test:unit`/`test:regression` + `testEnvironment: 'jsdom'` em `jest.config.js`. |
| `terser` | Sim — `require('terser')` em `scripts/check-min-freshness.js`. |
| `clean-css-cli` | Uso indireto — o script requer o pacote `clean-css` (dependência transitiva do `clean-css-cli`) e a mensagem de erro instrui `npx clean-css-cli styles.css -o styles.min.css` como comando manual. Funciona, mas há uma inconsistência: o `package.json` declara `clean-css-cli`, o código importa `clean-css` diretamente (só funciona porque é dependência transitiva hoisted no `node_modules`). Considere declarar `clean-css` explicitamente se o require direto for a forma oficial de uso. |
| `html-minifier-terser` | **Nenhum uso encontrado** — nem em `scripts/`/`tests/`/`package.json > scripts`, nem em uso manual: só aparece citado em `RELATORIO-PERFORMANCE.md` como parte de um pipeline de build completo (esbuild/clean-css/html-minifier/hash) que foi **descartado por decisão explícita do usuário** (imagens e cache eram os gargalos reais, não minificação). Candidato real a remoção. |
| `puppeteer` | Não usado em `scripts/`/`tests/` nem via `require('puppeteer')` no código — a menção em `tests/regression/slider.regression.test.js` (comentário "Testes de regressão (Puppeteer)" no README) é descritiva, o teste em si não importa o pacote. **Porém houve uso manual confirmado via `npx` ao longo da sessão** (README 16/07: validação visual antes/depois da remoção do Bootstrap e da otimização de logos, comparando desktop 1440px e mobile 375px). Não é lixo — é uma ferramenta ad-hoc de validação visual que você já usou mais de uma vez e provavelmente usará de novo. **Recomendação: manter.** |
| `sharp-cli` | Não integrado a nenhum script automatizado, mas **uso manual confirmado repetidas vezes** via `npx sharp-cli` (README 13/07 e 16/07: conversão de fotos/logos para `.webp`, redimensionamento de logos superdimensionados). Ferramenta pontual mas recorrente para otimização de imagem. **Recomendação: manter.** |
| `lighthouse` | Não invocado por nenhum script do `package.json`, mas os relatórios em `audit/lighthouse-*.report.*` comprovam uso manual via CLI (`npx lighthouse ...`) fora do fluxo automatizado. Não classifico como órfã, apenas não integrada ao `scripts`. |

**Recomendação final:** apenas `html-minifier-terser` é candidata real a remoção (nenhum uso automatizado ou manual encontrado, e o pipeline que a justificaria foi descartado). `puppeteer`, `sharp-cli` e `lighthouse` devem ser **mantidas** — são ferramentas usadas manualmente via `npx` ao longo da sessão (visual diffing, otimização de imagem, auditoria de performance) mesmo sem estarem cabeadas a um script formal do `package.json`.

---

## 8. Testes que testam funcionalidade inexistente

Comparei `tests/regression/slider.regression.test.js` e `tests/unit/slider.test.js` com a implementação atual em `script.js` (`createCascadingSlider`, linha 836; `initCascadingSlider`, linha 1102):

- Nenhum teste referencia `?isolate=` ou os antigos artefatos de debug (`no-blur-only`, etc.) — busca em `tests/` não retornou ocorrências.
- `CURVE` (`cubic-bezier(0.40, 0.00, 0.30, 1.00)`) e `DURATION` (`0.70`) testados batem exatamente com o que está documentado no `AGENTS.md` e presumivelmente com o código atual.
- Testes de breakpoints/proporções (`PCT tablet [0.15, 0.70, 0.15]`, etc.) e de existência das funções `createCascadingSlider`/`initCascadingSlider` correspondem à implementação atual.

**Conclusão: nenhum teste obsoleto encontrado.** A suíte de testes do carrossel está alinhada com o código-fonte atual.

---

## 9. Estimativa de espaço total liberável

| Categoria | Tamanho |
|---|---|
| Assets órfãos reais (item 1) | ≈ 32,0 MB |
| Relatórios Lighthouse transitórios em `audit/` (item 3) | ≈ 5,65 MB |
| **Total estimado liberável** | **≈ 37,6 MB** |

(Não incluí as pastas de backup do item 2 nem os blocos de código de debug do item 4 nesta soma — a remoção de código não libera espaço em disco de forma mensurável, é limpeza de manutenibilidade, não de armazenamento.)

---

## 10. Observação — pastas duplicadas do projeto

O projeto tem histórico de estar espalhado em múltiplas pastas no disco do usuário (`Perin_Rev` e `Perin_Rev_master_compare`, entre outras variações possíveis). Esta auditoria cobriu apenas `Perin_Rev_master_compare`. **Recomenda-se verificar manualmente** se a outra pasta (`Perin_Rev`) ainda é necessária, se está sincronizada ou defasada em relação a esta, e se pode ser arquivada/removida para evitar confusão sobre qual é a fonte da verdade do projeto. Isso está fora do escopo de arquivos internos analisados aqui.
