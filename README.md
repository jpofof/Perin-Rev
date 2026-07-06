# Perin Construções — Site Institucional Premium

Site institucional de alto padrão para a **Perin Construções**, empresa de engenharia e arquitetura especializada em construção residencial, comercial, industrial, reformas, ampliações, gerenciamento de obras e consultoria técnica.

O projeto foi desenvolvido para transmitir engenharia, arquitetura, sofisticação, tecnologia, precisão, robustez e alto padrão — uma experiência digital premium que posiciona a Perin Construções como uma empresa capaz de executar grandes projetos.

---

## 🚀 Tecnologias

| Tecnologia | Versão | Finalidade |
|---|---|---|
| **HTML5** | — | Estrutura semântica e acessível (ARIA labels, roles, landmarks) |
| **CSS3** | — | Design System próprio com Design Tokens (`:root`) |
| **JavaScript Vanilla** | ES6+ | Engine de animações e interações (sem frameworks) |
| **GSAP** | 3.12.5 | Animações de alta performance |
| **GSAP ScrollTrigger** | 3.12.5 | Scroll reveals, scrubs, pinning |
| **Bootstrap** | 5.3.3 | Grid utilitário (uso mínimo) |
| **SwiperJS** | 11+ | **(removido)** Substituído por carrossel próprio |

> **Nota:** Lenis (smooth scroll) foi removido por conflitos de scroll. O scroll nativo com GSAP ScrollTrigger provê animações fluidas sem comprometer a usabilidade.

---

## 📁 Estrutura do Projeto

```
/
├── index.html              # Página principal (9 seções)
├── styles.css              # Design System completo (~1700 linhas)
├── script.js               # Engine de animações (~430 linhas)
├── AGENTS.md               # Instruções do agente de IA
├── CLAUDE.md               # Instruções do Claude
├── README.md               # Documentação (este arquivo)
└── index1.html             # [Referência] HTML do cascading slider original
```

---

## 🎨 Design System

### Paleta de Cores (Design Tokens)

Todas as cores no arquivo `styles.css`:

```css
:root {
    /* Tons Claros / Fundos */
    --cor-branco-gelo: #F5F5F5;           /* Texto principal */
    --cor-creme: #F7F7DF;                 /* Reserva */

    /* Tons de Verde (Destaques e Elementos) */
    --cor-verde-neon: #0CEB82;            /* Glow / gradientes */
    --cor-verde-brilhante: #3FCC5B;       /* Hover */
    --cor-verde-floresta: #2A873E;        /* Cor primária */

    /* Tons Neutros / Base e Textos */
    --cor-bege-escuro: #BDB49F;           /* Texto secundário */
    --cor-cinza-acastanhado: #857F76;     /* Texto muted */
    --cor-preto-puro: #0A0B0B;            /* Fundo principal */
}
```

### Tipografia

- **Headings:** Manrope (800, 700, 600) — pesos bold para títulos
- **Body:** Inter (400, 500) — legibilidade premium
- **Proibido:** Poppins, Roboto, Open Sans, Montserrat como principal

### Sistema Tipográfico

| Elemento | Tamanho | Peso |
|---|---|---|
| Hero | 72px (clamp) | 800 |
| Título de Seção | 56px (clamp) | 700 |
| Subtítulo | 24px | 500 |
| Texto | 18px | 400 |

---

## 📄 Seções do Site

O `index.html` contém **9 seções** estruturadas:

| # | Seção | Classe CSS | ID |
|---|---|---|---|
| 1 | **Preloader** | `.premium-preloader` | `#preloader` |
| 2 | **Navegação** | `.premium-navigation` | `#mainNav` |
| 3 | **Hero** | `.hero-architectural-scene` | `#hero` |
| 4 | **Sobre** | `.about-narrative-section` | `#about` |
| 5 | **Serviços** | `.services-interactive-module` | `#services` |
| 6 | **Processo** | `.process-journey-section` | `#process` |
| 7 | **Portfólio** | `.portfolio-gallery-section` | `#portfolio` |
| 8 | **Diferenciais** | `.differentials-showcase-section` | `#differentials` |
| 9 | **Depoimentos** | `.testimonials-section` | `#testimonials` |
| 10 | **Contato** | `.premium-contact-experience` | `#contact` |
| 11 | **Footer** | `.premium-footer` | — |

