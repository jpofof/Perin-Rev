# Isolamento por eliminação — `?isolate=...` (Fase 2)

**Data:** 21/07/2026
**Status:** Instrumentação pronta para deploy. Nenhuma correção aplicada ainda — objetivo é isolar o componente responsável pelo travamento recorrente de ~3s no Safari iOS, testando no dispositivo real.

## Motivação

Sem acesso viável a profiling real via Safari Web Inspector (`ios-webkit-debug-proxy` incompatível com iOS moderno, sem Mac disponível), e já tendo descartado — via instrumentação anterior (`audit/fase-perf-real.md`) — qualquer `setInterval`/`setTimeout` do próprio código como causa do travamento de ~3s que se repete durante toda a sessão, o próximo passo viável é eliminação por isolamento: desligar componentes suspeitos um de cada vez (vídeo do hero, GSAP/ScrollTrigger, partículas CSS, carrossel de clientes) e o usuário testa cada versão no iPhone real para ver qual combinação para de travar.

## Como funciona

Novo bloco no topo de `script.js`, executado de forma síncrona **antes** de qualquer inicialização (`initPage()` ainda nem foi chamado):

```js
var __ISOLATE = (function () {
    var params = new URLSearchParams(location.search);
    var raw = params.get('isolate');
    if (!raw) return {};
    var list = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (list.indexOf('minimal') !== -1) {
        list = list.concat(['no-video', 'no-gsap', 'no-particles', 'no-carousel-clients']);
    }
    var flags = {};
    list.forEach(f => { flags[f] = true; });
    return flags;
})();
```

Sem `?isolate=...` na URL, `__ISOLATE` fica `{}` (objeto vazio) e **todo o comportamento normal do site permanece 100% inalterado** — todos os `if (__ISOLATE['...'])` avaliam falso e caem no caminho de código original, sem nenhuma diferença de execução.

Aceita múltiplas flags separadas por vírgula (ex.: `?isolate=no-video,no-particles`) — cada uma é independente e combinável.

## Flags implementadas

### `no-video`
Desliga: os dois elementos `<video>` do hero (`heroVideoForward`/`heroVideoReverse`) — reaproveita exatamente a mesma lógica já usada para mobile/`prefers-reduced-motion`/conexão lenta dentro de `initHeroVideoBackground()` (`script.js`): `forward.remove(); reverse.remove(); return;`. Nenhum byte de vídeo é baixado, nenhum listener de `ended` é registrado, nenhum loop forward↔reverse roda. Mostra só o poster estático (já definido via CSS/`background-image`).

### `no-gsap`
Desliga: **toda** a biblioteca GSAP em uso pelo nosso código (a lib em si continua carregada via `<script>` no HTML — não dá para impedir isso sem editar `index.html` condicionalmente — mas nenhuma função do nosso `script.js` chama `gsap.*`/`ScrollTrigger.*`):
- `initHeroEntrance()` — não roda `gsap.set`/`gsap.timeline`. Hero aparece **direto** no estado final: badge, linhas do título, subtítulo e ações recebem `opacity: 1; transform: none` via `style` puro, sem cascata/timeline.
- `initButtonRipple()` — não registra o `gsap.fromTo` do efeito de ripple (botões continuam clicáveis normalmente, só sem o efeito visual).
- `initScrollReveals()`, `batchReveal()` (usado por `initDifferentialsAnimation`, `initServicesReveal`, `initValuesReveal`, `initTestimonialsReveal`), `initCounters()` — nenhum `ScrollTrigger.batch`/`gsap.to` roda; conteúdo forçado visível direto via `style.opacity`/`style.transform`, incluindo os `.process-step` (que começam ocultos via CSS e normalmente só recebem a classe `.revealed` ao entrar na viewport).
- `initPortfolioGallery()` — a grade de projetos continua sendo populada normalmente (não é animação, é conteúdo essencial), só o `ScrollTrigger.refresh()` pós-montagem não é chamado.
- `initScrollRevealFallback()` — o `forceReveal()` de segurança usa `style.opacity`/`style.transform` direto em vez de `gsap.set` quando precisa forçar algo.
- `initCascadingSlider()` (carrossel cascata do portfólio, oficialmente GSAP-dependente por design — ver seção "Carrossel de Projetos" em `AGENTS.md`) — não inicializa.
- `initPage()` — não registra os listeners de `resize`/`load`/`document.fonts.ready` que chamam `ScrollTrigger.refresh()`/`ScrollTrigger.config()`.

