# Diagnóstico — Mobile Real: Hero, Seção "Sobre Nós" e Carrossel de Clientes

> **Status:** Investigação concluída. Nenhuma correção implementada nesta etapa (conforme instruído).
> **Data:** 20/07/2026
> **Commit auditado:** `329cbcc` (HEAD, inclui preload de fonte + `ScrollTrigger.refresh()` em `document.fonts.ready` + delay do hero reduzido)
> **Método:** análise estática linha a linha contra `script.js`/`index.html`/`styles.css` + histórico de commits/`RELATORIO-PERFORMANCE.md`. Sem Chrome DevTools/Safari real disponível neste ambiente — medições de tempo citadas (ex: 27ms do `initClientsCarousel`) são as já registradas na rodada anterior (`RELATORIO-PERFORMANCE.md:805`), não remedidas agora.

---

## Sintoma 1 — Texto do hero demora e depois "pula" para o estado final

### Causa

**Confirmado: consistente com main thread bloqueado, não com um bug de lógica da timeline.**

O GSAP anima via `requestAnimationFrame`. Quando o main thread fica ocupado por uma long task, o navegador não interrompe essa task para rodar o rAF — ele só roda no próximo frame livre. Quando esse frame finalmente chega, o GSAP não "recupera" frame a frame: ele calcula o progresso da timeline pelo **tempo decorrido real** (`gsap.ticker`), não pelo número de frames executados. Resultado: se 300-400ms de main thread ficaram bloqueados no meio de uma timeline de 0.6-0.8s, o próximo tick já corresponde a um progresso avançado da timeline — visualmente isso aparece como "nada acontece, depois pula quase pronto", exatamente o sintoma relatado. Isso é comportamento documentado do rAF sob contenção, não um defeito a corrigir na timeline em si.

### O fix do Passo 0 (`runQueueWhenIdle`) já está presente?

**Sim, confirmado no código atual** (`script.js:1884-1913`, aplicado em `initPage()` em `script.js:1916-1950`):

- `initHeroVideoBackground`, `initHeroParallax`, `initHeroEntrance`, `initHeroAnimations`, `initNavigation`, `initButtonRipple` seguem síncronos (crítico, precisam estar prontos no primeiro frame).
- As demais 15 funções (`createParticles`, `initScrollReveals`, `initCounters`, `initServicesReveal`, `initDifferentialsAnimation`, `initSegmentsTabs`, `initValuesReveal`, `initTestimonialsReveal`, `initServicesInteraction`, `initContactForm`, `initCustomSelect`, `initServiceGridAdjust`, `initCascadingSlider`, `initPortfolioGallery`, `initClientsCarousel`) rodam em `requestIdleCallback` **encadeados individualmente** (não agrupados em um único callback — essa foi uma tentativa anterior descartada por piorar o problema, ver comentário em `script.js:1895-1901`).

**Porém isso não elimina o Sintoma 1 — apenas reduz sua janela.** O `runQueueWhenIdle` evita que ~192ms de trabalho síncrono bloqueiem o *primeiro* frame do hero (esse problema já foi resolvido). Mas:

1. Cada função individual ainda é uma long task própria quando executa (ex.: `initClientsCarousel` ~27ms, `initScrollReveals` ~60ms conforme medição anterior). Sob CPU mobile real (throttle 4x-6x equivalente a devices low/mid-end), essas ~27-60ms medidas em desktop podem virar 100-300ms cada em hardware mobile fraco — suficiente para o rAF "pular" durante a entrada do hero, mesmo com o trabalho fora do primeiro frame.
2. `requestIdleCallback` com `timeout: 200` (`runWhenIdle`, `script.js:1889`) **força** a função a rodar mesmo se o thread não estiver realmente ocioso, caso o timeout seja atingido — em mobile, sob CPU mais lenta, é plausível que o timeout de 200ms seja atingido enquanto a timeline do hero (delay 0.15s + duração da entrada) ainda está em andamento, competindo por CPU exatamente na janela em que o texto deveria estar animando.

