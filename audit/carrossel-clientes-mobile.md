# Diagnóstico — carrossel de clientes não gira sozinho em mobile

> **Status: RESOLVIDO em 21/07/2026.** Ver seção "Correção aplicada" ao final deste documento.

**Data:** 21/07/2026
**Metodologia:** análise estática do código + reprodução automatizada via Puppeteer (emulação `iPhone`, viewport 390×844, `hasTouch: true`) contra o site servido localmente, com instrumentação temporária (fora do código de produção) em `IntersectionObserver`, `cancelAnimationFrame` e nos listeners de touch de `#clientsTrack`.

## Resumo executivo

**Causa raiz encontrada e é reproduzível em Chrome, não é exclusiva do Safari.** O `IntersectionObserver` que pausa/retoma o loop de `requestAnimationFrame` do carrossel (`script.js:2251-2261`) às vezes recebe uma entrada espúria com `isIntersecting: false` logo depois de uma entrada correta com `isIntersecting: true` — sem que o elemento tenha de fato saído da viewport. Isso chama `stop()` (cancela o `requestAnimationFrame`) e, como não há nenhum mecanismo de nova checagem, o carrossel fica parado permanentemente até o próximo evento real de scroll que cruze a fronteira de interseção. Não é o bug do `touchcancel`/`isDragging` (esse já está corrigido e continua funcionando corretamente) — é um problema separado, no próprio observer de visibilidade.

## Passo 1 — O carrossel inicializa?

**Sim.** Sequência confirmada via `?debug=perf` (log real capturado no teste):

```
hero-entrance-start   t=14
grupoA-start          t=3525
clientsCarousel-init-start        t=3773
clientsCarousel-first-image-loaded t=3774 (fromCache: true)
hero-entrance-end     t=5458
```

`initClientsCarousel()` está dentro do Grupo A (`script.js:2433-2443`) e dispara normalmente em viewport mobile. **Observação lateral, não é o bug reportado:** neste teste específico (headless/Puppeteer), o Grupo A disparou pelo fallback de 3,5s (`grupoA-start` em t=3525, antes de `hero-entrance-end` em t=5458) em vez de esperar o `onComplete` real da entrada do hero. Isso é esperado quando a timeline do GSAP não completa a tempo (ambiente headless costuma ser mais lento/instável para RAF do que um dispositivo real) — não afeta a conclusão sobre o carrossel em si, mas vale registrar como uma variável a mais em testes futuros neste ambiente.

## Passo 1.2 — Grupo A dispara corretamente em mobile?

**Sim**, confirmado no mesmo log acima — `grupoA-start`/`grupoA-end` disparam em viewport mobile sem diferença de comportamento em relação ao desktop.

## Passo 1.3 — O IntersectionObserver considera o carrossel visível em mobile? (**Aqui está o bug**)

Log real do `IntersectionObserver` interceptado, para o alvo `#clientsTrack`, durante o teste (scroll até a seção, sem nenhuma interação de toque ainda):

```json
[
  { "t": 4111, "isIntersecting": false, "intersectionRatio": 0,      "boundingTop": 3865.6 },
  { "t": 4988, "isIntersecting": true,  "intersectionRatio": 0.999,  "boundingTop": 300.8 },
  { "t": 5004, "isIntersecting": false, "intersectionRatio": 0,      "boundingTop": 300.8 }
]
```

- Entrada 1 (t=4111): elemento fora da viewport (`boundingTop: 3865`) — correto, seção ainda não rolada até.
- Entrada 2 (t=4988): scroll programático leva a seção à viewport, `isIntersecting: true`, `ratio: 0.999` — correto, `start()` é chamado.
- **Entrada 3 (t=5004), 16ms depois: `isIntersecting: false`, `ratio: 0`, mas `boundingTop` é o MESMO (300.8) da entrada anterior.** O elemento não se moveu nem saiu da tela — é uma entrada espúria. `stop()` é chamado, `cancelAnimationFrame` confirmado no log (`t=5005, id=199`).

Resultado prático: o `translate3d` do `#clientsTrack` fica **congelado no mesmo valor por, no mínimo, 4,5 segundos seguidos** no teste (verificado repetidamente), mesmo com o elemento comprovadamente dentro da viewport (`getBoundingClientRect` confirmando `top: 300.6`, `bottom: 452.6`, `winH: 844`).

### Hipótese de causa da entrada espúria

