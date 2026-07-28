# Revisão Técnica e Plano de Melhorias — Perin_Rev

> Revisão feita na ótica da skill `senior-engineer-review` (Engenheiro de Software Sênior + QA, `AGENTS.md` §1/§8/§9/§13), lendo o código real de `script.js`, `styles.css`, `index.html` e `tests/`. Skill carregada manualmente (criada nesta mesma sessão, ainda não registrada no índice de skills do harness — funcionará via `/senior-engineer-review` numa sessão nova).

## Achados (mais grave primeiro)

### 1. ~~`AGENTS.md` documenta uma regra do carrossel que diverge do código e dos testes~~ — ✅ CORRIGIDO em 07/07/2026
**Arquivo:** `AGENTS.md` (seção "Carrossel de Projetos — Implementação Oficial") vs. `script.js:302-303` e `tests/regression/slider.regression.test.js:325-330`.
**O problema:** `AGENTS.md` afirma que a transição usa `duration: 0.60s` e `cubic-bezier(0.6, 0.03, 0.15, 1)`. O código real (`createCascadingSlider`, `script.js:302-303`) usa `DURATION = 0.70` e `CURVE = 'cubic-bezier(0.40, 0.00, 0.30, 1.00)'` — e os próprios testes de regressão **afirmam explicitamente os valores do código**, não os do documento (`slider.regression.test.js:325-330`).
**Por que importa:** `AGENTS.md` é declarado como "fonte da verdade" e as regras do carrossel são tratadas como imutáveis, exigindo aprovação explícita para mudar. Se a documentação está desatualizada, qualquer IA ou dev que "corrija" o código para bater com `AGENTS.md` vai **quebrar o comportamento aprovado e testado**, ou vice-versa. Isso é uma bomba-relógio de regressão.
**Também diverge:** `AGENTS.md` só documenta 2 breakpoints (desktop / mobile <750px, 5 ou 3 slides). O código real tem **4 tiers**: `mobile` (≤480), `tablet` (≤750), `notebook` (≤1200), `desktop` (>1200) — com proporções próprias por tier (`PCT_NOTEBOOK = [0.08, 0.16, 0.52, 0.16, 0.08]`, `script.js:307`; `PCT_TABLET = [0.15, 0.70, 0.15]`, `script.js:308`), não documentadas em nenhum lugar.
**Ação:** decidir qual é a fonte correta (provavelmente o código, já que é o que está em produção e testado) e **reescrever a seção do `AGENTS.md`** para refletir os 4 breakpoints e os valores reais de duração/curva. Não corrigir isso silenciosamente sem confirmar com o usuário qual lado está certo.

**Resolvido:** `AGENTS.md` (seção "Carrossel de Projetos — Implementação Oficial") reescrito para refletir o código real, sem alterar `script.js`/`styles.css`/`index.html`:
- Duração/curva corrigidas para `0.70s` / `cubic-bezier(0.40, 0.00, 0.30, 1.00)`, com nota para manter código + doc + teste sincronizados em qualquer mudança futura.
- Documentados os 4 tiers reais (`desktop` >1200, `notebook` 1024–1200, `tablet` 750–1024, `mobile` ≤750) com as proporções de cada um, em vez dos 2 tiers antigos.
- Removida a menção a um `getProportions()`/parâmetro `hidden` que não existe no código — descrito o comportamento real (`getPCT()` + slides fora de `-1..1` com `opacity:0`/`pointer-events:none`).
- **Achado extra descoberto na sincronização:** o CSS define altura responsiva via `clamp(280px, 42vw, 420px)` (`styles.css:1208`), mas o JS sobrescreve com `420px` fixo em todo breakpoint (`script.js:370`) — a doc alegava altura "adaptada", o que não é verdade no comportamento atual. Documentado como comportamento real (não corrigido no código, pois não foi pedido).

