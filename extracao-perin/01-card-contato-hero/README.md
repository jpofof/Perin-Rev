# 01 — Card de contato flutuante no hero

Extraído de `styles/burkhardprojekte.webflow.shared.f3931eb82.css` (classe `.big-cta`,
linhas 3674–3735 e breakpoints 8006/8025/8874/9442 do arquivo original) e do
`<section class="section_hero">` de `index.html`.

## Estratégia de posicionamento

**`position: relative` + `inset` + `margin-bottom` negativo — não `position: absolute`.**

Isso é a decisão mais importante do componente e a mais fácil de errar ao portar:

- `.section_hero` é `position: relative` (contexto de posicionamento).
- `.big-cta` é o **último elemento filho direto** de `.section_hero` no HTML — não é
  filho do wrapper de conteúdo do hero (`.container-hero` / `.hero_wrapper`), é irmão dele.
- `.big-cta` usa `position: relative; inset: auto auto 0% 0%;` — isso o ancora visualmente
  no canto inferior-esquerdo *dentro do fluxo normal do documento*, não fora dele.
- O transbordo sobre a seção seguinte vem de `margin-bottom: -152px`: como o elemento
  continua no fluxo (não é `absolute`/`fixed`), a margem negativa realmente puxa os
  elementos seguintes (a seção de logos) para cima, sobrepondo o card sobre eles.

**Por que não `position: absolute`:** com `absolute`, o card sairia do fluxo do documento
e a section de logos abaixo *não saberia* que precisa de espaço extra no topo — o
`padding-top` da seção de logos (ver componente 02) teria que compensar isso "no escuro",
sem relação direta com a altura do card. Com a abordagem `relative` + `margin-bottom`
negativo, o espaço reservado é automático e proporcional à própria altura do card.

## Como o card transborda e sobrepõe a seção seguinte

1. O card fica visualmente "dentro" do hero (ancorado a ele via `inset`).
2. `margin-bottom: -152px` faz o box do card avançar 152px além do fim do hero.
3. Como o card ainda está no fluxo normal, esses 152px "descontam" do espaço que a seção
   seguinte ocuparia — na prática, a seção de logos começa 152px mais cedo (por baixo do
   card) do que começaria sem essa margem.
4. `z-index: 3` no card garante que ele fique visualmente acima do que estiver por baixo.

## Valores de espaçamento e dimensão por breakpoint

| Breakpoint (valor da referência) | `margin-left` | `margin-bottom` (sobreposição) | `max-width` |
|---|---|---|---|
| Desktop (padrão) | `10vw` | `-152px` | `32rem` |
| ≤991px | herda `10vw` | `2rem` (positivo — quase não sobrepõe) | herda `32rem` |
| ≤767px | `auto` (centralizado, largura quase total) | herda `2rem` | herda `32rem` (mas a largura efetiva é limitada pelas margens automáticas + padding da section) |
| ≤479px | herda `auto` | herda `2rem` | herda; `padding` interno reduz para `1rem` |

**Raciocínio:** em desktop há espaço vertical de sobra (hero com `min-height: 60rem`), então
a sobreposição pode ser grande (152px) sem risco de cobrir conteúdo da seção seguinte. Em
telas menores o hero encolhe (`height: auto`) e o espaço vertical fica mais escasso — por
isso a sobreposição cai para 2rem (~32px), quase sem transbordo real, e o card passa a se
comportar mais como um bloco empilhado normalmente do que como um elemento "flutuante".

## Ajustes necessários ao aplicar no Perin

O hero do Perin usa **vídeo de fundo** (a referência usa slider de imagens estáticas) e tem
**cores e tipografia próprias** — isso muda várias coisas:

1. **Cor do card**: trocar `var(--base-color-brand--turquoise)` pelo token de cor de
   destaque do Perin (o mesmo já usado no botão primário do hero, conforme pedido original).
2. **Cor do hover** (`#13373d`, um turquesa ~12% mais escuro): recalcular como uma variação
   escurecida do accent do Perin, não copiar o hex.
3. **Tipografia do título** (`.heading-style-h3`): usar a variável de fonte/peso de heading
   já definida no Perin — a referência usa Manrope, mas isso é irrelevante, o que importa é
   reaproveitar a MESMA classe/token que os outros títulos de seção do Perin já usam.
4. **`margin-bottom: -152px`**: este valor foi calibrado para a altura real do card
   *nesta* referência, com *este* padding e *esta* fonte. Com vídeo de fundo + tipografia
   diferente, a altura do card no Perin provavelmente será diferente — não copiar o valor,
   medir a altura real do card renderizado no Perin e recalcular.
5. **`z-index` e o overlay do hero**: a referência usa `background-image` com gradientes
   diretamente na `.section_hero` (sem um elemento de overlay separado). Se o hero do Perin
   usa um `<video>` + um elemento de overlay/gradiente próprio por cima, confirme a ordem de
   empilhamento: o card precisa ficar **acima** do vídeo e do overlay, então seu `z-index`
   pode precisar ser maior que 3 dependendo do que o Perin já usa para o overlay do vídeo.

## Atenção ao integrar — riscos previsíveis

- **Conflito de z-index com o overlay/gradiente da base do hero do Perin.** Se o Perin tiver
  um overlay escurecendo o vídeo com `z-index` alto (comum para legibilidade de texto sobre
  vídeo), o card pode acabar escondido atrás dele. Testar explicitamente a pilha de
  empilhamento (`z-index`) entre `<video>`, overlay e o card.
- **Vídeo de fundo com controles nativos ou `poster`**: se o vídeo não estiver com
  `pointer-events: none` corretamente configurado, cliques na área do card podem ser
  interceptados pelo vídeo em vez de ativarem o link. Verificar se o card recebe cliques
  corretamente com o vídeo já integrado.
- **Altura do hero variável por causa do vídeo**: vídeos costumam ter proporção fixa; se o
  hero do Perin ajusta a própria altura ao aspect-ratio do vídeo (em vez de uma altura fixa
  como `100svh` na referência), o valor de `margin-bottom` negativo pode precisar ser
  recalculado por breakpoint com mais cuidado, já que a "folga" vertical disponível muda.
- **`inset: auto auto 0% 0%` depende do padding interno da section**: se o Perin usa um
  wrapper `padding-global`/`container` diferente do da referência, o `margin-left: 10vw`
  pode não alinhar visualmente com a borda do container de conteúdo do hero — validar
  alinhamento horizontal com o resto do conteúdo do hero, não só com a viewport.
- **Reflow do card mudando a altura da sobreposição**: como a técnica depende do card estar
  no fluxo normal (não `absolute`), qualquer mudança de conteúdo/fonte que aumente a altura
  do card muda automaticamente quanto ele sobrepõe a seção de logos — isso é uma vantagem
  (é responsivo por natureza) mas exige revalidar o `padding-top` da seção 02 sempre que o
  conteúdo do card mudar.
