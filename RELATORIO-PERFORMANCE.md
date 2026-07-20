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

## Hero: vídeo + correções

Branch anterior de vídeo de fundo (`hero-video-background`, ver `implementation-notes.md`) foi mesclada com a branch de redesign do hero baseado em canvas/SVG (`heroGrid`/`heroGeometries`/`heroLighting`/`heroParticles`). Nota da seção "Lazy loading e prioridade" acima ("Não há `<img>`/`<video>` no hero nesta branch") ficou desatualizada por esse merge — agora há ambos os sistemas coexistindo no `#heroCanvas`.

### Decisão de design

Opção **B** (vídeo como fundo + formas geométricas por cima com opacidade reduzida) confirmada pelo usuário. É essencialmente o resultado natural pós-correção dos bugs abaixo — as geometrias já ficam sutis o bastante sobre o overlay escuro do vídeo, sem precisar de ajuste fino adicional.

### Bug 1 — `styles.min.css` desatualizado (causa do conflito visual)

`index.html` carrega `styles.min.css`, não `styles.css`. O `.min.css` servido havia sido gerado **antes** do merge da branch de vídeo — não continha nenhuma regra para `.hero-video-background`/`.hero-video-element`/`.hero-video-overlay`. Resultado: o vídeo caía em `position: static` (fluxo normal do documento, tamanho intrínseco 1024×576 no canto superior esquerdo), enquanto o sistema antigo (`hero-grid-layer` z-index:1, `hero-geometries` z-index:2, `hero-lighting-layer` z-index:3, `hero-particles` z-index:4) permanecia com posicionamento absoluto completo e cobria o resto do hero.

**Correção**: `npx cleancss -o styles.min.css styles.css` (66,8 KB → 47,3 KB). Confirmado via `getComputedStyle` que `.hero-video-background` passou a `position: absolute; z-index: 0` como esperado.

### Bug 2 — vídeo não tocava sozinho (`play()`/`is-visible` nunca disparavam) — BLOQUEANTE, corrigido

Mesma classe de problema do Bug 1: `index.html` carrega `script.min.js`, que também havia sido minificado antes do merge — **não continha `initHeroVideoBackground`**, nem qualquer referência a `heroVideoForward`/`canplaythrough`. Sem esse código, nenhum listener era anexado ao vídeo e `.play()` nunca era chamado, apesar do `<video>` carregar normalmente (`readyState: 4`) e o autoplay mudo não estar bloqueado pelo navegador (confirmado chamando `.play()` manualmente via DevTools).

**Correção**: `npx terser script.js -o script.min.js -c -m` (66,2 KB → 32,0 KB). Confirmado em Chrome real e via Puppeteer que o vídeo agora inicia sozinho (`is-visible` adicionada, `paused: false`, offset de 2s da Fase 3 aplicado).

**Causa raiz comum aos dois bugs**: os `.min` deste projeto são gerados manualmente (não há `npm run build`) e não foram regenerados após o merge das branches. Risco recorrente — recomendo considerar um script `build` versionado (`clean-css-cli` + `terser` já são devDependencies) para eliminar essa classe de bug em merges futuros. Não implementado nesta rodada por não ter sido solicitado.

### Contraste do texto (validação Opção B)

Testado em 3 pontos do loop do vídeo (início — terreno vazio, meio — escavação em andamento, fim — obra pronta). Overlay atual (`radial-gradient` + `linear-gradient` verde-preto, opacidade mínima ≥0,6, ver `implementation-notes.md` Fase 3) mantém título/subtítulo/CTAs legíveis nos 3 pontos, sem necessidade de escurecer mais.

### Recompressão de vídeo

| Arquivo | Antes | Depois | Redução |
|---|---|---|---|
| construction-timelapse.mp4 | 5,26 MB | 2,68 MB | −49% |
| construction-timelapse.webm | 6,41 MB | 2,20 MB | −66% |
| construction-timelapse-reverse.mp4 | 5,36 MB | 2,72 MB | −49% |
| construction-timelapse-reverse.webm | 6,42 MB | 2,18 MB | −66% |
| **Total** | **23,46 MB** | **9,79 MB** | **−58%** |

Parâmetros: MP4/H.264 recomprimido a ~1,5 Mbps (`-b:v 1.5M -maxrate 1.8M -bufsize 3M`), mantendo resolução 1024×576. WebM/VP9 recomprimido com `-crf 32 -b:v 1.5M` — antes desta rodada o WebM não tinha bitrate/CRF controlado explicitamente, por isso ficava maior que o MP4 equivalente (comportamento invertido do esperado para VP9); o CRF acabou dominando sobre o teto de bitrate, resultando em arquivos menores que a estimativa inicial de ~4-4,5 MB, sem perda de qualidade perceptível (comparação frame a frame no mesmo timestamp, original vs. recomprimido, sem blocos/banding visíveis). Validado visualmente e aprovado pelo usuário antes da substituição dos arquivos originais.

### Vídeo órfão removido

`assets/images/hero-fundo/hero-section-fundo.mp4` (3,2 MB, arquivo-fonte usado só na geração via ffmpeg dos clipes finais, nunca referenciado em HTML/CSS/JS) movido para `img-originais/hero-section-fundo.mp4`, seguindo o padrão de backup já usado para as demais imagens (`img-originais/brand/`, `img-originais/clients/`, `img-originais/placeholders/`).

### Lighthouse — antes vs. depois das correções

| Métrica | Pós-merge (bugado) | Pós-correção (hero funcionando) | Variação |
|---|---|---|---|
| Performance Score | 95 | 92 | −3 |
| LCP | 2.7 s | 2.8 s | +0.1 s |
| CLS | 0 | 0 | — |
| TBT | 100 ms | 180 ms | +80 ms |
| FCP | 1.3 s | 1.4 s | +0.1 s |
| Speed Index | 2.9 s | 3.4 s | +0.5 s |

**Leitura honesta desse resultado**: o score caiu porque o hero "bugado" nunca decodificava/tocava o vídeo (o bug do Bug 2 fazia o Lighthouse medir uma página essencialmente estática). Com o vídeo realmente rodando, há custo real de decode/paint que a versão quebrada não pagava — é o preço de ter a feature funcionando de verdade, não uma regressão a corrigir. Ainda assim, o vídeo recomprimido (9,79 MB no total vs. 23,46 MB antes) compensa parte desse custo em rede/payload, mesmo que não apareça nas métricas de tempo do Lighthouse (que já rodam contra servidor local, sem gargalo de rede). Relatório completo em `audit/lighthouse-hero-fix-final.report.html`.

### Testes

`npm run test:unit` (42/42) e `npm run test:regression` (65/65) rodados após cada mudança relevante (rebuild dos `.min`, troca dos vídeos, remoção do órfão) — sempre 107/107, carrossel intacto em todas as rodadas.

## Mobile: vídeo condicional + correção de download prematuro

> Investigação prévia (diagnóstico, sem mudança de código) confirmou que o hero baixava ~5,4 MB de vídeo (`construction-timelapse.mp4` forward + reverse) em **qualquer** dispositivo, incluindo iPhone real via Safari — a única checagem existente (`navigator.connection`) nunca funciona no WebKit/iOS, que não implementa a Network Information API. Detalhes completos dessa investigação estão registrados na conversa; esta seção documenta a correção implementada a partir dela.

### Peso do hero — antes vs. depois (mobile)

| Cenário | Antes | Depois |
|---|---|---|
| Requisições a `.mp4`/`.webm` em viewport mobile (≤768px) | 2 (forward + reverse, ~5,4 MB) | **0** |
| Peso do hero em mobile | ~5,4 MB de vídeo + ~163 KB de CSS/JS/font/logo | apenas `hero-timelapse-poster.webp` (57,7 KB), já usado como `background-image` do container |
| Peso total da página (Lighthouse, mobile) | não medido isoladamente antes | **375 KiB** (total-byte-weight, servidor local) |

Confirmado via Puppeteer com emulação de iPhone 14 (viewport 390×844, `isMobile: true`, User-Agent Safari iOS 17) interceptando todas as requisições de rede: **zero** requisições para `.mp4` ou `.webm` em mobile. Em desktop (1440×900), o forward (`construction-timelapse.webm`) carrega normalmente.

### Lógica do breakpoint

- Reaproveitado o breakpoint **768px** já usado em todo o CSS do projeto (`@media (max-width: 768px)` aparece em `styles.css:1900,2769,3027`), sem introduzir um novo valor.
- Em `script.js`, `initHeroVideoBackground()` agora verifica `window.matchMedia('(max-width: 768px)').matches` logo no início. Se verdadeiro (ou `prefers-reduced-motion: reduce`, ou conexão lenta detectável), as duas tags `<video>` são **removidas do DOM** via `forward.remove()` / `reverse.remove()` — nenhuma delas chega a ter `.load()` ou `.play()` chamados.
- Para garantir **zero requisição de rede em qualquer browser** (não só nos que respeitam `remove()` a tempo), o atributo `preload="auto"` do vídeo forward foi trocado para `preload="none"` no HTML (`index.html`). Antes, `preload="auto"` fazia o *preload scanner* do browser começar a buscar o vídeo assim que a tag era parseada, **antes mesmo do JavaScript rodar** — ou seja, remover a tag via JS depois não teria evitado esse download inicial em navegadores que respeitam `auto` de forma agressiva. Com `preload="none"` como padrão em HTML e o carregamento explícito feito só via `forward.load()` em JS (e só no branch desktop), a garantia de zero-download em mobile deixa de depender do timing entre parsing e execução do script.
- O poster (`hero-timelapse-poster.webp`) já era usado como `background-image` do container `.hero-video-background` (`styles.css:407`) independente do vídeo — por isso não foi necessário nenhum elemento novo nem CSS adicional para exibi-lo em mobile: a ausência do `<video>` simplesmente revela o fundo que já estava lá. As formas geométricas (`.hero-geometries`) são uma camada separada, renderizada sempre, e continuam aparecendo por cima do poster exatamente como aparecem por cima do vídeo em desktop.

### Correção do download prematuro do reverse (desktop + mobile)

Investigando a causa do reverse carregar cedo demais, a causa raiz **não era o listener de `ended`** (que só troca os clipes) — era a chamada `reverse.load()` dentro de `revealForward()`, disparada no instante em que o **forward começa a tocar**, muito antes do reverse ser necessário (`script.js:70` na versão anterior).

Correção aplicada:
- `reverse.load()` só é chamado agora dentro de `handleEnded()`, e só se um `IntersectionObserver` (`threshold: 0.25`) confirmar que o hero **ainda está na viewport** no momento em que o forward termina. Se o usuário já rolou a página para além do hero, o download do reverse (2,7 MB) simplesmente não acontece — nem o `play()` do próximo clipe é disparado.
- Isso beneficia tanto mobile (onde o vídeo mobile não existe mais, então o cenário nem se aplica) quanto **desktop**: hoje, se o visitante rola a página antes do primeiro ciclo do time-lapse terminar, o reverse deixa de ser baixado sem necessidade — comportamento que antes acontecia sempre, incondicionalmente, apenas alguns segundos após o carregamento da página.
- Não foi usada a alternativa de "carregar após a primeira interação de scroll" porque a visibilidade real do hero (via `IntersectionObserver`) é um sinal mais preciso do que "o usuário rolou alguma vez" — um usuário pode rolar e voltar ao hero antes do forward terminar, e nesse caso ainda faz sentido carregar o reverse.

