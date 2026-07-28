# Especificações do Projeto — Perin Construções (portfólio)

> Gerado aplicando a lente da skill `senior-engineer-review` (Engenheiro de Software Sênior + Engenheiro de QA, conforme `AGENTS.md` §1 e §13). O projeto não tinha specs formais além das regras do carrossel em `AGENTS.md` — este documento preenche essa lacuna a partir do código real (`index.html`, `script.js`, `styles.css`, `tests/`).

## 1. Visão geral

Site institucional/portfólio estático (sem backend próprio, sem build step) para a empresa **Perin Construções**. Estrutura: `index.html` (markup + 11 seções), `script.js` (~1750 linhas, toda a lógica em funções globais inicializadas via `initPage()`), `styles.css`. Formulário de contato submete via **Netlify Forms** (`fetch('/', ...)`, `data-netlify="true"`) — não há API própria.

## 2. Inventário funcional (por seção, `index.html`)

| # | Seção (`id`) | Responsável em `script.js` | Spec funcional |
|---|---|---|---|
| 1 | `hero` | `createParticles`, `initHeroParallax`, `initHeroAnimations`, `initHeroEntrance`, `diagnoseHeroState` | Cena de entrada animada com parallax e partículas. Deve degradar sem travar se `prefers-reduced-motion` estiver ativo (**não verificado no código — ver §5.3**). |
| 2 | `about` | `initScrollReveals` (compartilhado) | Reveal on-scroll de texto institucional. |
| 3 | `clients` | `initClientsCarousel` | Carrossel de logos de clientes — **carrossel distinto** do carrossel de projetos; não está sob as regras "imutáveis" de `AGENTS.md` (essas são exclusivas de `portfolio-gallery-section`). |
| 4 | `differentials` | `initDifferentialsAnimation` | Destaques/diferenciais com animação de entrada. |
| 5 | `portfolio` | `createCascadingSlider`, `initCascadingSlider`, `initPortfolioGallery` | **Carrossel de projetos oficial** — regras fixas em `AGENTS.md` (proporções, easing, imagem estática). Único componente com testes (`tests/unit/slider.test.js`, `tests/regression/slider.regression.test.js`). |
| 6 | `services` | `initServicesInteraction`, `initServiceGridAdjust`, `initServicesReveal` | Grade de serviços interativa. |
| 7 | `segments` | `initSegmentsTabs` | Abas de segmentos de atuação. |
| 8 | `process` | (reveal compartilhado) | Linha do tempo "como trabalhamos". |
| 9 | `testimonials` | `initTestimonialsReveal` | Depoimentos de clientes. |
| 10 | `faq` | (markup, sem JS dedicado identificado) | Perguntas frequentes — confirmar se usa `<details>` nativo ou JS de accordion. |
| 11 | `contact` | `initContactForm`, `initCustomSelect`, validações (`validateName`, `validateEmail`, `applyPhoneMask`, `checkPhone`, `checkEmail`, `checkService`) | Formulário de contato com validação client-side + honeypot anti-spam (`formWebsite`, `netlify-honeypot="website"`) + submissão via Netlify Forms. |
| — | Navegação | `initNavigation` | Menu fixo/scroll. |
| — | Micro-interação global | `initButtonRipple`, `initCounters` | Ripple em botões, contadores animados. |

## 3. Especificação do formulário de contato (o fluxo de maior risco do site)

Campos: `formName`, `formPhone`, `formEmail`, `customServiceText` (select customizado), `formMessage`, `formWebsite` (honeypot, `tabindex="-1"`, oculto).

**Regras de validação client-side (script.js:949-1105):**
- Nome: `validateName()` limpa caracteres inválidos em tempo real, `capitalizeName()` formata; erro se vazio no blur.
- Telefone: `applyPhoneMask()` aplica máscara BR a cada input; `checkPhone()` valida dígitos.
- E-mail: `validateEmail()` (regex, não lida aqui) + `checkEmail()` no blur/input.
- Serviço: obrigatório via seleção do `customServiceText`.
- Todos os campos sanitizados antes do envio via `sanitizeString()` (script.js:1152-1158): trim + strip de tags HTML (`<[^>]*>`) + limite de 1000 chars.

**Envio (script.js:1184-1205):** `POST /` com `Content-Type: application/x-www-form-urlencoded`, corpo montado via `URLSearchParams`, incluindo `form-name=contato`, `_timestamp` e `_source` como metadados.

**Gaps de segurança/QA identificados (ótica sênior + QA, AGENTS.md §9 e §13):**
1. **Sanitização client-side não é suficiente e não deveria ser tratada como controle de segurança** — é só UX. A validação real de spam/injeção depende inteiramente do Netlify Forms (honeypot). Isso é aceitável para um site estático sem backend próprio, mas deve ser **documentado como limitação conhecida**, não como proteção.
2. **`validateEmail()` usa regex própria** — não foi auditada aqui; regex de e-mail mal escrita é uma fonte clássica de falso-negativo/positivo. Precisa de teste unitário dedicado (não existe hoje).
3. **Nenhum teste cobre o formulário de contato.** `tests/unit` e `tests/regression` cobrem **exclusivamente o carrossel**. Isso é o maior gap de QA do projeto — um formulário que lida com PII (nome, telefone, e-mail) sem nenhum teste automatizado.
4. **PII em `_timestamp`/payload:** nome, telefone e e-mail trafegam em claro para o Netlify (esperado, é o propósito do form) — confirmar que não há log client-side (`console.log`) desses valores em nenhum ponto do fluxo (checar antes de qualquer PR que toque `initContactForm`).

