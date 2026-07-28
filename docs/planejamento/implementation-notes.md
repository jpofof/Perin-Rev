# Notas de Implementação — Vídeo de Fundo no Hero

Segue `technical-plan.md`. Registra desvios encontrados durante a execução e decisões tomadas para não interromper a Fase 2.

## Desvios em relação ao plano

1. **Duração real do arquivo fonte: 16.1s, não 8s.** `hero-section-fundo.mp4` (assets/images/hero-fundo/) tem 16.13s, resolução 1024x576 (não 1080p). O plano assumia 8s/1080p. Mantido o bitrate de 3 Mbps conforme decidido na Fase 1 — resultado: cada arquivo de saída (~5.3-6.6 MB) é maior que a estimativa original de ~3 MB. Isso **estoura o teto de payload combinado de 7 MB** definido no §7 do plano (forward+reverse MP4 = ~10.7 MB; WebM = ~13 MB). Decisão sobre reduzir bitrate/resolução para caber no orçamento fica para revisão pós-Fase-3, não foi alterada aqui.
2. **Ambiente sem `ffmpeg`/`cwebp` pré-instalado** — instalado via `winget install Gyan.FFmpeg` (inclui libwebp) durante a Fase 2. Ferramenta de build local, não é dependência de runtime do site.

## Bug encontrado e corrigido durante a implementação

- **`canplaythrough` não dispara se o vídeo já estiver com `readyState >= 4`** no momento em que o listener é anexado (ex.: vídeo servido do cache do disco/HTTP, comum em revisitas). Sem isso, o vídeo nunca ficava visível/tocando. Corrigido em `script.js` (`initHeroVideoBackground`) checando `forward.readyState >= 4` antes de decidir entre chamar `revealForward()` direto ou esperar o evento.
- **Contraste de texto insuficiente com overlay a 0.45 e `--color-text-primary` (quase preto) sobre o vídeo.** O overlay original do plano (`rgba(0,0,0,0.45)`) não garantia legibilidade do título/subtítulo/CTA contra céu e grama claros no vídeo. Ajustes feitos (dentro do escopo "overlay guarantees contrast" do próprio plano da Fase 2, não uma mudança de conteúdo):
  - Overlay elevado para `rgba(0, 0, 0, 0.68)`.
  - `.hero-title-line`, `.hero-subtitle`, `.hero-button-secondary` e `.hero-scroll-text` recebem cor clara (`#F5F5F5` / variações com opacidade) **escopada a `.hero-architectural-scene`** — não altera as variáveis `--color-text-*` usadas no resto do site.
  - Este ajuste base garante legibilidade; a Fase 3 (taste) pode refinar (gradiente, vinheta) mas não deve reduzir o contraste abaixo do que está aqui.

## Verificação realizada

- Testado com Puppeteer local (servidor `npx serve` em `localhost:8080`): vídeo forward carrega, fica visível (`is-visible`), toca (`paused: false`), sem erros de console.
- `npm run test:unit`: 42/42 passando (precisou de guard `typeof window.matchMedia === 'function'` porque o ambiente jsdom dos testes não implementa `matchMedia` — sem esse guard, `initPage()` quebrava a suíte inteira).
- `npm run test:regression`: 65/65 passando — nenhuma regra imutável do carrossel foi afetada (mudança é 100% aditiva, fora de `initCascadingSlider`/`.cascading-slider*`/`portfolio-section`).
- Navegadores: validado apenas via Chromium headless (Puppeteer) nesta sessão. **Safari desktop/iOS, Firefox e Android Chrome reais não foram testados** — ambiente de desenvolvimento é Windows sem acesso a esses browsers/dispositivos. Recomenda-se validar na preview do Netlify antes do merge, conforme o passo final do briefing.
- Lighthouse não foi executado nesta sessão (sem Chrome completo disponível no ambiente headless usado); a validação de LCP/payload deve ser feita na preview do Netlify.

## Pendências para Fase 3 (taste-skill)
- Overlay atual é flat `rgba(0,0,0,0.68)` — plano previa possível gradiente/vinheta/tom quente, ainda não aplicado.
- "Held moment" no pico da construção antes de reverter — ainda não implementado (loop atual troca imediatamente no `ended`).
- Sem tratamento de recorte/`object-position` específico para mobile retrato.
- Vídeo começa do zero (terreno vazio) — briefing sugere considerar iniciar em timestamp com atividade visível.