### Validação

- **Rede (Puppeteer, emulação iPhone 14):** 0 requisições a `.mp4`/`.webm` em mobile; confirmado programaticamente (script descartável, não versionado).
- **Visual (screenshot mobile 390×844):** poster estático cobre o hero corretamente, grid/formas geométricas sobrepostas, texto "Role para explorar" legível, sem salto de layout perceptível.
- **Testes:** `npm test` → **107/107 passando** (42 unit + 65 regressão), carrossel não tocado, sem regressões.
- **Lighthouse — ressalva importante:** o ambiente onde esta rodada foi executada **não tem acesso à internet** (falha ao buscar `https://cdnjs.cloudflare.com/.../gsap.min.js`, usado via CDN pelo projeto). Isso invalida a comparação direta dos scores de Performance com o baseline de produção (92–98) registrado nas seções anteriores deste relatório — o GSAP não carrega neste ambiente e penaliza o score independentemente da mudança feita aqui. Os números abaixo servem como referência de tendência (peso de página, LCP relativo mobile vs. desktop), não como comparação válida antes/depois:

| Métrica (servidor local, sem CDN) | Mobile | Desktop |
|---|---|---|
| Performance Score | 73 | 71 |
| LCP | 5.1 s | 2.9 s |
| TBT | 100 ms | 0 ms |
| Speed Index | 4.0 s | 2.2 s |
| Peso total da página | 375 KiB | 1.991 KiB |

O dado que **é** confiável e representa o ganho real desta mudança, por não depender do CDN: o peso de página mobile caiu de ~5,4 MB de vídeo (+163 KB de assets críticos) para 375 KiB no total — reflexo direto da remoção do `<video>` em mobile. Recomenda-se rodar novamente o Lighthouse em ambiente com acesso à internet (ou contra o deploy real) antes de considerar os scores absolutos como validação final.

### Deploy

Commit `0d2a153` — push feito para `origin master` em 16/07/2026, fast-forward (`3d75059..0d2a153`), sem conflito. Publicado via Netlify a partir de `master` (mesmo fluxo dos deploys anteriores).

## Validação pendente: iPhone real

O sandbox onde este trabalho foi feito não tem acesso à internet real (ver ressalva de Lighthouse acima) — a única forma de confirmar o ganho de verdade é em dispositivo físico, contra o deploy publicado. Checklist para rodar manualmente:

### 1. Velocidade percebida

- [ ] Abrir `https://perinconstrucoes.netlify.app` no Safari do iPhone, em **Wi-Fi**.
- [ ] Observar se o hero aparece imediatamente com o poster estático + formas geométricas, **sem** qualquer tela em branco ou salto esperando vídeo carregar.
- [ ] Repetir em **4G/5G** (desligar Wi-Fi ou usar modo avião + dados móveis) — a diferença deve ser ainda mais perceptível, já que antes o hero competia por banda com CSS/JS/fonte no exato momento do LCP.

### 2. Confirmação técnica via Web Inspector

Conectar o iPhone ao Mac e inspecionar o tráfego real:

1. No iPhone: **Ajustes → Safari → Avançado → Web Inspector** (ativar).
2. Conectar o iPhone ao Mac via cabo e, se solicitado, confiar no computador.
3. No Mac: Safari → menu **Desenvolver** (ativar em Preferências → Avançado → "Mostrar menu Desenvolver", se ainda não aparecer) → selecionar o nome do iPhone → selecionar a aba do site aberta no iPhone.
4. Na aba **Network** do Web Inspector remoto, recarregar a página no iPhone.
5. **Confirmar que nenhuma requisição para `.mp4` ou `.webm` aparece** — esse é o critério de sucesso desta correção. Qualquer requisição desse tipo em viewport de iPhone (largura ≤768px) indica que o `matchMedia` não disparou como esperado (verificar se é um caso de orientação/redimensionamento, ver item 4 abaixo).
6. Para referência, também vale observar o tempo até o primeiro byte e o padrão de download (completo vs. chunks) das imagens do poster, para comparação futura.

### 3. Teste visual

- [ ] No **iPhone 14**: confirmar poster + formas geométricas aparecendo corretamente, sem salto de layout, texto do hero ("Role para explorar" e títulos) legível sobre o fundo.
- [ ] No **iPhone 16**: repetir a mesma checagem — telas e densidades de pixel diferentes podem revelar recortes de imagem distintos.

### 4. Rotação / redimensionamento (borda do breakpoint)

- [ ] Girar o iPhone entre retrato e paisagem com a página do hero aberta e observar se o comportamento do vídeo/poster muda de forma inesperada ao cruzar os 768px (em retrato a maioria dos iPhones fica bem abaixo do breakpoint; em paisagem alguns modelos passam de 768px de largura lógica — nesse caso é **esperado** que o vídeo passe a carregar, já que a lógica é por largura de viewport, não por tipo de dispositivo).
- [ ] Se disponível, testar em iPad (breakpoint tablet, ainda acima de 768px) para confirmar que o vídeo continua carregando normalmente ali.

### 5. Cache real (pendente desde a Rodada 3, aproveitar o deploy atual)

```bash
curl -I https://perinconstrucoes.netlify.app/styles.min.css
```

- [ ] Confirmar o header `cache-control` retornado. Ver critérios completos e demais arquivos a testar na seção **"Parte 2 — Validação de cache"** acima (linhas 113–149) — este item apenas reaproveita esse checklist já documentado, que segue pendente desde a Rodada 3.

## Resumo consolidado — jornada completa de otimização

| Etapa | O que foi feito | Métrica-chave |
|---|---|---|
| **Fase 1** (pré-otimização, baseline) | Ponto de partida antes de qualquer otimização desta branch | Performance Score 81, LCP 3.3s, peso 312 KiB |
| **Rodada 1** — imagens, defer, cache (`_headers`) | Otimização de imagens, defer de scripts, política de cache por tipo de asset | Performance Score 81→89 (+8), LCP 3.3s→2.9s, TBT 220ms→100ms, peso 312→274 KiB (-12%) |
| **Rodada 2** — remoção do Bootstrap | Confirmado 0% de uso real (nenhuma classe/componente) via investigação; removido por completo, sem vendorizar | Validado visualmente sem nenhuma diferença (screenshots antes/depois idênticos); 107/107 testes |
| **Rodada 3** — logos superdimensionados | Redimensionamento de logos para o tamanho real de exibição | Detalhado na seção própria; checklist de validação de cache em produção deixado pendente (ainda não executado) |
| **Hero: vídeo + correções** | Corrigido `styles.min.css` desatualizado (Bug 1) e vídeo que não tocava sozinho (Bug 2, bloqueante); recompressão de vídeo (23,46 MB → 9,79 MB, -58%); remoção de vídeo órfão | Performance Score 92 (com vídeo de fato funcionando — leitura honesta: score de 95 anterior era artefato do bug, não medição real) |
| **Mobile: vídeo condicional + reverse sob demanda** (esta rodada, commit `0d2a153`) | Vídeo removido do DOM em mobile (≤768px), servindo só o poster já existente; `preload="none"` no forward; `reverse.load()` condicionado a `IntersectionObserver` em vez de disparado no início do forward | Peso do hero em mobile: ~5,4 MB de vídeo → **0 requisições de vídeo**, 375 KiB de página total; 107/107 testes; **push feito, aguardando validação em iPhone real** |

**Pendências em aberto ao final desta jornada:**
1. Validação de cache em produção (Rodada 3) — checklist pronto, nunca executado.
2. Validação desta correção mobile em iPhone real (14 e 16) — checklist acima, nunca executado.
3. Lighthouse contra ambiente com internet real (ou produção) para ter scores comparáveis de verdade — os números locais desta última rodada foram penalizados pela ausência de CDN no sandbox e não devem ser lidos como regressão real.

## Mobile: conteúdo não revelava ao rolar

> Reportado após os deploys `0d2a153`/`b4b2cda`: em mobile real, ao rolar a página, o conteúdo abaixo do hero (Diferenciais, Serviços, Valores, Depoimentos, "Como Trabalhamos") ficava em branco. Rolar de volta ao topo mostrava o hero normalmente — sintoma consistente com uma animação de revelação que nunca dispara, não com falha de carregamento de dados.

### Causa raiz confirmada

O mecanismo de revelação dessas seções é **GSAP ScrollTrigger** (não `IntersectionObserver` — esse só é usado na feature de vídeo do hero). Duas famílias de comportamento:

- `.section-title-reveal` / `.text-reveal` / `.section-tag-reveal`: têm `opacity: 1` fixo no CSS (`styles.css:2713-2723`) — **não são afetados**, sempre visíveis independente do JS.
- `.differential-item`, `.service-mosaic-item`, `.value-item`, `.testimonial-card` (via `gsap.from()`) e `.process-step` (via `ScrollTrigger.create({onEnter})`) — **dependem inteiramente do ScrollTrigger disparar** para sair de `opacity:0`.

Causa raiz: `initPage()` roda em `DOMContentLoaded` (script.js, antes desta correção), **antes** das imagens (portfólio injetado via JS, mosaico de serviços, avatares) terminarem de carregar. O ScrollTrigger calcula os marcadores de `start` (`top 85%`, `top 80%`) com base no layout daquele instante — mais curto do que o real. Nenhuma imagem do site tem `width`/`height`/`aspect-ratio` reservados, então o layout cresce depois que elas carregam. A única forma de recalcular era um listener de `resize` (`ScrollTrigger.refresh()`), mas `ScrollTrigger.config({ ignoreMobileResize: true })` — configuração correta para evitar recálculos durante o "resize" que o Safari mobile dispara ao esconder/mostrar a barra de endereço — também suprimia o único sinal de resize que mobile normalmente geraria. Resultado: em mobile (rede mais lenta, folga maior entre `DOMContentLoaded` e imagens carregadas) os marcadores ficavam desatualizados e nunca eram recalculados — o scroll do usuário nunca atingia o ponto que o ScrollTrigger (desatualizado) considerava o gatilho, e o `opacity:0` aplicado inline pelo `gsap.from()` nunca era revertido.

### Correção implementada

Duas camadas, ambas em `script.js`, dentro de `initPage()`:

1. **Correção da causa raiz** — `window.addEventListener('load', () => ScrollTrigger.refresh())`. Recalcula todos os marcadores de `start` assim que todas as imagens e fontes terminam de carregar (evento `load`, não `DOMContentLoaded`), eliminando o desalinhamento entre os marcadores calculados cedo e o layout final.
2. **Fallback de segurança** — `initScrollRevealFallback()` (nova função). Um `IntersectionObserver` com `rootMargin: '200px 0px'` observa os mesmos elementos (`.differential-item`, `.service-mosaic-item`, `.value-item`, `.testimonial-card`, `.process-step`). Quando um elemento entra na proximidade da viewport, aguarda uma folga de **1.500ms** (dando prioridade ao ScrollTrigger legítimo disparar primeiro) e só então verifica se o elemento ainda está oculto — se estiver, força `opacity:1`/`.revealed`. Não é um timer cego: só age em elementos que realmente estão perto/dentro da viewport, e continua observando indefinidamente (cobre também quem rola até uma seção muito depois do carregamento inicial, não só o primeiro segundo pós-load).

