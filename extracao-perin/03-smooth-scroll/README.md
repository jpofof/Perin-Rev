# 03 — Smooth scroll (Lenis)

**Importante sobre o escopo desta pasta:** o projeto Perin não está disponível neste
ambiente — tudo abaixo sobre "risco no Perin" é baseado no que você descreveu (GSAP
ScrollTrigger em uso extensivo, `overflow-anchor: none` já aplicado, histórico de saltos no
carrossel de portfólio, âncoras `#about`/`#contact`/`#portfolio`), não em código do Perin que
eu tenha inspecionado. O checklist abaixo precisa ser executado *no repositório do Perin*
antes de considerar a integração concluída — não foi (e não pôde ser) executado aqui.

## Biblioteca e carregamento

- **Lenis**, self-hosted (não via CDN) — `./scripts/lenis.min.js`, 14.242 bytes, minificado.
  Não há um header de versão explícito no arquivo minificado; uma string `1.1.20` aparece no
  bundle, compatível com essa faixa de versão do Lenis — confirmar contra o changelog oficial
  do Lenis se a versão exata importar para o Perin.
- CSS auxiliar: `styles/lenis.css` (191 bytes, ver conteúdo abaixo) — carregado via `<link>`
  antes do script.
- Carregamento: `<script src="./scripts/lenis.min.js">` seguido de um `<script>` inline que
  cria a instância. Nenhum bundler/import — é um `<script>` clássico que expõe `Lenis` no
  escopo global.

```css
/* styles/lenis.css — conteúdo integral da referência */
html.lenis, html.lenis body { height: auto }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain }
.lenis.lenis-stopped { overflow: clip }
.lenis.lenis-smooth iframe { pointer-events: none }
```

## Código de inicialização e parâmetros configurados

Ver `implementacao.js` para o trecho exato extraído. Resumo: a referência só configura
**um** parâmetro:

| Parâmetro | Valor na referência | O que faz |
|---|---|---|
| `autoRaf` | `true` | O próprio Lenis roda seu loop de `requestAnimationFrame` internamente. Simples, mas **é o primeiro ponto de atenção para integrar com ScrollTrigger** — ver abaixo. |
| `lerp` / `duration` | não definido (padrão da lib) | Controla o quão "gradual" é a suavização — quanto menor o `lerp` (ou maior a `duration`), mais inércia/atraso perceptível. A referência usa o padrão da biblioteca, não um valor calibrado ao design dela. |
| `easing` | não definido (padrão da lib) | Curva de aceleração/desaceleração do scroll suavizado. |
| `smoothWheel` / `smoothTouch` | não definido (padrão da lib) | Se o smoothing se aplica a wheel (mouse) e/ou touch. Import ante para mobile — ver seção de riscos. |

## Integrar com GSAP ScrollTrigger (a referência NÃO faz isso — o Perin precisa)

A referência não usa ScrollTrigger (GSAP core está carregado, mas o plugin ScrollTrigger
não está de fato em uso — a única ocorrência da string é um `console.log` de um loader de
scripts). Isso significa que **a integração Lenis+ScrollTrigger não pode ser copiada da
referência** — ela precisa ser feita do zero seguindo o padrão oficial do Lenis, porque é
exatamente esse ponto de integração que costuma causar os bugs de scroll que o Perin já tem
histórico de sofrer.

Padrão geral (fora da referência, documentado pelo próprio Lenis para uso com GSAP):

```js
// Desligar autoRaf e sincronizar manualmente o tick do Lenis com o ticker do GSAP,
// para que ambos concordem sobre a posição de scroll no mesmo frame:
const lenis = new Lenis({
  autoRaf: false, // diferente da referência — necessário para não haver dois loops de RAF concorrentes
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);
```

**Por que `autoRaf: true` (o padrão da referência) é arriscado com ScrollTrigger:** com
`autoRaf: true`, o Lenis atualiza a posição de scroll no seu próprio `requestAnimationFrame`,
sem avisar o ScrollTrigger. O ScrollTrigger então lê a posição de scroll em SEU próprio tick,
potencialmente um frame depois — isso é uma fonte clássica de jitter/dessincronia entre o
scroll suavizado e o que os triggers acham que é a posição atual. É provavelmente relacionado
à causa raiz dos saltos que o Perin já viu no carrossel de portfólio, se esse carrossel anima
com ScrollTrigger.

## Riscos específicos para o Perin

- **`overflow-anchor: none` já aplicado**: o Lenis intercepta o scroll nativo e o substitui
  por uma posição de scroll calculada via transform/JS. Isso deveria, em teoria, tornar o
  scroll-anchoring nativo do browser irrelevante (o Lenis não deixa o browser decidir
  âncoras de scroll sozinho) — mas **isso precisa ser validado**, não assumido: se o
  `overflow-anchor: none` foi um band-aid para um sintoma específico, remover/manter essa
  regra com o Lenis ativo pode se comportar de forma diferente do esperado. Testar com e sem
  a regra depois de integrar o Lenis.