### 2. `initPage()` não isola falhas por seção — um erro em qualquer `init*()` pode interromper a inicialização das seções seguintes
**Arquivo:** `script.js:1704` (`initPage`) chamando as ~20 funções `init*()` em sequência direta, sem try/catch.
**Cenário de falha concreto:** se um `id`/seletor mudar no HTML (ex.: renomear `#heroParticles`) e `createParticles()` (`script.js:12`) lançar `TypeError: Cannot read properties of null` ao chamar `container.appendChild`, **toda função chamada depois dela em `initPage()` deixa de rodar** — incluindo `initContactForm()`, a funcionalidade de conversão do site.
**Por que importa:** o formulário de contato é a única fonte de lead do site (ver `PRD.md` §6). Um erro isolado e não relacionado (ex.: hero) pode silenciosamente desativar o formulário de contato inteiro sem nenhum sinal de erro visível ao usuário.
**Ação:** envolver cada chamada em `initPage()` com try/catch individual + `console.error` nomeando a seção que falhou.

### 3. Nenhuma verificação de elemento nulo antes de manipular DOM em várias `init*()`
**Arquivos/linhas:** `script.js:12` (`createParticles` — `container.appendChild` sem checar se `heroParticles` existe), `script.js:28-29` (`initHeroParallax` — `geometries`/`lighting`/`grid` sem null-check antes de `.style.transform` dentro do listener), `script.js:142-144` (`initNavigation` — `nav`/`toggle`/`mobileMenu` sem null-check).
**Contraste:** `initHeroAnimations` (`script.js:54`) e `initHeroEntrance` (`script.js:101`) **fazem** o null-check corretamente (`if (!hero || !canvas || !overlay) return;`). Ou seja, o padrão certo já existe no arquivo, só não foi aplicado de forma consistente.
**Por que importa:** inconsistência é o pior tipo de bug — parte do código é defensiva, parte não, sem critério aparente. Isso mistura com o achado #2 (uma falha aqui interrompe o restante de `initPage()`).
**Ação:** aplicar o mesmo padrão de guard clause (`if (!el) return;`) usado em `initHeroAnimations`/`initHeroEntrance` em todas as demais `init*()`.

### 4. Formulário de contato — único ponto de conversão do site — sem nenhum teste automatizado
**Arquivos:** `script.js:949-1308` (toda a lógica de validação/submissão), `tests/` (125 testes, 100% concentrados no carrossel — confirmado por contagem em `tests/unit/slider.test.js` e `tests/regression/slider.regression.test.js`).
**Por que importa:** já registrado em `SPECS.md` §3/§5 e `PRD.md` §8 — reforçando aqui porque é o achado de QA mais crítico do projeto. `validateEmail()` (`script.js:1018`) usa regex própria não auditada; uma regressão nela bloquearia leads legítimos silenciosamente, sem qualquer teste que pegue isso em CI.
**Ação:** criar `tests/unit/contact-form.test.js` cobrindo `validateName`, `validateEmail`, `sanitizeString`, `applyPhoneMask` (casos válidos/inválidos/limites) e um teste de regressão para o fluxo de submissão (mock de `fetch`).

### 5. `script.js` é um arquivo único de ~1750 linhas / ~30 funções globais sem módulos (code smell, `AGENTS.md` §6)
**Arquivo:** `script.js` inteiro.
**Por que importa:** não é bloqueante no tamanho atual, mas cada função depende de estado global implícito (ex.: `portfolioState`, `portfolioSliderInstance` em `script.js:557-589`) e de ordem de execução em `initPage()`. Isso dificulta testar qualquer função isoladamente sem carregar o arquivo inteiro no jsdom.
**Ação (não urgente):** se o arquivo crescer mais, extrair por seção (`hero.js`, `portfolio.js`, `contact.js`, `navigation.js`) usando `<script type="module">` — sem framework, mantendo a filosofia vanilla do projeto.

### 6. Interpolação de string em `innerHTML` para dados hoje estáticos, mas sem barreira caso isso mude
**Arquivos:** `script.js:637-645` (cards do portfólio) e `script.js:707-717` (slides do viewer) — `project.name`, `project.subtitle`, `photo` interpolados diretamente em `innerHTML`.
**Por que importa:** hoje `portfolioProjects` (`script.js:247-290`) é um array hardcoded no próprio arquivo — não há risco de XSS real agora. Mas é um padrão frágil: se no futuro esses dados vierem de um CMS/API (`PRD.md` §7 já cogita isso como possível evolução), a interpolação direta em `innerHTML` vira uma injeção de HTML sem nenhuma barreira.
**Ação:** não é urgente corrigir agora (YAGNI — dado é estático), mas **documentar a premissa** com um comentário curto no topo de `portfolioProjects` (`script.js:247`) avisando que qualquer fonte dinâmica futura exige sanitização antes de virar `innerHTML`.

