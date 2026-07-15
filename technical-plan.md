# Plano Técnico — Vídeo Time-lapse de Fundo no Hero

**Branch:** `feat/hero-timelapse-video`
**Status:** Aprovado para Fase 2 (implementação)
**Fonte bruta recebida:** `assets/images/hero-fundo/hero-section-fundo.mp4` (3.2 MB, 8s, forward apenas — terreno até prédio de 2 pavimentos)

---

## 1. Estratégia de loop — DECISÃO: dois arquivos encadeados via `ended`

Opção escolhida: **(a) dois arquivos de vídeo** (`construction-timelapse.mp4` forward + `construction-timelapse-reverse.mp4`) trocados no evento `ended` do `<video>`. Rejeitada a opção (b) — reverse via JS (`requestAnimationFrame` + `currentTime--`).

Motivo:
- **Safari (desktop e iOS) não suporta scrubbing reverso confiável via JS.** Ajustar `currentTime` em loop de rAF gera stutter severo em iOS (o decoder não foi projetado para seek reverso contínuo) e pode disparar `stalled`/`waiting` repetidamente. É um problema documentado e não contornável de forma robusta.
- O arquivo fonte já é pequeno (3.2 MB para 8s). Duplicar (~6 MB combinados após compressão, ver §2) é barato frente ao ganho de confiabilidade — a opção (b) economiza banda mas troca isso por bug cross-browser e CPU extra (decode + composição a cada frame via JS), o que viola o pilar de "fácil manutenção": código de scrubbing manual é superfície de bug permanente.
- Reprodução forward pura em ambos os arquivos usa APIs nativas do `<video>` (`play()`, evento `ended`) — zero polling, zero rAF, custo de CPU mínimo (apenas decodificação de vídeo, que é acelerada por hardware em qualquer browser moderno).
- O arquivo reverso será gerado por `ffmpeg -vf reverse` a partir da mesma fonte (não via CapCut manual) — garante emenda perfeita quadro a quadro, sem dependência de ferramenta externa proprietária.

Encadeamento: `construction.play()` → `ended` → troca `src` para `reverse` (ou alterna visibilidade entre dois elementos `<video>` pré-carregados, ver Fase 3 para o refinamento do "held moment") → `ended` → volta para `construction` → repete.

## 2. Formato e encoding

- **Primário:** MP4 H.264 baseline profile, level 3.1, `yuv420p`, sem áudio (`-an`), `+faststart`.
- **Fallback:** WebM VP9, mesma configuração de bitrate.
- **Bitrate alvo:** 3 Mbps (dentro da faixa 2-4 Mbps recomendada para vídeo de fundo 1080p). Para 8s ≈ 3 MB por arquivo por variante.

Comandos ffmpeg (Fase 2 executa exatamente estes):

```bash
# 1. Forward MP4 (H.264 baseline)
ffmpeg -i assets/images/hero-fundo/hero-section-fundo.mp4 \
  -c:v libx264 -profile:v baseline -level 3.1 -b:v 3M -maxrate 3.5M -bufsize 6M \
  -pix_fmt yuv420p -an -movflags +faststart \
  assets/videos/construction-timelapse.mp4

# 2. Reverse MP4 (mesma fonte, filtro reverse)
ffmpeg -i assets/images/hero-fundo/hero-section-fundo.mp4 \
  -vf reverse -c:v libx264 -profile:v baseline -level 3.1 -b:v 3M -maxrate 3.5M -bufsize 6M \
  -pix_fmt yuv420p -an -movflags +faststart \
  assets/videos/construction-timelapse-reverse.mp4

# 3. Forward WebM (VP9 fallback)
ffmpeg -i assets/images/hero-fundo/hero-section-fundo.mp4 \
  -c:v libvpx-vp9 -b:v 3M -pix_fmt yuv420p -an \
  assets/videos/construction-timelapse.webm

# 4. Reverse WebM (VP9 fallback)
ffmpeg -i assets/images/hero-fundo/hero-section-fundo.mp4 \
  -vf reverse -c:v libvpx-vp9 -b:v 3M -pix_fmt yuv420p -an \
  assets/videos/construction-timelapse-reverse.webm

# 5. Poster — último frame do forward (prédio pronto), WebP
ffmpeg -sseof -0.1 -i assets/videos/construction-timelapse.mp4 -frames:v 1 -update 1 \
  assets/images/hero-fundo/hero-timelapse-poster.png
cwebp -q 80 assets/images/hero-fundo/hero-timelapse-poster.png \
  -o assets/images/hero-fundo/hero-timelapse-poster.webp
```

