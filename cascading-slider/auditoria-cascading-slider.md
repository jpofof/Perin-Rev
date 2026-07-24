# Auditoria completa — Componente "Cascading Slider"
**Projeto:** modusprojects_nl-over-ons
**Arquivo analisado:** `index.html` (único arquivo HTML do export) + `styles/*.css` + `scripts/*.js`

## Observação geral (importante)

O "Cascading Slider" **não é um componente modular** com arquivos próprios. Ele é um *Embed* de código customizado do Webflow: toda a estrutura HTML, o CSS específico do slider e o JavaScript que o anima estão **embutidos diretamente dentro do `index.html`**, em três blocos consecutivos:

| Bloco | Linhas em `index.html` | Conteúdo |
|---|---|---|
| Markup | linha 1082 (tudo em uma única linha longa) | `<div data-cascading-slider-wrap>` completo |
| `<style>` embutido | linhas 1084–1123 | CSS específico do slider (fica dentro de uma `<div class="w-embed">`) |
| `<script defer>` embutido | linhas 1127–1350 | função `initCascadingSlider()` |

Além disso, algumas classes visuais do slider (`.cascading-slider`, `.cascading-slider__*`) estão **duplicadas/compiladas** no arquivo CSS externo minificado:
`styles/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.23cdafd36.opt.min.css` (arquivo inteiro em 1 única linha).

Não foi encontrada nenhuma ocorrência de "cascading" em nenhum arquivo `.js` da pasta `scripts/` (gsap.min.js, ScrollTrigger.min.js, Draggable.min.js, Observer.min.js, SplitText.min.js, CustomEase.min.js, webflow*.js, jquery*.js, lenis.min.js, ping.js, pa-*.js) nem no CSS `styles/modus-projects-6db04b.webflow.shared.5f83cd4d4.min.css`. Todo o código funcional do slider está no `index.html`.

---

# 1. HTML

## 1.1 Classes (`class=""`)

| Classe | Onde aparece | Motivo |
|---|---|---|
| `cascading-slider` | div raiz do componente | Container principal, define `max-width: 90em` e centraliza o slider |
| `cascading-slider__collection` | div que envolve a lista (`w-dyn-list`) | Wrapper de coleção (largura 100%) |
| `cascading-slider__list` | div com `data-cascading-viewport` | O "viewport" visível do slider (altura fixa 35em, overflow hidden) |
| `cascading-slider__item` | cada slide (`data-cascading-slide`) | O slide individual — posicionado via `position:absolute` e animado por GSAP |
| `cascading-slider__item-inner` | dentro de cada item | Contém a imagem de fundo e o texto |
| `cascading-slider__item-bg` | dentro de `item-inner` | Camada de fundo posicionada em `inset:0%` |
| `cascading-slider__img` | tag `<img>` de cada slide | Imagem do slide, `object-fit:cover` |
| `cascading-slider__item-content` | dentro de `item-inner` | Contém título e subtítulo, com gradiente escuro por cima da imagem |
| `cascading-slider__h` | `<h3>` do título de cada slide | Título que aparece/desaparece conforme o slide fica ativo |
| `margin-none` | `<p>` do subtítulo | Classe utilitária global (remove margens) |
| `cascading-slider__nav` | `<nav>` de navegação | Container dos botões prev/next |
| `cascading-slider__button` | cada `<button>` | Botão circular de navegação (hover/active) |
| `cascading-slider__button-arrow` | `<svg>` dentro do botão | Ícone de seta |
| `cascading-slider__button-arrow is--prev` | `<svg>` do botão "anterior" | Modificador que rotaciona a seta em 180° |
| `w-dyn-list`, `w-dyn-items`, `w-dyn-item` | listas/itens | Classes de binding de CMS do Webflow (sem CSS próprio específico do slider) |
| `hide`, `w-embed`, `w-script` | divs que envolvem `<style>`/`<script>` | Classes do Webflow para ocultar/isolar código customizado embutido |

## 1.2 IDs (`id=""`)

**Nenhum `id` é utilizado em nenhum elemento do Cascading Slider.** Toda a seleção é feita por classes e, principalmente, por atributos `data-*` (ver 1.3), o que permite múltiplas instâncias do slider na mesma página sem conflito de IDs.

## 1.3 Atributos `data-*`