---

## 🎬 Animações e Interações

### Engine (`script.js`)

- **Preloader:** Barra de progresso animada com `setInterval`
- **Hero Particles:** 50 partículas CSS animadas com `@keyframes`
- **Hero Parallax:** Mouse tracking nas geometrias, grid e lighting (3 camadas)
- **Hero Entrance:** Timeline GSAP com rotateX 3D, y translation, opacity
- **Hero Scroll:** Scrub com scale + opacity no canvas + overlay gradient
- **Scroll Reveals:** Section titles, text, process steps (com stagger)
- **Counters:** Animações GSAP com snap para estatísticas
- **Service Interactions:** Hover com scale + rotate nos SVGs
- **Button Ripple:** Efeito ripple nos botões primários
- **Contact Form:** Floating labels com foco, submit feedback animado

### Carrossel de Portfólio (Cascading Slider)

Implementação própria com GSAP. Efeito "janela" — as imagens possuem escala fixa e os slides revelam mais ou menos área da fotografia conforme mudam de tamanho.

#### Estrutura Desktop

```
[6,5%] [13,5%] [60%] [13,5%] [6,5%]
```

5 slots com gap de 4px. Slide central ocupa 60% da largura útil.

#### Estrutura Mobile (<750px)

```
[10%] [80%] [10%]
```

3 slots visíveis. Slides extremos ficam off-screen e entram na sequência durante a navegação.

#### Comportamento

| Característica | Especificação |
|---|---|
| **Animação** | GSAP `to()` com `duration: 0.70s` |
| **Curva** | `cubic-bezier(0.40, 0.00, 0.30, 1.00)` — início ~40% mais suave que linear |
| **Navegação** | Clique nos slides, botões ← →, teclado (ArrowLeft/ArrowRight) |
| **Loop** | Circular infinito — slides off-screen participam da sequência |
| **Imagens** | Escala fixa (`width: auto; height: 100%`), centralizadas com `translate(-50%, -50%)` |
| **Overlay** | Transparente — sem escurecimento dos slides laterais |
| **Filtros** | Nenhum — sem `brightness()` ou `blur()` nos slides |
| **Texto** | Título + categoria visíveis apenas no slide ativo, com fade-in/out |
| **Touch** | Feedback visual (`touch-active`) durante a transição, removido automaticamente ao final |
| **Resize** | Handler debounced (100ms) recalcula posições sem recarregar a página |

#### Especificações Técnicas

```javascript
// Proporções (PCT)
const PCT_DESKTOP = [0.065, 0.135, 0.60, 0.135, 0.065];  // 5 slots
const PCT_MOBILE  = [0.10, 0.80, 0.10];                     // 3 slots (≤750px)

// Animação
const DURATION = 0.70;  // segundos
const CURVE = 'cubic-bezier(0.40, 0.00, 0.30, 1.00)';

// Altura
ch = isMobile() ? Math.min(window.innerHeight * 0.45, 340) : 420;  // px
```

#### Regras de Imagem (CSS)

```css
.cascading-slide-image img {
    width: auto;           /* escala fixa — NUNCA 100% */
    height: 100%;          /* mesma altura em todos os slides */
    max-width: none;
    object-fit: cover;
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);  /* centralizado */
}
```

A largura em pixels é definida via JS (`fixedImgWidth`) baseada no slide central (60% desktop / 80% mobile), garantindo que a imagem nunca mude de escala durante a navegação — o slide funciona como uma janela que revela mais ou menos área da fotografia.
</replace_in_file>

---

## 🧩 Nomenclatura

### Convenção de classes (kebab-case)

Todas as classes CSS seguem o padrão **kebab-case** para fácil edição:

```css
.hero-architectural-scene    /* ✅ correto */
.service-mosaic-item         /* ✅ correto */
.form-floating-input         /* ✅ correto */
```

IDs seguem **camelCase** para referência no JavaScript:

```javascript
document.getElementById('cascadingSliderList')  // ✅ correto
```

### Nomes proibidos

`section1`, `card1`, `box1`, `wrapper1`, `container1`, `item1`, `temp`, `test`

---

## 🎯 Personalização

### Cores
Edite o bloco `:root` no início do `styles.css`.

### Conteúdo
Substitua os placeholders `[Inserir ...]` no `index.html` pelos dados reais da empresa:
- Apresentação, missão, visão, valores, diferenciais
- Imagens reais no portfólio e sobre
- Depoimentos reais de clientes
- Email oficial, telefone, endereço
- Estatísticas (projetos realizados, anos de experiência)
- Slogan da empresa

### Carrossel (Portfólio)
No `script.js`, função `initCascadingSlider()`:
- `slideHeight`, `centerWidth`, `sideWidth`, `gap` — dimensões dos slides
- `opacityVal` — opacidade por distância do centro
- `transitionDelay` — delay do texto ao entrar no centro (0.4s)

---

## 🖥️ Responsividade

| Breakpoint | Largura | Ajustes principais |
|---|---|---|
| **Desktop** | >1200px | Layout completo |
| **Tablet** | ≤1024px | Grid 2 colunas em about/valores/diferenciais |
| **Mobile** | ≤768px | Menu hamburger, seções empilhadas, padding reduzido |
| **Small** | ≤480px | Botões full-width, fonte menor no menu mobile |

---

## 📐 Checklist de Qualidade

- [x] HTML semântico com ARIA labels
- [x] Design responsivo (4 breakpoints)
- [x] Animações com GSAP + ScrollTrigger
- [x] Navegação mobile com menu overlay
- [x] Formulário com floating labels e validação visual
- [x] Carrossel de portfólio customizado (cascading slider)
- [x] Placeholders para dados reais (sem invenção)
- [x] Zero dependências de servidor (100% estático)
- [x] Design System com Design Tokens (`:root`)
- [x] Nomenclatura semântica kebab-case
- [x] SEO (meta tags, Open Graph, canonical)
- [x] Performance (lazy-ready, CDNs com versões pinadas)

---

## 🧪 Testes Automatizados

O projeto possui uma suíte completa de testes unitários e de regressão para o carrossel de portfólio, garantindo que futuras alterações não introduzam regressões visuais ou funcionais.

### Estrutura

```
tests/
├── unit/
│   └── slider.test.js            # 35 testes unitários
└── regression/
    └── slider.regression.test.js  # 56 testes de regressão
```

### O que cada suíte testa

| Suíte | Tipo | Cobertura |
|---|---|---|
| **unit** | Lógica isolada | Proporções PCT, cálculo `getSizes()`, estrutura DOM, regras CSS, detecção de touch, acessibilidade, assets de imagem |
| **regression** | Integridade estrutural | Escala de imagens, overlay, estados de botões, breakpoints responsivos, camadas z-index, overflow, script integrity |

### Como instalar e executar

```bash
# Instalar dependências (apenas na primeira vez)
npm install

# Executar todos os testes
npm test

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de regressão
npm run test:regression
```

### Resultado esperado

```
Test Suites: 2 passed, 2 total
Tests:       91 passed, 91 total
```

### O que os testes garantem

| Regra de Negócio | Teste |
|---|---|
| Proporções 6.5% / 13.5% / 60% / 13.5% / 6.5% | ✅ |
| Proporções mobile 10% / 80% / 10% | ✅ |
| Imagens com escala fixa (sem zoom) | ✅ |
| Overlay transparente (sem escurecimento) | ✅ |
| Sem filtro brightness/blur | ✅ |
| Botões sem :hover CSS (gerenciado por JS) | ✅ |
| Touch feedback auto-limpa | ✅ |
| Breakpoints 750px e 480px | ✅ |
| Estrutura DOM (5 slides, imagens, SVG) | ✅ |
| Acessibilidade (ARIA labels) | ✅ |
| Script integrity (PCT, CURVE, DURATION, funções) | ✅ |