Nota de ambiente: a máquina de desenvolvimento atual **não tem `ffmpeg`/`ffprobe` instalados** (verificado — `command not found`). A Fase 2 precisa instalar (`winget install Gyan.FFmpeg` ou equivalente) antes de rodar os comandos acima. Isso será registrado como pré-requisito, não como mudança de plano.

## 3. Estratégia de carregamento

- Poster (`hero-timelapse-poster.webp`, alvo <100 KB) é o `poster` do elemento `<video>` e também usado como `background-image` inline crítico — carrega imediatamente, sem bloquear LCP.
- `<video preload="auto">` começa a baixar em paralelo, mas só recebe `opacity: 1` (fade CSS) quando o evento `canplaythrough` dispara.
- O LCP da seção Hero deve ser **carregado pelo poster**, nunca pelo vídeo — vídeo é estritamente decorativo e sobreposto depois.

## 4. Estratégia de fallback (poster-only, sem vídeo)

Vídeo **não** carrega (apenas poster exibido) quando:
1. `window.matchMedia('(prefers-reduced-motion: reduce)').matches` for `true`.
2. `navigator.connection?.effectiveType` for `'2g'` ou `'slow-2g'`.
3. Largura de viewport ≤ 480px (mobile pequeno) **apenas se** o teste manual da Fase 2 mostrar stutter/custo não compensado — decisão condicional documentada em `implementation-notes.md`, não travada aqui.

## 5. Acessibilidade

- Atributos: `muted autoplay playsinline aria-hidden="true"`.
- **Sem** atributo `loop` nativo — o loop é 100% controlado via JS (troca de `src` no `ended`), pois é a abordagem de dois arquivos.
- Conteúdo acessível da seção continua sendo `.hero-content-overlay` (título, subtítulo, CTAs) — inalterado.

## 6. Localização de arquivos

```
assets/videos/construction-timelapse.mp4
assets/videos/construction-timelapse.webm
assets/videos/construction-timelapse-reverse.mp4
assets/videos/construction-timelapse-reverse.webm
assets/images/hero-fundo/hero-timelapse-poster.webp
```

A fonte bruta `assets/images/hero-fundo/hero-section-fundo.mp4` permanece no repo como arquivo de origem (não é o asset servido ao cliente) — todo o encoding de saída acima é derivado dela. Nomenclatura kebab-case, consistente com `placeholder-obra-01.webp` etc. já presentes no projeto.

## 7. Orçamento de performance

- **LCP-crítico (primeiro paint):** apenas poster, ≤100 KB.
- **Payload total do Hero (poster + 1 variante de vídeo forward, a que o browser escolher via `<source>`):** teto de **4 MB**, carregado de forma assíncrona e não bloqueante.
- **Payload combinado (forward + reverse, ambos eventualmente baixados para permitir o loop completo):** teto de **7 MB** — aceitável pois o reverse só é buscado após o forward começar a tocar (não compete pelo LCP).
- Verificação: Lighthouse local (Performance ≥ 90, LCP element = poster/imagem, não vídeo) + aba Network confirmando que as requisições de vídeo ocorrem após o primeiro paint.

## Restrições confirmadas
- Nenhuma alteração fora da seção Hero.
- Carrossel de projetos (`initCascadingSlider`) não é tocado.
- Nenhuma dependência nova além de Bootstrap 5 / GSAP já presentes — `ffmpeg`/`cwebp` são ferramentas de build local (Fase 2), não dependências de runtime do site.
- Convenção kebab-case e variáveis CSS existentes são respeitadas na Fase 2.