| Atributo | Onde | Motivo/Função |
|---|---|---|
| `data-cascading-slider-wrap=""` | div raiz `.cascading-slider` | Marca o wrapper de cada instância do slider. É o seletor usado pelo JS para inicializar (`document.querySelectorAll('[data-cascading-slider-wrap]')`) |
| `data-cascading-viewport=""` | div `.cascading-slider__list` | Marca a área "viewport" onde os slides vivem. Usado para ler `--gap` e para clonar/inserir slides |
| `data-cascading-slide=""` | cada `.cascading-slider__item` | Marca cada slide individual. Selecionado via `querySelectorAll('[data-cascading-slide]')` |
| `data-status="active"` / `data-status="inactive"` | cada slide | Estado atual do slide, escrito **pelo JS** (`slide.setAttribute('data-status', ...)`) e lido pelo CSS embutido para animar o título (`transition-delay`, `opacity`) |
| `data-clone=""` | slides duplicados | Marca os slides clonados dinamicamente pelo JS quando há menos de 9 slides originais (evita confundi-los com os originais, embora não seja usado para lógica adicional além de identificação) |
| `data-cascading-slider-prev=""` | botão "anterior" | Seletor usado pelo JS para o botão de retroceder |
| `data-cascading-slider-next=""` | botão "próximo" | Seletor usado pelo JS para o botão de avançar |

Além destes (não são `data-*`, mas fazem parte da estrutura/acessibilidade): `aria-label="Featured content"`, `aria-roledescription="carousel"` (no wrap), `role="list"` / `role="listitem"`, `aria-roledescription="slide"`, `aria-label="slider navigation"` (na `<nav>`), `aria-label="previous slide"` / `"next slide"` (nos botões).

## 1.4 Estrutura HTML completa do slider

O componente tem **6 slides originais** (vindos de uma CMS List do Webflow — `w-dyn-list`/`w-dyn-item`) e o JavaScript **clona esse conjunto inteiro mais uma vez** (6 clones, com `data-clone=""`) para garantir um mínimo de 9 itens — no total ficam **12 itens** em tela (a lógica de clonagem está na seção 3). Abaixo está a estrutura completa e literal (wrapper, primeiro slide original na íntegra, e a `<nav>` completa). Os demais 5 slides originais e os 6 clones seguem **exatamente o mesmo padrão de marcação**, mudando apenas `src` da imagem, o texto do `<h3>`/`<p>` e os valores inline de `style` (`width`, `z-index`, `--clip`, `transform`) que o GSAP escreve a cada frame:

```html
<div aria-label="Featured content" aria-roledescription="carousel" class="cascading-slider" data-cascading-slider-wrap="">
  <div class="cascading-slider__collection w-dyn-list">
    <div class="cascading-slider__list w-dyn-items" data-cascading-viewport="" role="list">

      <!-- Slide original (repete 6x, um por item da CMS List) -->
      <div aria-roledescription="slide"
           class="cascading-slider__item w-dyn-item"
           data-cascading-slide=""
           data-status="inactive"
           role="listitem"
           style="width: 777.6px; translate: none; rotate: none; scale: none; z-index: 8; --clip: 350.44; transform: translate(-350.44px, 0px);">
        <div class="cascading-slider__item-inner">
          <div class="cascading-slider__item-bg">
            <img alt="" class="cascading-slider__img" draggable="false" loading="eager"
                 src="https://cdn.prod.website-files.com/.../Silo%20Amerika.jpg">
          </div>
          <div class="cascading-slider__item-content">
            <h3 class="cascading-slider__h">Silo Amerika</h3>
            <p class="margin-none">Rotterdam</p>
          </div>
        </div>
      </div>

      <!-- ... mais 5 slides originais idênticos em estrutura ... -->

      <!-- Slide clonado pelo JS (repete 6x, cópia exata do original + data-clone) -->
      <div aria-roledescription="slide"
           class="cascading-slider__item w-dyn-item"
           data-cascading-slide=""
           data-clone=""
           data-status="inactive"
           role="listitem"
           style="width: 777.6px; translate: none; rotate: none; scale: none; z-index: 7; --clip: 350.44; transform: translate(952.56px, 0px);">
        <div class="cascading-slider__item-inner">
          <div class="cascading-slider__item-bg">
            <img alt="" class="cascading-slider__img" draggable="false" loading="eager"
                 src="https://cdn.prod.website-files.com/.../Silo%20Amerika.jpg">
          </div>
          <div class="cascading-slider__item-content">
            <h3 class="cascading-slider__h">Silo Amerika</h3>
            <p class="margin-none">Rotterdam</p>
          </div>
        </div>
      </div>

      <!-- ... mais 5 clones idênticos em estrutura ... -->

    </div>
  </div>

  <nav aria-label="slider navigation" class="cascading-slider__nav">
    <button aria-label="previous slide" class="cascading-slider__button" data-cascading-slider-prev="">
      <svg class="cascading-slider__button-arrow is--prev" fill="none" viewBox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 19L21 12L14 5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path>
        <path d="M21 12H2" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path>
      </svg>
    </button>
    <button aria-label="next slide" class="cascading-slider__button" data-cascading-slider-next="">
      <svg class="cascading-slider__button-arrow" fill="none" viewBox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 19L21 12L14 5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path>
        <path d="M21 12H2" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path>
      </svg>
    </button>
  </nav>
</div>
```