- **`ScrollTrigger.refresh()` chamado múltiplas vezes**: cada `refresh()` recalcula as
  posições de start/end de todos os triggers com base no layout atual. Se o Lenis estiver
  ativo com `autoRaf: true` (não sincronizado), um `refresh()` disparado enquanto o Lenis
  está no meio de uma animação de suavização pode capturar uma posição de scroll
  "intermediária" incorreta. Auditar cada chamada de `.refresh()` existente no Perin e
  confirmar que elas rodam depois que o Lenis já sincronizou a posição (ou usar
  `ScrollTrigger.refresh()` dentro do mesmo ciclo de tick do GSAP, não solto).
- **Carrossel de portfólio que já causou saltos de scroll**: este é o teste de maior risco.
  Abrir/navegar/fechar esse carrossel com o Lenis ativo precisa ser testado manualmente e
  repetidamente (ver checklist). Suspeitos comuns: o carrossel travando o scroll do body
  (`lenis.stop()`/`lenis.start()` mal pareados), ou o carrossel usando `scrollIntoView`/
  `scrollTo` nativo enquanto o Lenis também está tentando controlar a posição de scroll —
  os dois competindo pela mesma coisa é a receita clássica de salto.
- **Âncoras internas do menu (`#about`, `#contact`, `#portfolio`)**: com Lenis ativo, cliques
  em `<a href="#secao">` precisam ser roteados pelo `lenis.scrollTo('#secao')`, não pelo
  scroll nativo do browser — caso contrário o browser pula instantaneamente para a âncora e
  o Lenis, no próximo frame, "corrige" a posição de volta para onde ele acha que o scroll
  deveria estar, causando um salto visível. Confirmar que os handlers de clique do menu do
  Perin chamam a API do Lenis, não dependem do comportamento nativo de `href="#id"`.
- **Mobile / touch**: a referência não desativa `smoothTouch`, então usa o padrão da
  biblioteca. Verificar qual é esse padrão na versão do Lenis usada — em várias versões o
  smoothing em touch já vem desativado por padrão (recomendado, já que a maioria dos
  dispositivos touch já tem inércia nativa própria); se não vier, considerar
  `smoothTouch: false` explicitamente para não empilhar duas inércias.

## Acessibilidade — `prefers-reduced-motion`

A referência **não verifica `prefers-reduced-motion` em nenhum lugar** (confirmado por busca
no arquivo inteiro) — o Lenis roda sempre, para todos os usuários. Isso é uma lacuna da
referência, não um padrão a copiar. Para o Perin, adicionar a guarda antes de instanciar:

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const lenis = new Lenis({
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
// se prefersReducedMotion, não instanciar o Lenis — o scroll nativo do
// browser já respeita a preferência do usuário sem nenhum código extra.
```

## Checklist de validação obrigatória (rodar no repositório do Perin, não aqui)

- [ ] Abrir o carrossel de portfólio com o Lenis ativo — sem salto de scroll ao abrir.
- [ ] Navegar entre itens do carrossel — sem salto de scroll durante a navegação.
- [ ] Fechar o carrossel — sem salto de scroll ao fechar, posição de scroll preservada.
- [ ] Clicar em cada âncora do menu (`#about`, `#contact`, `#portfolio`) — chega
      corretamente na seção, sem overshoot nem correção visível pós-scroll.
- [ ] Rolar a página inteira manualmente (wheel/trackpad) do topo ao fim — sem
      travamentos, sem comportamento errático, sem "double scroll".
- [ ] Repetir os itens acima em mobile/touch — confirmar se o smoothing em touch está
      desativado (comportamento recomendado) ou, se ativado, que não conflita com a
      inércia nativa do dispositivo.
- [ ] Testar com `prefers-reduced-motion: reduce` ativado no SO — confirmar que o Lenis
      não é instanciado e o scroll volta a ser 100% nativo.
- [ ] Confirmar que cada chamada existente de `ScrollTrigger.refresh()` no Perin ainda
      recalcula os triggers corretamente com o Lenis ativo (comparar posições antes/depois).
- [ ] Confirmar que `overflow-anchor: none` (já aplicado no Perin) não introduz efeito
      colateral com o Lenis ativo — testar remover temporariamente e comparar.

**Se qualquer item falhar, pare e reporte antes de prosseguir — não force a integração.**

## Alternativa mais conservadora, caso o Lenis conflite

Se o checklist acima falhar de um jeito que não se resolve com a sincronização
Lenis↔ScrollTrigger, a alternativa é **não usar biblioteca nenhuma** e aplicar suavização
só para navegação por âncora, via CSS nativo:

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

Isso não entrega a sensação de inércia contínua do Lenis (só suaviza o salto ao clicar numa
âncora, não o scroll manual do dia a dia), mas tem risco zero de conflitar com ScrollTrigger,
com o carrossel de portfólio, ou com o `overflow-anchor: none` já aplicado — porque não
intercepta o scroll nativo em nenhum momento, apenas anima o `scrollTop` do browser para
âncoras via CSS puro, sem JS algum controlando a posição de scroll.
