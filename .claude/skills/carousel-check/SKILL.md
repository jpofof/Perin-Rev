---
name: carousel-check
description: Valida o carrossel de projetos (initCascadingSlider em script.js) contra as regras imutáveis documentadas em AGENTS.md — proporções dos 5/3 slides, curva de easing, duração, e a regra de que a imagem nunca é animada. Use sempre que script.js, styles.css ou index.html forem alterados na seção do carrossel, antes de considerar a tarefa concluída.
---

# Carousel Check

Este projeto tem um componente de carrossel ("Carrossel de Projetos") cujas regras estão **fixadas e aprovadas** na seção "Carrossel de Projetos — Implementação Oficial" de `AGENTS.md`. Qualquer alteração em `script.js` (`initCascadingSlider()`), `styles.css` (`.cascading-slider*`) ou no markup do carrossel em `index.html` deve ser validada contra essas regras antes de ser considerada pronta.

## Quando usar
- Depois de editar qualquer código relacionado ao carrossel.
- Antes de fazer commit de mudanças em `script.js`/`styles.css`/`index.html` que toquem a seção `portfolio-section`.

## Passos

1. **Releia as regras primeiro.** Abra a seção "Carrossel de Projetos" em `AGENTS.md` (não confie na memória — as regras são detalhadas e específicas). Extraia os invariantes relevantes para a mudança em questão:
   - Proporções desktop: 6.5% / 13.5% / 60% / 13.5% / 6.5% (extrema-esq, esq, centro, dir, extrema-dir).
   - Proporções mobile (<750px): 0% / 10% / 80% / 10% / 0% (3 slides visíveis, extremos ocultos sem gap).
   - Duração da transição: `0.60s`, curva `cubic-bezier(0.6, 0.03, 0.15, 1)`.
   - Apenas `left` e `width` são animados nos slides — nunca `transform`, `scale`, `filter`, `opacity`.
   - A imagem nunca anima (escala/altura fixas, calculadas via `Math.max(scaleW, scaleH)`).
   - z-index por distância do centro (centro=10, adjacentes=9, extremos=8).
   - Cliques bloqueados durante transição; GSAP com `overwrite: 'auto'`, sem `killTweens`.

2. **Rode os testes de regressão existentes** (Puppeteer + Jest já cobrem parte disso):
   ```
   npm run test:regression
   ```
   Se falharem, o problema está confirmado — corrija antes de prosseguir.

3. **Inspeção manual do código alterado.** Para cada invariante acima que a mudança pode ter afetado, confira no diff:
   - `getProportions()` ainda retorna os valores certos para desktop e mobile.
   - Nenhuma propriedade CSS nova foi adicionada à animação dos slides além de `left`/`width`.
   - O cálculo de escala da imagem (`positionSlides()`) não foi alterado de forma que quebre a regra de "mesma altura visual" e "zero gaps".
   - Duração/easing do tween GSAP não mudaram sem aprovação explícita do usuário.

4. **Teste visual manual** (use a skill `run-static-site` para subir o servidor): abra o site, navegue o carrossel com clique, setas `←`/`→` e teclado, em pelo menos duas larguras de viewport (desktop >1200px e mobile <750px). Confirme que a imagem não pisca/aumenta durante a transição.

5. **Reporte resultado.** Se algum invariante foi violado, aponte a linha exata em `script.js`/`styles.css` e a regra de `AGENTS.md` que ele contraria — não corrija silenciosamente sem avisar, pois essas regras exigem aprovação explícita para mudar (seção "Regras para futuras alterações", item 5).

## Critério de sucesso
- `npm run test:regression` passa.
- Todos os invariantes listados no passo 1 continuam verdadeiros no código alterado.
- Testado visualmente em desktop e mobile.