**Motivo:** essa é toda a árvore DOM do componente. Note que os valores de `style` inline (`width`, `z-index`, `--clip`, `transform`) **não fazem parte do markup "de fábrica"** — eles são escritos pelo GSAP em tempo de execução (`gsap.set`/`gsap.to`); ao copiar o componente para outro projeto, esses valores inline podem ser descartados, pois o próprio script os recalcula na inicialização (`measure()` + `layout(false)`).

---

# 2. CSS

## 2.1 Seletores no arquivo externo `styles/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.23cdafd36.opt.min.css`

*(arquivo inteiro minificado em uma única linha — "linha 1")*

**Arquivo:**
```
styles/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.23cdafd36.opt.min.css
```
**Linha:** 1 (arquivo minificado)

**Código encontrado:**
```css
.cascading-slider{width:100%;max-width:90em;margin-left:auto;margin-right:auto;position:relative}
.cascading-slider__collection{width:100%}
.cascading-slider__list{width:100%;height:35em;position:relative;overflow:hidden}
.cascading-slider__item{color:#fff;cursor:pointer;will-change:transform,clip-path;height:100%;clip-path:inset(0px calc(var(--clip)*1px)round var(--radius));-webkit-user-select:none;user-select:none;position:absolute;inset:0% auto auto 0%}
.cascading-slider__item-inner{width:100%;height:100%;position:relative;overflow:hidden}
.cascading-slider__item-bg{z-index:0;position:absolute;inset:0%}
.cascading-slider__item-content{z-index:2;padding:var(--_sizing---5xl) var(--_sizing---l) var(--_sizing---l);background-image:linear-gradient(#0000,#0009 72%);position:absolute;inset:auto 0% 0%}
.cascading-slider__img{object-fit:cover;width:100%;height:100%;position:absolute;inset:0%}
.cascading-slider__h{opacity:0;text-transform:uppercase;margin-top:0;margin-bottom:0;font-family:Jubilee Silver,Georgia,sans-serif;font-size:2.5rem;font-weight:400;line-height:1;transition:all .3s cubic-bezier(.645,.045,.355,1);transform:translateY(.25em)}
.cascading-slider__nav{margin-top:var(--_sizing---1xl);grid-column-gap:var(--_sizing---s);grid-row-gap:var(--_sizing---s);flex-flow:row;justify-content:center;align-items:center;margin-left:auto;margin-right:auto;display:flex;position:relative}
.cascading-slider__button{width:var(--_sizing---2xl);height:var(--_sizing---2xl);padding:var(--_sizing---s);border-radius:var(--_sizing---3xs);outline-color:var(--_colors---transparent);outline-offset:0px;color:var(--_colors---white);background-color:#ffffff1a;outline-width:1px;outline-style:solid;justify-content:center;align-items:center;transition:all .3s;display:flex}
.cascading-slider__button:hover{background-color:var(--_colors---orange)}
.cascading-slider__button:active{outline-color:var(--_colors---orange);outline-offset:1px;outline-width:1px;outline-style:solid;transform:scale(.9)}
.cascading-slider__button-arrow.is--prev{transform:rotate(-180deg)}
```

**Motivo:** define toda a aparência "estática" do slider (dimensões, posicionamento absoluto de camadas, cor, tipografia do título, gradiente sobre a imagem, aparência dos botões e seus estados `:hover`/`:active`).

## 2.2 Estilos embutidos no `index.html` (dentro de `<div class="w-embed"><style>...`)

**Arquivo:** `index.html` — **Linhas:** 1084–1123

