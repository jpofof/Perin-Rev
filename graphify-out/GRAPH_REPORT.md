# Graph Report - Perin_Rev  (2026-08-17)

## Corpus Check
- 64 files · ~444,391 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1259 nodes · 1700 edges · 97 communities (92 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30feee4f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- script.js
- script.min.js
- gsap/gsap.min.js
- src-original/script.js
- js/gsap.min.js
- ScrollTrigger.min.js
- 03-smooth-scroll/lenis.min.js
- lenis/lenis.min.js
- form.test.js
- devDependencies
- ce
- r
- Travamento repetido no scroll hero → sobre-nós (hardware fraco) — investigação sem correção aplicada
- xe
- Tween
- clients-carousel.test.js
- slider.test.js
- r
- t
- Bc
- df
- Tween
- _d
- ja
- mc
- init-scheduling.test.js
- cb
- na
- check-min-freshness.js
- install-git-hooks.js
- Qa
- Za
- slider.regression.test.js
- K
- P
- Nc
- build-netlify.js
- CSS crítico inline + carregamento adiado — duas tentativas, revertidas em produção
- 03 — Smooth scroll (Lenis)
- pre-commit
- Cd
- Graphify
- Instruções Gerais de Trabalho
- Isolamento por eliminação — `?isolate=...` (Fase 2)
- Perin Construções — Site Institucional Premium
- auditoria-cascading-slider.md
- Atualização — investigação do padrão periódico de ~3s (20/07/2026)
- FASE 1 — Salto de scroll para trás
- 3. Conteúdo detalhado por seção
- Diagnóstico — carrossel de clientes não gira sozinho em mobile
- Consolidação de Branches — Master Local
- Diagnóstico — Mobile Real: Hero, Seção "Sobre Nós" e Carrossel de Clientes
- Relatório de Arquivos Desnecessários / Órfãos / Resquícios de Debug
- Achados (mais grave primeiro)
- Auditoria Técnica — Projeto Perin Construções (Landing Page)
- Diagnóstico de Performance — Fase 1 (Auditoria Estática)
- Inventário de Branches — Consolidação para Master
- PRD — Site Institucional Perin Construções
- Especificações do Projeto — Perin Construções (portfólio)
- Diagnóstico contra produção real — perinconstrucoes.netlify.app
- Oportunidades identificadas para próxima rodada
- Plano de Skills para o Projeto Perin_Rev
- Graphify — Automação e Manutenção do Grafo de Conhecimento
- Uso real do Bootstrap — Investigação (sem implementação)
- Limpeza executada — 21/07/2026
- Plano Técnico — Vídeo Time-lapse de Fundo no Hero
- Relatório de Performance — Perin Construções
- Carregamento inicial: poster, hero entrance, primeira seção, travamento intermitente
- GSAP self-hosted (elimina dependência de CDN externo)
- Hero: vídeo + correções
- Travamento recorrente no Safari iOS — causa raiz e correção
- 01 — Card de contato flutuante no hero
- hero-video.regression.test.js
- Notas de Implementação — Vídeo de Fundo no Hero
- Verificação de Produção — Commit `ab2b2ae`
- Relatório de Organização — Portfólio de Obras
- O que foi alterado, por categoria
- Mobile: travamento por sobrecarga de main thread
- Cascading Slider — pacote isolado
- 02 — Carrossel de clientes: posicionamento e continuidade visual
- Validação pendente: iPhone real
- ScrollTrigger.batch() — redução de instâncias
- Contenção de main thread durante a animação do hero (Passo 0) + redução da timeline (Passo 1)
- Parte 2 — Validação de cache (pendente, só após deploy)
- Correções: scheduling do hero, ordem cascading slider, touchcancel carrossel clientes
- Mobile: vídeo condicional + correção de download prematuro
- Correção: fila de inicializações em lote (não mais sequencial via idle individual)
- Rodada 2 — Remoção do Bootstrap
- Extração de padrões — burkhardprojekte.ch → Perin Construções
- Headroom
- CLAUDE.md
- checklist-pendencias-mobile.md
- process-diagram.regression.test.js
- implementacao.js

## God Nodes (most connected - your core abstractions)
1. `Relatório de Performance — Perin Construções` - 26 edges
2. `initPage()` - 21 edges
3. `Instruções Gerais de Trabalho` - 20 edges
4. `Perin Construções — Site Institucional Premium` - 14 edges
5. `Bc()` - 14 edges
6. `Tween()` - 13 edges
7. `r()` - 13 edges
8. `s()` - 13 edges
9. `Tween()` - 13 edges
10. `3. Conteúdo detalhado por seção` - 13 edges

## Surprising Connections (you probably didn't know these)
- `hb()` --indirect_call--> `f()`  [INFERRED]
  prototipos/cascading-slider/js/gsap.min.js → script.min.js
- `eb()` --indirect_call--> `f()`  [INFERRED]
  vendor/gsap/gsap.min.js → script.min.js
- `zb()` --indirect_call--> `ve()`  [INFERRED]
  prototipos/cascading-slider/js/gsap.min.js → vendor/gsap/gsap.min.js
- `zb()` --indirect_call--> `we()`  [INFERRED]
  prototipos/cascading-slider/js/gsap.min.js → vendor/gsap/gsap.min.js
- `wb()` --indirect_call--> `ce()`  [INFERRED]
  vendor/gsap/gsap.min.js → prototipos/cascading-slider/js/gsap.min.js

## Import Cycles
- None detected.

## Communities (97 total, 5 thin omitted)

### Community 0 - "script.js"
Cohesion: 0.07
Nodes (40): applyPhoneMask(), batchReveal(), buildResponsiveImgAttrs(), capitalizeName(), captureStack(), checkEmail(), checkName(), checkNameOnBlur() (+32 more)

### Community 1 - "script.min.js"
Cohesion: 0.08
Nodes (43): applyPhoneMask(), batchReveal(), buildResponsiveImgAttrs(), capitalizeName(), checkEmail(), checkName(), checkNameOnBlur(), checkPhone() (+35 more)

### Community 2 - "gsap/gsap.min.js"
Cohesion: 0.06
Nodes (14): ee(), Jd(), Kd(), la(), Ld(), ma(), Md(), na() (+6 more)

### Community 3 - "src-original/script.js"
Cohesion: 0.12
Nodes (37): applyPhoneMask(), buildResponsiveImgAttrs(), capitalizeName(), checkEmail(), checkName(), checkNameOnBlur(), checkPhone(), checkService() (+29 more)

### Community 4 - "js/gsap.min.js"
Cohesion: 0.07
Nodes (14): ia(), Md(), Nd(), oa(), Od(), pa(), Pd(), qa() (+6 more)

### Community 5 - "ScrollTrigger.min.js"
Cohesion: 0.07
Nodes (4): gc(), Ja(), Ka(), qb()

### Community 6 - "03-smooth-scroll/lenis.min.js"
Cohesion: 0.11
Nodes (17): advance(), cleanUpClassName(), constructor(), destroy(), emit(), isLocked(), isScrolling(), isStopped() (+9 more)

### Community 7 - "lenis/lenis.min.js"
Cohesion: 0.11
Nodes (17): advance(), cleanUpClassName(), constructor(), destroy(), emit(), isLocked(), isScrolling(), isStopped() (+9 more)

### Community 8 - "form.test.js"
Cohesion: 0.13
Nodes (3): fs, html, path

### Community 9 - "devDependencies"
Cohesion: 0.07
Nodes (26): clean-css-cli, jest, jest-environment-jsdom, lighthouse, description, devDependencies, clean-css-cli, jest (+18 more)

### Community 10 - "ce"
Cohesion: 0.15
Nodes (20): Ae(), Animation(), ce(), $d(), Da(), ee(), he(), ka() (+12 more)

### Community 11 - "r"
Cohesion: 0.15
Nodes (20): _a(), ac(), Co(), db(), ea(), eb(), ga(), gb() (+12 more)

### Community 12 - "Travamento repetido no scroll hero → sobre-nós (hardware fraco) — investigação sem correção aplicada"
Cohesion: 0.33
Nodes (6): Causa raiz identificada, Estado final, Metodologia, Sintoma, Tentativas feitas, Travamento repetido no scroll hero → sobre-nós (hardware fraco) — investigação sem correção aplicada

### Community 13 - "xe"
Cohesion: 0.50
Nodes (4): Ud(), vd(), we(), xe()

### Community 14 - "Tween"
Cohesion: 0.15
Nodes (17): _assertThisInitialized(), Ec(), Fc(), gc(), ka(), qa(), t(), tb() (+9 more)

### Community 15 - "clients-carousel.test.js"
Cohesion: 0.12
Nodes (3): fs, html, path

### Community 16 - "slider.test.js"
Cohesion: 0.15
Nodes (3): fs, html, path

### Community 17 - "r"
Cohesion: 0.24
Nodes (12): Ao(), cb(), cc(), ga(), gb(), ha(), hb(), r() (+4 more)

### Community 18 - "t"
Cohesion: 0.24
Nodes (11): _a(), Context(), Db(), Eb(), fb(), Gc(), Gw(), Hc() (+3 more)

### Community 19 - "Bc"
Cohesion: 0.22
Nodes (11): Bc(), Ha(), Ia(), ob(), rc(), tc(), uc(), Va() (+3 more)

### Community 20 - "df"
Cohesion: 0.27
Nodes (11): df(), ff(), gf(), hf(), jf(), M(), N(), of() (+3 more)

### Community 21 - "Tween"
Cohesion: 0.27
Nodes (10): _assertThisInitialized(), ic(), ta(), Timeline(), Tween(), w(), x(), xa() (+2 more)

### Community 22 - "_d"
Cohesion: 0.29
Nodes (10): be(), _d(), fa(), ia(), ie(), je(), ke(), le() (+2 more)

### Community 23 - "ja"
Cohesion: 0.28
Nodes (9): Aa(), Animation(), ha(), ja(), Jc(), Lc(), Ra(), Sa() (+1 more)

### Community 24 - "mc"
Cohesion: 0.22
Nodes (9): Cb(), J(), mb(), mc(), oc(), Ta(), tb(), Ua() (+1 more)

### Community 25 - "init-scheduling.test.js"
Cohesion: 0.29
Nodes (3): fs, html, path

### Community 26 - "cb"
Cohesion: 0.29
Nodes (7): Ab(), Bb(), cb(), Context(), fb(), Gw(), zb()

### Community 27 - "na"
Cohesion: 0.33
Nodes (6): Aa(), Ca(), na(), Vb(), wb(), Xb()

### Community 28 - "check-min-freshness.js"
Cohesion: 0.33
Nodes (3): fs, path, ROOT

### Community 29 - "install-git-hooks.js"
Cohesion: 0.33
Nodes (5): { execSync }, fs, hooksSrcDir, path, ROOT

### Community 30 - "Qa"
Cohesion: 0.53
Nodes (6): Db(), La(), Ma(), Na(), Qa(), z()

### Community 31 - "Za"
Cohesion: 0.40
Nodes (5): kb(), ob(), ra(), rb(), Za()

### Community 32 - "slider.regression.test.js"
Cohesion: 0.50
Nodes (4): css, fs, html, path

### Community 33 - "K"
Cohesion: 0.40
Nodes (5): A(), B(), F(), G(), K()

### Community 34 - "P"
Cohesion: 0.40
Nodes (5): O(), P(), pc(), r(), yb()

### Community 35 - "Nc"
Cohesion: 0.50
Nodes (4): ja(), Lc(), Nc(), ub()

### Community 36 - "build-netlify.js"
Cohesion: 0.12
Nodes (15): copyRecursive(), crypto, DIRS, DIST, EXCLUDE, excluded, FILES, fs (+7 more)

### Community 37 - "CSS crítico inline + carregamento adiado — duas tentativas, revertidas em produção"
Cohesion: 0.29
Nodes (7): Causa raiz da reversão, CSS crítico inline + carregamento adiado — duas tentativas, revertidas em produção, Estado final, Metodologia, Métricas — tentativa 1 (`audit/perf-css-critico/`, abandonada), Métricas — tentativa 2 (`audit/perf-css-critico-v2/`, implementada em produção e depois revertida), Sintoma

### Community 39 - "03 — Smooth scroll (Lenis)"
Cohesion: 0.22
Nodes (8): 03 — Smooth scroll (Lenis), Acessibilidade — `prefers-reduced-motion`, Alternativa mais conservadora, caso o Lenis conflite, Biblioteca e carregamento, Checklist de validação obrigatória (rodar no repositório do Perin, não aqui), Código de inicialização e parâmetros configurados, Integrar com GSAP ScrollTrigger (a referência NÃO faz isso — o Perin precisa), Riscos específicos para o Perin

### Community 44 - "Graphify"
Cohesion: 0.22
Nodes (8): Atualização automática (hook), Checklist de verificação, Comandos (fallback manual), Como confirmar que está em uso, Consultas (uso pela IA), Graphify, O que é, Último resultado conhecido

### Community 45 - "Instruções Gerais de Trabalho"
Cohesion: 0.05
Nodes (39): 10. Privacidade (LGPD / GDPR), 11. Resiliência e Performance, 12. Nuvem e FinOps (Agnóstico a Provedor), 13. Testes (Obrigatório em Toda Alteração), 14. Observabilidade (Obrigatória em Toda Aplicação), 15. Documentação Automática, 16. Commits (Sugestão Obrigatória), 17. O Que Nunca Fazer (+31 more)

### Community 46 - "Isolamento por eliminação — `?isolate=...` (Fase 2)"
Cohesion: 0.05
Nodes (37): Achado separado: `filter: blur(100px)` estático nos light-spots, Arquivos alterados, Arquivos alterados nesta atualização, Arquivos alterados nesta atualização, Atualização final — causa raiz confirmada, correção aplicada, infraestrutura removida (21/07/2026), Atualização — `no-blur-only` e `no-animation-only` (21/07/2026), Atualização — `no-geometries` (21/07/2026), Como funciona (+29 more)

### Community 47 - "Perin Construções — Site Institucional Premium"
Cohesion: 0.06
Nodes (34): 🎬 Animações e Interações, Carrossel de Portfólio (Cascading Slider), Carrossel (Portfólio), 📐 Checklist de Qualidade, Como instalar e executar, ▶️ Como usar, Comportamento, Conteúdo (+26 more)

### Community 48 - "auditoria-cascading-slider.md"
Cohesion: 0.07
Nodes (26): 1.1 Classes (`class=""`), 1.2 IDs (`id=""`), 1.3 Atributos `data-*`, 1.4 Estrutura HTML completa do slider, 1. HTML, 2.1 Seletores no arquivo externo `styles/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.23cdafd36.opt.min.css`, 2.2 Estilos embutidos no `index.html` (dentro de `<div class="w-embed"><style>...`), 2.3 Pseudo-classes / pseudo-elementos (+18 more)

### Community 49 - "Atualização — investigação do padrão periódico de ~3s (20/07/2026)"
Cohesion: 0.08
Nodes (25): Arquivos alterados, Arquivos alterados nesta atualização, Arquivos alterados nesta atualização, Atualização — checkpoints granulares em `initPage()` (20/07/2026), Atualização — investigação do padrão periódico de ~3s (20/07/2026), Botão de exportação, Dado real que motivou este passo, Dado real que motivou este passo (+17 more)

### Community 50 - "FASE 1 — Salto de scroll para trás"
Cohesion: 0.08
Nodes (23): Causa raiz confirmada — não era gesto nativo do iOS, Conclusão honesta, Correção aplicada (`script.js`, ~linha 2221), Dados reais capturados no iPhone — análise, FASE 1 — Salto de scroll para trás, Hipótese mais provável, Instrumentação para captura real no dispositivo (v1 — superada, exigia Mac), Instrumentação v2 — sem Mac, direto no iPhone (`?debug=scroll`) (+15 more)

### Community 51 - "3. Conteúdo detalhado por seção"
Cohesion: 0.09
Nodes (22): 1. Ordem das seções (fluxo narrativo atual), 2. Tabela seção por seção, 3. Conteúdo detalhado por seção, 4. Altura total da página, 5. CTAs (oportunidades de conversão), 6. Repetições de conteúdo, 7. Seções dependentes de conteúdo real do cliente (ainda não fornecido), 8. Resumo de complexidade técnica por seção (ordenado do mais simples ao mais complexo) (+14 more)

### Community 52 - "Diagnóstico — carrossel de clientes não gira sozinho em mobile"
Cohesion: 0.12
Nodes (15): Conclusão, Correção 1 — Observar o container estável, Correção 2 — Debounce antes de parar (redesenhado durante a implementação), Correção aplicada (21/07/2026), Diagnóstico — carrossel de clientes não gira sozinho em mobile, Hipótese de causa da entrada espúria, Passo 1.2 — Grupo A dispara corretamente em mobile?, Passo 1.3 — O IntersectionObserver considera o carrossel visível em mobile? (**Aqui está o bug**) (+7 more)

### Community 53 - "Consolidação de Branches — Master Local"
Cohesion: 0.12
Nodes (15): Branches mergeadas, nesta ordem, Como o conflito foi resolvido, Consolidação de Branches — Master Local, Estado atual, `feat/hero-timelapse-video`, `index.html`, Métricas de Lighthouse — evolução da consolidação, O que foi preservado de cada branch (+7 more)

### Community 54 - "Diagnóstico — Mobile Real: Hero, Seção "Sobre Nós" e Carrossel de Clientes"
Cohesion: 0.13
Nodes (14): Causa, Causa nova identificada, Causa técnica, Confirmação necessária, Diagnóstico — Mobile Real: Hero, Seção "Sobre Nós" e Carrossel de Clientes, Diferença touch vs. mouse na inicialização, Este é o bug antigo (código desatualizado) ou uma causa nova?, Medição de interferência no carregamento (+6 more)

### Community 55 - "Relatório de Arquivos Desnecessários / Órfãos / Resquícios de Debug"
Cohesion: 0.14
Nodes (13): 10. Observação — pastas duplicadas do projeto, 1. Assets órfãos reais (fora de pasta de backup), 2. Órfãos "intencionais" dentro de pastas de backup, 3. Pasta `audit/` — classificação, 4. Infraestrutura de debug ainda presente no código, 5. `console.log` / `console.trace` / `console.debug` — fonte, 6. Blocos de código morto comentado, 7.1 Assets (+5 more)

### Community 56 - "Achados (mais grave primeiro)"
Cohesion: 0.14
Nodes (13): 1. ~~`AGENTS.md` documenta uma regra do carrossel que diverge do código e dos testes~~ — ✅ CORRIGIDO em 07/07/2026, 2. `initPage()` não isola falhas por seção — um erro em qualquer `init*()` pode interromper a inicialização das seções seguintes, 3. Nenhuma verificação de elemento nulo antes de manipular DOM em várias `init*()`, 4. Formulário de contato — único ponto de conversão do site — sem nenhum teste automatizado, 5. `script.js` é um arquivo único de ~1750 linhas / ~30 funções globais sem módulos (code smell, `AGENTS.md` §6), 6. Interpolação de string em `innerHTML` para dados hoje estáticos, mas sem barreira caso isso mude, 7. `prefers-reduced-motion` não é verificado em nenhuma animação, 8. Imagens pesadas sem otimização confirmada (+5 more)

### Community 57 - "Auditoria Técnica — Projeto Perin Construções (Landing Page)"
Cohesion: 0.14
Nodes (13): 1. Mapeamento geral, 2.1 Achado crítico — pastas "Projeto N" não estão integradas ao site, 2.2 Links quebrados (referenciados mas inexistentes no disco), 2.3 Dependência morta, 2.4 Nomenclatura cruzada de fotos (não são backups, mas indicam organização incompleta), 2.5 Backups/versões antigas/arquivos de teste esquecidos, 2. Arquivos problemáticos, 3. Erros e inconsistências técnicas (+5 more)

### Community 58 - "Diagnóstico de Performance — Fase 1 (Auditoria Estática)"
Cohesion: 0.15
Nodes (12): 10. Métricas reais (Lighthouse) — pendente, 1. Imagens, 2. CSS e JS, 3. Scripts sem `defer`/`async`, 4. Fontes, 5. Preconnect / Preload / Prefetch, 6. CSS/JS não utilizado, 7. `_headers` (cache Netlify) (+4 more)

### Community 59 - "Inventário de Branches — Consolidação para Master"
Cohesion: 0.17
Nodes (11): Aguardando decisão, Branch que parece obsoleta / já implicitamente resolvida, Branches encontradas, Detalhe do conflito `perf` × `teste`, Inventário de Branches — Consolidação para Master, Opção 1 — `feat/hero-timelapse-video` → `perf/otimizacao-performance` → `teste/skills-design-emil-taste`, Opção 2 — `feat/hero-timelapse-video` → `teste/skills-design-emil-taste` → `perf/otimizacao-performance`, Ordem de merge sugerida (+3 more)

### Community 60 - "PRD — Site Institucional Perin Construções"
Cohesion: 0.17
Nodes (11): 10. Perguntas em aberto para o dono do produto, 1. Visão do produto, 2. Problema a resolver, 3. Objetivo de negócio e métrica de sucesso, 4. Personas, 5. Escopo funcional (estado atual — "as built"), 6. Requisitos não-funcionais (herdados de `AGENTS.md`, aplicados como critério de aceite de produto), 7. Fora de escopo (nesta versão) (+3 more)

### Community 61 - "Especificações do Projeto — Perin Construções (portfólio)"
Cohesion: 0.17
Nodes (11): 1. Visão geral, 2. Inventário funcional (por seção, `index.html`), 3. Especificação do formulário de contato (o fluxo de maior risco do site), 4. Especificação técnica — arquitetura (`script.js`), 5.1 Cobertura obrigatória a criar (por prioridade), 5.2 Edge cases transversais a cobrir em qualquer novo teste, 5.3 Acessibilidade (não coberto, recomendado), 5. Especificação de QA — cobertura necessária (AGENTS.md §13) (+3 more)

### Community 62 - "Diagnóstico contra produção real — perinconstrucoes.netlify.app"
Cohesion: 0.18
Nodes (10): ⚠️ Achado novo — a correção de ordem no `_headers` da rodada anterior não teve o efeito esperado, Diagnóstico contra produção real — perinconstrucoes.netlify.app, Foco em main-thread / JS execution (pedido explícito do usuário), Passo 1 — Produção reflete o código local?, Passo 2 — Headers de cache reais, Passo 3 — Lighthouse real contra produção, Passo 4 — Recorrência ou causa nova?, Passo 5 — Recomendação priorizada (nada implementado) (+2 more)

### Community 63 - "Oportunidades identificadas para próxima rodada"
Cohesion: 0.18
Nodes (10): Atualização — Rodada 2 (remoção do Bootstrap), Itens marcados como pendentes na Rodada 1 — status atualizado, Métricas de página (Rodada 1 "depois" → pós-remoção do Bootstrap), Novas (surgiram após as mudanças, investigadas), Novo item pendente identificado, Oportunidades identificadas para próxima rodada, Pendentes (já existiam antes, não foram tratadas), Regressões (Rodada 1 → Rodada 2) (+2 more)

### Community 64 - "Plano de Skills para o Projeto Perin_Rev"
Cohesion: 0.18
Nodes (10): 1. `carousel-check` (prioridade alta), 2. `changelog-update` (prioridade média), 3. `run-static-site` (prioridade média), 4. `jest-focus` (prioridade baixa), Como implantar, Contexto do projeto, Fora de escopo (já cobertas por skills globais), Ordem de implementação sugerida (+2 more)

### Community 65 - "Graphify — Automação e Manutenção do Grafo de Conhecimento"
Cohesion: 0.18
Nodes (10): 1. O que é o Graphify neste projeto, 2. Estado atual da instalação, 3. Quando atualizar o Graphify, 4. Comandos de atualização, 5. Fluxo recomendado, 6. Automação futura, 7. Orientações para assistentes de IA, Arquivos gerados em `graphify-out/` (+2 more)

### Community 66 - "Uso real do Bootstrap — Investigação (sem implementação)"
Cohesion: 0.20
Nodes (9): Classes CSS do Bootstrap, Componentes JS do Bootstrap, Passo 1 — Mapeamento do uso real, Passo 2 — Comparação de estratégias, Passo 3 — Recomendação, Passo 4 — Aguardando decisão, Peso atual (medido via Lighthouse, network real), Ressalva importante antes de decidir (+1 more)

### Community 67 - "Limpeza executada — 21/07/2026"
Cohesion: 0.20
Nodes (9): 1. Assets órfãos (~31,6 MB), 2. Relatórios Lighthouse intermediários (~5,65 MB), 3. Dependência não usada, Espaço total liberado, Limpeza executada — 21/07/2026, Não commitado, O que foi mantido (por decisão explícita), O que foi removido (+1 more)

### Community 68 - "Plano Técnico — Vídeo Time-lapse de Fundo no Hero"
Cohesion: 0.20
Nodes (9): 1. Estratégia de loop — DECISÃO: dois arquivos encadeados via `ended`, 2. Formato e encoding, 3. Estratégia de carregamento, 4. Estratégia de fallback (poster-only, sem vídeo), 5. Acessibilidade, 6. Localização de arquivos, 7. Orçamento de performance, Plano Técnico — Vídeo Time-lapse de Fundo no Hero (+1 more)

### Community 69 - "Relatório de Performance — Perin Construções"
Cohesion: 0.14
Nodes (13): Antes vs. Depois, Carrossel de clientes parado em mobile — causa raiz e correção, Carrossel de clientes — velocidade de rotação aumentada em 1.5x, Causa raiz confirmada, Como revisar esta branch localmente, Correção implementada, Decisão registrada, Mobile: conteúdo não revelava ao rolar (+5 more)

### Community 70 - "Carregamento inicial: poster, hero entrance, primeira seção, travamento intermitente"
Cohesion: 0.20
Nodes (10): Carregamento inicial: poster, hero entrance, primeira seção, travamento intermitente, Causa raiz confirmada empiricamente (Puppeteer + CDP, Slow-4G simulado + CPU 4x), Fechamento, Passo 1 — Cadeia de dependências do carregamento, Passo 3 — Travamento intermitente (sintoma mais grave): NENHUM deadlock/Promise pendente encontrado, Passo 4 — Recomendação sobre o `delay: 0.4` (aguardando aprovação, nada alterado ainda), Passo 5 — Correções 1-3 implementadas (Passo 4 aguardando aprovação), Resumo das causas (Passo 4) (+2 more)

### Community 71 - "GSAP self-hosted (elimina dependência de CDN externo)"
Cohesion: 0.22
Nodes (9): ⚠️ Achado colateral crítico — `.min` desatualizados em produção, Cache (Passo 4) — ressalva resolvida, Confirmação da versão e escopo (Passo 1), GSAP self-hosted (elimina dependência de CDN externo), Peso adicionado ao repositório, Trava permanente — git hook pre-commit (Passo 3), Validação (Passo 3), Vendorização (Passo 2) (+1 more)

### Community 72 - "Hero: vídeo + correções"
Cohesion: 0.22
Nodes (9): Bug 1 — `styles.min.css` desatualizado (causa do conflito visual), Bug 2 — vídeo não tocava sozinho (`play()`/`is-visible` nunca disparavam) — BLOQUEANTE, corrigido, Contraste do texto (validação Opção B), Decisão de design, Hero: vídeo + correções, Lighthouse — antes vs. depois das correções, Recompressão de vídeo, Testes (+1 more)

### Community 73 - "Travamento recorrente no Safari iOS — causa raiz e correção"
Cohesion: 0.22
Nodes (9): Causa raiz confirmada, Correção aplicada, Passo 1 — Instrumentação de performance real no dispositivo (`?debug=perf`), Passo 2 — Checkpoints granulares no bloco síncrono de `initPage()`, Passo 3 — Investigação e descarte do padrão periódico de ~3s, Passo 4 — Isolamento por eliminação via `?isolate=...`, Passo 5 — Separação entre blur estático e animação (`no-blur-only` / `no-animation-only`), Travamento recorrente no Safari iOS — causa raiz e correção (+1 more)

### Community 74 - "01 — Card de contato flutuante no hero"
Cohesion: 0.29
Nodes (6): 01 — Card de contato flutuante no hero, Ajustes necessários ao aplicar no Perin, Atenção ao integrar — riscos previsíveis, Como o card transborda e sobrepõe a seção seguinte, Estratégia de posicionamento, Valores de espaçamento e dimensão por breakpoint

### Community 75 - "hero-video.regression.test.js"
Cohesion: 0.22
Nodes (3): fs, html, path

### Community 76 - "Notas de Implementação — Vídeo de Fundo no Hero"
Cohesion: 0.25
Nodes (7): Bug encontrado e corrigido durante a implementação, Desvios em relação ao plano, Fase 3 — Refinamento visual (taste), Notas de Implementação — Vídeo de Fundo no Hero, Pendências para Fase 3 (taste-skill), Verificação pós-Fase-3, Verificação realizada

### Community 77 - "Verificação de Produção — Commit `ab2b2ae`"
Cohesion: 0.29
Nodes (6): Passo 1 — Diff byte-a-byte, produção vs. commit local, Passo 2 — Confirmação da presença específica das três correções em produção, Passo 3 — Diagnóstico honesto, Passo 4 — Não aplicável, Resumo, Verificação de Produção — Commit `ab2b2ae`

### Community 78 - "Relatório de Organização — Portfólio de Obras"
Cohesion: 0.29
Nodes (6): Imagens em "Dúvidas" (baixa confiança de agrupamento), Lógica usada para diferenciar cada projeto, Próximos passos sugeridos, Quantidade de fotos por projeto, Relatório de Organização — Portfólio de Obras, Resumo geral

### Community 79 - "O que foi alterado, por categoria"
Cohesion: 0.29
Nodes (7): Cache (Netlify), Fontes, Imagens (com confirmação prévia do usuário sobre imagens do carrossel), Lazy loading e prioridade, Minificação (passe manual único, não é processo de build), O que foi alterado, por categoria, Scripts

### Community 80 - "Mobile: travamento por sobrecarga de main thread"
Cohesion: 0.29
Nodes (7): Causas identificadas (evidência, não suposição), Como validar no Safari real do iPhone (Web Inspector remoto, aba Timelines), Correções aplicadas (Direções 1 e 2 do plano; Direção 3 — `ScrollTrigger.batch()` — adiada para depois da validação real), Inventário de `initPage()` (script.js:1821-1853, antes desta correção), Limitação do ambiente, Mobile: travamento por sobrecarga de main thread, Validação

### Community 81 - "Cascading Slider — pacote isolado"
Cohesion: 0.29
Nodes (6): Cascading Slider — pacote isolado, Coisas importantes a saber, Como testar, Como usar em outro projeto, Estrutura, Referência à auditoria completa

### Community 82 - "02 — Carrossel de clientes: posicionamento e continuidade visual"
Cohesion: 0.33
Nodes (5): 02 — Carrossel de clientes: posicionamento e continuidade visual, Como aplicar no Perin — só reposicionar, não substituir o carrossel, Onde quebrar a alternância de cores em xadrez, Por que não há cabeçalho na seção de logos, e o efeito disso, Relação espacial hero → logos → sobre

### Community 83 - "Validação pendente: iPhone real"
Cohesion: 0.33
Nodes (6): 1. Velocidade percebida, 2. Confirmação técnica via Web Inspector, 3. Teste visual, 4. Rotação / redimensionamento (borda do breakpoint), 5. Cache real (pendente desde a Rodada 3, aproveitar o deploy atual), Validação pendente: iPhone real

### Community 84 - "ScrollTrigger.batch() — redução de instâncias"
Cohesion: 0.33
Nodes (6): ⚠️ Achado importante — a premissa "batch() reduz o número de instâncias" está incorreta, Correção — `leaveStagger: 0` no `onLeaveBack`, Passo 1 — Mapeamento e correção de uma contagem anterior incorreta, Passo 2 — Implementação, Passo 3 — Validação, ScrollTrigger.batch() — redução de instâncias

### Community 85 - "Contenção de main thread durante a animação do hero (Passo 0) + redução da timeline (Passo 1)"
Cohesion: 0.33
Nodes (6): Achado metodológico — minha primeira medição de "stutter" estava contaminada, Confirmação do carrossel, Contenção de main thread durante a animação do hero (Passo 0) + redução da timeline (Passo 1), Passo 0 — reordenar `initPage()` para tirar trabalho síncrono do caminho do hero, Passo 1 — timeline reduzida (~2,85s → ~1,5s), Validação — armadilha do ambiente de teste headless

### Community 86 - "Parte 2 — Validação de cache (pendente, só após deploy)"
Cohesion: 0.33
Nodes (6): Checklist de validação pós-deploy pendente, Opção 1 — `curl` direto nos headers de resposta, Opção 2 — Lighthouse contra produção, Parte 1 — Logos superdimensionados, Parte 2 — Validação de cache (pendente, só após deploy), Rodada 3 — Logos superdimensionados + preparação de validação de cache

### Community 87 - "Correções: scheduling do hero, ordem cascading slider, touchcancel carrossel clientes"
Cohesion: 0.33
Nodes (6): Correção 1 — Scheduling do hero: fila idle só começa após `onComplete` da timeline, Correção 2 — Ordem entre criação de ScrollTrigger e mutações de altura pós-load, Correção 3 — `touchcancel` no carrossel de clientes, Correções: scheduling do hero, ordem cascading slider, touchcancel carrossel clientes, Resumo do que mudou desde o diagnóstico aprovado, Validação final

### Community 88 - "Mobile: vídeo condicional + correção de download prematuro"
Cohesion: 0.33
Nodes (6): Correção do download prematuro do reverse (desktop + mobile), Deploy, Lógica do breakpoint, Mobile: vídeo condicional + correção de download prematuro, Peso do hero — antes vs. depois (mobile), Validação

### Community 89 - "Correção: fila de inicializações em lote (não mais sequencial via idle individual)"
Cohesion: 0.33
Nodes (6): Correção: fila de inicializações em lote (não mais sequencial via idle individual), Passo 1 — Confirmação antes de mudar, Passo 2 — Reorganização em dois grupos, Passo 3 — Validação com medição real de timing, Passo 4 — Confirmação de que a proteção original não regrediu, Resumo entregável

### Community 90 - "Rodada 2 — Remoção do Bootstrap"
Cohesion: 0.33
Nodes (6): Métricas — antes da remoção vs. depois, Métricas — desde o início (Fase 1, pré-otimização) até agora, O que foi feito, Rodada 2 — Remoção do Bootstrap, Testes automatizados, Validação visual

### Community 91 - "Extração de padrões — burkhardprojekte.ch → Perin Construções"
Cohesion: 0.40
Nodes (4): Extração de padrões — burkhardprojekte.ch → Perin Construções, Ordem recomendada de integração no Perin, Resumo de riscos gerais, Índice dos componentes

### Community 92 - "Headroom"
Cohesion: 0.40
Nodes (4): Como fechar essa pendência, Em aberto — preencher quando souber, Headroom, Papel conhecido

### Community 102 - "process-diagram.regression.test.js"
Cohesion: 0.22
Nodes (6): css, flush(), fs, html, loadScript(), path

## Knowledge Gaps
- **549 isolated node(s):** `fs`, `path`, `html`, `portfolioProjects`, `portfolioProjects` (+544 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `script.min.js` to `r`, `r`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `wb()` connect `Tween` to `r`, `gsap/gsap.min.js`, `ce`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `eb()` connect `r` to `script.min.js`, `gsap/gsap.min.js`, `Tween`, `ja`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `html` to the rest of the system?**
  _549 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07256894049346879 - nodes in this community are weakly interconnected._
- **Should `script.min.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08069381598793364 - nodes in this community are weakly interconnected._
- **Should `gsap/gsap.min.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06342780026990553 - nodes in this community are weakly interconnected._