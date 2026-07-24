# Cascading Slider — pacote isolado

Este pacote contém o componente **Cascading Slider** extraído do projeto
`modusprojects_nl-over-ons`, pronto para abrir no VS Code e testar direto no
navegador.

## Estrutura

```
cascading-slider/
├── index.html                 → página de demonstração com o slider montado
├── css/
│   └── cascading-slider.css   → todo o CSS necessário (variáveis + visual + media query)
└── js/
    ├── gsap.min.js            → GSAP core (única biblioteca externa exigida)
    └── cascading-slider.js    → lógica do slider (initCascadingSlider)
```

## Como testar

1. Abra a pasta `cascading-slider` no VS Code.
2. Instale a extensão **Live Server** (se ainda não tiver).
3. Clique com o botão direito em `index.html` → **Open with Live Server**
   (abrir o arquivo direto com duplo clique também funciona, pois as imagens
   são carregadas de URLs externas do CDN da Webflow).
4. Use os botões de seta, clique nos slides ou as setas do teclado
   (`←`/`→`) para navegar.

## Como usar em outro projeto

1. Copie a pasta `css/cascading-slider.css` e `js/gsap.min.js` +
   `js/cascading-slider.js` para o seu projeto.
2. Copie o bloco de markup do `index.html` (entre os comentários
   `INÍCIO/FIM DO COMPONENTE`) para a página onde o slider deve aparecer.
3. No `<head>` ou antes do `</body>`, inclua, **nesta ordem**:
   ```html
   <link rel="stylesheet" href="caminho/para/cascading-slider.css">
   ...
   <script src="caminho/para/gsap.min.js"></script>
   <script src="caminho/para/cascading-slider.js"></script>
   ```
4. Troque as imagens/textos de cada `.cascading-slider__item` pelos seus.
   Você pode ter **quantos slides quiser** — se tiver menos de 9, o próprio
   script clona os itens originais automaticamente até completar 9.

## Coisas importantes a saber

- **GSAP é obrigatório.** O script usa `gsap.to`, `gsap.set` e
  `gsap.delayedCall`. Nenhum outro plugin do GSAP (ScrollTrigger, Draggable,
  Observer, SplitText, CustomEase) é necessário.
- **Nenhum `id` é usado.** A seleção é feita por atributos `data-*`, então
  você pode ter vários sliders na mesma página sem conflito
  (`data-cascading-slider-wrap`, `data-cascading-viewport`,
  `data-cascading-slide`, `data-cascading-slider-prev`,
  `data-cascading-slider-next`).
- A fonte original do título (`.cascading-slider__h`) é **"Jubilee Silver"**,
  uma fonte hospedada no Webflow do projeto original. Ela não foi incluída
  aqui — o CSS já tem um fallback (`Georgia, serif`). Se quiser a fonte
  exata, você precisa obtê-la e importá-la separadamente.
- As variáveis de design (`--_sizing---*`, `--_colors---*`) no topo do
  `cascading-slider.css` são só as que o componente realmente usa. Se seu
  projeto já tiver um sistema de tokens próprio, você pode apagar esse bloco
  e apontar essas variáveis para os seus tokens equivalentes.
- Os valores de `width`, `z-index`, `--clip` e `transform` **não precisam**
  ser definidos manualmente no HTML — o script calcula tudo isso sozinho na
  inicialização (`measure()` + `layout(false)`).

## Referência à auditoria completa

Este pacote foi gerado a partir da auditoria completa do componente
(arquivo `auditoria-cascading-slider.md`, entregue anteriormente), que lista
linha a linha de onde cada trecho veio no projeto original.
