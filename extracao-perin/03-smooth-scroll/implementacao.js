/*
  Extraído de: burkhardprojekte.ch (Webflow export) — index.html, inline <script>
  logo após o carregamento de scripts/lenis.min.js.

  Carregamento na referência (self-hosted, sem CDN):
    <link rel="stylesheet" href="./styles/lenis.css">
    <script src="./scripts/lenis.min.js"></script>
    <script> ... este arquivo ... </script>

  Cópia local da biblioteca em: ./lenis.min.js (mesmo arquivo, copiado sem
  modificação de scripts/lenis.min.js do site de referência).

  ATENÇÃO: este é o código EXATO da referência, incluindo a lacuna de
  acessibilidade que ele tem (nenhuma verificação de prefers-reduced-motion).
  NÃO copiar isso 1:1 para o Perin — ver README.md desta pasta para a versão
  recomendada com guarda de reduced-motion e para os riscos de integração
  com GSAP ScrollTrigger, que a referência não usa.
*/

// Lenis
const lenis = new Lenis({
  autoRaf: true,
});

/*
  Parâmetros efetivamente configurados na referência: SOMENTE `autoRaf: true`.
  Todo o resto (lerp, duration, easing, smoothWheel, smoothTouch, orientation
  etc.) fica no valor padrão da biblioteca — a referência não os customiza.
  Ver README.md para o que cada parâmetro relevante faz e quais valores
  costumam ser necessários para integrar com ScrollTrigger.
*/