**Nota importante:** `initHeroAnimations()` (o parallax de scale/opacity do canvas do hero ao rolar) **não é afetado** por esta flag — essa função nunca chamou `gsap.*`, é 100% scroll listener + `style` manual (confirmado por inspeção de código). Se o travamento persistir sob `no-gsap`, essa função continua sendo uma fonte possível a investigar depois.

### `no-particles`
Desliga: `createParticles()` não roda — nenhuma das 50 partículas animadas por CSS é criada (`return` logo no início da função, antes de qualquer `createElement`). Hero sem partículas.

### `no-carousel-clients`
Desliga: `initClientsCarousel()` não roda — sem clonagem de slides (normalmente clona 2x para loop infinito), sem `requestAnimationFrame` de rotação, sem drag/momentum. O `track` tem largura de fallback via CSS (`--slide-w` com default `215px`), então sobra como uma linha estática flex dos logos originais, sem rotação automática — visualmente uma fileira fixa em vez de esteira.

### `no-scrolltrigger-only`
Desliga: **apenas** o sistema de `ScrollTrigger` (reveals de seção ao rolar, `.process-step`, contadores, refresh em resize/load/fonts) — usa o mesmo guard interno (`__scrollTriggerDisabled()`) que `no-gsap`, mas **sem** desligar `initHeroEntrance()`/`initButtonRipple()`/`initCascadingSlider()`. A timeline de entrada do hero e o carrossel cascata do portfólio continuam funcionando normalmente com GSAP. Útil para diferenciar "é o ScrollTrigger" de "é o GSAP como um todo".

### `minimal`
Combina todos os isolamentos acima de uma vez — equivalente a `?isolate=no-video,no-gsap,no-particles,no-carousel-clients` (implementado literalmente como essa expansão da lista de flags antes de processar). Uma versão "site estático puro": teste de controle — se mesmo essa versão travar a cada ~3s, o problema **não está** em nenhum desses componentes, e sim em algo mais fundamental (CSS pesado, imagens, estrutura do DOM, ou algo fora do alcance desta técnica de isolamento).

## Validação

- **Comportamento normal inalterado:** `npm test` — 4 suítes, **112 testes passando** (unitários + os 65 de regressão do carrossel), idêntico ao estado antes desta mudança. Todos os guards são condicionados a `__ISOLATE['...']`, que é sempre `{}` nos testes (sem `?isolate=` no ambiente jsdom).
- **Cada flag testada isoladamente via Puppeteer** (Chrome, mas suficiente para confirmar que o JS desliga exatamente o que deveria, sem quebrar o resto visualmente):

  | Flag | `<video>` do hero | Partículas criadas | Clones do carrossel de clientes | Hero badge visível de cara | `.process-step` força-revelado |
  |---|---|---|---|---|---|
  | *(nenhuma)* | 2 elementos | sim | 8 clones | via timeline (atraso normal) | não (só ao rolar) |
  | `no-video` | 0 elementos | sim | 8 clones | via timeline | não |
  | `no-gsap` | 2 elementos | sim | 8 clones | **instantâneo** (`opacity:1` direto) | **sim, imediato** |
  | `no-particles` | 2 elementos | **não** | 8 clones | via timeline | não |
  | `no-carousel-clients` | 2 elementos | sim | **0 clones** | via timeline | não |
  | `no-scrolltrigger-only` | 2 elementos | sim | 8 clones | via timeline (GSAP intacto) | **sim, imediato** |
  | `minimal` | **0 elementos** | **não** | **0 clones** | **instantâneo** | **sim, imediato** |

  Nenhum erro de página (`pageerror`) em nenhuma das 7 combinações testadas. O restante da página (navegação, formulário, seções de conteúdo) permanece utilizável em todos os casos, como esperado (menos bonito nos casos com isolamento, nunca quebrado).
- `script.min.js` regenerado via `npx terser script.js -o script.min.js -c -m` e validado com `node scripts/check-min-freshness.js`.

## Arquivos alterados

