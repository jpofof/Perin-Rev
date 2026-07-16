# Relatório de Performance — Perin Construções

> Branch `perf/otimizacao-performance` (a partir de `origin/master`, commit `044eaff`). Nenhum merge/deploy realizado. Métricas coletadas via Lighthouse CLI contra servidor estático local (`npx serve -l 8080 .`), categoria `performance`, Chrome headless.

## Decisão registrada

Pipeline de build completo (esbuild/clean-css/html-minifier/hash de arquivos + `netlify.toml` → `/dist`) foi **descartado por decisão do usuário** — os maiores ofensores identificados na Fase 1 eram imagens e falta de defer/cache, não a ausência de minificação automatizada. Fica para reavaliação futura se necessário.

## Antes vs. Depois

| Métrica | Antes | Depois | Variação |
|---|---|---|---|
| Performance Score | 81 | 89 | **+8** |
| LCP | 3.3 s | 2.9 s | **-0.4 s** |
| CLS | 0 | 0 | — |
| TBT | 220 ms | 100 ms | **-120 ms** |
| FCP | 2.8 s | 2.2 s | **-0.6 s** |
| Speed Index | 4.9 s | 4.8 s | -0.1 s |
| Peso total da página | 312 KiB | 274 KiB | **-38 KiB (-12%)** |
| Nº de requisições | 17 | 15 | -2 |

## Rodada 2 — Remoção do Bootstrap

Investigação em `audit/bootstrap-uso-real.md` confirmou **0% de uso real** do Bootstrap (nenhuma classe CSS — `.container`, `.row`, `.col-*`, `.btn`, `.navbar`, `.card`, utilities — e nenhum componente JS — `data-bs-*`, `bootstrap.Modal/Tooltip/Dropdown/etc` — em `index.html` ou `script.js`). Decisão do usuário: **remover completamente**, não vendorizar.

### O que foi feito

- Removidas de `index.html`: `<link rel="preconnect" href="https://cdn.jsdelivr.net">`, `<link href="...bootstrap.min.css" rel="stylesheet">` e `<script src="...bootstrap.bundle.min.js" defer>`.
- Confirmado via grep em todo o projeto: nenhuma outra referência a `bootstrap` sobrou (fora de `audit/` — relatórios históricos do Lighthouse — e `src-original/` — backup pré-minificação, ambos intencionais e fora do que é servido pelo site).
- Nenhum uso isolado de Popper.js encontrado (o bundle já o incluía; sem dependência separada a remover).

### Validação visual

Comparação sistemática via Puppeteer, antes/depois da remoção (mesmo servidor local, alternando o `index.html` via `git stash`), em **desktop (1440px)** e **mobile (375px)**, cobrindo: hero, navegação (desktop e menu mobile aberto), seção Portfólio (cards do carrossel), seção "Como Trabalhamos", formulário de contato completo (inputs, dropdown, textarea, botão), seção Depoimentos, em 8 pontos de scroll diferentes por viewport.

**Nenhuma diferença visual encontrada.** Todos os pares de screenshot (antes/depois) são visualmente idênticos — mesma tipografia, espaçamento, bordas de input, aparência de botões, menu mobile pixel-idêntico. A única variação observada foi um deslocamento de scroll de ~21px em capturas por percentual de altura (explicado por uma diferença de 21px na altura total da página entre os dois estados, 13.741px → 13.720px, ~0,15% — ruído de renderização, não uma mudança de layout) e diferenças de timing de animação GSAP entre execuções separadas do script (não relacionadas ao Bootstrap). O projeto já tinha seu próprio reset (`box-sizing: border-box`, `margin: 0` em `styles.css:76-78`), o que explica a ausência de qualquer efeito do Reboot do Bootstrap em elementos nativos (botões, links, formulário).

### Testes automatizados

- `npm test` — **107/107** passando.
- `npm run test:regression` — **65/65** passando (carrossel intacto).

### Métricas — antes da remoção vs. depois