```css
[data-cascading-viewport] {
  --gap: 0.5em;
}

[data-cascading-slide] {
  --clip: 0;
  --radius: 0.25rem;
}

[data-cascading-slide][data-status="active"] {
  cursor: default;
}

[data-cascading-slide] .cascading-slider__h {
  transition-delay: 0ms;
}

[data-cascading-slide][data-status="active"] .cascading-slider__h {
  transition-delay: 400ms;
  opacity: 1;
  transform: translate(0px, 0em);
}

.wf-design-mode [data-cascading-viewport] {
  display: flex;
  flex-direction: row;
  gap: 1em;
  overflow: auto;
}

.wf-design-mode [data-cascading-slide] {
  position: relative;
  width: 60%;
  flex: 0 0 auto;
}

.wf-design-mode .cascading-slider__h {
  opacity: 1;
  transform: translate(0px, 0em);
}
```

**Motivo:** este bloco é **essencial** e fica separado do CSS externo porque define os **valores padrão das variáveis CSS** (`--gap`, `--clip`, `--radius`) via seletores de atributo (`[data-cascading-slide]`), controla o `cursor` do slide ativo, e controla a transição de opacidade/posição do título (`cascading-slider__h`) conforme `data-status` muda (valor que é escrito pelo JS). Também contém regras exclusivas do **modo de design do Webflow** (`.wf-design-mode`), que servem apenas para pré-visualização dentro do editor Webflow e **podem ser descartadas** ao portar o componente para fora do Webflow.

## 2.3 Pseudo-classes / pseudo-elementos

| Seletor | Arquivo | Motivo |
|---|---|---|
| `.cascading-slider__button:hover` | CSS externo (2.1) | Muda a cor de fundo do botão para laranja no hover |
| `.cascading-slider__button:active` | CSS externo (2.1) | Aplica um "outline" laranja e um leve `scale(.9)` ao clicar |

Nenhum `::before`/`::after` é usado especificamente pelo slider (o `.w-embed:before/:after` encontrado no CSS compartilhado é um clearfix genérico do Webflow, não exclusivo do slider — ver seção 4).

## 2.4 Media queries que alteram o slider

**Arquivo:** `styles/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.23cdafd36.opt.min.css` — dentro do bloco `@media screen and (max-width:991px)`

```css
.cascading-slider__h{font-size:2rem}
.cascading-slider__item-content{padding-right:var(--_sizing---s);padding-left:var(--_sizing---s)}
```

**Motivo:** em telas ≤991px, reduz o tamanho do título e o padding lateral do conteúdo do slide. **Importante:** o comportamento responsivo *principal* do slider (larguras do slide ativo/vizinhos/distantes) não é feito por media query, e sim pelo objeto `breakpoints` dentro do JavaScript (seção 3.6) — o CSS só ajusta detalhes tipográficos/espaçamento.

## 2.5 Variáveis CSS utilizadas (`--...`)

**Variáveis próprias do componente** (definidas nos seletores de atributo, seção 2.2, e manipuladas pelo JS):

| Variável | Definida em | Usada em | Função |
|---|---|---|---|
| `--gap` | `[data-cascading-viewport]` (index.html, linha 1085) | lida por `readGap()` no JS | espaçamento entre slides, usado para calcular larguras |
| `--clip` | `[data-cascading-slide]` (index.html, linha 1089) e sobrescrita inline pelo GSAP | `.cascading-slider__item{clip-path:inset(0px calc(var(--clip)*1px) round var(--radius))}` | quantidade de "corte" lateral de cada slide (efeito de cascata) |
| `--radius` | `[data-cascading-slide]` (index.html, linha 1090) | mesma regra de `clip-path` acima | raio do arredondamento do `clip-path` |

**Variáveis globais (design tokens) herdadas de `:root`**, usadas pelas regras do slider no CSS externo:

`--_sizing---1xl`, `--_sizing---2xl`, `--_sizing---3xs`, `--_sizing---5xl`, `--_sizing---l`, `--_sizing---s`, `--_colors---transparent`, `--_colors---white`, `--_colors---orange`

**Motivo:** essas variáveis não pertencem ao slider, mas são **pré-requisito** — sem elas definidas em `:root`, o CSS do slider quebra (paddings, larguras de botão e cores ficam `unset`).

---

# 3. JavaScript

Todo o código está embutido em `index.html`, dentro de `<div class="hide w-embed w-script"><script defer="">` (linhas 1125–1352).