- `script.js` — bloco `__ISOLATE`/`__gsapDisabled()`/`__scrollTriggerDisabled()` no topo do arquivo; guards em `initHeroVideoBackground`, `initHeroEntrance`, `initButtonRipple`, `initScrollReveals`, `batchReveal`, `initCounters`, `initScrollRevealFallback`, `initPortfolioGallery`, `initCascadingSlider`, `createParticles`, `initClientsCarousel`, e nos listeners de `resize`/`load`/`fonts.ready` ligados a `ScrollTrigger` dentro de `initPage()`.
- `script.min.js` — regenerado.
- `audit/isolamento-query-params.md` — este documento.

## URLs prontas para teste no iPhone

```
https://perinconstrucoes.netlify.app/?isolate=no-video
https://perinconstrucoes.netlify.app/?isolate=no-gsap
https://perinconstrucoes.netlify.app/?isolate=no-particles
https://perinconstrucoes.netlify.app/?isolate=no-carousel-clients
https://perinconstrucoes.netlify.app/?isolate=no-scrolltrigger-only
https://perinconstrucoes.netlify.app/?isolate=minimal
```

## Instruções para o usuário testar depois do deploy

1. Teste cada URL da lista acima, uma de cada vez, no Safari do iPhone.
2. Para cada uma, use o site por 15-20 segundos como faria normalmente (esperar o hero, rolar a página, interagir com o que estiver disponível) e anote: **travou como sempre**, **travou mas pareceu menos frequente/intenso**, ou **não travou**.
3. **Ordem sugerida:** comece por `?isolate=minimal` (teste de controle).
   - Se essa versão **travar**, avise imediatamente — isso muda toda a investigação (a causa não está em nenhum dos componentes isolados).
   - Se **não travar**, siga testando as outras uma por uma para achar qual isolamento específico resolveu o problema.

## Remoção futura

Assim que a causa do travamento estiver confirmada, remover o bloco `__ISOLATE`/`__gsapDisabled()`/`__scrollTriggerDisabled()` e todos os guards associados listados acima, e regenerar `script.min.js`.

---

## Atualização — `no-geometries` (21/07/2026)

### Dado real que motivou este passo

Resultado dos testes anteriores no iPhone real:

| Isolamento | Resultado |
|---|---|
| `no-video` | travamento idêntico ao normal — **não ajuda** |
| `no-particles` | travamento idêntico ao normal — **não ajuda** |
| `no-scrolltrigger-only` (mantém a timeline, desliga só o ScrollTrigger) | melhora **bem pouco** |
| `no-gsap` (desliga a timeline de entrada inteira) | **quase elimina** o travamento |

A diferença entre `no-gsap` e `no-scrolltrigger-only` aponta a **própria execução da timeline de entrada do hero** como o fator determinante, não o ScrollTrigger/scroll. Suspeita levantada: as formas geométricas SVG do hero (`hero-geometries`, `hero-grid`, `hero-lighting`), que segundo hipótese inicial seriam animadas *dentro* dessa timeline junto com o texto.

### Confirmação dos nomes exatos no código atual

Inspeção de `index.html`/`styles.css` confirma os IDs/classes:

- `#heroGrid` (`.hero-grid-layer`) — grade de fundo (linear-gradient, sem animação).
- `#heroGeometries` (`.hero-geometries`) — contém 3 `<div class="geometry-shape geometry-shape-N">` com `<svg>` inline (retângulos/polígonos com stroke).
- `#heroLighting` (`.hero-lighting-layer`) — contém 3 `<div class="light-spot light-spot-N">`.

**Correção importante à hipótese original:** essas três camadas **não são animadas pela timeline GSAP de entrada** (`initHeroEntrance()`, `script.js`) — essa timeline só anima `.hero-badge`, `.hero-title-line-*`, `.hero-subtitle`, `.hero-actions`. As camadas geométricas são animadas por dois mecanismos **independentes de GSAP**:

1. **`.geometry-shape-1/2/3`** — `animation: floatShape 15-25s ease-in-out infinite` **em CSS puro** (`styles.css`, `@keyframes floatShape`), rodando o tempo todo, sem relação com a timeline de entrada nem com `initHeroEntrance()`.
2. **Parallax do mouse (`initHeroParallax()`, `script.js`)** — também **não usa GSAP**: um listener `mousemove` que escreve `style.transform` direto em `.hero-geometries`, `.hero-grid-layer` e nos 3 `.light-spot` a cada movimento do mouse.

