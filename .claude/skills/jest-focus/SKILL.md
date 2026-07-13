---
name: jest-focus
description: Decide qual suíte Jest rodar (unit, regression, ambas ou nenhuma) com base nos arquivos alterados no projeto Perin_Rev, evitando rodar Puppeteer (lento) quando não necessário. Use antes de finalizar qualquer tarefa que tenha tocado código, como parte da verificação obrigatória de testes do AGENTS.md.
---

# Jest Focus

`package.json` define três scripts: `test` (tudo), `test:unit` e `test:regression`. A suíte `regression` usa Puppeteer (lenta, sobe browser real) e cobre principalmente o carrossel. Rodar tudo sempre desperdiça tempo/tokens quando a mudança é, por exemplo, só no `README.md`.

## Passos

1. **Liste os arquivos alterados**:
   ```
   git status --porcelain
   ```

2. **Aplique a regra de decisão:**
   - Só `README.md`, `AGENTS.md`, `CLAUDE.md`, `relatorio.md`, imagens (`*.png`/`*.jpg`/`*.jpeg`) ou arquivos em `Duvidas/`/`Projeto N/` → **nenhum teste necessário** (não são cobertos por Jest).
   - `script.js` ou `styles.css` tocando o carrossel (`cascading-slider`, `initCascadingSlider`) ou `index.html` na seção do portfólio → rode **ambas** as suítes:
     ```
     npm run test:unit && npm run test:regression
     ```
   - `script.js`/`styles.css` fora da área do carrossel, ou arquivos em `tests/unit/**` → rode só:
     ```
     npm run test:unit
     ```
   - Mudança em `tests/regression/**` ou em qualquer coisa que afete renderização/DOM real → rode:
     ```
     npm run test:regression
     ```
   - Na dúvida sobre o que a mudança afeta → rode `npm test` (tudo) para não arriscar falso negativo.

3. **Execute e reporte** o resultado (pass/fail), sem despejar o output completo do Jest no contexto — resuma falhas relevantes, mostre stack trace só da parte que falhou.

## Critério de sucesso
- A suíte certa (nem mais, nem menos) foi executada para a mudança feita.
- Falhas foram resumidas de forma acionável, não copiadas por inteiro.