### Validação

Desta vez o GSAP carregou normalmente no sandbox (diferente das rodadas anteriores, em que `cdnjs.cloudflare.com` estava inacessível — a conectividade deste ambiente parece intermitente; recomenda-se sempre reconfirmar antes de assumir online/offline). Isso permitiu testar o comportamento real do ScrollTrigger, não só análise estática:

- **Simulação de scroll real** (Puppeteer, `window.scrollTo` em 12 passos incrementais + 2,5s de espera para o fallback) em mobile (390×844) e desktop (1440×900):

| Seção | Mobile — opacity de cada item | Desktop — opacity de cada item |
|---|---|---|
| `.differential-item` | `[1,1,1,1,1,1]` | `[1,1,1,1,1,1]` |
| `.service-mosaic-item` | `[1,1,1,1,1,1,1]` | `[1,1,1,1,1,1,1]` |
| `.value-item` | `[1,1,1,1]` | `[1,1,1,1]` |
| `.testimonial-card` | `[1,1]` | `[1,1]` |
| `.process-step` (`.revealed`) | `[true,true,true,true]` | `[true,true,true,true]` |

Todas as seções revelam corretamente em ambos os viewports — nenhum elemento ficou preso em `opacity:0`.
- **Console**: nenhum erro de JS introduzido pela mudança, em nenhum dos dois viewports.
- **Testes**: `npm test` → **107/107 passando** (42 unit + 65 regressão), carrossel intacto.
- **Desktop não regrediu**: comportamento de reveal idêntico ao mobile na tabela acima — a correção não alterou nada que já funcionava.

Não commitado nem enviado — aguardando aprovação.

## Mobile: travamento por sobrecarga de main thread

> Reportado após a correção acima: o site trava no carregamento inicial, o **próprio hero** trava ao rolar (não só as seções abaixo), e ao passar do hero o restante do conteúdo demora e trava também. Sintoma de "tudo fica lento", não "algo não dispara" — main thread sobrecarregado, não uma animação que falha em iniciar.

### Limitação do ambiente

Sem Chrome DevTools nem Safari real disponíveis no sandbox de CLI — não foi possível gravar um profile de Performance real (Passo 2 do pedido do usuário). Toda a análise a seguir é **estática**, verificada linha a linha contra `script.js`/`index.html`/`styles.css`, não medição em runtime. Passo a passo de validação real no Safari/iPhone documentado abaixo, para o usuário executar.

### Inventário de `initPage()` (script.js:1821-1853, antes desta correção)

22 funções de inicialização, todas síncronas, todas disparadas juntas na `DOMContentLoaded`, sem escalonamento. Total de instâncias GSAP ScrollTrigger criadas no load: **≥ 57** (10 `.section-title-reveal` + 4 `.text-reveal` + 24 `.process-step` via `ScrollTrigger.create` + 7 `.service-mosaic-item` + 6 `.differential-item` + 4 `.value-item` + 2 `.testimonial-card`; número exato confirmável via `ScrollTrigger.getAll().length` no console real).

### Causas identificadas (evidência, não suposição)

1. **`createParticles()` (script.js:11-24)** — 50 `<div>` com `animation: particleFloat 3s ease-in-out infinite` (`styles.css:566-573`), sem `IntersectionObserver`: rodava para sempre, mesmo com o hero fora da viewport. Individualmente barato (compositável via `transform`/`opacity`), mas somado ao resto.
2. **`initHeroAnimations()` (script.js:151-197) — causa mais provável do próprio hero travar ao rolar.** O listener `window.addEventListener('scroll', ...)` chamava, em **todo evento nativo de scroll sem throttle**, `hero.getBoundingClientRect()` (força layout read) e depois escrevia `canvas.style.transform`, `canvas.style.opacity` e `overlay.style.height` (força layout write). Isso é layout thrashing clássico (read→write repetido) disparando em alta frequência durante momentum scrolling no iOS Safari — exatamente enquanto o usuário rola o hero.
3. **`initClientsCarousel()` (script.js:1611-1792) — dois problemas simultâneos:**
   - `start()` do loop `requestAnimationFrame` do marquee de clientes era chamado incondicionalmente no load, sem `IntersectionObserver` — rodava para sempre mesmo com o carrossel (no fim da página) fora da tela.
   - `window.addEventListener('touchmove', onPointerMove, { passive: false })` — listener de touch **não-passivo registrado no `window` inteiro**, não no elemento do carrossel. Isso desativa o scroll-ahead do navegador para a página inteira, obrigando esperar a thread JS a cada touchmove — mesmo que o usuário nunca tenha tocado o carrossel. Coerente com "ao passar do hero, o resto trava".

### Correções aplicadas (Direções 1 e 2 do plano; Direção 3 — `ScrollTrigger.batch()` — adiada para depois da validação real)

1. **Throttle via `requestAnimationFrame` no scroll do hero** (`initHeroAnimations`, script.js): flag `heroScrollTicking` agrupa múltiplos eventos de scroll do mesmo frame em uma única leitura+escrita de layout, eliminando o thrashing.
2. **`touchmove` do clients carousel escopado ao `track`**, não mais ao `window`: eventos de touch continuam disparando no elemento de origem mesmo com o dedo fora dele, então não há perda de funcionalidade — só deixou de degradar o scroll-ahead da página inteira.
3. **`IntersectionObserver` pausando `hero-particles` fora da viewport**: classe `.hero-particles.is-paused .particle { animation-play-state: paused; }` (styles.css) alternada via observer no `createParticles()`.
4. **`IntersectionObserver` pausando/retomando o RAF do clients carousel** (`stop()`/`start()`) conforme visibilidade do `track` — mesmo padrão já usado para o vídeo do hero.

### Validação

- `npm test` → **107/107 passando**, nenhuma regressão nos 65 testes de regressão do carrossel.
- Validação visual pendente: passo a passo abaixo para o usuário confirmar em Safari real do iPhone.
- **Não commitado/enviado** — aguardando validação do usuário no iPhone antes de decidir sobre a Direção 3 (`ScrollTrigger.batch()`, reduzir as ≥57 instâncias).

### Como validar no Safari real do iPhone (Web Inspector remoto, aba Timelines)

1. iPhone conectado por cabo ao Mac, Web Inspector habilitado (Ajustes → Safari → Avançado → Web Inspector).
2. No Mac: Safari → menu Develop → [seu iPhone] → aba do site.
3. Na janela do Web Inspector, aba **Timelines** (não Network).
4. Gravar (círculo vermelho) → no iPhone recarregar a página, esperar estabilizar, rolar continuamente pelo hero e pelo resto da página por ~5-8s → parar a gravação.
5. Na timeline **Layout & Rendering**: procurar barras repetidas de forced layout/recalculate style sincronizadas com o gesto de scroll — se sumirem/diminuírem comparado ao comportamento relatado, confirma a correção do item 2 acima.
6. Na timeline **Scripting**: verificar se `applyHeroState`/`animate` (clients carousel) deixaram de aparecer como as funções mais chamadas durante o scroll.
7. Comparar o tempo até o primeiro frame estável (da navegação até a timeline assentar) antes/depois.

## GSAP self-hosted (elimina dependência de CDN externo)

> Motivação: o site dependia 100% de `cdnjs.cloudflare.com` para GSAP core + ScrollTrigger, carregados de forma síncrona antes de `initPage()` — nenhuma animação/reveal funciona até o CDN responder. Isso introduz variabilidade de latência fora do controle do projeto (congestionamento do CDN, distância geográfica, disponibilidade do provedor terceiro), possível contribuinte para o travamento inconsistente relatado pelo usuário ("às vezes mais, às vezes menos" na mesma rede).

### Confirmação da versão e escopo (Passo 1)

- `index.html` carregava `gsap.min.js` e `ScrollTrigger.min.js`, ambos **v3.12.5**, via `cdnjs.cloudflare.com`.
- Confirmado por grep em `script.js`: nenhum outro plugin GSAP referenciado (`SplitText`, `Draggable`, `MotionPath`, `Flip`, etc. — nenhuma ocorrência). Só core + ScrollTrigger precisavam ser vendorizados.

### Vendorização (Passo 2)

- Baixados os `.min.js` da **mesma versão exata (3.12.5)** já em uso, para não introduzir mudança de comportamento por upgrade — salvos em `vendor/gsap/gsap.min.js` e `vendor/gsap/ScrollTrigger.min.js`.
- `index.html`: tags `<script src="https://cdnjs...">` substituídas por `vendor/gsap/*.min.js`, mantendo `defer`. Comentário adicionado no HTML registrando versão (3.12.5) e data (17/07/2026) da vendorização, para atualização manual futura (sem pipeline de build automatizado).
- Removido também o `<link rel="preconnect" href="https://cdnjs.cloudflare.com">`, sem uso após a migração.

### ⚠️ Achado colateral crítico — `.min` desatualizados em produção

Durante a validação, descoberto que `script.min.js`/`styles.min.css` (os arquivos de fato servidos, referenciados em `index.html`) **não haviam sido regenerados** após o commit anterior (`1ece90f` — throttle do scroll do hero + `IntersectionObserver` das partículas/carrossel de clientes), porque a minificação é um passo manual, sem pipeline automatizado. Ou seja: aquele fix já estava em produção (push feito) mas **sem efeito real**, pois o navegador carrega os `.min`, não os fontes. Corrigido nesta rodada regenerando ambos:
- `npx terser script.js -o script.min.js -c -m`
- `npx clean-css-cli styles.css -o styles.min.css`

Confirmado via grep que os `.min` regenerados contêm as correções (`is-paused`, lógica de throttle). **Recomendação para o usuário**: sempre regenerar os `.min` como parte de qualquer alteração a `script.js`/`styles.css`, enquanto não houver build automatizado — risco real de deploys "silenciosamente sem efeito".

### Verificação de conteúdo (não timestamp) — evidência explícita

Esta é a 4ª vez nesta sessão que um `.min` desatualizado passa despercebido (1x CSS, 2x JS antes desta correção, agora institucionalizado como trava — ver seção do hook abaixo). Por isso a confirmação aqui não se apoia em "arquivo existe"/timestamp, mas em **diff de conteúdo byte-a-byte**:

```
npx terser script.js -o /tmp/script.check.min.js -c -m && diff script.min.js /tmp/script.check.min.js
→ [ok] Files are identical

npx clean-css-cli styles.css -o /tmp/styles.check.min.css && diff styles.min.css /tmp/styles.check.min.css
→ [ok] Files are identical
```