## 3.1 Funções

| Função | Linha | Escopo | Responsabilidade |
|---|---|---|---|
| `initCascadingSlider()` | 1127 | global (chamada no `DOMContentLoaded`) | Ponto de entrada: busca todos os wrappers e inicializa cada um |
| `setupInstance(wrapper)` | 1142 | interna a `initCascadingSlider` | Configura uma instância do slider (um `wrapper` por vez); contém todas as demais funções e o estado da instância |
| `readGap()` | 1170 | interna a `setupInstance` | Lê o valor computado da variável CSS `--gap` e o converte para pixels |
| `getSettings()` | 1183 | interna a `setupInstance` | Retorna o breakpoint ativo de acordo com `window.innerWidth` |
| `getOffset(slideIndex, fromIndex)` | 1191 | interna a `setupInstance` | Calcula a distância circular entre um slide e o slide ativo (considerando o "wrap-around" da lista) |
| `measure()` | 1200 | interna a `setupInstance` | Calcula larguras de cada "slot" visível (ativo, vizinhos, distantes) e aplica a largura a todos os slides |
| `getSlideProps(offset)` | 1236 | interna a `setupInstance` | Retorna `{x, '--clip', zIndex}` para um dado offset (posição relativa ao slide ativo) |
| `layout(animate, previousIndex)` | 1249 | interna a `setupInstance` | Aplica (com ou sem animação GSAP) a posição/estado de todos os slides |
| `goTo(targetIndex)` | 1287 | interna a `setupInstance` | Troca o slide ativo, decide direção da animação e chama `layout(true, ...)` |

## 3.2 Variáveis

| Variável | Linha | Tipo | Função |
|---|---|---|---|
| `duration` | 1129 | `const` (escopo de `initCascadingSlider`) | Duração das animações GSAP (0.65s) |
| `ease` | 1130 | `const` | Easing das animações (`power3.inOut`) |
| `breakpoints` | 1132–1137 | `const` (array de objetos) | Tabela responsiva de larguras do slide ativo/vizinho por breakpoint |
| `wrappers` | 1139 | `const` (NodeList) | Todos os elementos `[data-cascading-slider-wrap]` da página |
| `viewport` | 1143 | `const` (por instância) | Elemento `[data-cascading-viewport]` |
| `prevButton` / `nextButton` | 1144–1145 | `const` (por instância) | Botões de navegação |
| `slides` | 1146 | `let`/array (por instância) | Lista de elementos `[data-cascading-slide]` (recebe os clones depois) |
| `totalSlides` | 1147 | `let` | Quantidade atual de slides (recalculada após clonagem) |
| `originalSlides` | 1152 | `const` (dentro do `if`) | Cópia da lista original de slides, usada como fonte para clonagem |
| `clone` | 1155 | `const` (dentro do `forEach`) | Nó clonado de um slide original |
| `activeIndex` | 1164 | `let` | Índice do slide atualmente ativo |
| `isAnimating` | 1165 | `let` (boolean) | Trava para impedir cliques/transições simultâneas |
| `slideWidth` | 1166 | `let` | Largura (px) do slide ativo, calculada em `measure()` |
| `slotCenters` | 1167 | `let` (objeto) | Centro (px) de cada "slot" (-3 a 3) em relação ao viewport |
| `slotWidths` | 1168 | `let` (objeto) | Largura (px) de cada "slot" |
| `resizeTimer` | 1333 | `let` | Timer de debounce do evento `resize` |

## 3.3 Event listeners

| Evento | Elemento | Linha | Ação |
|---|---|---|---|
| `click` | `prevButton` | 1319 | `goTo(activeIndex - 1)` |
| `click` | `nextButton` | 1320 | `goTo(activeIndex + 1)` |
| `click` | cada `slide` (em `slides.forEach`) | 1322–1326 | `goTo(index)` se o slide clicado não for o ativo |
| `keydown` | `document` | 1328–1331 | Setas `ArrowLeft`/`ArrowRight` navegam para o slide anterior/próximo |
| `resize` | `window` | 1334–1340 | Recalcula `measure()` + `layout(false)` após 100ms de debounce |
| `DOMContentLoaded` | `document` | 1348–1350 | Dispara `initCascadingSlider()` |

## 3.4 `querySelector` / `querySelectorAll`

