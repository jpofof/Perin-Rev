# Limpeza executada — 21/07/2026

Execução das decisões aprovadas em `audit/relatorio-arquivos-desnecessarios.md`, item por item. Nenhuma remoção adicional além do aprovado.

## O que foi removido

### 1. Assets órfãos (~31,6 MB)
- **77 fotos** em `assets/images/portfolio/` (pastas `portfolio-projeto-01` a `portfolio-projeto-11` e `portfolio-duvidas`) — confirmado via grep (`index.html`, `styles.css`, `script.js`) que nenhum arquivo era referenciado antes da remoção.
- **10 variantes** `placeholder-obra-0X-desktop.webp` / `-mobile.webp` em `assets/images/placeholders/` — só a versão base de cada placeholder é usada pelo carrossel.

### 2. Relatórios Lighthouse intermediários (~5,65 MB)
7 pares (`.html` + `.json`) de 16/07/2026, superados pelos 3 relatórios de validação final de 17/07/2026:
`lighthouse-antes`, `lighthouse-depois`, `lighthouse-pos-bootstrap`, `lighthouse-pos-logos`, `lighthouse-pos-hero-merge`, `lighthouse-consolidacao-final`, `lighthouse-hero-fix-final`.

Mantidos (validação final, 17/07): `lighthouse-producao-real.report.{html,json}`, `lighthouse-desktop-pos-fix.report.json`, `lighthouse-mobile-pos-fix.report.json`.

### 3. Dependência não usada
- `html-minifier-terser` removida de `devDependencies` em `package.json`. `npm install` executado, `package-lock.json` atualizado (10 pacotes transitivos removidos).

## O que foi mantido (por decisão explícita)
- `puppeteer`, `sharp-cli`, `lighthouse` em `devDependencies` — uso manual real confirmado via `npx` ao longo da sessão (documentado no `README.md`).
- `?debug=scroll` e `?debug=perf` em `script.js`, incluindo os 3 `console.log` associados — mantidos para diagnóstico futuro caso sintomas semelhantes retornem.

## Validação
- Suíte completa: **112 testes passando** (47 unitários + 65 de regressão do carrossel) antes e depois de cada etapa de remoção — nenhuma regressão.
- Relatórios Lighthouse de 17/07/2026 confirmados intactos após a remoção dos antigos.

## Espaço total liberado
≈ 31,6 MB (assets órfãos) + ≈ 5,65 MB (Lighthouse antigos) ≈ **37,25 MB**, em linha com a estimativa de ~37,6 MB do relatório original.

## Não commitado
Nenhum commit ou push foi feito. Alterações aguardando revisão final via `git status` (ver mensagem de fechamento).