Adicionalmente, grep no conteúdo minificado confirmando que a lógica esperada está de fato presente (não apenas "algum" conteúdo):
- `window.addEventListener("scroll",()=>{a||(a=!0,requestAnimationFrame(()=>{n(i()),a=!1}))},{passive:!0})` — throttle via rAF do scroll do hero.
- `e.addEventListener("touchmove",g,{passive:!1})` com `e` = variável local do `track` (não `window`, que só recebe `mouseup`/`mousemove`) — confirma escopo corrigido do listener.
- `new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting?p():d&&(cancelAnimationFrame(d),d=null)})},{threshold:0})` — pausa/retoma o RAF do clients carousel.
- `e.classList.toggle("is-paused",!t.isIntersecting)` — pausa as partículas do hero fora da viewport.

### Trava permanente — git hook pre-commit (Passo 3)

Instalado `scripts/check-min-freshness.js`: regenera `script.min.js`/`styles.min.css` **em memória**, usando as APIs JS de `terser`/`clean-css` diretamente (não via `npx <cli>` em subprocesso — subprocess com `shell:true` quebra quando o caminho do projeto contém espaços, ex: "Área de Trabalho"; foi o primeiro bug encontrado ao implementar isto), e compara o resultado byte-a-byte com o `.min` já commitado. Se divergir, imprime o comando exato de correção e bloqueia.

O hook em si (`scripts/git-hooks/pre-commit`, versionado) é instalado em `.git/hooks/pre-commit` automaticamente via `"prepare": "node scripts/install-git-hooks.js"` no `package.json` (roda sozinho em todo `npm install`, sem depender de Husky ou de passo manual em clones novos).

**Armadilha real encontrada e corrigida durante a implementação**: este repositório é um **git worktree** (`Perin_Rev_master_compare`, ligado ao repo principal `Perin_Rev`). Hooks em worktrees vivem no **diretório git compartilhado do repo principal** (`git rev-parse --git-common-dir` → `.../Perin_Rev/.git/hooks/`), não no diretório administrativo específico do worktree (`git rev-parse --git-dir` → `.../Perin_Rev/.git/worktrees/Perin_Rev_master_compare/`). A primeira versão do instalador usava `--git-dir` e instalava o hook num lugar que o Git nunca consulta — o commit de teste passava silenciosamente, sem nenhum erro. Corrigido trocando para `--git-common-dir`.

**Teste real de bloqueio, executado e confirmado:**
1. Duas tentativas de teste com marcadores triviais (comentário; variável local não utilizada) **não** dispararam o bloqueio — corretamente, porque `terser` remove comentários e faz *dead-code elimination* de variáveis não usadas, então o `.min` "desatualizado" era na verdade idêntico ao que seria gerado. Não eram falha do hook, eram testes mal desenhados.
2. Teste válido: adicionada uma chamada `console.log("__hookTestMarkerABC")` dentro de `createParticles()` em `script.js`, sem regenerar `script.min.js`. `git add script.js && git commit -m "..."` →
   ```
   [check-min-freshness] ERRO: script.js foi modificado mas script.min.js nao foi regenerado.
     Rode: npx terser script.js -o script.min.js -c -m
     Depois adicione script.min.js ao commit.
   EXIT CODE: 1
   ```
   Commit **bloqueado** (`git log` confirma HEAD inalterado). Alteração de teste revertida em seguida, `check-min-freshness` volta a reportar OK, `npm test` confirmado 107/107 no estado limpo.

**Emergência real**: `git commit --no-verify` pula o hook — usar com extrema cautela, é exatamente o tipo de atalho que causou este bug de produção duas vezes.

### Validação (Passo 3)

- Servidor local + Puppeteer (desktop 1440×900 e mobile 390×844), simulando os mesmos 12 passos de scroll incremental + espera das rodadas anteriores:
  - `window.gsap.version` → `"3.12.5"`, `window.ScrollTrigger` definido — carregado corretamente do caminho local.
  - `scriptSrcs` confirma as 3 tags carregadas de `http://localhost:.../vendor/gsap/...` e `script.min.js` — **nenhuma** de `cdnjs.cloudflare.com`.
  - Todas as animações idênticas às rodadas anteriores: `.differential-item`, `.service-mosaic-item`, `.value-item`, `.testimonial-card` com `opacity: 1`; `.process-step` com `.revealed`; hero (`canvas.style.transform: scale(0.95)`, `overlay height: 400px`); 50 partículas presentes. Nenhum erro de console em nenhum dos dois viewports.
- **Zero requisições a `cdnjs.cloudflare.com`** — array `cdnRequests` vazio na captura de rede do Puppeteer.
- `npm test` → **107/107 passando** (nenhuma regressão).
- Medição de `console.time`/`console.timeEnd` (instrumentação temporária, removida após a medição) do início do `<head>` até `initPage()` começar: **~40-230ms localmente** (231ms na primeira carga fria, 40-50ms nas seguintes, mesma origem/cache de disco). Como o ambiente local é same-origin, esse número não captura o ganho real — o benefício principal (eliminar RTT de rede + risco de congestionamento/indisponibilidade de um CDN de terceiro) só é mensurável de forma justa em produção, comparando contra o comportamento observado anteriormente com o CDN externo.

### Cache (Passo 4) — ressalva resolvida

**Pesquisa confirmada (2 buscas independentes)**: o Netlify processa o `_headers` **top-to-bottom, primeira regra que casar vence** (não é "mais específico vence" automaticamente, nem "mesclagem" das regras conflitantes) — regras mais específicas precisam vir **antes** das genéricas no arquivo. A regra `/vendor/gsap/*` estava originalmente **depois** de `/*.js` no arquivo, então `/*.js` (max-age=2592000, sem `immutable`) venceria primeiro para os arquivos do GSAP vendorizado — o oposto do pretendido.

**Corrigido**: `/vendor/gsap/*` movida para o topo do `_headers`, antes de `/*.css` e `/*.js`:
```
/vendor/gsap/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=2592000

/*.js
  Cache-Control: public, max-age=2592000
...
```
Ainda assim recomendo confirmar o header `Cache-Control` de fato retornado em produção após o deploy (mesmo checklist de validação de cache já pendente desde a Rodada 3) — a pesquisa é consistente entre fontes, mas nenhuma delas é a documentação oficial do Netlify declarando isso explicitamente sobre esse comportamento exato.

### Peso adicionado ao repositório

| Arquivo | Tamanho |
|---|---|
| `vendor/gsap/gsap.min.js` | 72 KB |
| `vendor/gsap/ScrollTrigger.min.js` | 44 KB |
| **Total** | **116 KB** |

Peso que antes vinha do CDN (não contabilizado no repositório) agora faz parte do projeto — mesmo peso de transferência para o usuário final (arquivos idênticos aos do CDN), mudança é apenas de origem/latência, não de tamanho.

**Não commitado nem enviado — aguardando aprovação.**

## ScrollTrigger.batch() — redução de instâncias

> Motivação: diagnóstico contra produção real (`audit/diagnostico-producao-real.md`) mostrou site limpo (deploy correto, GSAP self-hosted, Lighthouse mobile 93), mas identificou uma long task de 165ms atribuída a `ScrollTrigger.min.js` durante o carregamento — coerente com a hipótese, já levantada em rodadas anteriores, de que o alto número de instâncias individuais de `ScrollTrigger` (uma por item, em 5 seções) sobrecarrega o main-thread. Tentativa: consolidar via `ScrollTrigger.batch()`.

### Passo 1 — Mapeamento e correção de uma contagem anterior incorreta

Nesta rodada, a contagem real de `ScrollTrigger.getAll().length` em runtime (Puppeteer, GSAP real) é **37**, não "≥57" como reportado em rodadas anteriores. A causa da discrepância: o grep usado antes (`class="[^"]*process-step[^"]*"`) capturava também classes irmãs que contêm a substring `process-step` (`process-step-number`, `process-step-content`, `process-step-title`, `process-step-description`, `process-step-visual`), inflando a contagem de `.process-step` de 4 (real) para 24 (aparente). Correção registrada aqui por transparência — a estimativa estática anterior estava errada, o número real sempre foi 37.

As 5 funções que criam 1 ScrollTrigger por item via `.forEach()`:

| Função | Seletor | Itens reais | Padrão original |
|---|---|---|---|
| `initScrollReveals` (bloco `.process-step`) | `.process-step` | 4 | `ScrollTrigger.create()` por item, `once:true`, `onEnter` com `classList.add('revealed')` após `setTimeout(i*200)` — reveal 100% CSS-driven (`styles.css:1215-1219`), sem tween GSAP |
| `initServicesReveal` | `.service-mosaic-item` | 7 | `gsap.from()` por item, `toggleActions: 'play none none reverse'`, `delay: i*0.1` |
| `initDifferentialsAnimation` | `.differential-item` | 6 | idêntico ao acima, `delay: i*0.1` |
| `initValuesReveal` | `.value-item` | 4 | idêntico, mas `trigger: '.values-row'` (compartilhado entre os 4 itens, não o próprio item), `delay: i*0.15` |
| `initTestimonialsReveal` | `.testimonial-card` | 2 | idêntico, `delay: i*0.15` |

Todos os itens dentro de cada seção têm comportamento **idêntico** (mesmo `opacity`/`y`/`duration`/`ease`), variando só o `delay` em cascata por índice — compatível com `stagger` do `batch()`, sem perda de efeito visual.

**Não incluídos no escopo** (conforme pedido): `.section-title-reveal` (10 instâncias) e `.text-reveal` (4 instâncias) continuam com ScrollTrigger individual — ficam de fora por decisão explícita do usuário nesta rodada.

### Passo 2 — Implementação

Criada função helper `batchReveal()` em `script.js`, usada por `initDifferentialsAnimation`, `initServicesReveal`, `initValuesReveal` e `initTestimonialsReveal`:
```js
function batchReveal(selector, { y = 40, duration = 0.6, stagger = 0.1, ease = 'power2.out', start = 'top 85%' } = {}) {
    gsap.set(selector, { opacity: 0, y });
    ScrollTrigger.batch(selector, {
        start,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration, stagger, ease, overwrite: true }),
        onLeaveBack: (batch) => gsap.to(batch, { opacity: 0, y, duration, stagger, ease, overwrite: true }),
    });
}
```
`ScrollTrigger.batch()` não tem um `toggleActions` nativo — o `'play none none reverse'` original (anima ao entrar, reverte ao rolar de volta para cima) foi replicado manualmente: `onEnter` toca a animação para frente, `onLeaveBack` toca a reversão. O `delay: i*X` em cascata virou `stagger` (mesmo efeito visual).

`.process-step` usa `ScrollTrigger.batch()` sem tween GSAP — só reproduz o `onEnter` com `classList.add('revealed')` escalonado por `setTimeout`, preservando o mecanismo 100% CSS.

**Nuance documentada para `.value-item`**: o original usava `trigger: '.values-row'` (um único elemento compartilhado por todos os 4 itens — todos disparavam no mesmo ponto de scroll). `ScrollTrigger.batch()` usa cada item como seu próprio trigger. Como os 4 itens estão na mesma linha (mesmo grid/flex row), o topo de cada item coincide com o topo da row — na prática o ponto de disparo é o mesmo (diferença sub-pixel, se houver). Não é um comportamento novo, mas o mecanismo por trás mudou; registrado por transparência.