Ou seja: essas camadas continuam renderizando e animando **normalmente mesmo sob `?isolate=no-gsap`** (que só desliga chamadas `gsap.*`) — e mesmo assim `no-gsap` quase eliminou o travamento. Isso não descarta a hipótese das geometrias, mas muda o que ela precisa provar: se `no-geometries` (que remove essas camadas mas **mantém** a timeline GSAP do texto rodando normalmente) também resolver bem, a explicação mais provável é que o **ticker do GSAP (rAF) competindo por main thread durante a timeline de entrada COM as camadas de geometria/blur rodando ao mesmo tempo** é que gera o travamento — não uma dessas partes isoladamente, mas a soma/contenção entre elas no Safari. Se `no-geometries` não ajudar, a suspeita se desloca de volta para a timeline GSAP do próprio texto/badge, ou o parallax do mouse.

### Achado separado: `filter: blur(100px)` estático nos light-spots

Independente de qualquer animação, os 3 `.light-spot` (`styles.css`) têm `filter: blur(100px)` aplicado via CSS — um blur pesado (raio de 100px) sobre elementos de até 600×600px, conhecido por ser significativamente mais caro no compositor do WebKit/Safari do que no Chrome/Blink, **mesmo parado, sem nenhuma animação**. Isso é uma fonte de custo potencialmente separada da animação em si (CSS `floatShape` + parallax do mouse). `no-geometries` remove os light-spots inteiramente, então não isola "blur estático" de "geometrias animadas" — se o resultado for positivo, ainda não sabemos qual das duas causas (o blur em si, ou a animação) pesa mais. Registrado aqui para decidir um teste futuro mais granular (ex.: um isolamento que mantém os light-spots visíveis mas sem `filter: blur()`, ou sem a animação CSS `floatShape` mas com o blur) **se `no-geometries` confirmar a hipótese geral**.

### O que foi implementado

- `initPage()` (`script.js`) — primeiro passo da função, antes de qualquer `init*()` rodar: sob `__ISOLATE['no-geometries']`, remove do DOM `#heroGrid`, `#heroGeometries` e `#heroLighting` por completo (`el.remove()`), incluindo os 3 SVGs de formas geométricas e os 3 light-spots com blur.
- `initHeroParallax()` — adicionado guard de segurança (`if (!geometries || !lighting || !grid) return;`) para não lançar erro ao tentar acessar `.style`/`.querySelectorAll` de elementos removidos.
- `initHeroEntrance()` **não foi alterado** — a timeline GSAP do badge/título/subtítulo/ações continua rodando exatamente igual, confirmando o objetivo do isolamento (diferente de `no-gsap`, que também desliga essa timeline).
- **Não adicionado a `minimal`** — `no-geometries` é um isolamento novo e específico, mantendo `minimal` com a mesma composição já documentada (`no-video,no-gsap,no-particles,no-carousel-clients`), conforme solicitado.

### Validação

- `npm test`: 4 suítes, **112 testes passando** — inalterado.
- Puppeteer, comparando `baseline` vs `?isolate=no-geometries`:
  - `#heroGeometries`/`#heroGrid`/`#heroLighting` presentes no baseline, **ausentes** sob `no-geometries` — confirmado.
  - Nenhum erro de página (`pageerror`) em nenhum dos dois casos — confirma que `initHeroParallax()` não quebra com os elementos ausentes.
  - Opacidade de `.hero-badge`/`.hero-title-line-1` evolui de forma idêntica em ambos os casos (parcial durante a timeline, `1` após ~2,5s) — confirma que a timeline de entrada do texto continua rodando normalmente sob `no-geometries`, ao contrário de `no-gsap`.
- `script.min.js` regenerado via `npx terser script.js -o script.min.js -c -m` e validado com `node scripts/check-min-freshness.js`.

### Arquivos alterados nesta atualização

- `script.js` — remoção de `#heroGrid`/`#heroGeometries`/`#heroLighting` no início de `initPage()` sob `no-geometries`; guard de segurança em `initHeroParallax()`.
- `script.min.js` — regenerado.
- `audit/isolamento-query-params.md` — esta atualização.

### URL para o usuário testar

```
https://perinconstrucoes.netlify.app/?isolate=no-geometries
```

### Instruções para o usuário

Testar por 15-20s, do mesmo jeito que os isolamentos anteriores, prestando atenção especial a:

1. **O texto do hero ainda anima normalmente?** (badge, título, subtítulo, botões devem continuar tendo a transição de entrada — diferente de `no-gsap`, onde tudo aparece instantâneo). Se o texto aparecer instantâneo em vez de animado, algo está errado e deve ser reportado.
2. **O travamento melhora, piora, ou fica igual** comparado ao site normal?