---

## ▶️ Como usar

Apenas abra o arquivo `index.html` em qualquer navegador moderno:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Nenhum servidor, build ou instalação de dependências é necessária.

---

## 📝 Histórico de Mudanças

| Data | Mudança | Arquivos |
|---|---|---|
| 09/06/2026 | Criação inicial do projeto | HTML, CSS, JS |
| 09/06/2026 | Substituição da paleta de cores | `styles.css` |
| 09/06/2026 | Renomeação para kebab-case | HTML, CSS, JS |
| 09/06/2026 | Remoção do Lenis (scroll conflitante) | `index.html`, `script.js` |
| 09/06/2026 | Substituição do Swiper por Cascading Slider | HTML, CSS, JS |
| 09/06/2026 | Ajustes de layout (gap, altura, largura) | `script.js` |
| 09/06/2026 | Transição mais lenta (1.2s) | `script.js` |
| 09/06/2026 | Texto apenas no slide central com fade | HTML, CSS, JS |
| 09/06/2026 | Delay do texto reduzido (0.7s → 0.4s) | `script.js` |
| 09/06/2026 | Documentação atualizada | `README.md` |
| 10/06/2026 | Substituição do select nativo por dropdown customizado no formulário de contato, com ícones SVG por tipo de serviço, estilos com a paleta verde do site e navegação por teclado | `index.html`, `styles.css`, `script.js` |
| 25/06/2026 | Ajustes no carrossel automático de clientes: cards ~13% maiores (215×152px), proporção menos alongada (~1.41:1), velocidade do autoplay aumentada (2.8 px/frame), inércia mais forte (FRICTION 0.95, DRAG_FACTOR 1.05, MAX_SPEED 22), direção inicial ← ← ← (direita para esquerda, baseSpeed=-2.8), definição JS das variáveis CSS `--slide-w`/`--slide-h` | `styles.css`, `script.js` |
| 30/06/2026 | Reformulação completa da seção Portfólio: nova arquitetura dual Galeria + Visualizador com transição contínua. Galeria com grid responsivo 3/2/1 colunas, cards padronizados 16:10 com hover elegante (overlay gradiente, botão "Ver Projeto" animado). Carrossel premium extraído para engine reutilizável `createCascadingSlider()`. Transição cinematográfica: expansão contínua do card clicado até ocupar área do visualizador, foto de capa se transforma no primeiro slide sem trocar de imagem. Retorno com animação reversa e restauração exata do scroll. Dados dos projetos movidos para array `portfolioProjects` com 6 projetos. Testes atualizados para nova arquitetura (107 testes passando) | `index.html`, `styles.css`, `script.js`, `tests/unit/slider.test.js`, `tests/regression/slider.regression.test.js` |
| 30/06/2026 | Reimplementação da transição como Shared Element Transition: eliminados clones (`expandCard`/`shrinkCard`), o card é o protagonista único durante toda a animação. Timeline única orquestra todas as fases — outros cards perdem destaque gradualmente, card expande continuamente, slides nascem ao redor, títulos e setas aparecem sequencialmente. Fechamento é o reverso exato da abertura. Viewer nunca usa `display:none` — transição por `opacity`/`pointer-events`. Nenhum frame vazio entre estados. 107 testes passando | `script.js`, `styles.css` |
| 30/06/2026 | Refinamento da animação para continuidade orgânica: easing unificado (`cubic-bezier(0.55, 0, 0.15, 1)`) com início suave e desaceleração fluida. Todas as fases se sobrepõem naturalmente — nada começa após o término da anterior. Outros cards e galeria compartilham o mesmo timing do movimento mestre (expansão/contração do card). Fechamento implementado como espelho exato da abertura. Timeline de abertura: ~0.76s. Timeline de fechamento: ~0.62s. 107 testes passando | `script.js` |
| 30/06/2026 | Reimplementação conceitual completa da transição como Shared Element Transformation: slider pré-populado e pré-posicionado invisível antes da animação começar. Card é o protagonista perpétuo — nunca desaparece durante a expansão. Slides nascem ao redor do card a 70% da expansão. Carrossel já está montado e posicionado desde o frame 0, apenas invisível. Easing físico: `cubic-bezier(0.25, 0.10, 0.10, 1.00)` — início muito lento, meio acelerado, desaceleração longa e suave. Fechamento literalmente o vídeo ao contrário. Nenhum `display:none` durante a animação. Card só é escondido após slides visíveis (merge natural). 107 testes passando | `script.js` |
| 30/06/2026 | Transição premium nível Awwwards: master curve única `cubic-bezier(0.25, 0.46, 0.45, 0.94)` para todos os movimentos. Card nunca é substituído — o slide 0 do carrossel É o próprio card (placeholder crossfade). Slides laterais entram com `blur(4px)→0` + `opacity`, sensação cinematográfica. Outros cards recuam com stagger por distância. Fechamento com destruição em ordem reversa: botões → títulos → slides com blur → card reemerge → shrink → galeria retorna com stagger por proximidade. Curva idêntica em ambas direções. 107 testes passando | `script.js` |
| 01/07/2026 | Refatoração completa da arquitetura do portfólio: criado `.portfolio-stage` como palco único com `position:relative`. Gallery e viewer são camadas sobrepostas (`position:absolute; inset:0`). 107 testes passando | `index.html`, `styles.css`, `script.js` |
| 01/07/2026 | Transição surface-slide (referência eduardbodak.com): viewer desliza de baixo como nova superfície (`translateY 100%→0`, 800ms, `cubic-bezier(0.25,0.46,0.45,0.94)`). Conteúdo interno aparece sequencialmente só após 80% da superfície posicionada: título (-12px→0, 200ms) → subtítulo (+60ms) → botão voltar (+120ms, fade) → setas carrossel (+150ms, scale 0.95→1) → slides laterais (+180ms, translateX ±30→0) → conteúdo slide ativo (+220ms, fade leve). Fechamento é reverso exato: conteúdo desaparece → superfície desce (0→100%). Gallery fade atrás. Carrossel e GSAP do slider não foram alterados. 107 testes passando | `script.js` |
| 01/07/2026 | Correção de bugs da transição surface-slide: viewer invisível (opacity nunca setada para 1) e falta de profundidade (galeria sumia em vez de escurecer atrás). Adicionado overlay `.portfolio-gallery-dim` interno à galeria com animação de `transparent` → `rgba(0,0,0,0.30)` durante a subida do viewer. CSS `.staged` não zera mais opacity/visibility da galeria — ela permanece visível atrás com o overlay de escurecimento. Timeline openProject garante estado final: `gsap.set(viewer, { opacity:1, visibility:visible, y:'0%', pointerEvents:'auto' })` no `onComplete`. Gallery só some (visibility:hidden) após animação completa. Fechamento: overlay clareia de volta, galeria reaparece atrás do viewer durante a descida. z-index do viewer ajustado para 3 (acima do dim z-index:2). 107 testes passando | `index.html`, `styles.css`, `script.js` |
| 01/07/2026 | Transição "curtain" (cortina editorial): substitui surface-slide. Nova abordagem conceitual — uma cortina com fundo bege (`var(--color-bg-secondary)`) cobre toda a seção (`y:100%→0%`, 550ms, `cubic-bezier(0.55,0.06,0.35,0.94)`) com leve escurecimento (`rgba(0,0,0,0)→rgba(0,0,0,0.22)`). No ponto médio (totalmente coberto), swap silencioso via `tl.call()`: gallery desmonta e viewer monta atrás da cortina. Depois cortina revela (`y:0%→-100%`, 550ms) enquanto escurecimento reduz. Conteúdo do viewer (título, subtítulo, botão voltar, setas, slides) aparece em stagger somente após cortina sair completamente. Fechamento é reverso exato: cortina desce cobrindo, destrói viewer atrás, restaura gallery, cortina revela gallery. Em nenhum momento gallery e viewer são visíveis simultaneamente. `.portfolio-stage` ganha `overflow:hidden` para clipar a cortina. 107 testes passando | `index.html`, `styles.css`, `script.js` |
| 01/07/2026 | Transição "viewport": substitui curtain. O viewer é a nova viewport — fundo bege (`var(--color-bg-secondary)`) cobre a seção ao deslizar de baixo (`y:100%→0%`, 850ms, `cubic-bezier(0.25,0.46,0.45,0.94)`). Galeria antiga apenas escurece (`opacity:1→0.3`) sem mover — fica para trás como segundo plano. Carrossel montado imediatamente (atrás da viewport). Conteúdo (título 20px→0, subtítulo, botão voltar, setas, slides laterais) aparece em stagger só após viewport terminar de entrar. Fechamento: conteúdo some → viewer desce → galeria clareia → cards voltam. Nenhuma cortina extra — o próprio viewer funciona como superfície de transição. 107 testes passando | `index.html`, `styles.css`, `script.js` |
| 01/07/2026 | Correção de layout do viewer: reduzidos espaçamentos internos (back button `mb:28→14px`, subtitle `mb:32→18px`, nav `mt:48→30px`). Carrossel centralizado visualmente na seção. 107 testes passando | `styles.css` |
| 01/07/2026 | **Bugfix crítico**: viewer fechava automaticamente ~1s após abrir. Causa: `stage.style.minHeight=''` no `onComplete` do `openProject` colapsava o stage (altura 0) porque gallery (`.staged`) e viewer são `position:absolute` (fora do fluxo). Com `overflow:hidden` no stage, viewer com `inset:0` ficava com altura 0 e todo conteúdo desaparecia. Correção: removido `minHeight=''` do `onComplete` — minHeight travado mantém a altura. `minHeight` só é liberado no `onComplete` do `closeProject` (quando gallery volta ao fluxo normal e stage retorna altura natural do grid). 107 testes passando | `script.js` |
| 02/07/2026 | **Bugfix definitivo**: botões de navegação (← →) do carrossel no viewer não apareciam. Causa dupla: (1) `inset:0` no CSS do viewer incluía `bottom:0`, prendendo-o à altura do stage (~500px) e cortando o nav (82px abaixo do slider de 420px); (2) `overflow:hidden` na `.portfolio-gallery-section` (seção pai) também clipava o nav. Solução: (A) CSS — viewer usa `top/left/right` sem `bottom`, com `min-height:100%` para crescer com o conteúdo; removido `overflow:hidden` da section pai. (B) JS — `requestAnimationFrame` no `onComplete` de `openProject` libera `viewer.style.bottom='auto'` e `stage.style.overflow='visible'` após GSAP finalizar estilos. No `closeProject`: restaura `overflow:hidden` no início e limpa `bottom`/`overflow` no `onComplete`. Nenhuma animação ou carrossel foi alterado. 107 testes passando | `styles.css`, `script.js` |
| 06/07/2026 | **Integração Netlify Forms**: adicionados atributos `data-netlify="true"`, `method="POST"`, `name="contato"`, campo hidden `form-name` ao formulário de contato. Substituído mock `submitToAPI` por `fetch()` real para `/` com `Content-Type: application/x-www-form-urlencoded`, `URLSearchParams` e campo `form-name` no payload. Honeypot mantido como anti-spam adicional ao Netlify. 107 testes passando | `index.html`, `script.js` |

---

## 📌 Observabilidade (Logs)

- Não há `console.log` no código de produção (apenas logs de diagnóstico e submissão do formulário)
- O formulário de contato envia dados para o Netlify Forms via `POST` com `Content-Type: application/x-www-form-urlencoded`
- Nenhuma PII (informação pessoal) é coletada ou processada além do que o usuário preenche no formulário

---

© 2026 Perin Construções. Todos os direitos reservados.