**Conclusão:** o fix do Passo 0 está presente e ativo, e reduziu o problema (a long task de ~400ms no primeiro frame foi eliminada), mas não o elimina totalmente em mobile real, porque o `timeout: 200` do idle callback pode forçar execução de funções não-críticas durante a janela de animação do hero, e cada função individual mobile-throttled ainda é cara o suficiente para causar salto perceptível. Isso é consistente com o teste do usuário mostrar uma versão *diferente* do sintoma anterior ("pula" em vez de "cascata lenta") — é o mesmo tipo de causa raiz (contenção de main thread), só que agora com amplitude menor e disparo mais tardio.

---

## Sintoma 2 — Seção "Sobre Nós" corta e as seções abaixo só aparecem depois de um tempo

### Este é o bug antigo (código desatualizado) ou uma causa nova?

**O código testado já inclui o fix de fonte** (commit `329cbcc`, presente na branch atual — preload de `inter-latin.woff2`, `ScrollTrigger.refresh()` em `document.fonts.ready`, `fetchpriority="high"` no poster). Assumindo que o teste do usuário foi feito contra o deploy mais recente (a confirmar com o usuário se o ambiente testado já reflete esse commit), **isso não é simples recorrência do bug antigo — há uma causa nova, adicional, que o fix de fonte não cobre.**

### Causa nova identificada

`ScrollTrigger.refresh()` é chamado em três momentos (`script.js:1954-1968`):
- `resize`
- `window.load`
- `document.fonts.ready`

Todos os três já executaram **antes** de qualquer uma das 15 funções da fila `runQueueWhenIdle` rodar, porque essa fila só começa depois que `initPage()` termina sua parte síncrona, e `initPage()` roda em `DOMContentLoaded` — que ocorre antes de `window.load`. Ou seja, a ordem real é: `DOMContentLoaded` → `initPage()` síncrono → fila idle começa a rodar em paralelo com o carregamento de imagens/fontes → `window.load` dispara (todas imagens/fontes já carregadas) → primeiro `ScrollTrigger.refresh()`.

O problema: **`initCascadingSlider()` está na fila idle** (`script.js:1947`) e, quando executa, `createCascadingSlider()` (`script.js:432+`) define a altura do container `.cascading-slider-collection` via **inline style fixo de 420px** (`const ch = 420`, documentado em `CLAUDE.md` como comportamento aprovado — a altura via CSS `clamp(280px, 42vw, 420px)` é sobrescrita). Em telas mobile estreitas, `42vw` fica bem abaixo de 420px (ex.: 380px de largura → ~160px, clamped a 280px mínimo) — **antes** do JS rodar, o container está em 280px; **depois**, salta para 420px.

Isso é uma mudança de altura de página de até ~140px que acontece **depois** que os três `ScrollTrigger.refresh()` já rodaram (nenhum dos três é dispensado especificamente para essa mudança — não é resize de viewport, nem fonte, nem load). Os marcadores de `start`/`end` de todo `ScrollTrigger` posicionado abaixo do carrossel cascata (que inclui "Sobre Nós" e as seções seguintes, a julgar pela ordem do DOM) ficam desatualizados na mesma direção do bug original: o elemento fica esperando o scroll atingir uma posição que já não corresponde mais à posição real na tela.

Isso explica exatamente o padrão relatado:
- "Sobre Nós" corta (título + início do parágrafo) — o `ScrollTrigger` dessa seção foi calculado com a página mais curta do que ela fica depois do slider expandir.
- Seções abaixo não aparecem — mesmo motivo, offsets deslocados em cascata.
- "Depois de um tempo tudo carrega" — isso bate com o `initScrollRevealFallback()` (`script.js:1839-1882`, `GRACE_PERIOD_MS = 1500`), a rede de segurança que força `opacity: 1` nos elementos presos 1.5s depois de entrarem no viewport observado via `IntersectionObserver` próprio (não depende do `ScrollTrigger.refresh()`). O fallback está mascarando o sintoma, não o resolvendo — daí o "demora, mas eventualmente aparece".

