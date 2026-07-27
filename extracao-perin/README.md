# Extração de padrões — burkhardprojekte.ch → Perin Construções

Esta pasta contém três padrões de UI extraídos do site de referência **BurkhardProjekte GmbH**
(export estático do Webflow, `index.html` + `styles/burkhardprojekte.webflow.shared.f3931eb82.css`)
para serem reimplementados no projeto **Perin Construções**, que tem identidade visual própria.

**Nenhum arquivo original do site de referência foi modificado.** Todo o conteúdo aqui é cópia
isolada, comentada e reescrita para leitura — não é o export bruto.

## Índice dos componentes

| # | Componente | O que resolve | Pasta |
|---|---|---|---|
| 01 | Card de contato flutuante no hero | Card ancorado no canto inferior-esquerdo do hero, transbordando sobre a seção seguinte | [`01-card-contato-hero/`](./01-card-contato-hero/) |
| 02 | Posição do carrossel de clientes | Carrossel logo abaixo do hero, sem cabeçalho, com continuidade de cor até "Sobre" | [`02-carrossel-clientes-posicao/`](./02-carrossel-clientes-posicao/) |
| 03 | Smooth scroll (Lenis) | Biblioteca, inicialização e parâmetros do scroll suave | [`03-smooth-scroll/`](./03-smooth-scroll/) |

## Ordem recomendada de integração no Perin

1. **03 — Smooth scroll primeiro.** É a mudança de maior risco (afeta o comportamento de scroll
   da página inteira) e a que mais interage com código já existente no Perin (GSAP ScrollTrigger,
   `overflow-anchor: none`, carrossel de portfólio, âncoras do menu). Integrar e validar isso
   isoladamente, antes de adicionar elementos visuais novos, evita que um bug de scroll seja
   confundido com um bug do card ou do carrossel.
2. **02 — Reposicionar o carrossel de clientes.** É uma mudança estrutural (ordem de seções,
   remoção de cabeçalho, cor de fundo) mas não introduz elementos novos — só reorganiza o que já
   existe. Fazer isso antes do card dá um "chão" estável (altura real da faixa de logos, cor de
   fundo definida) para calcular a sobreposição do card no passo seguinte.
3. **01 — Card de contato flutuante.** Depende da geometria final do hero e da seção de logos
   (passo 2) para calcular corretamente o `padding-top` que evita cobrir os logos. Fazer por
   último também isola o componente com mais mudanças visuais novas (cor, ícone, tipografia) como
   o último passo, mais fácil de revisar isoladamente.

## Resumo de riscos gerais

- **Todo valor de cor, fonte, espaçamento ou breakpoint citado nos READMEs é da referência
  BurkhardProjekte** e está marcado explicitamente como *"valor da referência — substituir pelo
  equivalente do Perin"*. Nenhum desses valores deve ir para o Perin sem passar pelos tokens de
  design do próprio projeto.
- O hero da referência usa **imagem de fundo estática/slider**; o hero do Perin usa **vídeo de
  fundo** — isso muda o contexto de empilhamento (z-index/overlay) em que o card 01 vive. Ver
  seção "Atenção ao integrar" em `01-card-contato-hero/README.md`.
- O Perin já usa **GSAP ScrollTrigger extensivamente** e tem **histórico documentado de bugs de
  scroll** (scroll anchoring, saltos no carrossel de portfólio, `ScrollTrigger.refresh()`). A
  referência não usa ScrollTrigger e não tem esse histórico — a integração do Lenis (03) é o
  ponto de maior atenção e tem checklist de validação obrigatória.
- O Perin já tem um **carrossel de clientes funcional** — o padrão 02 é só de **posicionamento e
  fundo**, não um componente para substituir o existente.