### 7. `prefers-reduced-motion` não é verificado em nenhuma animação
**Arquivos:** `initHeroParallax` (`script.js:27`), `initHeroEntrance` (`script.js:99`), `createParticles` (`script.js:11`), todo o motor GSAP do carrossel.
**Por que importa:** já registrado em `SPECS.md` §5.3/`PRD.md` §8 — o site tem parallax de mouse, partículas e transições GSAP; usuários com sensibilidade a movimento (ou que configuraram `prefers-reduced-motion: reduce` no SO) recebem a experiência completa sem alternativa.
**Ação:** checar `window.matchMedia('(prefers-reduced-motion: reduce)').matches` no início de `initPage()` e, se `true`, pular `createParticles`, `initHeroParallax` e reduzir/zerar durações do GSAP.

### 8. Imagens pesadas sem otimização confirmada
**Arquivos:** `trabalhando01.jpeg` a `trabalhando05.jpeg`, 208KB–350KB cada, usadas repetidamente como fotos de projeto em `portfolioProjects` (`script.js:253-288`).
**Por que importa:** essas 5 imagens se repetem entre os 6 projetos do portfólio — o carrossel de cada projeto carrega várias delas. Sem lazy loading confirmado nos slides do viewer (`script.js:710` — `<img>` sem atributo `loading="lazy"`, diferente dos cards da galeria que **têm** `loading="lazy"` em `script.js:639`), o viewer pode carregar 5 imagens pesadas de uma vez ao abrir qualquer projeto.
**Ação:** adicionar `loading="lazy"` nas imagens do slide do viewer (`script.js:710`) e avaliar compressão/redimensionamento das `trabalhando0X.jpeg` (hoje maiores que o necessário para exibição em carrossel).

## Plano de ação priorizado

| # | Item | Esforço | Risco se não feito | Ordem |
|---|---|---|---|---|
| 1 | Corrigir divergência `AGENTS.md` vs. código real (duração/curva/breakpoints do carrossel) | Baixo (só documentação) | Alto — próxima mudança "seguindo a doc" quebra o carrossel aprovado | 1º |
| 2 | Try/catch por seção em `initPage()` | Baixo | Alto — falha silenciosa pode desativar o formulário de contato | 2º |
| 3 | Testes automatizados do formulário de contato | Médio | Alto — único ponto de conversão sem rede de segurança | 3º |
| 4 | Null-checks consistentes nas `init*()` que faltam | Baixo | Médio — mesma causa raiz do item 2 | 4º (junto com o 2) |
| 5 | `loading="lazy"` nas imagens do viewer + revisão de compressão | Baixo | Médio — performance percebida, principalmente mobile | 5º |
| 6 | Checagem de `prefers-reduced-motion` | Baixo/Médio | Médio — acessibilidade | 6º |
| 7 | Comentário de premissa sobre `innerHTML` em `portfolioProjects` | Trivial | Baixo hoje, alto se dado virar dinâmico | Junto com qualquer mudança nessa área |
| 8 | Modularização de `script.js` | Alto | Baixo agora, cresce com o tempo | Backlog, sem urgência |

## Observação sobre commit recente

O commit `c7f609a` ("fix: prevent viewer auto-close by removing minHeight release in openProject onComplete") já corrigiu um bug relacionado exatamente à área de `openProject`/`closeProject` (`script.js:672-929`) revisada aqui — reforça que essa área (transição do viewer de portfólio) é historicamente frágil e merece os testes de regressão do item 3 estendidos para cobrir abertura/fechamento do viewer, não só o carrossel interno.

## Próximo passo sugerido
Confirmar com o usuário qual conjunto de valores é a "verdade" do carrossel (código atual vs. `AGENTS.md`) antes de tocar em qualquer um dos dois — é a única decisão deste plano que não pode ser resolvida só com leitura de código.