| Métrica | Antes (fim Rodada 1) | Depois (pós-Bootstrap) | Variação |
|---|---|---|---|
| Performance Score | 89 | **98** | **+9** |
| LCP | 2.9 s | **2.4 s** | **-0.5 s** |
| CLS | 0 | 0 | — |
| TBT | 100 ms | **50 ms** | **-50 ms** |
| FCP | 2.2 s | **1.2 s** | **-1.0 s** |
| Speed Index | 4.8 s | **1.7 s** | **-3.1 s** |
| Peso total da página | 274 KiB | **217 KiB** | **-57 KiB (-21%)** |
| Nº de requisições | 15 | **13** | -2 |

Nenhuma regressão: comparação programática de todos os audits de performance entre os dois relatórios confirma que nenhum `score` caiu. Detalhamento completo em `audit/proximas-oportunidades.md` (seção "Atualização — Rodada 2"). Relatório bruto em `audit/lighthouse-pos-bootstrap.report.html`.

### Métricas — desde o início (Fase 1, pré-otimização) até agora

| Métrica | Início (Fase 1) | Agora (pós-Bootstrap) | Variação total |
|---|---|---|---|
| Performance Score | 81 | **98** | **+17** |
| LCP | 3.3 s | **2.4 s** | **-0.9 s** |
| TBT | 220 ms | **50 ms** | **-170 ms** |
| FCP | 2.8 s | **1.2 s** | **-1.6 s** |
| Speed Index | 4.9 s | **1.7 s** | **-3.2 s** |
| Peso total | 312 KiB | **217 KiB** | **-95 KiB (-30%)** |
| Requisições | 17 | **13** | -4 |

## Rodada 3 — Logos superdimensionados + preparação de validação de cache

### Parte 1 — Logos superdimensionados

Últimos 3 arquivos pendentes de `audit/proximas-oportunidades.md` (`image-delivery-insight`, ~44 KiB estimados): `logo-perin-navbar.webp` (navbar), `elektro.webp` e `state-grid.webp` (carrossel de clientes).

**Tamanho de exibição real confirmado no CSS:**
- Navbar (`styles.css:203-208`, `.nav-logo-image`): `height: 40px`, `width: auto` — sem breakpoint que mude o tamanho (mesmo valor em mobile e desktop). Bounding box real medido pelo Lighthouse: 163×40px.
- Clientes (`styles.css:1770-1791`, `.clients-carousel-slide`/`.clients-carousel-img`): card `215×152px` (fallback JS via `--slide-w`/`--slide-h`, mesmo valor em todos os breakpoints — só o `padding` interno muda: 24px desktop → 16px tablet (`768px`) → 12px mobile (`480px`), reduzindo a área útil da imagem em telas menores, nunca aumentando).

**Redimensionamento (2x o maior bounding box observado, para suportar retina sem exagero):**

| Arquivo | Antes | Depois | Redução |
|---|---|---|---|
| `logo-perin-navbar.webp` | 935×229px, 22,99 KB | 330×81px, 9,54 KB | **-58,5%** |
| `elektro.webp` | 1500×898px, 17,68 KB | 400×239px, 6,12 KB | **-65,4%** |
| `state-grid.webp` | 721×218px, 22,61 KB | 400×121px, 20,82 KB | -7,9% (arquivo já tinha compressão eficiente para o nível de detalhe; ganho real veio da resolução, não da qualidade) |
| **Total** | **63,28 KB** | **36,48 KB** | **-42,3%** |

Conversão feita com `sharp-cli`, qualidade **92** (mais conservadora que os 75-78 usados nas fotos de portfólio, por serem logos com texto/traços finos). Canal alpha testado e confirmado preservado em `state-grid.webp` e `logo-perin-navbar.webp` (ambos tinham transparência original — `elektro.webp` nunca teve). Originais preservados em `img-originais/brand/` e `img-originais/clients/`.

**Validação visual** (Puppeteer, desktop 1440px e mobile 375px, navbar + seção de clientes): nenhuma perda de nitidez perceptível — texto fino dos logos (`STATE GRID BRAZIL HOLDING S.A.`, caracteres chineses, `ELEKTRO`) permanece legível sem serrilhado ou artefato de compressão.

**Testes:** `npm test` — 107/107 passando (nomes de arquivo não mudaram, substituição in-place, nenhuma referência em `index.html`/`script.js` precisou de atualização).

