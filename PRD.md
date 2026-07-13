# PRD — Site Institucional Perin Construções

> Documento produzido no papel de **Product Owner especialista**, a partir da análise real do código (`index.html`, `script.js`, `styles.css`, `AGENTS.md`, `SPECS.md`, `tests/`). Onde uma informação de negócio (público-alvo, metas comerciais, KPIs) não está presente no código e não foi confirmada pelo usuário, ela é marcada como **[ASSUNÇÃO]** — deve ser validada antes de virar critério de aceite oficial.

## 1. Visão do produto

Site institucional/portfólio one-page para a **Perin Construções**, com o objetivo de apresentar a empresa, seus diferenciais, portfólio de obras/projetos e capturar leads via formulário de contato. É a vitrine digital da empresa — não é um sistema transacional, não tem login, não tem backend próprio (usa Netlify Forms para captura de lead).

## 2. Problema a resolver

**[ASSUNÇÃO]** Empresas de construção/engenharia dependem de portfólio visual e prova social (depoimentos, clientes atendidos) para gerar confiança e converter visitantes em leads qualificados (pedidos de orçamento/contato). O site resolve isso substituindo material impresso/apresentações avulsas por uma vitrine digital sempre disponível, otimizada para conversão no formulário de contato.

## 3. Objetivo de negócio e métrica de sucesso

**[ASSUNÇÃO — validar com o usuário]**
- **Objetivo primário:** maximizar a taxa de conversão de visitante → lead (submissão válida do formulário de contato).
- **Métricas candidatas** (nenhuma instrumentação de analytics foi encontrada no código — ver §8, gap):
  - Taxa de submissão do formulário / visitantes únicos.
  - Taxa de scroll até a seção `contact`.
  - Taxa de rejeição (bounce) na seção `hero`.
  - Tempo até o primeiro clique no carrossel de portfólio (engajamento com prova social).

## 4. Personas

**[ASSUNÇÃO]**
| Persona | Necessidade | Onde no site |
|---|---|---|
| Decisor de obra (dono de imóvel/empresa) buscando construtora | Ver portfólio real, confiar na empresa, saber quais serviços são oferecidos, entrar em contato rápido | `portfolio`, `about`, `differentials`, `contact` |
| Comparador (está pesquisando várias construtoras) | Ver clientes já atendidos, depoimentos, segmentos de atuação, FAQ para tirar dúvidas sem precisar ligar | `clients`, `testimonials`, `segments`, `faq` |
| Visitante mobile (celular, sessão curta) | Navegação rápida, formulário simples de preencher no toque | Todo o site — regras de responsividade em `AGENTS.md`/mobile <750px |

## 5. Escopo funcional (estado atual — "as built")

Baseado no inventário de `SPECS.md` §2. O PRD aqui **documenta o que já existe como baseline**, para servir de referência a futuras evoluções.

| Épico | Seção (`id`) | Descrição | Status |
|---|---|---|---|
| Apresentação institucional | `hero` | Cena de entrada com parallax/partículas, chamada principal | ✅ Implementado |
| Sobre a empresa | `about` | Narrativa institucional com reveal on-scroll | ✅ Implementado |
| Prova social — clientes | `clients` | Carrossel de logos de clientes atendidos | ✅ Implementado |
| Diferenciais competitivos | `differentials` | Destaques do que diferencia a empresa | ✅ Implementado |
| **Portfólio de projetos** | `portfolio` | Carrossel de projetos com regras visuais fixas e aprovadas (ver `AGENTS.md`) | ✅ Implementado, único módulo com testes automatizados |
| Serviços oferecidos | `services` | Grade interativa de serviços | ✅ Implementado |
| Segmentos de atuação | `segments` | Abas por segmento (residencial, comercial, industrial etc. — confirmar rótulos reais) | ✅ Implementado |
| Como trabalhamos | `process` | Linha do tempo do processo/metodologia | ✅ Implementado |
| Depoimentos | `testimonials` | Prova social — depoimentos de clientes | ✅ Implementado |
| FAQ | `faq` | Perguntas frequentes | ✅ Implementado |
| **Captura de lead** | `contact` | Formulário com validação client-side (nome, telefone, e-mail, serviço, mensagem), honeypot anti-spam, envio via Netlify Forms | ✅ Implementado |