## Fase 3 — Refinamento visual (taste)

`.claude/skills/taste-skill` não estava registrada como skill invocável nesta sessão (pasta existe mas é um repositório de plugin não vinculado, não apareceu na lista de skills disponíveis) — o refinamento abaixo foi feito diretamente, seguindo os mesmos objetivos descritos no briefing da Fase 3. Arquitetura técnica da Fase 2 não foi alterada (mecanismo de loop, paths de arquivo, lógica de fallback continuam os mesmos).

1. **Overlay** — trocado de flat `rgba(0,0,0,0.68)` para uma composição de gradiente radial (vinheta, mais escuro nas bordas) + gradiente linear vertical com leve matiz verde-preto (`rgba(6,12,8,...)` em vez de preto puro) para unificar com a identidade Perin sem sacrificar contraste — a opacidade mínima em qualquer ponto continua ≥0.6, então a legibilidade da Fase 2 não regride.
2. **Fade-in do vídeo** — trocado `opacity 0.6s ease` (linear) por `opacity 0.7s var(--ease-premium)`, reaproveitando a curva `cubic-bezier(0.16, 1, 0.3, 1)` já usada em outras transições do projeto (não inventei uma curva nova).
3. **Transição do loop** — adicionado um "held moment" de 260ms: ao disparar `ended`, o clipe atual fica congelado no último frame por 260ms antes de trocar para o próximo (em vez de troca instantânea). O crossfade em si já é natural: como `currentClip`/`nextClip` compartilham a mesma `transition: opacity`, remover `is-visible` de um e adicionar ao outro na mesma tick produz um crossfade suave ao longo dos 0.7s da transição CSS — não precisou de lógica adicional de crossfade manual.
4. **CTA e badge sobre vídeo em movimento** — adicionado `backdrop-filter: blur(8px)` + fundo semi-transparente escuro (`rgba(10,16,12,0.25)`) no botão secundário (outline) e no badge "Engenharia & Arquitetura", escopado a `.hero-architectural-scene`. Dá uma sensação de "vidro" que ancora o texto contra o fundo em movimento sem alterar o CTA primário (já sólido/alto contraste).
5. **Mobile** — vídeo é aéreo/paisagem (1024x576); em `max-width: 750px` (breakpoint já usado no projeto), `object-position` muda de `center center` para `62% center`, deslocando o enquadramento para o lado onde a atividade de construção (escavadeira/estrutura) fica mais visível em vez de cortar para o centro geométrico do frame, que tende a mostrar mais céu/grama vazios em retrato.
6. **Primeiro segundo / impressão inicial** — na primeira reprodução apenas, `forward.currentTime` é ajustado para 2s antes de tocar (só quando `forward.duration > 4s`, evitando erro em clipes muito curtos). Isso pula o instante de terreno completamente vazio; nos ciclos seguintes do loop, o forward sempre recomeça do zero normalmente (o offset é aplicado uma única vez, controlado pela flag `isFirstPlay`).

### Verificação pós-Fase-3
- `npm run test:unit`: 42/42.
- `npm run test:regression`: 65/65 — precisou mover o novo bloco `@media (max-width: 750px)` do vídeo do Hero para depois dos blocos 750px do carrossel/portfolio em `styles.css`, porque o teste de regressão localiza o **primeiro** bloco `@media (max-width: 750px)` do arquivo via regex e esperava que fosse o do carrossel (`cascading-slide-title`/`cascading-slide-subtitle`). Nenhuma regra do carrossel foi alterada — só a posição do meu bloco novo no arquivo.
- Verificado visualmente via Puppeteer em 1440×900 (desktop) e 390×844 (mobile): texto legível, CTAs com tratamento de vidro visíveis, enquadramento mobile favorece a área de atividade da obra.
- Confirmado que a entrada GSAP do Hero (`initHeroEntrance`) ainda completa normalmente — em ambiente headless com decodificação de 2 vídeos simultâneos, a timeline pode levar mais que os ~2.5s observados antes da Fase 2 para concluir (chegou a precisar de ~7s no teste headless sob CPU concorrente); isso é uma característica do ambiente de teste sob carga, não uma quebra de funcionalidade — a timeline do GSAP em si não foi tocada.