**`initClientsCarousel()` também está na fila idle e mexe no DOM** (clona todos os slides duas vezes, `script.js:1665-1671`), mas isso altera a largura do `track` interno, não a altura do documento — não deveria, por si só, deslocar `ScrollTrigger`s de seções abaixo. `initPortfolioGallery()` inicializa listeners/estado mas não vi, na leitura feita, alteração de altura de layout no load inicial (a expansão do viewer só ocorre sob interação do usuário). O candidato dominante é o `cascading slider`.

### Confirmação necessária

Antes de corrigir, vale confirmar com o usuário: o teste em mobile real foi contra o commit `329cbcc` (ou posterior) já publicado/deployado? Se o ambiente testado ainda era uma versão anterior sem o fix de fonte, uma parte do sintoma pode ser realmente recorrência do bug antigo somada a esta causa nova — mas a causa do cascading slider existe independentemente e deve ser corrigida de qualquer forma.

---

## Sintoma 3 — Carrossel automático de clientes não gira sozinho em mobile

### Causa técnica

**Não é breakpoint nem CSS de mobile desativando o carrossel** — não há `display: none` nem regra equivalente para `.clients-carousel*` em nenhum media query (`styles.css:1899-1931` só ajusta `padding`/`gap`/`padding` de imagem). O `IntersectionObserver` que controla `start()`/`stop()` (`script.js:1815-1825`) usa `threshold: 0`, que dispara com qualquer pixel visível — não é um threshold calibrado para desktop que falharia em mobile.

**Causa real: ausência de handler para `touchcancel`.** O carrossel registra `touchstart` (seta `isDragging = true`), `touchmove` e `touchend` (`script.js:1799-1801`), mas não escuta `touchcancel`. Em mobile, é comum o navegador cancelar uma sequência de toque sem disparar `touchend` — por exemplo, quando o gesto é interpretado como scroll da página, quando uma notificação/modal do sistema interrompe, ou quando o dedo desliza para fora da área rastreável. Quando isso acontece:

1. `isDragging` fica travado em `true` para sempre (nunca mais é setado para `false`, já que só `onPointerUp` faz isso).
2. No loop `animate()` (`script.js:1697-1721`), o bloco que restaura `velocity` em direção a `baseSpeed` (o "motor" do movimento automático, via `RETURN_SPRING`) só roda **quando `!isDragging`** (`script.js:1698`). Com `isDragging` travado em `true`, esse bloco nunca mais executa.
3. `currentX += velocity` (`script.js:1709`) continua rodando a cada frame, mas `velocity` fica congelado no último valor que tinha no momento em que o toque começou — tipicamente próximo de `baseSpeed` (2.8) ou menor, mas sem o mecanismo de recuperação. Se o toque interrompido ocorreu com o carrossel já em repouso relativo ou logo após uma inversão de direção, o valor congelado pode ser muito baixo ou até negativo, dando a impressão de carrossel "parado".

Em mobile, a probabilidade de o dedo tocar a área do carrossel de forma não-intencional durante o scroll da página é alta (ele fica embaixo, na área que o usuário atravessa rolando até o fim) — e justamente aí, o navegador frequentemente resolve o gesto como scroll da página em vez de drag do carrossel, que é o cenário clássico de `touchcancel` sem `touchend`. Isso explica por que o sintoma é mobile-específico: em desktop, `mousedown`/`mouseup` raramente ficam órfãos (não há ambiguidade de gesto entre "arrastar o carrossel" e "rolar a página").

### Diferença touch vs. mouse na inicialização

Não há dependência de `mouseenter` ou qualquer evento exclusivo de mouse para *iniciar* o autoplay — `start()` é chamado apenas pelo `IntersectionObserver` (`entry.isIntersecting`), igual para os dois inputs. A assimetria não está na inicialização, está na **robustez do fim do gesto de drag**, que é touch-específica pelo motivo acima.