O observer está registrado no próprio `#clientsTrack` (`script.js:2258`, `visibilityObserver.observe(track)`), que:
1. Tem `will-change: transform` e seu `transform` (`translate3d`) é reescrito a cada frame pelo próprio loop de animação que o observer controla.
2. É 3× mais largo que a área visível (clones para o loop infinito) e é recortado por um ancestral com `overflow: hidden` (`.clients-carousel-stage`).
3. A entrada espúria ocorreu logo após um `window.scrollTo()` programático (forçando reflow síncrono) — um padrão conhecido de instabilidade do `IntersectionObserver` em engines quando o alvo observado sofre transform contínuo simultâneo a uma mudança de scroll/layout.

Observar um elemento que está sendo transformado a cada frame do próprio loop que o observer controla é uma referência circular arriscada: qualquer inconsistência de timing entre o commit do `transform` e o cálculo de interseção do navegador pode gerar uma leitura zerada mesmo com o elemento visível. **Isso bate com o padrão já visto nesta sessão** (bug calibrado incorretamente para desktop) — mas aqui o problema não é o *threshold* (`threshold: 0` está correto), é *o que* está sendo observado.

## Passo 2 — Revisão do histórico de mudanças

- **Correção do `touchcancel`** (`script.js:2231-2237`): presente e funcional. Testado isoladamente: um gesto de toque completo (`touchstart` → `touchmove` × 2 → `touchend`) sobre o carrossel foi recebido corretamente pelos 4 listeners (log capturado), e `onPointerUp` reseta `isDragging` corretamente. **Não é a causa do congelamento observado** — o congelamento ocorreu mesmo em cenário sem nenhuma interação de toque (Passo 1.3 acima), e persistiu igualmente depois de um toque bem-sucedido.
- **Nenhum `if (isMobile) return` ou condição de teste/debug esquecida** foi encontrada dentro de `initClientsCarousel()` ou nas suas dependências (`runBatchWhenIdle`, `startIdleQueue`). Não há checagem de `matchMedia`/`window.innerWidth` em lugar nenhum dessa função.
- **Grupo em lote (Grupo A)**: a mudança que agrupou as inicializações não-críticas em um único `requestIdleCallback` (`ec4656d`) não alterou a lógica interna do carrossel, só o momento em que `initClientsCarousel()` roda — não é candidata a causa.
- **Correção do salto de scroll**: não toca em `initClientsCarousel` nem no `IntersectionObserver` do carrossel — grep confirma zero menções cruzadas.
- **Remoção do blur pesado / infraestrutura `?isolate=`**: confirmado via `git show 1856fcb --stat` que o diff não tocou a função do carrossel de clientes nem seu observer — mudança isolada em `.light-spot` (blur) e remoção de `?isolate=`.
- **`html-minifier-terser`/min freshness**: produção carrega `script.min.js`; `check-min-freshness` confirma que reflete o `script.js` atual — não há divergência entre fonte e minificado que explique o sintoma.

**Conclusão do Passo 2:** nenhuma mudança recente desta sessão introduziu uma condição que bloqueia autoplay em mobile por lógica de negócio. A causa é estrutural (o design do observer de visibilidade), preexistente, e só se manifesta de forma intermitente/dependente de timing — o que explica por que o sintoma "some e volta" ao longo de várias sessões de código.

## Passo 3 — Testes em condições reais

- **Reproduzido em emulação Chrome (Puppeteer, perfil iPhone 390×844, `hasTouch: true`).** Não foi necessário Safari real para reproduzir — **isso não é um bug exclusivo de WebKit**, ao contrário dos outros bugs desta sessão (blur, timers periódicos).
- Um teste adicional confirmou que um gesto de toque bem-sucedido (touchstart/touchmove/touchend, sem `touchcancel`) **não** é o gatilho — o congelamento acontece de forma independente, na transição inicial de visibilidade.
- Como o bug reproduz em Chrome, a instrumentação `clientsCarousel-raf-tick` (item pedido no Passo 3 do pedido original, para o caso de precisar de captura em iPhone real) **não foi necessária para fechar o diagnóstico desta rodada** — mas fica como recomendação se, após a correção do observer, ainda houver relato de travamento específico em Safari real (nesse caso futuro, adicionar um `mark('clientsCarousel-raf-tick', {frame: n})` a cada N frames dentro de `animate()`, ativo só sob `?debug=perf`, seguindo o mesmo padrão dos outros checkpoints).

## Passo 4 — Respostas diretas