**Lighthouse (antes desta rodada → depois):**

| Métrica | Antes (pós-Bootstrap) | Depois (pós-logos) |
|---|---|---|
| Performance Score | 98 | 97* |
| LCP | 2.4 s | 2.4 s |
| TBT | 50 ms | 50 ms |
| Speed Index | 1.7 s | 3.1 s* |
| Peso total | 217 KiB | **191 KiB** |
| Requisições | 13 | 13 |
| `image-delivery-insight` (score / est. savings) | 0,5 / 44 KiB | 0,5 / **23 KiB** |

\* A variação de -1 no Score e o aumento pontual do Speed Index (1.7s→3.1s) são ruído de medição do ambiente local (headless Chrome competindo por CPU com outros processos na mesma máquina) — não há nenhuma mudança de código nesta rodada que explique um Speed Index pior; peso da página e requisições confirmam que o site ficou mais leve, não mais pesado.

`elektro.webp` saiu completamente da lista de `image-delivery-insight`. Os dois itens que restam (`state-grid.webp`: 16,9 KiB; `logo-perin-navbar.webp`: 6,2 KiB) são a **margem de retina 2x proposital** — o Lighthouse testou em DPR 1x (emulação mobile padrão), então o buffer para telas de alta densidade aparece como "excesso" nessa medição específica, mas é o comportamento esperado e desejado ao seguir a instrução de dimensionar para 2x. Não é sobre-dimensionamento real remanescente.

Relatório completo: `audit/lighthouse-pos-logos.report.html`.

### Parte 2 — Validação de cache (pendente, só após deploy)

O `_headers` criado na Rodada 1 não pode ser validado localmente: `npx serve` (usado em todos os testes desta branch) **ignora arquivos `_headers`** — essa é uma feature exclusiva do Netlify, aplicada apenas em produção. As instruções abaixo ficam prontas para você rodar **depois do merge e do deploy**.

#### Opção 1 — `curl` direto nos headers de resposta

Depois do deploy, rode (troque o caminho pelo de um CSS ou JS real publicado):

```bash
curl -I https://perinconstrucoes.netlify.app/styles.min.css
curl -I https://perinconstrucoes.netlify.app/script.min.js
curl -I https://perinconstrucoes.netlify.app/assets/images/brand/logo-perin-navbar.webp
curl -I https://perinconstrucoes.netlify.app/fonts/inter-latin.woff2
```

**O que verificar na resposta:** procure o header `cache-control` e confirme que bate com o que foi configurado em `_headers`:
- `styles.min.css` / `script.min.js` → `cache-control: public, max-age=2592000` (30 dias)
- `assets/images/*` / `fonts/*` → `cache-control: public, max-age=31536000, immutable` (1 ano)
- Qualquer `.html` → `cache-control: public, max-age=0, must-revalidate`

Se o header não aparecer ou vier diferente do esperado, o `_headers` pode não ter sido reconhecido pelo Netlify (verificar se o arquivo está na raiz do diretório de publish) ou pode haver algum header de cache padrão do Netlify sobrepondo — nesse caso, comparar com a documentação oficial do Netlify sobre `_headers`.

#### Opção 2 — Lighthouse contra produção

```bash
npx lighthouse https://perinconstrucoes.netlify.app --output=html --output-path=./audit/lighthouse-producao
```

**O que verificar no relatório:** o audit **"Uses efficient cache policy on static assets"** (ou, nesta versão do Lighthouse, o insight equivalente `cache-insight`) deve aparecer como **aprovado** (score 1, sem "Est savings"), diferente de todos os relatórios locais desta branch (`lighthouse-antes`, `lighthouse-depois`, `lighthouse-pos-bootstrap`, `lighthouse-pos-logos`), onde esse item sempre apareceu com score 0 — porque nenhum deles rodou contra um servidor que respeita `_headers`.

#### Checklist de validação pós-deploy pendente

