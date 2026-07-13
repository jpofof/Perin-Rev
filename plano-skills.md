# Plano de Skills para o Projeto Perin_Rev

## Contexto do projeto
Site estático (portfólio "Perin Construções"): `index.html` + `script.js` + `styles.css`, sem build/bundler, sem servidor próprio. Testes via Jest + Puppeteer (`tests/unit`, `tests/regression`) cobrindo o carrossel (`initCascadingSlider()`), cujas regras visuais estão **fixadas e são imutáveis** em `AGENTS.md` (proporções 6.5/13.5/60/13.5/6.5%, escala de imagem, timing GSAP, breakpoints). `README.md` exige changelog obrigatório a cada alteração. Já existem skills globais genéricas (`verify`, `run`, `code-review`, `simplify`) — o que falta são skills **específicas deste projeto**, que nenhuma skill global cobre porque dependem de regras de negócio locais (as regras do carrossel, o changelog do README, ausência de servidor dev).

## Skills recomendadas

### 1. `carousel-check` (prioridade alta)
**Problema que resolve:** a skill global `verify` não conhece as regras imutáveis do carrossel (proporções exatas, curva de easing, "imagem nunca anima"). Hoje, validar isso depende de reler o `AGENTS.md` inteiro toda vez.
**O que faz:** abre `index.html` num browser (via Puppeteer, reaproveitando `tests/regression`), navega o carrossel (clique, setas, teclado) e verifica automaticamente:
- larguras dos 5 slides em % (desktop) e 3 slides (mobile <750px)
- que `transform/scale/filter/opacity` não são animados nos slides
- duração (0.60s) e curva de easing aplicadas
- z-index por distância do centro
**Quando usar:** antes de qualquer commit que toque `script.js`/`styles.css` na seção do carrossel.

### 2. `changelog-update` (prioridade média)
**Problema que resolve:** `AGENTS.md` exige registrar toda alteração em `README.md` (o quê, arquivos, data) — hoje isso depende de lembrança manual.
**O que faz:** dado um diff/commit, gera a entrada de changelog no formato já usado no `README.md` e insere na seção "Histórico de Mudanças".
**Quando usar:** ao final de qualquer tarefa de código, antes de considerar concluído.

### 3. `run-static-site` (prioridade média)
**Problema que resolve:** a skill global `run` tenta detectar padrões genéricos (CLI/server/Electron), mas este projeto não tem servidor — precisa de um servidor estático ad-hoc (ex.: `npx serve` ou `python -m http.server`) para o Puppeteer/visualização funcionar.
**O que faz:** sobe um servidor estático local na porta livre, abre `index.html`, e opcionalmente tira screenshot do portfólio (compara com `portfolio-screenshot.png` já versionado).
**Quando usar:** para inspeção visual manual ou como pré-requisito do `carousel-check`.

### 4. `jest-focus` (prioridade baixa)
**Problema que resolve:** `package.json` já tem `test:unit` e `test:regression` separados; uma skill leve pode escolher automaticamente qual suíte rodar com base nos arquivos alterados (ex.: mudou `script.js` → roda os dois; mudou só `README.md` → não roda nada).
**Quando usar:** integrado ao fluxo normal de commit, para evitar rodar Puppeteer (lento) quando desnecessário.

## Fora de escopo (já cobertas por skills globais)
- Execução genérica de app/screenshot → skill `run`
- Revisão de diff / qualidade de código → `code-review`, `simplify`
- Verificação funcional pós-mudança → `verify` (mas sem conhecimento das regras do carrossel — por isso `carousel-check` é complementar, não substituta)

## Ordem de implementação sugerida
1. `carousel-check` — maior risco de regressão silenciosa (regras "imutáveis" do carrossel).
2. `run-static-site` — pré-requisito técnico para o item 1 funcionar sem servidor manual.
3. `changelog-update` — reduz esquecimento de uma exigência já obrigatória no `AGENTS.md`.
4. `jest-focus` — otimização, não bloqueante.

## Como implantar
Cada skill vira uma pasta em `.claude/skills/<nome>/SKILL.md` (escopo de projeto, não global), descrevendo trigger, passos e critérios de sucesso — seguindo o mesmo formato das skills globais já listadas no ambiente. Nenhuma dependência nova é necessária além das já presentes (`jest`, `jest-environment-jsdom`, `puppeteer`).
