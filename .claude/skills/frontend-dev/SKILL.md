---
name: frontend-dev
description: Implementa e ajusta UI/UX deste site (HTML/CSS/JS vanilla, GSAP, responsividade) no papel de desenvolvedor front-end especialista, seguindo as convenções já estabelecidas no projeto (sem framework, sem build step, GSAP para animação) e as regras imutáveis do carrossel em AGENTS.md. Use para qualquer tarefa de implementação visual, layout, responsividade ou interação neste projeto.
---

# Front-end Developer

Este projeto é HTML/CSS/JS vanilla (sem React/Vue, sem bundler, sem TypeScript), usando GSAP como única biblioteca de animação aprovada. O desenvolvedor front-end aqui deve seguir o que já existe, não introduzir stack nova.

## Convenções do projeto (derive do código, confirme antes de assumir)

- **Sem framework de componentes** — DOM manipulado diretamente via `script.js` (`querySelector`, criação de elementos).
- **GSAP é a biblioteca oficial de animação** para o carrossel (AGENTS.md, regra 6) — não migrar para CSS transitions/WAAPI nessa área sem aprovação explícita.
- **Breakpoints já definidos:** desktop >1200px, tablet ≤1024px, mobile <750px, small ≤480px (ver seção "Responsividade" de AGENTS.md para o carrossel — reaproveite os mesmos breakpoints para consistência em outras seções, a menos que o design peça outro).
- **Dimensionamento de imagem calculado em JS**, não em CSS, quando envolve cobertura proporcional (ver `positionSlides()`) — CSS mínimo, só `display: block` nesses casos.

## Passos ao implementar/ajustar UI

1. **Leia o CSS/JS existente da área a alterar** antes de escrever — confirme nomes de classes (`.cascading-slider-*`), variáveis de espaçamento/cor já usadas, para manter consistência visual.
2. **Se a mudança tocar o carrossel**, releia primeiro a seção "Carrossel de Projetos — Implementação Oficial" em `AGENTS.md` — as regras lá são aprovadas e mudanças exigem aprovação explícita do usuário (não decida sozinho mudar proporção, easing ou comportamento de imagem).
3. **Implemente mobile-first ou desktop-first conforme o padrão já usado no arquivo** — não misture as duas abordagens na mesma seção.
4. **Acessibilidade básica:** contraste de texto sobre imagem, `alt` em imagens, foco visível em elementos navegáveis por teclado (o carrossel já responde a `ArrowLeft`/`ArrowRight` — preserve isso em qualquer novo componente interativo).
5. **Teste em múltiplos viewports** usando a skill `run-static-site` — pelo menos desktop, tablet e mobile — antes de considerar pronto. Não confie só em DevTools de um único breakpoint.
6. **Performance visual:** evite reflow desnecessário (medir/alterar DOM em loop), prefira `transform`/propriedades compostas quando a regra do componente permitir (o carrossel é exceção deliberada — ali só `left`/`width`).
7. **Depois de implementar**, rode `carousel-check` se a área tocada for o carrossel, ou `jest-focus` para o restante.

## Critério de sucesso
- Visual consistente com o resto do site (cores, espaçamento, tipografia já em uso).
- Responsivo nos breakpoints definidos, testado de fato (não assumido).
- Nenhuma regra "imutável" de `AGENTS.md` violada sem aprovação explícita.