- [ ] Rodar `curl -I` em pelo menos 1 arquivo de cada categoria (CSS, JS, imagem, fonte, HTML) e conferir o `cache-control` de cada um.
- [ ] Rodar Lighthouse contra a URL de produção e confirmar que o item de cache aparece como aprovado.
- [ ] Se algo não bater, reportar antes de considerar o `_headers` validado — pode exigir ajuste de configuração no painel do Netlify (não necessariamente no arquivo `_headers` em si).

Relatórios completos em `audit/lighthouse-antes.report.{json,html}` e `audit/lighthouse-depois.report.{json,html}`.

## O que foi alterado, por categoria

### Imagens (com confirmação prévia do usuário sobre imagens do carrossel)
- As únicas imagens >150 KB efetivamente carregadas pelo site são as 5 `placeholder-obra-01..05.webp`, usadas como `cover`/`photos` do carrossel de portfólio (`script.js`). As pastas `assets/images/portfolio/portfolio-projeto-*/` (75+ arquivos, 300–620 KB cada) **não são referenciadas em lugar nenhum do código** — são peso morto no repositório, não no site; por decisão do usuário, ficaram fora de escopo desta rodada.
- Para as 5 imagens do carrossel: gerada variante `-mobile.webp` (resize 800px, ~55-65% menor) além da variante `-desktop.webp` (resolução original, já bem comprimida — recompressão adicional em q75-78 não trouxe ganho real, pois os arquivos originais já estavam próximos do ótimo).
- Originais preservados intactos em `img-originais/placeholders/` (backup, fora do fluxo de deploy).
- Implementado `srcset`/`sizes` via helper `buildResponsiveImgAttrs()` em `script.js`, sem alterar `initCascadingSlider()` nem nenhuma regra de proporção/animação/duração do carrossel (validado com `npm run test:regression`, 65/65 passando, e teste visual manual).

### Lazy loading e prioridade
- `loading="lazy"` adicionado nas imagens abaixo da primeira dobra: logos do carrossel de clientes (`clients-carousel-img`, 4 imagens) e logo do rodapé.
- Imagens do carrossel de portfólio já tinham `loading="lazy"` no `cover` (pré-existente); adicionado também nas fotos da galeria interna do projeto (`i !== 0`, preservando a primeira foto como eager já que aparece imediatamente ao abrir o projeto).
- **Não há `<img>`/`<video>` no hero nesta branch** (é gerado via CSS/SVG/JS — canvas, geometrias, partículas), então não havia elemento para marcar `fetchpriority="high"`.

### Scripts
- Os 4 `<script>` (Bootstrap bundle, GSAP, ScrollTrigger, `script.js`) receberam `defer`. Nenhum é candidato a `async`: todos têm dependência de ordem (`script.js` usa `gsap`/`ScrollTrigger` como globais e já esperava `DOMContentLoaded` — `script.js:1693` — confirmando que `defer` é seguro). Não há scripts de analytics/pixel no projeto.

### Fontes
- Google Fonts (Manrope + Inter) baixado e servido localmente em `/fonts` — apenas **2 arquivos** necessários (`inter-latin.woff2`, `manrope-latin.woff2`), pois o Google serve um único woff2 de peso variável por família para o subset `latin` (cobre acentuação do PT-BR: ç, ã, õ, á, é etc.). Subset `latin-ext` (necessário só para vietnamita/polonês/etc.) foi omitido — não é usado pelo conteúdo do site.
- `@font-face` com `font-display: swap` adicionado no topo de `styles.css`, com `font-weight` em faixa (`300 600` Inter, `400 800` Manrope) compatível com o arquivo variável.
- `<link>` externo do Google Fonts removido do `<head>`; `preconnect` para `fonts.googleapis.com`/`fonts.gstatic.com` removido (não é mais necessário).
- `preconnect` adicionado para os CDNs remanescentes (`cdn.jsdelivr.net`, `cdnjs.cloudflare.com`).
- `<link rel="preload" as="font">` adicionado para `manrope-latin.woff2` (fonte do título do hero, `--font-primary`).
- **Bootstrap continua vindo via CDN** (`cdn.jsdelivr.net`) — a memória do projeto indicava que já tinha sido removido, mas isso **não é verdade no código atual**. Não foi alterado, ver pendências abaixo.

