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
