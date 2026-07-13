---
name: run-static-site
description: Sobe um servidor HTTP estático local para o site do portfólio Perin_Rev (index.html/script.js/styles.css) e abre no navegador, já que o projeto não tem build nem servidor dev próprio. Use quando precisar inspecionar visualmente o site, tirar screenshot, ou como pré-requisito para testes com Puppeteer/carousel-check.
---

# Run Static Site

Este projeto é um site estático puro (`index.html` + `script.js` + `styles.css`, sem bundler, sem `npm start`). Para visualizá-lo corretamente (evitar problemas de `file://` com módulos/CORS) é preciso um servidor HTTP local.

## Passos

1. **Verifique se já há um servidor rodando** na porta padrão (evite duplicar processos):
   ```
   powershell -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue"
   ```

2. **Suba o servidor** a partir da raiz do projeto, usando uma ferramenta já disponível no ambiente (não instale nada globalmente — `npx` baixa e descarta):
   ```
   npx --yes serve -l 8080 .
   ```
   ou, alternativa sem Node:
   ```
   python -m http.server 8080
   ```
   Rode em background (`run_in_background: true`) para não travar a sessão.

3. **Abra no navegador** (ou use Puppeteer, já é devDependency do projeto, para automação/screenshot):
   - Manual: `http://localhost:8080/index.html`
   - Automatizado: reaproveite o setup de `tests/regression` (Puppeteer) para navegar e tirar screenshot, comparando com `portfolio-screenshot.png` já versionado no repo como referência visual.

4. **Encerre o servidor** ao final da inspeção (mate o processo em background) para não deixar a porta ocupada em sessões futuras.

## Quando não usar
- Para rodar os testes Jest normais (`npm test`), que já sobem/gerenciam seu próprio ambiente jsdom/Puppeteer sem precisar deste passo manual.

## Critério de sucesso
- Site acessível em `http://localhost:8080` sem erros de console relacionados a CORS/`file://`.
- Servidor encerrado ao final, sem processo órfão.