| Pergunta | Resposta |
|---|---|
| O carrossel inicializa? (Grupo A dispara, `initClientsCarousel` roda) | **Sim**, confirmado via log `?debug=perf` em viewport mobile. |
| O `IntersectionObserver` considera o carrossel visível em mobile? | **Inconsistentemente** — chega a considerar visível corretamente, mas emite uma entrada espúria de "não visível" ~16ms depois, sem o elemento ter saído da tela, o que interrompe o autoplay permanentemente até o próximo cruzamento real de scroll. **Esta é a causa raiz.** |
| Alguma mudança recente desta sessão introduziu uma condição que bloqueia autoplay em mobile? | **Não.** Nenhuma lógica condicional nova (`isMobile`, `matchMedia`, debug esquecido) foi encontrada. O bug é estrutural no design do observer (observar um alvo que se transforma continuamente e é maior que a viewport), não uma regressão de commit específico. |
| Reproduz em emulação Chrome ou só em Safari real? | **Reproduz em Chrome emulado.** Não é necessária nova captura em iPhone real para confirmar a causa — mas recomenda-se validar a correção também em dispositivo real, dado o histórico de discrepâncias Chrome/Safari nesta sessão. |

## Recomendação para a próxima rodada (correção, não incluída aqui)

Duas linhas de correção possíveis, ambas quebrando a referência circular "observar o próprio elemento que se transforma":
1. Observar `.clients-carousel-stage` (contêiner estável, sem transform, do tamanho real da viewport) em vez de `#clientsTrack`.
2. Ou manter a observação em `track`, mas tratar a entrada `isIntersecting: false` com um pequeno debounce (ex.: só chamar `stop()` se duas leituras consecutivas confirmarem não-interseção), absorvendo a entrada espúria isolada sem introduzir atraso perceptível para o caso real de sair da viewport.

## Correção aplicada (21/07/2026)

Implementadas as duas correções recomendadas, juntas, em `initClientsCarousel()` (`script.js:2248-2280`):

### Correção 1 — Observar o container estável
O `IntersectionObserver` passou a observar `#clientsStage` (o `<div>` pai fixo, `overflow: hidden`, que já existia na estrutura HTML — `index.html:270`) em vez de `#clientsTrack`. `clientsStage` nunca é transformado nem redimensionado pelo loop de animação, eliminando a referência circular que causava a leitura espúria.

### Correção 2 — Debounce antes de parar (redesenhado durante a implementação)
A proposta original ("2 confirmações consecutivas do observer") **não funcionaria na prática**: uma saída real de viewport dispara apenas UMA notificação `isIntersecting: false` do navegador (não duas), então exigir 2 callbacks consecutivos nunca seria satisfeito e o `stop()` legítimo pararia de funcionar — confirmado empiricamente durante a validação (ver abaixo). Implementado em vez disso um **debounce por tempo**: ao receber `isIntersecting: false`, o `stop()` é adiado por 100ms via `setTimeout`; se uma notificação `isIntersecting: true` chegar antes desse timeout dessa disparar (o padrão exato da leitura espúria original — `false` seguido de `true` ~16ms depois), o `stop()` pendente é cancelado. `start()` continua imediato, sem debounce, em qualquer notificação de visibilidade.

### Validação (Puppeteer, emulação iPhone 390×844 + desktop 1440×900)

Reproduzido o cenário exato que capturou o bug originalmente (mesmo scroll programático até a seção):

```
IO LOG (após a correção):
  t=4241  isIntersecting=false  target=clientsStage  boundingTop=3865.5  (correto, fora da viewport)
  t=5044  isIntersecting=true   target=clientsStage  boundingTop=300.7   (correto, entrou na viewport)
  (nenhuma leitura espúria — a entrada falsa que ocorria 16ms depois desapareceu)

Transform ao longo do tempo (mobile, pós-entrada na viewport):
  T1=translate3d(-850.1px,...) → T2=translate3d(-770.4px,...) → T3=translate3d(-661.2px,...)
  KEEPS MOVING? = true
```

Caso real de saída de viewport (scroll de volta ao topo), testado na mesma sessão:

```
T_A=translate3d(-654.9px,...) → T_B=translate3d(-654.9px,...) (1.5s depois)
STOPPED WHEN OUT OF VIEW? = true
```

Confirmado em **desktop (1440×900)** também: `DESKTOP KEEPS MOVING? = true`.

**112/112 testes passando** (47 unitários + 65 de regressão) antes e depois da mudança. `script.min.js` regenerado e `check-min-freshness` confirma consistência fonte/minificado.

### Conclusão
O carrossel agora inicia e continua girando sozinho, tanto ao entrar na viewport em mobile quanto em desktop, sem parar espontaneamente, e continua parando corretamente quando sai de fato da tela. Correção validada em ambiente automatizado (Chrome/Puppeteer); recomenda-se confirmação visual em iPhone real na próxima oportunidade, dado o histórico de discrepâncias Chrome/Safari nesta sessão — mas a causa raiz identificada e corrigida não dependia de comportamento específico do WebKit.
