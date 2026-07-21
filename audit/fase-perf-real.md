# Fase 2 — Instrumentação de performance real (Safari/WebKit no iPhone)

**Data:** 20/07/2026
**Status:** Instrumentação pronta para deploy. Causa raiz do travamento ainda **não** diagnosticada — este documento cobre só a captura de dados, não a correção.

## Motivação

O WebPageTest testa Chrome mesmo em "modo mobile" (emulação de viewport, não motor real). Os números sempre pareceram bons ali, enquanto o usuário e os pais dele continuam sentindo travamento real em iPhones. O bug é provavelmente específico do motor WebKit/Safari, não reproduzível em Chrome — mesmo padrão do bug de salto de scroll da Fase 1 (`audit/fase1-salto-scroll.md`), que só foi confirmado com instrumentação rodando no dispositivo real.

Estratégia repetida aqui: instrumentação ativada por query param, autocontida, com botão de exportação via clipboard, para capturar dados reais direto no iPhone.

## O que foi implementado

Novo bloco `initPerfDebug()` em `script.js` (logo após o bloco de debug de scroll da Fase 1), ativado por `?debug=perf` **ou** `?debug=all` (o bloco de scroll também passou a aceitar `?debug=all`, permitindo capturar os dois diagnósticos numa única sessão).

Zero efeito em produção normal — todo o bloco retorna cedo (`return`) se o parâmetro não estiver presente. Confirmado via Puppeteer que, sem `?debug=perf`, nem `window.__perfDebugLog` nem o botão de cópia existem no DOM.

### Dados capturados (`window.__perfDebugLog`)

1. **Marcos de ciclo de vida:** `script-start`, `DOMContentLoaded`, `load`.
2. **Hero entrance:** `hero-entrance-start` / `hero-entrance-end` — via wrap de `window.initHeroEntrance` (a função global é hoisted antes do IIFE de debug rodar, então o wrap intercepta a chamada real feita em `initPage()` sem alterar a lógica interna).
3. **Grupo A (ScrollTrigger de reveal, carrossel de clientes, portfolio):** `grupoA-start` / `grupoA-end` — via wrap de `window.runBatchWhenIdle`.
4. **Primeira imagem do carrossel de clientes:** `clientsCarousel-init-start` e `clientsCarousel-first-image-loaded` (com `fromCache: true/false`) — via wrap de `window.initClientsCarousel`, checando `img.complete` ou aguardando o evento `load`.
5. **Frame timing:** loop de `requestAnimationFrame` nos primeiros 9s da página. Cada delta entre frames consecutivos > 50ms vira uma entrada `frame-delta` com o valor em ms. A 60fps o delta esperado é ~16,7ms; deltas de 100ms+ indicam soluço real perceptível.
6. **Long tasks:** `PerformanceObserver` com `entryTypes: ['longtask']`. Se a API não existir (comum no Safari iOS — suporte inconsistente), registra `performance-observer-unsupported` ou `longtask-unsupported` explicitamente, para não ser confundido com "nenhuma long task ocorreu".
7. **Memória:** `performance.memory` não existe no Safari — registrado como `memory-unsupported` em vez de omitir ou inventar dado.
8. **Heartbeat de bloqueio do main thread:** `setInterval` de 200ms. Se o gap entre dois heartbeats consecutivos passar de 500ms, registra `heartbeat-gap` com o valor real do gap — sinal direto de que o main thread ficou bloqueado tempo suficiente para o próprio timer atrasar, correlacionável com a sensação de travamento do usuário.

### Botão de exportação

Botão fixo (`📋 Copiar log de performance`, canto inferior direito, acima do botão de scroll caso ambos estejam ativos) copia `JSON.stringify({ log: window.__perfDebugLog })` via `navigator.clipboard.writeText()`. Diferente do debug de scroll, aparece desde o carregamento inicial (sem depender de detecção automática de anomalia) — a captura é manual, após 15-20s de uso normal.

## Validação

- **Inércia em produção:** confirmado via Puppeteer que `window.__perfDebugLog`, `window.__scrollDebugLog` e os botões de debug não existem quando a página carrega sem `?debug=...` na URL.
- **Suíte de testes:** `npm test` — 4 suítes, **112 testes passando** (unitários + regressão do carrossel, incluindo os 65 de `tests/regression/slider.regression.test.js`). Nenhuma regressão introduzida pelos wraps de `initHeroEntrance`/`runBatchWhenIdle`/`initClientsCarousel`.
- **Puppeteer (`?debug=perf`):** botão `📋 Copiar log de performance` aparece no DOM; ao clicar, `navigator.clipboard.writeText` é chamado (mockado no teste) sem lançar erro, o texto do botão muda para "✅ Copiado!", e o log já contém entradas (`script-start`, `DOMContentLoaded`, `load`, marcos do hero/Grupo A, etc.) no momento da captura. Limitação conhecida (mesma da Fase 1): não é possível verificar o conteúdo real da área de transferência do SO dentro do sandbox — só que a chamada acontece sem erro.
- **`script.min.js` regenerado** via `npx terser script.js -o script.min.js -c -m` e validado com `node scripts/check-min-freshness.js` (o `index.html` carrega o `.min`, não o `script.js` fonte — sem isso a instrumentação não rodaria em produção real).