### Medição de interferência no carregamento

- **Tempo de main thread na inicialização:** ~27ms (medição da rodada anterior, `RELATORIO-PERFORMANCE.md:805` — não remedido agora por falta de DevTools/Safari real neste ambiente). Não mudou em relação ao código lido: a função `initClientsCarousel` não teve sua lógica de setup alterada desde essa medição, só o *momento* em que é chamada (agora dentro de `runQueueWhenIdle`, já fora do primeiro frame). **27ms é bem abaixo do limiar de 50ms** definido para "bloqueio significativo".
- **Consumo contínuo de CPU do loop `rAF`:** o loop faz apenas aritmética simples (`velocity`, `currentX`) e uma escrita de `transform` (propriedade compositável, não gera layout/paint pesado) por frame. Isso é uma operação de custo típico de frações de milissegundo por frame — não é o tipo de trabalho que causa jank por si só. Além disso, ele já é pausado via `IntersectionObserver` quando o carrossel sai da viewport (`script.js:1815-1825`), então não roda continuamente desde o load — só quando o usuário rola até o fim da página.

**Conclusão da análise de interferência: baixa/insignificante.** Nem os 27ms de setup (< 50ms, e já fora do primeiro frame por estar na fila idle) nem o loop `rAF` (leve, e gateado por visibilidade) explicam ou contribuem de forma relevante para os travamentos de carregamento investigados nos Sintomas 1 e 2. A causa do carrossel não girar é isolada — um bug de estado (`isDragging` travado por falta de `touchcancel`), não um problema de performance.

### Recomendação

Como a interferência é baixa, **não recomendo o caminho de "carrossel estático em mobile"** (que seria a alternativa correta apenas se a interferência fosse alta, análogo ao vídeo do hero). A causa é um bug de estado pontual e barato de corrigir (adicionar handler de `touchcancel` que reseta `isDragging`), sem relação com o problema de carregamento.

**Pergunta para o usuário:** deseja que eu implemente a correção (adicionar `touchcancel` ao carrossel de clientes, resetando `isDragging`/`dragDelta` da mesma forma que `onPointerUp`) nesta sessão, junto com as correções dos Sintomas 1 e 2, ou prefere tratar separadamente?

---

## Resumo executivo

| Sintoma | Causa | Já corrigido? | Ação recomendada |
|---|---|---|---|
| 1 — Hero "pula" | Main thread ainda contendido em mobile real: `requestIdleCallback` com `timeout: 200` pode forçar execução de funções não-críticas durante a janela de animação do hero; cada função individual é mais cara em CPU mobile throttled. Fix do Passo 0 presente e ativo, mas insuficiente sozinho. | Parcial | Aguardando decisão — possíveis próximos passos: aumentar o delay/timeout do idle scheduler, ou adiar ainda mais o início da fila até a timeline do hero terminar |
| 2 — "Sobre Nós" corta / seções atrasadas | `initCascadingSlider()` (fila idle) redimensiona `.cascading-slider-collection` de ~280px para 420px inline **depois** dos 3 `ScrollTrigger.refresh()` já terem rodado, deslocando os marcadores de todas as seções abaixo. Fallback de 1.5s mascara o sintoma sem resolver a causa. | Não — causa nova, distinta do fix de fonte já aplicado | Aguardando decisão — chamar `ScrollTrigger.refresh()` também depois do `initCascadingSlider()`/demais mutações de layout da fila idle |
| 3 — Carrossel de clientes não gira | `isDragging` trava em `true` quando `touchcancel` ocorre sem `touchend` (comum em mobile por ambiguidade de gesto scroll-vs-drag); falta handler `touchcancel`. Interferência no carregamento: **baixa** (27ms setup, loop leve e gateado por viewport). | Não | Não é caso de desativar autoplay em mobile — correção pontual e barata; aguardando confirmação do usuário para implementar |

Nenhuma alteração de código foi feita nesta etapa.