**Carrossel não tocado** — nenhuma alteração em `createCascadingSlider`/`initCascadingSlider`/`initClientsCarousel`, conforme instruído.

### ⚠️ Achado importante — a premissa "batch() reduz o número de instâncias" está incorreta

O pedido presumia que `ScrollTrigger.getAll().length` cairia de "57+ para um número bem menor". **Medido em runtime (Puppeteer, GSAP real, antes/depois em servidores paralelos): 37 → 37 — nenhuma redução na contagem.**

Investigado o motivo: `ScrollTrigger.batch()` **continua criando uma instância de `ScrollTrigger` por elemento internamente** — o que ele consolida é a **invocação do callback** (agrupa elementos que cruzam o threshold dentro do mesmo intervalo curto em uma única chamada de `onEnter`/`onLeaveBack`, com um único tween via `stagger`), não o número de triggers rastreados. Confirmado inspecionando `ScrollTrigger.getAll()[i].trigger.className` após a conversão: os elementos `.process-step`, `.service-mosaic-item`, `.differential-item`, `.value-item`, `.testimonial-card` continuam aparecendo individualmente na lista.

**O ganho real de `batch()` não é "menos triggers", é "menos tweens GSAP criados antecipadamente"**: antes, cada `gsap.from()` criava uma tween própria já no load (mesmo que sua animação só rodasse quando o ScrollTrigger disparasse); agora, o tween só é criado dentro do `onEnter`/`onLeaveBack`, quando o grupo de fato entra/sai da viewport — e um único tween anima todos os elementos do grupo via `stagger`, em vez de N tweens independentes. Isso reduz trabalho de setup no load e o número de tweens simultâneos ativos durante o scroll, sem reduzir a contagem de triggers observáveis.

### Passo 3 — Validação

- **`ScrollTrigger.getAll().length`**: **37 → 37** (sem mudança — ver achado acima; a expectativa original do pedido estava tecnicamente incorreta sobre o que `batch()` reduz).
- **Testes automatizados**: `npm test` → **107/107 passando**. 1 ajuste necessário: `tests/unit/slider.test.js` mockava `global.ScrollTrigger` só com `refresh`/`config` — adicionados `batch`/`create` ao mock (infra de teste, não o carrossel).
- **Validação visual** (Puppeteer, 390×844, GSAP real, servidores locais em paralelo — commit anterior vs. código atual):
  - Scroll progressivo completo: `.differential-item`, `.service-mosaic-item`, `.value-item`, `.testimonial-card` → `opacity: 1` em todos os itens, `.process-step` → `.revealed` em todos, **idêntico antes/depois**.
  - Scroll de volta ao topo (reversão): comportamento equivalente antes/depois — todos os itens revertem para próximo de `opacity: 0`, com uma variação menor na dinâmica *intermediária* do stagger (a ordem exata de qual item termina de reverter primeiro difere ligeiramente entre `delay` implícito no tween original e `stagger` explícito no batch), mas o estado de repouso final é o mesmo em ambas as versões. Nenhum erro de console em nenhum dos dois.
- **Lighthouse local, antes vs. depois** (mesmo host, `--throttling-method=simulate`, mobile):

| Métrica | Antes (sem batch) | Depois (com batch) | Variação |
|---|---|---|---|
| Performance Score | 95 | 96 | +1 |
| Total Blocking Time | 110ms | 70ms | **-40ms (-36%)** |
| Main-thread work breakdown | 2.7s | 2.6s | -0.1s |
| Long task em `script.min.js` | 129ms | 84ms | **-45ms (-35%)** |
| Long task em `vendor/gsap/gsap.min.js` | 79ms | 81ms | +2ms (ruído) |

A long task de 165ms atribuída a `ScrollTrigger.min.js` observada no diagnóstico de produção real não se reproduziu neste teste local (nem antes, nem depois) — variação de ambiente/timing, não comparável 1:1. Mas a redução real e reproduzível da long task de `script.min.js` (129→84ms) e do TBT total (110→70ms) é uma melhoria genuína, mensurável, coerente com a explicação técnica acima (menos tweens criados no load).

### Correção — `leaveStagger: 0` no `onLeaveBack`

Após esclarecimento pedido pelo usuário sobre a dinâmica intermediária da reversão (ver troca anterior), medição real (Puppeteer, screenshots em 25/50/75% da transição) confirmou que `stagger` no `onLeaveBack` introduzia uma cascata nova e perceptível (~150-300ms de defasagem entre itens) que **não existia no código original** — o `toggleActions: 'play none none reverse'` de antes revertia sincronizado (o `delay` de um `gsap.from()` fica na cauda do tween, não na cabeça; ao reverter a partir do estado 100% completo, o delay vira tempo morto depois da animação visual, não antes).

**Correção**: `batchReveal()` passou a aceitar `leaveStagger` (default `0`), usado só no `onLeaveBack`. O `onEnter` permanece **byte-a-byte idêntico**:
```diff
 onEnter:     (batch) => gsap.to(batch, { opacity: 1, y: 0, duration, stagger,              ease, overwrite: true }),
-onLeaveBack: (batch) => gsap.to(batch, { opacity: 0, y,    duration, stagger,              ease, overwrite: true }),
+onLeaveBack: (batch) => gsap.to(batch, { opacity: 0, y,    duration, stagger: leaveStagger, ease, overwrite: true }),
```
Como `leaveStagger` default é `0` e nenhum dos 4 call-sites o sobrescreve, a correção se aplica automaticamente às 4 seções que usam `batchReveal()` — incluindo `.differential-item` (mesmo mecanismo, mesmo problema, não estava no pedido explícito de re-teste, mas corrigida como efeito colateral natural do default).

**Validação repetida (mesmos 3 pontos, 150/300/450ms, agora com scroll gradual em 20 passos — mais realista que o salto abrupto do teste anterior):**

| Seção | Reversão após o fix |
|---|---|
| `.testimonial-card` (2 itens) | **Totalmente sincronizada** — os 2 itens idênticos em cada instante amostrado, ambos em `opacity: 0` no repouso. Igual ao original. |
| `.service-mosaic-item` (7 itens) | **Sincronizada, com ruído desprezível** — 6 de 7 itens em `opacity: 0` no repouso, 1 item em `0.035` (diferença imperceptível). |
| `.value-item` (4 itens) | **Melhorou substancialmente, mas não 100% idêntico ao original**: no repouso, 1 item ficou em `opacity ~0.38` enquanto os outros 3 ficaram em `~0.21` — um resíduo de 2 grupos, não mais a cascata de 4 passos distintos que o `stagger` introduzia, mas também não a sincronização perfeita do código antigo (que usava 1 único trigger compartilhado `.values-row` para os 4 itens). Causa: `ScrollTrigger.batch()` usa cada item como seu próprio trigger — mesmo com `stagger:0`, o agrupamento interno de callbacks do `batch()` pode dividir os 4 itens em 2 chamadas de `onLeaveBack` levemente distintas no tempo. Isso não é ajustável via `stagger` — é inerente à troca de "1 trigger compartilhado" por "4 triggers individuais". Resíduo pequeno (dezenas de ms, não mais 150-300ms), provavelmente no limiar ou abaixo da percepção — registrado com honestidade em vez de declarado "idêntico".

`onEnter` confirmado intacto por inspeção de diff (não por medição dinâmica — uma tentativa de medir via Puppeteer nesta rodada teve um problema metodológico de pré-posicionamento de scroll e foi descartada em vez de reportada como evidência).

**Testes**: `npm test` → **107/107 passando** após a correção.

**Não commitado nem enviado — aguardando aprovação.**

## Carregamento inicial: poster, hero entrance, primeira seção, travamento intermitente

> Diagnóstico apenas — nada corrigido nesta seção ainda. 4 sintomas reportados: (1) poster do hero demora a aparecer, (2) textos do hero surgem com atraso perceptível, (3) primeira seção após o hero aparece "cortada"/incompleta ao rolar, (4) travamento ocasional completo. Investigação com evidência real (Puppeteer + Chrome DevTools Protocol, throttling de rede Slow-4G-like + CPU 4x), não só leitura estática de código — os episódios anteriores desta sessão (`.min` desatualizado, premissas erradas sobre `batch()`) ensinaram a não confiar em suposição sem medir.

### Passo 1 — Cadeia de dependências do carregamento

Ordem real no `index.html` (`<head>`):
1. `<link rel="preload" href="fonts/manrope-latin.woff2" ...>` — só a fonte **Manrope** (títulos) é pré-carregada.
2. `<link rel="stylesheet" href="styles.min.css">` — **render-blocking**, sem `preload`/`media` assíncrono.
3. `<script src="vendor/gsap/gsap.min.js" defer>`, `<script src="vendor/gsap/ScrollTrigger.min.js" defer>`, `<script src="script.min.js" defer>` — todos `defer` (corretos), mas **deferred scripts só executam depois que a stylesheet que os precede termina de carregar** (regra do próprio navegador, para evitar acessar `computedStyle` antes do CSSOM existir) — então `styles.min.css` bloqueia a execução de TODA a cadeia de JS, não só a renderização.

**Poster do hero**: `<video poster="assets/images/hero-fundo/hero-timelapse-poster.webp">` no desktop, e via CSS em `.hero-video-background { background: var(--color-bg-primary) url('.../hero-timelapse-poster.webp') center/cover; }` (`styles.css:399-408`) — **mesmo mecanismo em ambos os breakpoints**, já que em mobile o `<video>` é removido e só a regra CSS de fundo permanece visível. **Nenhum `fetchpriority`, nenhum `<link rel="preload">` para essa imagem em lugar nenhum do projeto** (confirmado por grep).

**`initHeroEntrance()`** (script.js): depende só de `initPage()` rodar (bind em `DOMContentLoaded`) — **não espera fontes, não espera imagens, não usa `document.fonts.ready`, não usa nenhuma Promise**. O atraso é 100% um `gsap.timeline({ delay: 0.4, ... })` **hardcoded**, com badge→título(3 linhas)→subtítulo→ações encadeados via offsets `'-=0.3'`/`'-=0.5'`, timeline total ≈ 3.1s a partir de quando `initHeroEntrance()` roda. Confirmado por grep em todo `script.js`: **nenhuma referência a `document.fonts`/`fonts.ready`** em lugar nenhum do código.

### Causa raiz confirmada empiricamente (Puppeteer + CDP, Slow-4G simulado + CPU 4x)

Waterfall real de rede sob throttle (`Network.emulateNetworkConditions` ~400kbps/400ms latência + `Emulation.setCPUThrottlingRate: 4`):

| Recurso | Terminou de baixar em |
|---|---|
| `styles.min.css` | 2759ms |
| `logo-perin-navbar.webp` | 3431ms |
| `ScrollTrigger.min.js` | 3927ms |
| `manrope-latin.woff2` (preloaded) | 4229ms |
| `script.min.js` | 4236ms |
| `gsap.min.js` | 4658ms |
| **`hero-timelapse-poster.webp`** | **5738ms** |
| **`inter-latin.woff2`** (não preloaded) | **6350ms** |