## Arquivos alterados

- `script.js` — novo bloco `initPerfDebug()`; condição do bloco `initScrollJumpDebug()` da Fase 1 ampliada para aceitar `?debug=all` também.
- `script.min.js` — regenerado a partir de `script.js`.
- `audit/fase-perf-real.md` — este documento.

## Instruções para teste no iPhone (pós-deploy)

1. Abrir `https://perinconstrucoes.netlify.app/?debug=perf` no Safari do iPhone (idealmente em mais de um aparelho — o do usuário e, se possível, o de um dos pais — para confirmar se é um padrão geral ou específico de um dispositivo).
2. Usar o site normalmente por 15-20 segundos: esperar o hero, rolar a página, interagir com o carrossel — tentar reproduzir a sensação de travamento como sempre acontece.
3. Tocar no botão "📋 Copiar log de performance".
4. Colar o conteúdo copiado para análise.

## Remoção futura

Assim que a causa do travamento estiver confirmada e corrigida, remover o bloco `initPerfDebug()` inteiro de `script.js` (autocontido, mesma forma que o bloco de debug de scroll da Fase 1) e regenerar `script.min.js`.

---

## Atualização — checkpoints granulares em `initPage()` (20/07/2026)

### Dado real que motivou este passo

Captura real no iPhone do usuário via `?debug=perf` (reprodutível em toda carga, não é efeito de aquecimento/JIT):

- **Bloqueio de main thread de ~3785ms sem nenhum frame** e **heartbeat atrasado em 3843ms**, entre `DOMContentLoaded` (t=44) e t≈3839 — **antes** do Grupo A rodar, **antes** do evento `load`, e **enquanto a timeline de entrada do hero ainda estava em andamento** (começou em t=40, só terminou em t=5241 — mais de 5s no total, quando o esperado é ~1,5-2s).
- Isso não aparece em Chrome/Puppeteer/WebPageTest — confirma que o gargalo é específico do motor WebKit/Safari real, não reproduzível em emulação.

O bloqueio está confinado à parte **síncrona** de `initPage()` — as funções que rodam antes do Grupo A ser adiado para idle. Passo necessário: granularizar os checkpoints para achar qual função (ou a soma delas) está consumindo os ~3,8s.

### Lista real confirmada no código (não é a suposta na hipótese original — `createParticles` faz parte do **Grupo B**, adiado para idle, não do bloco síncrono)

Ordem exata em `initPage()` (`script.js`, dentro da função, antes do agendamento do Grupo A/B):

1. `initHeroVideoBackground()`
2. `initHeroParallax()`
3. `initHeroAnimations()`
4. `initNavigation()`
5. `initButtonRipple()`

Não há chamada a `gsap.registerPlugin(ScrollTrigger)` em `script.js` — o registro do plugin acontece internamente nos arquivos vendor (`vendor/gsap/gsap.min.js` / `vendor/gsap/ScrollTrigger.min.js`), fora do escopo do nosso código, então não há onde inserir esse checkpoint específico sem modificar os vendors (não deve ser feito).

### O que foi adicionado

- `function __perfCheckpoint(label)` — helper global de topo de arquivo (fora de qualquer IIFE de debug, pois precisa estar acessível dentro de `initPage()`). No-op total quando `window.__perfDebugLog` não existe (fora do modo `?debug=perf`/`?debug=all`) — sem custo de performance em produção.
- Checkpoints `-start`/`-end` ao redor de cada uma das 5 chamadas síncronas acima, mais `initPage-sync-start` / `initPage-sync-end` marcando o início e o fim de todo o bloco síncrono. Nenhuma ordem ou comportamento de função foi alterado — só os logs em volta.

### Validação

- `npm test`: 4 suítes, **112 testes passando** (unitários + os 65 de regressão do carrossel) — inalterado.
- Puppeteer com `?debug=perf`: confirmado via `window.__perfDebugLog` que a sequência de eventos aparece corretamente ordenada: `script-start` → `initPage-sync-start` → `initHeroVideoBackground-start/end` → `initHeroParallax-start/end` → `initHeroAnimations-start/end` → `initNavigation-start/end` → `initButtonRipple-start/end` → `initPage-sync-end` → `hero-entrance-start` → ...
- `script.min.js` regenerado via `npx terser script.js -o script.min.js -c -m` e validado com `node scripts/check-min-freshness.js`.

### Arquivos alterados nesta atualização

- `script.js` — helper `__perfCheckpoint()` no topo do arquivo; checkpoints granulares em volta das 5 chamadas síncronas de `initPage()`.
- `script.min.js` — regenerado.
- `audit/fase-perf-real.md` — esta atualização.

### Próximo passo

Repetir a captura no iPhone com `?debug=perf` (mesmas instruções da seção anterior). Com os checkpoints granulares, o log vai mostrar exatamente qual função (ou combinação) consome os ~3,8s de bloqueio — a partir daí dá para propor a correção.
