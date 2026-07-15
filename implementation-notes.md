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