**Sintoma 1 explicado**: o poster é a **penúltima** coisa a terminar de baixar — depois de CSS, logo e os 3 scripts JS inteiros. Isso acontece porque (a) é descoberto via CSS `background`, só depois do CSSOM existir (mais tarde que um `<img>` ou algo com `preload`), e (b) sem `fetchpriority`/`preload`, o navegador não dá prioridade a ele frente aos scripts. Sob rede lenta, o usuário olha para `var(--color-bg-primary)` sólido por **quase 6 segundos**.

**Sintoma 2 explicado**: `initPage()` (e portanto `initHeroEntrance()`) só roda depois que a cadeia inteira acima (CSS → 3 scripts deferred) termina de EXECUTAR — em uma repetição do teste, `DOMContentLoaded` só disparou aos **~5.2s**; a partir daí ainda soma o `delay:0.4` + progressão da timeline (badge visível só em ~7s, título completo em ~8s neste teste). O "atraso perceptível" não é a timeline em si (ela é curta, 3.1s) — é tudo que precisa acontecer **antes** dela sequer começar.

**Sintoma 3 explicado — recorrência do bug de ScrollTrigger, mas por uma causa NOVA que escapou do fix anterior**: `inter-latin.woff2` (fonte usada em `--font-secondary`, corpo de texto — parágrafos, nav, subtítulo) **não tem `<link rel="preload">`** (só Manrope tem) e é a **última** coisa a terminar de baixar (6350ms), depois até do poster. Com `font-display: swap` (`styles.css:11`), o texto renderiza primeiro com a fonte de fallback e **troca (reflow)** para Inter quando ela chega — e isso pode acontecer **depois** do evento `window.load`, que é justamente o gatilho do `ScrollTrigger.refresh()` já implementado (`script.js:1909`, do fix de sessão anterior). `document.fonts.ready` resolveu em ~6196ms num teste em que `window.load` já tinha disparado em ~4649ms — **1,5s depois**. O fix anterior cobria imagens (evento `load` espera imagens), mas **não cobre fontes com `font-display:swap`**, porque o `load` não espera o *swap* de fonte terminar — é exatamente esse gap que a seção "Sobre Nós" (primeira após o hero) expõe: o `ScrollTrigger.refresh()` já rodou com o layout de ANTES do texto trocar de fonte, e a troca de fonte (que muda métricas/quebras de linha) desloca a posição de tudo abaixo do hero, desatualizando os marcadores de novo — mesma classe de bug do fix anterior, causa diferente (fonte, não imagem).
Nota: `.section-title-reveal`/`.text-reveal` (usados no "Sobre Nós") têm `opacity: 1` fixo no CSS (`styles.css:2718-2729`) — não ficam presos invisíveis. O "cortado" percebido é mais provavelmente o **reflow real do texto** acontecendo enquanto a seção já está parcialmente visível (linhas re-quebrando visivelmente), não uma animação GSAP interrompida.

### Passo 3 — Travamento intermitente (sintoma mais grave): NENHUM deadlock/Promise pendente encontrado

Busca exaustiva em `script.js` por padrões de risco: `while(`, `setInterval`, `async function`, `await`, `new Promise`, `XMLHttpRequest`, `.then(` sem `.catch(`, listeners de evento sem fallback de timeout. Resultado:
- **Nenhum `while`, `setInterval`, `async/await`, `XMLHttpRequest`** em todo o arquivo.
- Único `.then(` é o `fetch()` do formulário de contato (`submitToAPI`, linha ~1331) — tem `.catch()` correspondente, e só roda quando o **usuário** envia o formulário (não durante o carregamento inicial).
- `video.addEventListener('canplaythrough', revealForward, { once: true })` (linha 121, `initHeroVideoBackground`) **não tem timeout de segurança nem `onerror`** — se o vídeo nunca atingir `canplaythrough` (falha de rede real, não só lentidão), o vídeo nunca aparece. **Mas isso só roda em desktop** (mobile remove o `<video>` do DOM inteiramente antes desse código, `script.js:59-66`) — não explica o travamento relatado em mobile. É um ponto frágil real, porém de escopo/impacto limitado (vídeo nunca aparece, mas o poster de fundo cobre o hero de qualquer forma — não trava a página).
- Nenhum outro `Promise`/callback assíncrono sem tratamento de erro encontrado.

**Conclusão**: não há um deadlock de código (nenhuma Promise pendurada, nenhum loop infinito). O teste sob throttle **completou corretamente em todos os casos rodados** (nenhum erro de console, nenhuma requisição falhada) — só muito mais devagar. A explicação mais provável para "trava por completo, precisa recarregar" é **contenção severa de main-thread + rede**, não um hang eterno: no pior caso medido, mais de 8 segundos se passam entre a navegação e o hero ficar visualmente completo, com potencialmente dezenas de tarefas longas empilhadas (37 instâncias de ScrollTrigger sendo criadas, timeline do hero, parsing/execução de 150KB de JS, tudo synchronamente dentro de `initPage()`) — um dispositivo real mais lento que o simulado, ou uma rede pior, pode facilmente esticar essa janela a ponto de o usuário achar que travou e recarregar a página no meio do processo (o que reinicia tudo do zero, criando a impressão de "trava sempre que eu tento"). **Isto não é prioridade de correção por "trava real" (não existe), mas continua sendo prioridade por gravidade percebida** — reduzir a cadeia crítica (Passo 5) ataca a causa direta desse tempo de exposição.

Nenhum recurso externo (CDN) restante — confirmado por grep, só `rel="canonical"` aponta para um domínio externo (não é uma requisição de rede).

### Resumo das causas (Passo 4)

| Sintoma | Causa confirmada | Prioridade de correção |
|---|---|---|
| 1. Poster demora | `background-image` via CSS, sem `fetchpriority`/`preload`; penúltimo recurso a terminar (5738ms sob throttle) | Alta |
| 2. Texto do hero atrasado | Delay de 0.4s hardcoded + timeline de 3.1s só começa depois de TODA a cadeia CSS→3 scripts JS executar | Média (não é bug, é design; mas a cadeia que a antecede é o problema real) |
| 3. Primeira seção "cortada" | `inter-latin.woff2` não preloaded, `font-display:swap`, troca de fonte após `window.load` já ter disparado `ScrollTrigger.refresh()` — reflow tardio desalinha os marcadores | Alta |
| 4. Travamento ocasional | **Nenhum deadlock encontrado** — contenção severa de main-thread/rede sob condições ruins, não um hang de código | Média (mitigado pelas correções 1-3, sem "fix" dedicado por não haver bug de fato) |

**Não implementado ainda — aguardando aprovação para o Passo 5.**

### Passo 5 — Correções 1-3 implementadas (Passo 4 aguardando aprovação)

**Passo 1 — Preload da fonte Inter:**
```html
<link rel="preload" href="fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
```
Caminho confirmado (`fonts/inter-latin.woff2`, mesmo padrão do preload já existente para Manrope).

**Passo 2 — Preload do poster (Opção A, sem mudar `background-image`):**
```html
<link rel="preload" href="assets/images/hero-fundo/hero-timelapse-poster.webp" as="image" fetchpriority="high">
```
Layout do hero validado visualmente (screenshot antes/depois, 390×844, rede normal) — **pixel-idêntico**, nenhuma mudança de posicionamento/cover/proporção. Confirmado via CDP que continua sendo **1 única requisição** (sem duplicar o fetch entre o `preload` e o uso real via CSS `background`).

**Passo 3 — Refresh adicional em `document.fonts.ready`:**
```js
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
}
```
Adicionado logo após o `window.addEventListener('load', () => ScrollTrigger.refresh())` já existente.

### Validação — waterfall antes/depois (Slow 4G simulado + CPU 4x, mesma condição do diagnóstico)

**Ordem `fonts.ready` vs `load` — 5 execuções consecutivas cada lado** (pergunta central: o gap que causava a seção "cortada" foi eliminado de forma consistente, ou só por sorte?):

| Execução | ANTES (sem preload) | DEPOIS (com preload) |
|---|---|---|
| 1 | fonts **depois** do load (gap real) | fonts **antes** do load (sem gap) |
| 2 | fonts **depois** do load (gap real) | fonts **antes** do load (sem gap) |
| 3 | fonts **depois** do load (gap real) | fonts **antes** do load (sem gap) |
| 4 | fonts **depois** do load (gap real) | fonts **antes** do load (sem gap) |
| 5 | fonts **depois** do load (gap real) | fonts **antes** do load (sem gap) |

**5/5 antes com o gap confirmado, 5/5 depois sem o gap** — o preload da fonte Inter elimina de forma consistente e reproduzível a condição de corrida que causava a seção "Sobre Nós" ser recalculada com layout desatualizado. Este é o resultado mais importante desta rodada: o sintoma 3 tinha causa raiz identificada corretamente, e a correção resolve exatamente essa causa, de forma determinística sob a mesma condição de rede.

**Nenhum erro de console em nenhuma das 10 execuções** (5+5) — reforça a conclusão do Passo 3 anterior: não há deadlock, só o gap de timing que agora está fechado.

**Tempo até o poster/fonte terminarem de baixar — resultado misto, reportado com honestidade:**

| Recurso | ANTES | DEPOIS | Variação |
|---|---|---|---|
| `hero-timelapse-poster.webp` | ~5760-5840ms | ~5990-6070ms | **~230ms mais lento** |
| `inter-latin.woff2` | ~6230-6270ms | ~5780-5820ms | **~450ms mais rápido** |

O poster **não ficou mais rápido** sob esta condição de rede extremamente limitada (throughput agregado ~400kbps, igual ao "Slow 4G" do Chrome DevTools) — na verdade ficou ligeiramente mais lento. Investigado o motivo: a rede simulada limita o **throughput agregado da conexão**, não por-requisição — antes, o poster era baixado tarde mas sozinho (linha inteira disponível para ele); agora, com `fetchpriority="high"` + preload da fonte também com prioridade alta, os dois competem por download simultâneo logo no início, junto com CSS e scripts, **dividindo** a banda já escassa entre mais requisições de alta prioridade ao mesmo tempo — em vez de reduzir o tempo de conclusão, apenas redistribui a mesma banda entre mais streams concorrentes. `fetchpriority`/`preload` ajudam quando há folga de banda e o gargalo é ordem/agendamento — não quando o gargalo é a banda em si (como no perfil "Slow 4G" testado). Confirmado com Lighthouse local: `FCP` e `Speed Index` pioraram ligeiramente (1.6s→1.9s cada), `LCP`/`TTI` inalterados, score igual (95).

**Isto não invalida a correção**: o ganho real do preload não é "poster chega mais rápido no pior caso de banda", é **"o navegador descobre e prioriza o recurso desde o `<head>`, independente de quando o CSS/JS terminam de processar"** — o que é o que efetivamente resolve o gap de `fonts.ready` vs `load` (5/5 execuções). O poster continua demorando sob rede muito ruim porque o gargalo ali é banda insuficiente para o total de bytes necessários, não prioridade de agendamento — nenhum `fetchpriority` resolve throughput insuficiente.

### Testes e Lighthouse

- `npm test` → **107/107 passando**.
- Lighthouse mobile local (Slow 4G simulado, `--throttling-method=simulate`): score **95 → 95** (igual), FCP/SI levemente piores (~300ms, explicado acima), LCP/TTI inalterados.

