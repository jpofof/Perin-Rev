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

---

## 📌 Observabilidade (Logs)

- Não há `console.log` no código de produção
- O formulário de contato não envia dados reais (apenas feedback visual)
- Nenhuma PII (informação pessoal) é coletada ou processada

---

© 2026 Perin Construções. Todos os direitos reservados.