## 6. Requisitos não-funcionais (herdados de `AGENTS.md`, aplicados como critério de aceite de produto)

- **Performance:** carregamento não deve ser penalizado por assets pesados — hoje há imagens `.jpeg` de até 350KB (`trabalhando05.jpeg`) sem evidência de otimização/lazy loading confirmada. **Recomendação de produto:** definir orçamento de peso de página (ex.: <2MB total acima da dobra) como critério de aceite de qualquer nova imagem adicionada.
- **Responsividade:** breakpoints já definidos e testados para o carrossel (desktop >1200px, tablet ≤1024px, mobile <750px, small ≤480px) — qualquer nova seção deve seguir os mesmos breakpoints por consistência.
- **Confiabilidade do lead:** o formulário de contato é o único ponto de conversão do site — **é a funcionalidade de maior criticidade de negócio**, mas hoje é a que tem menor cobertura de teste automatizado (`SPECS.md` §3, §5). Isso representa risco direto de perda de leads sem detecção (ex.: uma regressão silenciosa no envio não seria pega por CI).
- **Anti-spam:** honeypot Netlify já implementado — suficiente para o volume esperado de um site institucional; não requer CAPTCHA a menos que spam real seja observado em produção.

## 7. Fora de escopo (nesta versão)

- Área logada / painel administrativo.
- CMS para o cliente editar conteúdo sem deploy.
- Internacionalização (site é 100% PT-BR).
- Analytics/tracking de conversão (ver gap em §8 — está fora do escopo *atual*, mas é a lacuna mais crítica para medir sucesso de produto).

## 8. Gaps de produto identificados (ação recomendada)

| Gap | Impacto | Prioridade |
|---|---|---|
| **Sem analytics/tracking de conversão** — impossível medir a métrica de sucesso definida em §3 sem instrumentação (GA4, Plausible, ou evento no próprio Netlify) | Sem isso, qualquer decisão de produto sobre o site é feita "no escuro" | Alta |
| **Formulário de contato sem teste automatizado** (`SPECS.md` §3, §5.1) | Funcionalidade core do produto (é o único ponto de conversão) sem rede de segurança | Alta |
| **Sem confirmação visual/e-mail de recebimento para o usuário** após envio do form — confirmar se existe tela de "obrigado" (`res.ok` handler, script.js:1204+ trata sucesso, mas UX de confirmação não foi auditada aqui) | Usuário pode reenviar por achar que falhou | Média |
| **`prefers-reduced-motion` não verificado** (`SPECS.md` §5.3) — site tem parallax, partículas e animações GSAP pesadas | Acessibilidade / experiência para usuários sensíveis a movimento | Média |
| **Peso de imagens não otimizado** (`trabalhando0X.jpeg` até 350KB) | Performance percebida, especialmente mobile | Média |
| **FAQ sem JS dedicado identificado** — confirmar se é acordeão acessível (`<details>`) ou estático | Se estático, pode estar sub-aproveitando a seção para reduzir fricção antes do contato | Baixa |

## 9. Critérios de aceite para a próxima iteração (sugestão de backlog priorizado)

1. **Instrumentar analytics básico** (evento de submissão de formulário bem-sucedida, no mínimo) — sem isso, nenhuma decisão de produto futura tem dado.
2. **Cobrir o formulário de contato com testes automatizados** (unit para validações, regression para o fluxo de submissão) — protege a única fonte de receita/lead do site.
3. **Confirmar e formalizar o comportamento pós-envio** (mensagem de sucesso, reset do formulário, tratamento de erro de rede) como especificação explícita, hoje implícita no código.
4. **Auditoria de peso de imagem** com meta explícita de KB por seção.
5. **Checagem de `prefers-reduced-motion`** nas animações de entrada/parallax.

## 10. Perguntas em aberto para o dono do produto

- Qual é a meta real de conversão (nº de leads/mês) e como ela é medida hoje, se não há analytics no código?
- Existe SLA de resposta ao lead após submissão (ex.: e-mail automático, prazo de retorno comercial)?
- O conteúdo (textos, projetos do portfólio, depoimentos) é atualizado por quem — há necessidade real de CMS, ou deploy via Git é aceitável a longo prazo?
- Há meta de SEO (títulos, meta description, dados estruturados) definida, ou o foco é 100% em tráfego pago/direto?