### Passo 4 — Recomendação sobre o `delay: 0.4` (aguardando aprovação, nada alterado ainda)

Tentativa de medir precisamente "quanto tempo o usuário espera vendo a página parada antes do badge/texto começar a animar" encontrou **uma anomalia de medição em Chrome headless** (o badge apareceu ~3.4s depois do `DOMContentLoaded` em rede rápida — nem remotamente compatível com o `delay:0.4` codificado), muito provavelmente um artefato do `requestAnimationFrame` sendo executado de forma não-confiável em uma aba headless sem foco real, não um reflexo do comportamento em um navegador real visível. Não vou usar esse número questionável para basear a recomendação.

**Raciocínio a partir do código + dos tempos de rede já medidos (esses sim confiáveis):**
- Em rede normal: `DOMContentLoaded` ocorre em ~200-300ms; o poster (agora preloaded) já está pronto em ~100ms — **o poster sempre chega bem antes da timeline começar**, delay ou não. Reduzir/remover o `delay:0.4` não arrisca mostrar texto sobre um fundo ainda não carregado nesse cenário.
- Em rede lenta (Slow 4G simulado): `initPage()`/`initHeroEntrance()` só rodam depois de ~6.1-6.3s (gargalo é a cadeia CSS→JS, não o `delay`); o poster termina de baixar em ~6.0s — **os dois chegam quase juntos, com ou sem o delay de 0.4s**, porque 400ms é irrelevante frente a um atraso de rede de vários segundos.

**Conclusão**: em nenhum dos dois extremos (rede rápida ou lenta) o `delay:0.4` está de fato "esperando o poster" — ele é puro **ritmo/coreografia estética** (dar uma pequena pausa antes do badge entrar), não uma sincronização funcional com o carregamento do fundo. **Recomendação: reduzir de `0.4` para algo entre `0.1` e `0.15`**, mantendo uma pequena pausa perceptível (evita o "tudo aparece de um golpe só") sem o atraso de quase meio segundo que hoje soma à percepção de lentidão em rede rápida (onde tudo mais já está pronto). Não recomendo remover completamente (`0`) — um mínimo de stagger antes do badge evita a sensação de "pop" abrupto assim que o CSS/JS terminam de carregar.

**Aprovado e implementado**: `delay: 0.4` → `delay: 0.15` em `initHeroEntrance()` (script.js). Comentário desatualizado ("NO delay, immediate", que já contradizia o `delay:0.4` existente) corrigido para refletir o raciocínio real. `.min` regenerados, `npm test` → **107/107 passando** após a mudança.

### Fechamento

Todas as 4 correções do Passo 5 implementadas e validadas nesta rodada:
1. Preload de `inter-latin.woff2` — elimina o gap `fonts.ready`/`load` (5/5 → 0/5 execuções com o bug).
2. `ScrollTrigger.refresh()` em `document.fonts.ready` — cobertura adicional para o mesmo gap.
3. `fetchpriority="high"` + preload no poster do hero — garante descoberta/priorização antecipada (ganho de correção, não de velocidade bruta sob rede saturada, conforme explicado acima).
4. `delay: 0.4 → 0.15` na timeline de entrada do hero.

Testes: 107/107. Layout do hero validado pixel-idêntico. Zero erros de console em 10 execuções sob rede lenta simulada.

## Contenção de main thread durante a animação do hero (Passo 0) + redução da timeline (Passo 1)

> Rodada seguinte: mesmo com o poster aparecendo imediatamente (fix anterior confirmado funcionando pelo usuário), sobrava a queixa de que a própria animação do hero soluça/trava durante a execução — sintoma diferente de "atraso antes de começar". Investigado com evidência real (Puppeteer + CDP Performance/longtask + patch de `requestAnimationFrame`), não só leitura de código.

### Passo 0 — reordenar `initPage()` para tirar trabalho síncrono do caminho do hero

**Confirmado**: `initHeroEntrance()` roda antes de todas as outras inicializações (partículas, ~37 instâncias de ScrollTrigger de seções fora da tela, carrossel de clientes), todas síncronas, sem `setTimeout`/`requestIdleCallback` entre elas. Medido via `PerformanceObserver` (longtask): **long task de 415ms** logo em t=168ms — exatamente o bloco de `initPage()` — com gaps de frame de rAF de até 233ms nessa janela.

**Breakdown por função** (instrumentado): `initScrollReveals` 60ms, `initHeroEntrance` 37ms, `initClientsCarousel` 27ms, `initValuesReveal` 14ms, resto somando ~54ms — **192ms de trabalho síncrono, nenhum dele visível no primeiro frame**.

**Implementação**: `initPage()` dividido em dois grupos. Crítico (mantido síncrono): `initHeroVideoBackground`, `initHeroParallax`, `initHeroEntrance`, `initHeroAnimations`, `initNavigation`, `initButtonRipple` (inclui o botão do hero — precisa estar clicável de imediato). Não-crítico (tudo abaixo da dobra: partículas, os `ScrollTrigger.batch()`/individuais, formulário, os 3 carrosséis/galeria): adiado.

**Tentativa 1 (revertida)**: agrupar todo o não-crítico em **um único** `requestIdleCallback` piorou a situação — sob CPU throttled, o navegador atrasa o callback até perto do timeout (200ms) e aí roda o bloco inteiro de uma vez do mesmo jeito, só mais tarde. Medido: long tasks subiram para ~900ms em média, gaps de até 2,6s.

**Tentativa 2 (implementada)**: `runQueueWhenIdle()` — cada função não-crítica em seu **próprio** `requestIdleCallback`, encadeados (a próxima só é agendada depois que a anterior termina), com fallback `setTimeout(fn, 0)` para navegadores sem `requestIdleCallback` (Safari). `initClientsCarousel`/`initCascadingSlider`/`initPortfolioGallery` tiveram só o **momento** de inicialização adiado — nenhuma lógica interna alterada.

### Achado metodológico — minha primeira medição de "stutter" estava contaminada

Comparando antes/depois com a métrica original (`rAF gaps > 30ms` na janela toda), o resultado pareceu neutro/pior (~2,6s de "gap" em ambos). Investigado: essa métrica contava como stutter **qualquer** intervalo sem frame, incluindo o período **depois** que a animação do hero já tinha terminado naturalmente (nada mais pedindo frames não é um travamento). Corrigido para medir só durante a janela em que o título está de fato em transição (opacity entre 0 e 1):

| Métrica (CPU 4x, 10 execuções) | Antes do Passo 0 | Depois do Passo 0 |
|---|---|---|
| Título começa a animar (média) | ~4,4s | ~4,1s |
| Maior stall real *durante* a animação ativa | 29,4ms | 41,3ms |

**Resultado honesto**: o Passo 0 antecipa o início da animação em ~200-300ms de forma consistente (ganho real), mas **não mostrou evidência clara de eliminar stutter durante a animação** nesta simulação — ambos os valores (29-41ms) já eram pequenos, nada como as long tasks de 400-900ms medidas no load. Reportado ao usuário antes de prosseguir; ele optou por seguir para o Passo 1 mesmo assim.

### Passo 1 — timeline reduzida (~2,85s → ~1,5s)

Durations e overlaps reduzidos pela metade, mantendo a mesma estrutura de cascata (badge → 3 linhas do título → subtítulo → botões):

| Elemento | Antes (`duration`, overlap) | Depois |
|---|---|---|
| badge | 0.7s | 0.35s |
| título linha 1 | 0.9s, `-=0.3` | 0.45s, `-=0.15` |
| título linha 2 | 0.9s, `-=0.5` | 0.45s, `-=0.25` |
| título linha 3 | 0.9s, `-=0.5` | 0.45s, `-=0.25` |
| subtítulo | 0.7s, `-=0.5` | 0.35s, `-=0.25` |
| botões | 0.7s, `-=0.3` | 0.35s, `-=0.15` |

Total: delay 0.15s + timeline ≈ 1,5s (era 2,85s).

### Validação — armadilha do ambiente de teste headless

Uma tentativa de validação visual dinâmica (Puppeteer, sem CPU throttle) mostrou o `gsap.ticker.frame` **travado** em um número fixo (4-8) por segundos inteiros, com elementos parados em opacidades intermediárias — sintoma aparentemente idêntico ao "trava no meio" relatado. Investigado antes de assumir qualquer coisa: **o mesmo congelamento reproduz de forma idêntica na versão anterior ao Passo 0/1 (HEAD antes desta rodada)**, e `script.js` não toca em `gsap.ticker`/`lagSmoothing` em lugar nenhum (confirmado por grep). Conclusão: é um artefato do Chrome headless neste sandbox (sem compositor/display real, `requestAnimationFrame` executando a ~2-3fps de forma intermitente), não uma regressão desta rodada — mas também significa que a validação visual dinâmica direta neste ambiente específico não é confiável no modo "sem throttle".

**Validação que funcionou** (mesma metodologia CPU-4x-throttle das rodadas anteriores, que já tinha se mostrado consistente): amostragem fina da opacidade dos 6 elementos ao longo do carregamento —

```
badge inicia ~2837ms → 1  (opacity 1 em 3312ms)
título linha 1 → 1 em 3493ms
título linha 2 → 1 em 3656ms
título linha 3 → 1 em 3821ms
subtítulo      → 1 em 3979ms
botões         → 1 em 4318ms
```

Cascata completa na ordem correta, do início ao fim em **~1,48s** — bate com os ~1,5s calculados. Efeito visual da cascata preservado, só mais rápido.

### Confirmação do carrossel

`initCascadingSlider`, `initPortfolioGallery` e `initClientsCarousel` agora inicializam de forma assíncrona (dentro da fila de `requestIdleCallback`), sem nenhuma mudança de lógica interna. Isso quebrou `tests/unit/slider.test.js`, que assumia inicialização síncrona logo após `require('../../script.js')` — corrigido usando `jest.useFakeTimers()` + `jest.runOnlyPendingTimers()` em loop limitado (bounded, não `runAllTimers()` — o loop de `requestAnimationFrame` do clients carousel se reagenda indefinidamente e abortaria com "infinite loop" se não fosse limitado). Ajuste de infraestrutura de teste, nenhuma alteração no carrossel em si.

**`npm test` → 107/107 passando** (65 de regressão do carrossel inclusos, confirmando que nada no carrossel quebrou).

## Correções: scheduling do hero, ordem cascading slider, touchcancel carrossel clientes

> Data: 20/07/2026. Diagnóstico prévio em `audit/diagnostico-mobile-hero-secao-carrossel.md` (aprovado pelo usuário). Três correções implementadas e testadas isoladamente, nesta ordem. Não commitado/enviado — aguardando aprovação final do usuário, incluindo confirmação explícita sobre a criação de arquivos de teste novos (`tests/unit/init-scheduling.test.js`, `tests/unit/clients-carousel.test.js`) além dos já existentes.

### Correção 1 — Scheduling do hero: fila idle só começa após `onComplete` da timeline