## 4. Especificação técnica — arquitetura (`script.js`)

- **God file / falta de módulos (code smell, AGENTS.md §6):** `script.js` tem ~1750 linhas e ~30 funções globais, todas no mesmo arquivo, sem namespacing, expostas via `window.getSelectedService`. Risco: colisão de nomes, dificuldade de teste isolado. Não é bloqueante para o tamanho atual do site, mas **qualquer nova feature deveria considerar extrair para módulos ES (`<script type="module">`) ou pelo menos agrupar por seção** (hero.js, portfolio.js, contact.js) caso o arquivo cresça mais.
- **Camadas:** o projeto mistura DOM handling com lógica de validação na mesma função em vários pontos (ex.: `checkName()`/`checkPhone()` provavelmente leem e escrevem DOM diretamente) — aceitável para o porte do projeto (site estático simples), mas vale isolar as funções puras de validação (`validateName`, `validateEmail`, `sanitizeString`) das que tocam DOM, para permitir teste unitário sem jsdom completo.
- **Inicialização:** tudo entra por `initPage()` → `DOMContentLoaded` (script.js:1704, 1733). Padrão correto para site sem framework.

## 5. Especificação de QA — cobertura necessária (AGENTS.md §13)

Estado atual: **125 casos de teste, 100% concentrados no carrossel de projetos** (`tests/unit/slider.test.js`: 49, `tests/regression/slider.regression.test.js`: 76). Nenhuma outra seção tem teste.

### 5.1 Cobertura obrigatória a criar (por prioridade)

| Prioridade | Área | Testes necessários |
|---|---|---|
| Alta | Formulário de contato | Unit: `validateName`, `validateEmail`, `sanitizeString`, `applyPhoneMask` (casos válidos, inválidos, limites — string de 1001 chars, e-mail malformado, telefone incompleto). Regression: fluxo completo de submissão (mock do `fetch`), bloqueio de submit com campo obrigatório vazio, honeypot preenchido não deve submeter como válido. |
| Alta | `initCustomSelect` | Seleção de serviço via teclado (acessibilidade) e mouse; estado "nenhum selecionado" bloqueia submit. |
| Média | `initClientsCarousel` | Smoke test de navegação (diferente do carrossel de projetos — não tem regras fixas, mas precisa não quebrar). |
| Média | `initNavigation` | Scroll para âncora, estado ativo do menu. |
| Baixa | `initCounters`, `initButtonRipple`, reveals on-scroll | Smoke test de que não lançam erro em DOM vazio/elemento ausente. |

### 5.2 Edge cases transversais a cobrir em qualquer novo teste
- Elemento ausente no DOM (ex.: seção removida) não deve lançar exceção não tratada — hoje várias funções assumem `getElementById` sempre retorna elemento (sem null-check), ex.: `nameInput`, `phoneInput` em `initContactForm` (script.js:1108-1111). **Risco real:** se o markup de alguma dessas seções for editado/removido futuramente, `initPage()` quebra silenciosamente para todo o resto do script, pois todas as inits rodam em sequência sem isolamento de erro.
- **Recomendação concreta:** envolver cada `init*()` em `initPage()` com try/catch individual + log estruturado do erro (console.error com o nome da seção), para que uma seção quebrada não impeça as demais de inicializar — hoje um erro em `initHeroParallax()`, por exemplo, pode interromper toda a cadeia de `initPage()` dependendo da ordem de execução.

### 5.3 Acessibilidade (não coberto, recomendado)
- Confirmar respeito a `prefers-reduced-motion` nas animações GSAP (`createParticles`, `initHeroParallax`, transições do carrossel) — hoje não há evidência de checagem dessa media query no código.
- Navegação por teclado no `customServiceText`/select customizado (ver §5.1).

## 6. O que este documento NÃO substitui

- As regras "imutáveis" do carrossel de projetos continuam **exclusivamente** em `AGENTS.md` (seção "Carrossel de Projetos — Implementação Oficial") — este documento referencia, não duplica.
- Este é um levantamento do estado atual + gaps, não um roadmap de produto. Priorização de qual gap atacar primeiro é decisão do usuário.

## 7. Próximos passos sugeridos (ordem de risco)

1. Testes para `initContactForm`/validações — maior superfície de risco sem cobertura (PII + spam).
2. Isolamento de erro por seção em `initPage()` (try/catch) — baixo esforço, alto ganho de resiliência.
3. Testes para `initCustomSelect` (acessibilidade + bloqueio de submit).
4. Avaliar extração de `script.js` em módulos, apenas se o arquivo continuar crescendo.