Se `no-geometries` resolver bem (parecido com `no-gsap`), confirma que as camadas de geometria/grid/luz (CSS `floatShape` + parallax do mouse + blur estático) são a causa raiz — próximo passo é decidir a correção definitiva (remover, simplificar os efeitos, ou trocar por algo mais leve), possivelmente com um teste adicional para separar "é o blur estático" de "é a animação". Se não ajudar muito, a suspeita muda para a própria timeline GSAP do texto/badge ou para o parallax do mouse.

---

## Atualização — `no-blur-only` e `no-animation-only` (21/07/2026)

### Dado real que motivou este passo

**Confirmado no iPhone real: `?isolate=no-geometries` elimina o travamento por completo.** A causa está confinada a `hero-grid`/`hero-geometries`/`hero-lighting`. Falta separar duas características dessas camadas para achar a correção mínima que preserva o máximo do visual original:

1. `filter: blur(100px)` estático nos 3 `.light-spot` (conhecido por ser caro no compositor do WebKit/Safari, independente de animação).
2. A animação contínua: `@keyframes floatShape` (CSS, nos 3 `.geometry-shape`) + o parallax do mouse via JS (`initHeroParallax()`, que escreve `style.transform` em `.hero-geometries`/`.hero-grid-layer`/os 3 `.light-spot` a cada `mousemove`).

### O que foi implementado

Dois novos isolamentos, cada um desligando **apenas uma** das duas características, mantendo a outra e todo o resto do hero intactos:

#### `no-blur-only`
Mantém `hero-grid`/`hero-geometries`/`hero-lighting` totalmente presentes e **animando normalmente** (CSS `floatShape` + parallax do mouse ativos). Remove **apenas** o blur:

- **Seletor alterado:** `styles.css` — nova regra `.isolate-no-blur-only .light-spot { filter: none; }`, logo após a regra base `.light-spot { ... filter: blur(100px); ... }`.
- **Ativação:** `initPage()` (`script.js`) adiciona a classe `isolate-no-blur-only` em `document.documentElement` quando `__ISOLATE['no-blur-only']` está setado. CSS puro faz o resto — nenhuma outra lógica JS envolvida, então a animação (CSS e parallax) continua 100% intacta.

#### `no-animation-only`
Mantém as formas visíveis com o **blur original de 100px intacto**, mas congela toda animação relacionada a elas:

- **CSS puro (`@keyframes floatShape`):** nova regra em `styles.css` — `.isolate-no-animation-only .geometry-shape { animation: none; }`, logo após o bloco `@keyframes floatShape`. Ativada pela mesma classe em `document.documentElement`, adicionada em `initPage()` quando `__ISOLATE['no-animation-only']` está setado.
- **Parallax do mouse (JS):** `initHeroParallax()` (`script.js`) ganhou um guard — `if (__ISOLATE['no-animation-only']) return;` logo após o guard existente de `no-geometries` — que impede o registro do listener de `mousemove` inteiramente. Como essa função só existe para mover essas três camadas, pular a função inteira já é o "no-op" pedido, sem precisar de lógica condicional dentro do handler.

Ambos os novos isolamentos são combináveis entre si e com todos os outros já existentes (ex.: `?isolate=no-blur-only,no-video`), pois seguem o mesmo padrão de flags independentes em `__ISOLATE`. Nenhum dos dois foi adicionado a `minimal` (mantido como estava, sem alteração).

### Validação

- **`no-blur-only` (Puppeteer):** `getComputedStyle('.light-spot-1').filter` = `"none"` (baseline: `"blur(100px)"`); `getComputedStyle('.geometry-shape-1').animationName` continua `"floatShape"` (igual ao baseline); movimento do mouse continua escrevendo `style.transform` em `.hero-geometries` (listener ativo, igual ao baseline) — confirma: **formas nítidas, se movendo normalmente**.
- **`no-animation-only` (Puppeteer):** `filter` do light-spot continua `"blur(100px)"` (igual ao baseline); `animationName` do geometry-shape = `"none"` (congelado); `style.transform` de `.hero-geometries` nunca é definido mesmo após mover o mouse (listener não registrado) — confirma: **blur normal, formas completamente paradas**.
- **Combinação (`no-blur-only,no-video`):** ambas as flags aplicadas corretamente ao mesmo tempo, sem conflito.
- Nenhum erro de página (`pageerror`) em nenhum dos casos.
- `npm test`: 4 suítes, **112 testes passando** — inalterado.
- `script.min.js` regenerado via `npx terser script.js -o script.min.js -c -m`; `styles.min.css` regenerado via `npx clean-css-cli styles.css -o styles.min.css`; ambos validados com `node scripts/check-min-freshness.js`.