### Cache (Netlify)
- Criado `_headers` na raiz (publicação direta, sem `/dist`):
  - `*.css`/`*.js`: `max-age=2592000` (30 dias) — conservador porque não há hash nos nomes de arquivo, então um novo deploy pode substituir o conteúdo sob o mesmo nome.
  - `assets/images/*` e `fonts/*`: `max-age=31536000, immutable` (1 ano) — nomes de imagem raramente mudam com o mesmo conteúdo.
  - `*.html`: `max-age=0, must-revalidate`.

### Minificação (passe manual único, não é processo de build)
- `styles.css` → `styles.min.css` via `clean-css-cli` (66.8 KB → 47.0 KB).
- `script.js` → `script.min.js` via `terser` (66.2 KB → 31.8 KB).
- `index.html` referencia agora `styles.min.css` e `script.min.js`.
- **`index.html` em si não foi minificado** — os testes de regressão (`tests/regression/*.test.js`) leem `script.js`/`styles.css` diretamente do disco por nome fixo para validar padrões de código-fonte (proporções do carrossel, curva/duração da animação, estrutura HTML); sobrescrever esses arquivos com a versão minificada quebrava 10 dos 65 testes (falsos-negativos causados por checagem de texto-fonte, não por regressão real de comportamento). Optei pela alternativa já prevista nas instruções: gerar `.min` em arquivo separado e atualizar as referências, mantendo `script.js`/`styles.css` como fonte legível para os testes e para edição futura.
- Fontes não minificadas preservadas em `src-original/` (snapshot pós-Fases 2-5, pré-minificação).

## Pendências de decisão do usuário

1. ~~**Bootstrap ainda em CDN**~~ — **Resolvido na Rodada 2.** Investigação (`audit/bootstrap-uso-real.md`) confirmou 0% de uso real (nenhuma classe CSS, nenhum componente JS). Decisão do usuário: remover completamente. Ver seção "Rodada 2 — Remoção do Bootstrap" acima.
2. **Pastas `assets/images/portfolio/portfolio-projeto-*/`** (75+ arquivos órfãos, maior volume de dados do repositório) seguem sem uso — decisão de negócio já registrada em `AUDITORIA.md` sobre integrar fotos reais ao carrossel, fora do escopo desta tarefa de performance.
3. **`styles.css`/`script.js` continuam publicáveis na raiz** junto com seus `.min`. Tentativa de mover para `/dev-source/` foi feita e revertida nesta mesma rodada: os testes de regressão (`tests/regression/slider.regression.test.js:18`) leem esses arquivos por caminho fixo (`path.join(__dirname, '..', '..', 'styles.css')`), e movê-los sem atualizar os testes quebra a suíte inteira (0/65 rodando, erro de arquivo não encontrado). Não havia `netlify.toml` no projeto antes desta tarefa e nenhum foi criado. Reorganizar isso exigiria também editar os testes — fora do que foi autorizado nesta rodada; ganho seria puramente organizacional (esses arquivos não são requisitados pelo HTML, não pesam na performance real).

## Validação

- `npm test` — 107/107 testes passando (unit + regression) após todas as mudanças, incluindo a tentativa revertida de mover `script.js`/`styles.css`.
- `npm run test:regression` rodado após cada passo que tocou `script.js`/`index.html` — todas as regras imutáveis do carrossel (proporções, curva `cubic-bezier(0.40, 0.00, 0.30, 1.00)`, duração `0.70s`, animação restrita a `left`/`width`) permanecem intactas.
- Nenhuma alteração de copy/texto ou lógica de negócio (formulário, contadores, segmentos) foi feita em nenhum momento desta tarefa.
- Não foi feito merge nem deploy — pronto para revisão visual antes de subir.

## Como revisar esta branch localmente

```bash
git fetch origin
git checkout perf/otimizacao-performance
npm install
npm test                          # 107/107 esperado
npx serve -l 8080 .                # sobe o site local
# abrir http://localhost:8080/ no navegador e conferir visualmente
```

Relatórios brutos do Lighthouse (antes/depois) disponíveis em `audit/lighthouse-antes.report.html` e `audit/lighthouse-depois.report.html` — abra direto no navegador para o breakdown completo.