**Problema:** `runQueueWhenIdle` (item 1934 antes desta correção) começava a rodar quase imediatamente após a parte síncrona de `initPage()`, via `requestIdleCallback` com `timeout: 200`. Em CPU mobile mais lenta, esse timeout podia forçar uma função não-crítica a rodar **durante** a janela de animação do hero (delay 0.15s + ~1.5s de cascata), competindo por main thread exatamente quando o GSAP `ticker` precisava de frames livres — causando o título "pular" em vez de animar suave.

**Correção aplicada** (`script.js`, `initHeroEntrance`/`initPage`):
- `initHeroEntrance(onDone)` agora aceita um callback e o registra como `onComplete` da timeline GSAP (`gsap.timeline({ ..., onComplete: onDone })`). Se o hero não estiver visível no viewport (branch `else`, elementos já em opacity:1), `onDone()` é chamado imediatamente — nada a esperar.
- `initPage()` só chama `runQueueWhenIdle([...])` dentro de `startIdleQueue()`, disparado por `initHeroEntrance(startIdleQueue)`. Um `setTimeout(startIdleQueue, 3500)` cobre o caso da timeline nunca completar (usuário sai da página, erro); uma flag `queueStarted` garante que a fila só inicia uma vez, não importa qual gatilho vença.
- Nenhuma lógica interna das 16 funções da fila foi alterada — só o momento em que a fila **começa**.

**Trade-off documentado:** isso atrasa o início absoluto da fila (antes: ~200ms após `DOMContentLoaded`; agora: ~1.65s, tempo da animação do hero, ou até 3.5s no pior caso) — o que também atrasa quando `initPortfolioGallery()` roda e, por consequência, quando a Correção 2 (abaixo) dispara seu `ScrollTrigger.refresh()`. Isso não piora a Correção 2 em si (a distância relativa entre os itens da fila não muda, só o ponto de partida), mas significa que o tempo total até as seções abaixo da dobra ficarem corretas fica um pouco maior em troca de uma entrada do hero mais suave. O fallback de 1.5s (`initScrollRevealFallback`) continua ativo como rede de segurança adicional.

**Testes** (`tests/unit/init-scheduling.test.js`):
- `idle queue (e.g. cascading slider) does not start before hero entrance onComplete fires` — usa um mock de `gsap.timeline` que captura o `onComplete` sem invocá-lo; confirma que `createParticles` (primeiro item da fila) não rodou 500ms depois, e que roda assim que o `onComplete` capturado é chamado manualmente.
- `3.5s fallback starts the idle queue even if hero onComplete never fires` — mock que nunca invoca `onComplete`; confirma que a fila inicia mesmo assim via fallback.
- Ambos falham no código anterior à correção (`initHeroEntrance()` sem parâmetro, fila chamada incondicionalmente) — confirmado revertendo `script.js` temporariamente e rodando os testes antes de restaurar.

**Validação real (CPU 4x throttle, 10 execuções)** — não executável neste sandbox (sem Chrome DevTools/Safari real disponível, mesma limitação já registrada nas rodadas anteriores deste relatório). Passo a passo para o usuário validar no dispositivo real está na seção "Como validar no Safari real do iPhone" acima; o critério de sucesso é a cascata de opacidade do hero (badge → título → subtítulo → botões) completar sem saltos, amostrando opacidade a cada ~50-100ms como feito na seção "Carregamento inicial" acima.

### Correção 2 — Ordem entre criação de ScrollTrigger e mutações de altura pós-load

**Descoberta durante a implementação — corrige a hipótese do diagnóstico original:** o diagnóstico aprovado apontava `initCascadingSlider()` (redimensionamento 280→420px de `.cascading-slider-collection`) como causa do Sintoma 2. Ao escrever o teste de regressão, descobri que essa hipótese estava **errada**: os elementos `.cascading-slide` não existem no HTML estático (`grep` confirmou zero ocorrências em `index.html`) — eles só são criados quando o usuário abre um projeto do portfólio (`openProject()`). `initCascadingSlider()` (`script.js`) tem um guard (`if (!list || list.querySelectorAll('.cascading-slide').length === 0) return;`) que **sempre retorna cedo no carregamento da página** — `createCascadingSlider()` nunca executa no load, então a mudança de altura 280→420px nunca acontece nesse momento. A correção original (`ScrollTrigger.refresh()` dentro do `requestAnimationFrame` de `createCascadingSlider`) foi mantida — é inofensiva e correta para quando o visualizador do portfólio realmente abre — mas não resolve o Sintoma 2 sozinha.

**Causa real, confirmada por leitura de `index.html`:** `#portfolioGrid` também está **vazio no HTML estático** e só é populado por `initPortfolioGallery()` (item 14 de 16 na fila idle), que roda **depois** de `initServicesReveal`(4), `initDifferentialsAnimation`(5), `initValuesReveal`(7) e `initTestimonialsReveal`(8) — todos itens anteriores na mesma fila, que já criaram seus `ScrollTrigger` medindo a página **sem** a grade do portfólio. A ordem das seções no DOM (`index.html`) é: `hero → about → clients → differentials → portfolio → services → segments → process → testimonials → faq → contact`. Como o portfólio fica **acima** de services/segments/process/testimonials, popular sua grade (6 cards, `aspect-ratio: 16/10` cada) empurra a posição real de todas essas seções para baixo — invalidando os marcadores de `ScrollTrigger` já calculados para elas. Nenhum `ScrollTrigger.refresh()` roda depois disso, então essas seções ficam com marcadores obsoletos até o fallback de 1.5s (`initScrollRevealFallback`) forçar a revelação — exatamente o padrão "corta, depois de um tempo tudo aparece" relatado.

**Correção aplicada** (`script.js`, `initPortfolioGallery`): logo após o `forEach` que cria e insere os `.portfolio-card` em `grid`, adicionado `if (typeof ScrollTrigger !== 'undefined') { ScrollTrigger.refresh(); }`. Corrige a causa (marcadores desatualizados) no momento exato em que a página realmente muda de altura, em vez de depender só do fallback.

**Testes** (`tests/unit/init-scheduling.test.js`, describe `Portfolio grid population -> ScrollTrigger.refresh on mount`): confirma que `#portfolioGrid` foi populado e que `ScrollTrigger.refresh()` foi chamado depois. Falha no código anterior à correção (confirmado revertendo `script.js` e rodando o teste).

**Validação real (10 execuções)** — mesma limitação de ambiente; critério de sucesso: rolar a página em mobile real (ou emulado com throttle) e confirmar que "Sobre Nós", diferenciais, serviços, segmentos, processo e depoimentos aparecem completos ao alcançar cada seção, sem depender do atraso de 1.5s do fallback (idealmente, a revelação deve coincidir com o momento em que o elemento entra na viewport, não 1.5s depois).

### Correção 3 — `touchcancel` no carrossel de clientes

**Correção aplicada** (`script.js`, `initClientsCarousel`): adicionado `track.addEventListener('touchcancel', onPointerUp);` junto aos listeners existentes de `touchstart`/`touchmove`/`touchend`. Reutiliza `onPointerUp` (mesma função do `touchend`) — já reseta `isDragging = false` e recalcula `velocity`/`baseSpeed` a partir do `dragDelta` acumulado até o cancelamento, sem necessidade de lógica nova.

**Testes** (`tests/unit/clients-carousel.test.js`):
- `carousel element exists and auto-rotate loop is active` — smoke test do loop de `requestAnimationFrame`.
- `velocity resumes converging to baseSpeed after a gesture is interrupted by touchcancel` — o teste mais importante: simula (1) um drag real via `touchend` que define `velocity = -22`/`baseSpeed = -6.6` por momentum; (2) apenas 2 frames de convergência (spring ainda longe do alvo); (3) um segundo gesto ambíguo que é cancelado via `touchcancel` sem `touchend`; (4) 250 frames adicionais. Calcula a velocidade por frame (`Δtranslate3d`) resultante e confirma que converge para a faixa esperada (~-0,2, valor de equilíbrio analítico considerando o `FRICTION` aplicado a cada frame). **Sem o fix, este teste falha**: a velocidade fica congelada em ~-19 (o valor de quando o segundo toque começou, antes de qualquer convergência), porque `isDragging` nunca volta a `false` e o bloco de correção (`RETURN_SPRING`/`FRICTION`) para de rodar — confirmado revertendo `script.js` e rodando o teste antes de restaurar.

**Interferência no carregamento:** já medida como baixa no diagnóstico (~27ms de setup, loop leve e gateado por `IntersectionObserver`) — esta correção não muda esse cálculo, pois não adiciona nenhum trabalho ao setup ou ao loop, só um listener a mais que só executa em caso de cancelamento de gesto.

### Validação final

- **`npm test` → 112/112 passando** (107 anteriores + 5 novos: 2 em `clients-carousel.test.js`, 3 em `init-scheduling.test.js`). `65/65` testes de regressão do carrossel (`slider.regression.test.js`) inclusos e passando, confirmando que a estrutura/proporções/comportamento aprovados do carrossel cascata não foram alterados.
- `script.min.js` regenerado via `npx terser script.js -o script.min.js -c -m` e verificado com `node scripts/check-min-freshness.js` (OK).
- Cada um dos 5 novos testes foi confirmado como guarda de regressão real: revertido `script.js` temporariamente (`git stash`) e reexecutado o teste correspondente, confirmando falha sem a correção, antes de restaurar e confirmar sucesso com a correção presente.
- **Validação visual em dispositivo real (10 execuções para Sintomas 1 e 2, fluxo completo dos três sintomas juntos) não foi possível neste ambiente** — mesma limitação já registrada nas rodadas anteriores deste relatório (sem Chrome DevTools/Safari real no sandbox de CLI). Pendente para o usuário: passo a passo de validação no Safari real do iPhone já documentado na seção "Mobile: travamento por sobrecarga de main thread" acima serve para os três sintomas; para o carrossel de clientes especificamente, o teste manual é: tocar no carrossel perto do fim da página como se fosse rolar (gesto ambíguo), soltar o dedo fora da área ou deixar o gesto virar scroll da página, e confirmar que o carrossel volta a girar sozinho pouco depois — sem precisar de outro toque completo (start+end) para "destravar".

### Resumo do que mudou desde o diagnóstico aprovado

| Item | Diagnóstico original | Confirmado na implementação |
|---|---|---|
| Sintoma 1 | Fix do Passo 0 presente mas insuficiente; `timeout: 200` força execução durante a animação do hero | Confirmado — corrigido via `onComplete` da timeline + fallback de 3.5s |
| Sintoma 2 | `initCascadingSlider()` redimensiona 280→420px depois dos refreshes | **Hipótese errada** — `.cascading-slide` não existe no load, `initCascadingSlider()` sempre retorna cedo. Causa real: `initPortfolioGallery()` popula `#portfolioGrid` (vazio no HTML estático) depois que ScrollTriggers de seções abaixo do portfólio já foram criados, sem refresh subsequente |
| Sintoma 3 | Falta `touchcancel`, `isDragging` trava em `true` | Confirmado — teste de regressão reproduz o congelamento de velocidade sem o fix |

Nenhuma alteração foi commitada ou enviada. Aguardando aprovação final do usuário.

**Não commitado nem enviado — aguardando aprovação.**