### Arquivos alterados nesta atualização

- `script.js` — ativação das classes `isolate-no-blur-only`/`isolate-no-animation-only` em `initPage()`; guard em `initHeroParallax()` para `no-animation-only`.
- `styles.css` — regras `.isolate-no-blur-only .light-spot { filter: none; }` e `.isolate-no-animation-only .geometry-shape { animation: none; }`.
- `script.min.js` / `styles.min.css` — regenerados.
- `audit/isolamento-query-params.md` — esta atualização.

### URLs para o usuário testar (nesta ordem)

```
https://perinconstrucoes.netlify.app/?isolate=no-blur-only
https://perinconstrucoes.netlify.app/?isolate=no-animation-only
```

### Instruções para o usuário

1. **`?isolate=no-blur-only`** — teste 15-20s. As formas devem aparecer **nítidas (sem desfoque) mas se movendo**. Trava ou não trava?
2. **`?isolate=no-animation-only`** — teste 15-20s. As formas devem aparecer **com o desfoque normal, mas paradas (sem se mover)**. Trava ou não trava?

**Como interpretar:**

- Se `no-blur-only` **não** travar (e `no-animation-only` travar): o problema é o `blur(100px)` — a correção é reduzir/remover o blur, mantendo a animação.
- Se `no-animation-only` **não** travar (e `no-blur-only` travar): o problema é a animação — a correção é parar/simplificar o movimento, mantendo o blur visual.
- Se **ambos não travarem**: qualquer um dos dois ajustes sozinho já resolve — pode escolher a correção que preserva mais o visual original.
- Se **ambos travarem**: a causa é a combinação/quantidade das 3 camadas em conjunto, não uma característica isolada — a correção provável é reduzir a complexidade geral (menos elementos, ou desligar essas camadas em mobile, como já foi feito com o vídeo).

Nenhuma correção definitiva foi aplicada ainda — depende do resultado desses dois testes.

---

## Atualização final — causa raiz confirmada, correção aplicada, infraestrutura removida (21/07/2026)

### Resultado

Confirmado no iPhone real: **`?isolate=no-blur-only` resolve o travamento por completo**, sozinho, mantendo a animação (CSS `floatShape` + parallax do mouse) rodando normalmente. Causa raiz isolada: `filter: blur(100px)` nos 3 `.light-spot`.

### Correção definitiva

`styles.css`, regra `.light-spot`: `filter: blur(100px)` → `filter: blur(24px)`, aplicada **permanentemente** (sem condicional, válida para mobile e desktop). Resumo completo da investigação (todas as etapas, do heartbeat até esta conclusão) em `RELATORIO-PERFORMANCE.md`, seção "Travamento recorrente no Safari iOS — causa raiz e correção".

### Infraestrutura de `?isolate=...` removida

Toda a infraestrutura descrita neste documento (`__ISOLATE`, `__gsapDisabled()`, `__scrollTriggerDisabled()`, e todos os guards em `initHeroVideoBackground`, `createParticles`, `initHeroEntrance`, `initButtonRipple`, `initScrollReveals`, `batchReveal`, `initCounters`, `initScrollRevealFallback`, `initPortfolioGallery`, `initCascadingSlider`, `initClientsCarousel`, `initHeroParallax`, `initPage`) foi removida de `script.js`, já tendo cumprido seu propósito de diagnóstico. As regras CSS `.isolate-no-blur-only`/`.isolate-no-animation-only` também foram removidas de `styles.css`. Nenhuma das 9 flags (`no-video`, `no-gsap`, `no-particles`, `no-carousel-clients`, `no-scrolltrigger-only`, `no-geometries`, `no-blur-only`, `no-animation-only`, `minimal`) está mais disponível.

A instrumentação `?debug=scroll`/`?debug=perf` (Fase 1/2, documentada em `audit/fase-perf-real.md`) foi **mantida**, por ser útil para validações futuras.

Este documento (`audit/isolamento-query-params.md`) permanece como registro histórico da investigação.
