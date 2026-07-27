# 02 — Carrossel de clientes: posicionamento e continuidade visual

Extraído de `index.html` (ordem das seções) e de
`styles/burkhardprojekte.webflow.shared.f3931eb82.css` (`.section_logos` linha 3634,
`.section_about` linha 4096) da referência.

## Relação espacial hero → logos → sobre

```
┌─────────────────────────────┐
│         .section_hero        │  altura fixa (100svh / min-height 60rem)
│  ┌─────────────────────┐     │
│  │ .big-cta (card 01)   │     │  ancorado no canto inferior-esquerdo,
│  └─────────────────────┘     │  margin-bottom: -152px
└──────────────┬────────────────┘
                │ (o card sobrepõe esta borda)
┌───────────────▼────────────────┐
│        .section_logos           │  padding-top: 2rem (dá espaço para não
│   (sem heading, direto o        │  ficar colado no card acima)
│    carrossel de logos)          │
└──────────────┬───────────────────┘
                │ mesma cor de fundo (herdada do body em ambos os lados)
┌───────────────▼───────────────────┐
│        .section_about              │  TEM cabeçalho (eyebrow) — contraste
│   ("Sobre os projetos Burkhard")   │  proposital com a seção de logos
└─────────────────────────────────────┘
```

A seção de logos funciona como uma "ponte" visual entre o hero (escuro, com imagem/vídeo)
e o conteúdo institucional (claro, com texto) — sem cabeçalho, ela não compete por atenção
com o card de contato que está sobrepondo o topo dela, nem com o título da seção seguinte.

## Por que não há cabeçalho na seção de logos, e o efeito disso

Na referência, `.section_logos` vai direto de `padding-global` para o wrapper do carrossel —
não existe nenhum bloco de eyebrow/badge/heading ali, diferente de praticamente todas as
outras seções do site (incluindo a seção "Sobre" logo abaixo, que tem eyebrow).

**Efeito:** os logos de clientes funcionam como um elemento de transição rápida — "prova
social" que se lê em 1-2 segundos ao rolar, sem pedir que o visitante pare para ler um
título. Isso também reduz a altura total dessa faixa, o que importa porque é justamente
o espaço que precisa acomodar a sobreposição do card do hero sem parecer apertado.

## Como aplicar no Perin — só reposicionar, não substituir o carrossel

O Perin **já tem um carrossel de clientes funcional**. O que se extrai aqui é apenas:

1. **Posição no DOM**: mover o bloco do carrossel para logo após o `</section>` do hero,
   antes de qualquer outra seção.
2. **Remover** (ou não adicionar) qualquer heading/eyebrow/badge acima do carrossel nesse
   contexto específico — mesmo que o componente de carrossel do Perin tenha uma variante
   com cabeçalho usada em outros lugares do site, aqui ela não deve ser usada.
3. **Aplicar o `padding-top`** calculado (ver estilos.css) ao wrapper da seção, para abrir
   espaço proporcional à sobreposição do card do hero (componente 01) — não é uma
   propriedade do carrossel em si, é do contêiner da seção.
4. **Não tocar** na lógica interna do carrossel (animação de marquee, loop de itens,
   controles) — isso já existe e funciona no Perin.

## Onde quebrar a alternância de cores em xadrez

Se o Perin alterna cores de fundo entre seções (claro/escuro/claro/...), o par
**"logos" → "seção seguinte equivalente ao Sobre"** é onde essa alternância precisa ser
quebrada intencionalmente: as duas devem compartilhar a mesma cor de fundo (a clara,
"valor da referência — substituir pelo equivalente do Perin": era
`var(--background-color--background-primary)` = `#fafafa` na referência).

**Diferença importante em relação à referência:** na BurkhardProjekte isso "acontece
sozinho" porque nenhuma das duas seções define cor própria (ambas herdam do `<body>`, que
já é claro). Se o Perin tem alternância ativa por seção (cada seção define sua própria
`background-color` explicitamente, inclusive as claras), **não basta remover a regra de
alternância dessas duas seções** — é preciso definir explicitamente a mesma cor nas duas,
do contrário uma futura mudança na cor de fundo padrão do `<body>` do Perin quebraria essa
continuidade sem aviso. Ver o CSS comentado em `estilos.css` para a regra explícita
recomendada.