| Chamada | Linha | Retorna |
|---|---|---|
| `document.querySelectorAll('[data-cascading-slider-wrap]')` | 1139 | Todas as instâncias do slider na página |
| `wrapper.querySelector('[data-cascading-viewport]')` | 1143 | O viewport da instância |
| `wrapper.querySelector('[data-cascading-slider-prev]')` | 1144 | Botão "anterior" |
| `wrapper.querySelector('[data-cascading-slider-next]')` | 1145 | Botão "próximo" |
| `viewport.querySelectorAll('[data-cascading-slide]')` | 1146 (dentro de `Array.from(...)`) | Todos os slides do viewport |

## 3.5 Atributos `data-*` acessados/manipulados pelo JS

| Atributo | Linha(s) | Uso |
|---|---|---|
| `[data-cascading-slider-wrap]` | 1139 | seleção das instâncias |
| `[data-cascading-viewport]` | 1143 | seleção do viewport |
| `[data-cascading-slider-prev]` | 1144 | seleção do botão anterior |
| `[data-cascading-slider-next]` | 1145 | seleção do botão próximo |
| `[data-cascading-slide]` | 1146 | seleção dos slides |
| `data-clone` | 1156 (`clone.setAttribute('data-clone', '')`) | marca nós clonados |
| `data-status` | 1273 (`slide.setAttribute('data-status', ...)`) | escreve `"active"`/`"inactive"` em cada slide a cada `layout()` |

## 3.6 Constantes relacionadas ao slider

```js
const duration = 0.65;
const ease = 'power3.inOut';

const breakpoints = [
  { maxWidth: 479, activeWidth: 0.78, siblingWidth: 0.08 },
  { maxWidth: 767, activeWidth: 0.70, siblingWidth: 0.10 },
  { maxWidth: 991, activeWidth: 0.60, siblingWidth: 0.10 },
  { maxWidth: Infinity, activeWidth: 0.60, siblingWidth: 0.13 },
];
```
**Motivo:** controlam toda a régua de responsividade do slider (proporção de largura do slide ativo/vizinho por breakpoint) e o comportamento de animação (duração/easing), substituindo o que normalmente seria feito via media query.

---

# 4. Dependências

## 4.1 Bibliotecas externas

| Biblioteca | Arquivo local | É necessária para o slider? | Motivo |
|---|---|---|---|
| **GSAP (core)** | `scripts/gsap.min.js` (também carregado via CDN `https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js`) | **SIM, obrigatória** | O script usa diretamente `gsap.to(...)`, `gsap.set(...)` e `gsap.delayedCall(...)` (linhas 1258, 1268, 1276, 1282, 1303, 1310, 1316) |
| ScrollTrigger.min.js | `scripts/ScrollTrigger.min.js` | Não | Nunca referenciado dentro de `initCascadingSlider` |
| Draggable.min.js | `scripts/Draggable.min.js` | Não | Não referenciado (é usado pelo componente separado `draggable-marquee`, que é outro slider da página) |
| Observer.min.js | `scripts/Observer.min.js` | Não | Não referenciado |
| SplitText.min.js | `scripts/SplitText.min.js` | Não | Usado apenas pelo efeito de "split de palavras" (`gsap_split_word`) em títulos, componente diferente |
| CustomEase.min.js | `scripts/CustomEase.min.js` | Não | Não referenciado |
| jQuery (`jquery-3.5.1...js`) | `scripts/jquery-3.5.1.min.dc5e7f18c8.js` | Não | O slider usa apenas JS puro (`querySelector`, `addEventListener`), nenhum `$(...)` |
| `webflow.29b8fb7b...js` / `webflow.schunk...js` | `scripts/webflow.*.js` | Não | Runtime geral do Webflow (menus, interações, CMS); não é chamado pelo slider |
| `lenis.min.js` + `styles/lenis.css` | `scripts/lenis.min.js` | Não | Smooth-scroll da página inteira; não interage com o slider |
| `ping.js`, `pa-Sqg6vyhtWsckPaZZKPPpJ.js` | `scripts/ping.js`, `scripts/pa-...js` | Não | Analytics (Leadinfo/Plausible), sem relação |

**Observação:** no `index.html`, o `<script>` do slider é carregado com o atributo `defer`, e os `<script src="...gsap...">` ficam no final do `<body>` sem `defer`/`async` — ou seja, eles executam de forma síncrona assim que o parser os alcança, e terminam antes do evento `DOMContentLoaded` (que é quando `initCascadingSlider()` roda). Isso garante que `window.gsap` já exista quando o slider inicializa. Ao portar o componente, é preciso manter essa ordem: **GSAP core carregado antes** do script do slider ser executado.

