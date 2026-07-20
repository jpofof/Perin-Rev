# FASE 1 — Salto de scroll para trás

> Status: investigado, **causa não confirmada**. Nenhuma correção implementada. Nenhum código alterado.

## Investigação (leitura estática)

Todos os pontos que chamam `ScrollTrigger.refresh()` em `script.js`:

| Local | Gatilho | Pode disparar durante scroll ativo do usuário? |
|---|---|---|
| `window.addEventListener('resize', ...)` | resize | Sim, mas `ScrollTrigger.config({ ignoreMobileResize: true })` suprime especificamente o resize causado pela barra de endereço do Safari escondendo/aparecendo durante scroll (a causa mais comum de resize em mobile) |
| `window.addEventListener('load', ...)` | load | Só uma vez, cedo — improvável coincidir com scroll ativo do usuário na maioria dos casos, mas não impossível em rede muito lenta |
| `document.fonts.ready.then(...)` | fontes carregadas | Só uma vez, timing depende da rede — pode coincidir com o usuário já rolando se a fonte demorar |
| `initPortfolioGallery()` (dentro do Grupo A, pós-hero) | fila de inicialização | Só uma vez, mas o timing (logo após o hero, ~20ms depois do gatilho) é exatamente a janela em que o usuário mais provavelmente já está rolando (o hero acabou de "liberar" a atenção dele) |
| `createCascadingSlider()` (dentro de `initCascadingSlider`) | abertura do visualizador do portfólio | Só quando o usuário clica em um projeto — não é o cenário descrito (usuário só rolando) |

Nenhuma chamada de `ScrollTrigger.refresh()` acontece de forma repetida/contínua durante o scroll — todas são eventos únicos. `initPortfolioGallery()` é a mais suspeita por coincidir em timing com o momento em que o usuário provavelmente já está rolando.

Verificado e **descartado** como causa de mudança de altura ACIMA da posição de scroll:
- `createParticles()` — adiciona 50 `<div>` a `#heroParticles`, mas esse container é `position: absolute` (`styles.css:556-563`), fora do fluxo normal — não afeta a altura da seção hero.
- `initClientsCarousel()` — clona slides do carrossel de clientes, mas `.clients-carousel-track` é `display: flex` sem `flex-wrap` (cresce em largura, não altura); os clones têm a mesma altura dos originais.
- Nenhum `pin: true` é usado em nenhum ScrollTrigger do projeto (`grep` sem resultados) — descarta o padrão clássico de "pin-spacer" recalculado causando salto.
- `initScrollRevealFallback()` só altera `opacity`/`x`/`y` via `gsap.set()` ou adiciona uma classe (`revealed`) — nenhuma dessas propriedades afeta layout/altura diretamente (a menos que o CSS por trás de `.revealed` mude `display`/`height`, o que não foi confirmado nem descartado por leitura de CSS nesta rodada).
- Nenhuma chamada a `window.scrollTo`/`scrollIntoView`/`scrollTop =` acontece fora de fluxos de interação explícita (abrir/fechar o visualizador do portfólio, erro de validação do formulário) — nenhuma delas faz parte do cenário relatado (usuário só rolando).

## Reprodução tentada (Puppeteer, Chrome real headless)

Metodologia: viewport mobile (390×844), scroll simulado via `window.scrollBy(0, 25)` a cada 30ms durante os primeiros 4s (aproximando um gesto de rolagem gradual), monitorando `window.scrollY`, `document.documentElement.scrollHeight`, e o `offsetTop` absoluto de cada seção (`#hero`, `#about`, `#clients`, `#differentials`, `#portfolio`, `#services`, `#segments`, `#process`, `#testimonials`) a cada 20ms.

**Resultado: nenhum salto de `scrollY` foi detectado** (`maxScrollDropPx = 0.0`). Duas mudanças de altura do documento foram registradas (+2181px em ~300ms, +1364px em ~4053ms — este segundo timing corresponde ao momento em que o Grupo A/fallback de 3,5s roda, coerente com `initPortfolioGallery()`), mas **nenhuma das seções rastreadas (`about` até `testimonials`) teve seu `offsetTop` alterado** — ou seja, nesta simulação, toda a altura adicionada aconteceu abaixo de `testimonials` (não rastreado; provavelmente FAQ/contato), sem deslocar nenhuma seção visível na janela de scroll testada.

## Conclusão honesta

**Não consegui reproduzir o salto de scroll neste ambiente**, apesar de ter investigado todos os pontos de `ScrollTrigger.refresh()` e as mutações de DOM candidatas. Isso pode significar:

1. A causa real depende de uma condição não capturada por esta simulação — por exemplo, o comportamento real da barra de endereço do Safari iOS (que este ambiente não reproduz; `window.scrollBy` não altera `window.innerHeight` como o gesto real de scroll no Safari faz), scroll anchoring do navegador se comportando diferente entre Chrome desktop/headless e Safari iOS real, ou timing de rede real (imagens/fontes chegando em momentos diferentes dos deste teste local).
2. A causa pode estar em uma interação entre `ScrollTrigger.refresh()` e o `ignoreMobileResize: true` que só se manifesta quando o refresh acontece DURANTE a transição real da barra de endereço (viewport momentaneamente maior), calculando marcadores com uma altura de viewport que depois "volta" — mecanismo que não pude simular sem o comportamento real do Safari.
3. Pode haver uma causa ainda não identificada, fora do que foi investigado.

**Não vou implementar uma correção especulativa sem confirmar a causa real** — conforme instruído. Recomendo que a próxima gravação real no iPhone (se possível) capture também `performance.now()` e `window.scrollY` via um pequeno snippet de debug temporário injetado no console do Safari remoto (Web Inspector), para termos dados reais do dispositivo em vez de simulação. Alternativa mais barata: adicionar um listener temporário de `scroll` que loga `scrollY`/timestamp para o `localStorage` (sobrevive a navegação) e o usuário exporta depois — posso implementar isso como uma ferramenta de diagnóstico temporária, se aprovado, sem tocar na lógica de produção.

## Instrumentação para captura real no dispositivo (v1 — superada, exigia Mac)

`audit/debug-scroll-jump-snippet.js` foi a primeira versão (snippet para colar no console via Web Inspector remoto). **Superada** pela v2 abaixo, que não depende de Mac. Mantido no repositório só como referência.

## Instrumentação v2 — sem Mac, direto no iPhone (`?debug=scroll`)

Adicionado a `script.js` um bloco autocontido no topo do arquivo (logo após `'use strict'`), gated por `if (params.get('debug') !== 'scroll') return;` — **nunca ativa sem o parâmetro na URL**, não afeta usuários normais do site, e não interfere em nenhuma outra parte do código (não compartilha variáveis, não modifica nenhuma função existente exceto um wrap não-destrutivo de `ScrollTrigger.refresh()` para logging).

**O que faz:**
- Monitora `window.scrollY`, `window.innerHeight` (detecta a barra de endereço do Safari escondendo/aparecendo) e `document.documentElement.scrollHeight` a cada 20ms.
- Intercepta `ScrollTrigger.refresh()` para logar exatamente quando cada chamada acontece, sem alterar seu comportamento.
- Loga eventos de `resize`.
- Ao detectar uma queda de `scrollY` > 30px entre duas amostras (o salto), guarda um snapshot completo no log e mostra um botão fixo no canto inferior direito: **"📋 Copiar log de debug"**.
- Tocar o botão copia `JSON.stringify(window.__scrollDebugLog)` para a área de transferência via `navigator.clipboard.writeText()` — sem precisar de console.
- Captura encerra sozinha depois de 15s.

**Fácil de remover:** todo o bloco está isolado entre `// === DEBUG TEMPORARIO — FASE 1 ===` e o fechamento da IIFE, antes de `// === DESIGN TOKENS ===`. Remover é deletar esse bloco inteiro (uma única função autoexecutável) — não deixa nenhum resíduo em outras partes do arquivo.

**Verificação feita (Puppeteer, Chrome real):**
- Confirmado que **sem** `?debug=scroll` na URL, `window.__scrollDebugLog` nunca é definido (bloco não ativa) — zero risco para usuários normais.
- Confirmado que **com** `?debug=scroll`, um salto simulado (`scrollTo` forçado) faz o botão aparecer corretamente.
- **Não consegui verificar o `navigator.clipboard.writeText()` de ponta a ponta neste sandbox** — o Chrome headless usado aqui nega a permissão de escrita na área de transferência mesmo com `overridePermissions()` concedido explicitamente (`NotAllowedError: Write permission denied`), uma limitação conhecida de ambientes headless/CI, não do código. O código usa a API padrão (`navigator.clipboard.writeText`), amplamente suportada no Safari iOS a partir de um toque real do usuário — mas a confirmação final de que o botão realmente copia no iPhone depende do seu teste real.

**Como usar (você):**
1. Abra `https://perinconstrucoes.netlify.app/?debug=scroll` no Safari do iPhone (depois que esta mudança for publicada).
2. Role a página tentando reproduzir o salto (do jeito que rolou na gravação original).
3. Se/quando o botão "📋 Copiar log de debug" aparecer no canto da tela, toque nele.
4. Cole o conteúdo copiado direto aqui no chat.

Se o botão nunca aparecer mesmo depois de reproduzir o salto visualmente, isso por si só já é um dado importante (significa que a queda de `scrollY` foi menor que 30px, ou que o mecanismo de detecção não está capturando o evento real — nesse caso, aumente a duração da rolagem e tente de novo, ou me avise para eu ajustar o limiar).

## Item do checklist

- [~] FASE 1: **investigada, causa não confirmada/reproduzida em simulação.** Instrumentação `?debug=scroll` adicionada a `script.js` (autocontida, fácil de remover, verificada via Puppeteer exceto o clipboard em si). Nenhuma correção implementada — aguardando captura real do usuário no iPhone.