## 4.2 Funções/variáveis auxiliares (não têm "cascading" no nome, mas são indispensáveis)

Todas as funções auxiliares do slider (`readGap`, `getSettings`, `getOffset`, `measure`, `getSlideProps`, `layout`, `goTo`) já estão listadas na seção 3.1 — nenhuma delas tem "cascading" no nome, mas todas são internas e exclusivas da função `setupInstance`, portanto **fazem parte do componente** e não podem ser omitidas.

## 4.3 Estilos globais utilizados pelo slider

| Estilo/classe global | Onde é definido | Por que o slider depende dele |
|---|---|---|
| Variáveis `:root` (`--_sizing---*`, `--_colors---*`) | topo do CSS externo (linha 1) | usadas em paddings, larguras dos botões e cores (seção 2.5) |
| `font-family: "Jubilee Silver", Georgia, sans-serif` | regra `.cascading-slider__h` (herdada do token tipográfico do projeto) | fonte do título de cada slide |
| `.margin-none{margin-top:...none;margin-bottom:...none}` | CSS externo | usada no `<p>` de subtítulo de cada slide |
| `.hide{display:none}` | CSS externo | esconde a `<div class="hide w-embed w-script">` que envolve o `<script>` do slider (sem isso, a div do script ocuparia espaço/apareceria) |
| `.w-embed:before/:after` (clearfix) | `styles/modus-projects-6db04b.webflow.shared.5f83cd4d4.min.css` | clearfix genérico do Webflow aplicado à `<div class="w-embed">` que envolve o `<style>` e o `<script>` do slider |
| `.w-dyn-list`, `.w-dyn-items`, `.w-dyn-item` | sem regras CSS próprias (apenas marcadores) | usados pelo runtime de CMS do Webflow; podem ser removidos com segurança fora do Webflow |

---

# 5. Resumo consolidado por arquivo

| Arquivo | O que contém relacionado ao slider |
|---|---|
| `index.html` (linha 1082) | Todo o markup HTML do componente (`data-cascading-slider-wrap`, slides, nav) |
| `index.html` (linhas 1084–1123) | `<style>` embutido com variáveis `--gap/--clip/--radius` e regras de transição do título |
| `index.html` (linhas 1127–1350) | `<script>` embutido com toda a lógica (`initCascadingSlider` e funções internas) |
| `styles/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.23cdafd36.opt.min.css` | Classes visuais `.cascading-slider*` (dimensões, cores, tipografia, hover/active, media query 991px) + variáveis globais `:root` das quais o slider depende |
| `styles/modus-projects-6db04b.webflow.shared.5f83cd4d4.min.css` | Apenas o clearfix genérico `.w-embed` (dependência indireta, não exclusiva do slider) |
| `scripts/gsap.min.js` | Biblioteca externa obrigatória (`gsap.to`, `gsap.set`, `gsap.delayedCall`) |

---

# Arquivos necessários para copiar o slider

Para levar o Cascading Slider para outro projeto, o mínimo indispensável é:

1. **O fragmento HTML** do componente — extraído de `index.html`, linha 1082 (a `<div data-cascading-slider-wrap>` inteira, seção 1.4). Os valores de `style` inline não precisam ser copiados (são recalculados em runtime).
2. **O bloco `<style>` embutido** — extraído de `index.html`, linhas 1084–1123 (seção 2.2). As regras `.wf-design-mode` podem ser descartadas fora do Webflow.
3. **As regras `.cascading-slider*`** do arquivo `styles/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.23cdafd36.opt.min.css` (seção 2.1), mais as variáveis globais `:root` usadas por elas (seção 2.5) e as classes utilitárias `.margin-none` e `.hide` (seção 4.3).
4. **O bloco `<script>` embutido** — extraído de `index.html`, linhas 1127–1350 (função `initCascadingSlider` completa).
5. **`scripts/gsap.min.js`** (GSAP core) — única biblioteca externa realmente necessária, carregada **antes** do script do slider.

Nenhum outro arquivo da pasta `scripts/` (`ScrollTrigger`, `Draggable`, `Observer`, `SplitText`, `CustomEase`, `jquery`, `webflow.*`, `lenis`, `ping`, `pa-*`) nem `styles/lenis.css` é necessário para o funcionamento do slider.
