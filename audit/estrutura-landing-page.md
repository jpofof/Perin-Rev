# Mapa Estrutural da Landing Page — Perin Construções

> Levantamento puramente factual, seção por seção, conforme `index.html` (1036 linhas), `styles.css` (3204 linhas) e `script.js` (2555 linhas) no estado atual do repositório.
> **Sem análise crítica ou recomendações** — apenas descrição do que existe.
> Data do levantamento: 22/07/2026.

---

## 1. Ordem das seções (fluxo narrativo atual)

1. Navegação (header fixo, não é "seção" de conteúdo)
2. Hero
3. About ("Sobre Nós")
4. Clients (carrossel de logos)
5. Differentials ("Diferenciais")
6. Portfolio ("Portfólio")
7. Services ("Nossos Serviços")
8. Segments ("Um Portfólio, Três Escalas")
9. Process ("Como Trabalhamos")
10. Testimonials ("Depoimentos")
11. FAQ
12. Contact ("Contato")
13. Footer

Nota: a navegação (`#services`, `#process`, `#portfolio`) lista a ordem esperada pelo menu como Sobre → Serviços → Como Trabalhamos → Portfólio → FAQ → Contato, mas a ordem **real de renderização no DOM** é a listada acima (Portfólio aparece antes de Serviços no HTML, por exemplo).

---

## 2. Tabela seção por seção

| # | Seção (id) | Título visível | Altura aprox. (desktop) | CTA? | Interatividade | Complexidade técnica |
|---|---|---|---|---|---|---|
| — | `mainNav` (header) | — (logo + menu) | ~80px fixo | 1 link destacado ("Contato") | Menu mobile em overlay, toggle hamburguer | JS de scroll (troca de estado), CSS simples |
| 1 | `hero` | "Construímos o Futuro com Precisão" | 100vh (min 700px) | 2 botões: "Ver Projetos", "Solicitar Orçamento" | Vídeo de fundo (timelapse forward/reverse), scroll indicator, formas SVG com parallax (`data-depth`), partículas animadas | Alta — vídeo de fundo com 2 elementos `<video>`, camadas de luz, geometria SVG, sistema de partículas via JS, timeline GSAP de entrada |
| 2 | `about` | "Engenharia que Constrói Confiança" | `--section-padding` (160px topo/base desktop, 100px mobile) + conteúdo | Nenhum | Nenhuma (estático) | Baixa/Média — grid 2 colunas, 1 imagem placeholder (SVG com texto "[Inserir foto real da equipe/obra]"), reveal via GSAP (`section-title-reveal`, `text-reveal`) |
| 3 | `clients` | "Empresas que Confiam na Perin" | `--section-padding` + altura do carrossel | Nenhum | Carrossel infinito de logos (auto-scroll, `initClientsCarousel`) | Média — JS dedicado (`initClientsCarousel`, ~linha 2074+) para loop infinito de slides |
| 4 | `differentials` | "Por que Escolher a Perin" | `--section-padding` + grid | Nenhum | Nenhuma (estático) | Baixa — grid de 6 cards com ícone SVG inline, reveal via GSAP batch |
| 5 | `portfolio` | "Projetos que Definem Nosso Legado" | `--section-padding` + carrossel/grade dinâmica | Nenhum direto (navegação interna) | Galeria de cards clicáveis → abre "viewer" com carrossel (cascading slider) sobreposto; botão "Voltar à Galeria"; navegação por setas e teclado | Alta — `portfolioProjects` (array JS com 6 projetos), engine de carrossel customizado (`createCascadingSlider`, ~300 linhas), transições GSAP timeline complexas (galeria↔viewer), `ScrollTrigger.refresh()` sob demanda |
| 6 | `services` | "Soluções Completas em Engenharia" | `--section-padding` + mosaico | 7 CTAs "Solicitar Orçamento" (1 por card, âncora para `#contact`) | Mosaico de 7 cards com hover (item 1 ocupa 2x2) | Média — grid CSS assimétrico, ícones SVG inline por serviço, animação de hover via GSAP |
| 7 | `segments` | "A mesma engenharia, três contextos diferentes" | `--section-padding` + painel | Nenhum | Tabs clicáveis (Residencial / Comercial / Industrial) trocando o painel visível | Média — lógica de tabs (`role="tablist"`), 3 painéis com SVG próprio |
| 8 | `process` | "Do Contato à Entrega" | `--section-padding` + timeline de 4 passos | Nenhum | Nenhuma (estático, com reveal ao scroll) | Média — `ScrollTrigger.batch()` único para os 4 passos (documentado no próprio JS como otimização), 4 ilustrações SVG |
| 9 | `testimonials` | "O Que Nossos Clientes Dizem" | `--section-padding` + 2 cards | Nenhum | Nenhuma (estático) | Baixa — 2 cards com avatar SVG, estrelas fixas (5/5) |
| 10 | `faq` | "Tire Suas Dúvidas" | `--section-padding` + 6 itens | Nenhum | Accordion nativo (`<details>/<summary>`), sem JS custom | Baixa — HTML/CSS nativo, zero JS |
| 11 | `contact` | "Vamos Construir Juntos" | `--section-padding` + formulário | 1 CTA "Enviar Mensagem" | Formulário completo (Netlify Forms): nome, telefone, email, select customizado de serviço, textarea de mensagem, honeypot anti-spam, validação inline com ícones de sucesso/erro | Alta — validação JS customizada por campo, dropdown customizado acessível (`role="listbox"`), animação de submit (ripple, troca de cor do botão) |
| 12 | `footer` | (sem H2, é rodapé) | ~250-300px | Nenhum (apenas links de navegação) | Links âncora | Baixa — grid simples 3 colunas |

---

## 3. Conteúdo detalhado por seção

### Hero (`#hero`)
- Badge: "Engenharia & Arquitetura"
- Título (3 linhas): "Construímos o Futuro com **Precisão**"
- Subtítulo: "Da fundação ao acabamento, cada detalhe é pensado para transformar seu projeto em uma obra-prima da engenharia."
- 2 botões: "Ver Projetos" (→ `#portfolio`), "Solicitar Orçamento" (→ `#contact`)
- Indicador de scroll: "Role para explorar"
- Vídeo de fundo: timelapse de construção (forward + reverse), com poster de fallback
- Elementos decorativos: 3 formas geométricas SVG com parallax, 3 "light spots", camada de partículas, grid de fundo

### About (`#about`)
- Tag: "Sobre Nós"
- Título: "Engenharia que **Constrói** Confiança"
- 2 parágrafos de texto institucional (atuação em residencial/comercial/industrial; processo do projeto à entrega)
- Imagem: **placeholder SVG** com texto embutido "[Inserir foto real da equipe/obra]" — não é foto real

### Clients (`#clients`)
- Tag: "Clientes"
- Título: "Empresas que **Confiam** na Perin"
- Carrossel com 4 logos reais: Elektro, Eldorado, ISA Energia, State Grid
- Comentário HTML no código: `<!-- TODO: adicionar mais 4 logos de clientes (client-05 a client-08 ainda não existem) -->`

### Differentials (`#differentials`)
- Tag: "Diferenciais"
- Título: "Por que **Escolher** a Perin"
- 6 cards, cada um com ícone SVG + título + descrição:
  1. Engenharia Antes do Canteiro
  2. Experiência em Obras de Alta Exigência (cita os mesmos 4 clientes)
  3. Equipe Própria, Não Terceirizada
  4. Comunicação Ativa Durante a Obra
  5. Consultoria Técnica Independente
  6. Entrega com Documentação Completa

### Portfolio (`#portfolio`)
- Tag: "Portfólio"
- Título: "Projetos que **Definem** Nosso Legado"
- 6 projetos no array `portfolioProjects` (script.js:792-835):
  1. Eldorado Brasil — Obra Industrial 2024 — 1 foto real (logo) + 4 fotos placeholder
  2. Elektro Redes — Infraestrutura Elétrica 2023 — 1 foto real (logo) + 4 placeholder
  3. ISA Energia — Subestação 2023 — 1 foto real (logo) + 4 placeholder
  4. State Grid — Linha de Transmissão 2022 — 1 foto real (logo) + 4 placeholder
  5. Sede Perin — Construção Comercial 2021 — logo da empresa + 4 placeholder
  6. Residencial Villaggio — Construção Residencial 2024 — **100% placeholder** (nenhuma foto real, nem capa)
- Todos os projetos usam arquivos `assets/images/placeholders/placeholder-obra-01.webp` a `05.webp` reciclados entre si — são as mesmas 5 imagens placeholder reaproveitadas em ordens diferentes para cada projeto.
- Clique no card abre um "viewer" com carrossel de 5 fotos por projeto (motor "cascading slider", documentado em detalhe no `AGENTS.md` do projeto).

### Services (`#services`)
- Tag: "Nossos Serviços"
- Título: "Soluções Completas em **Engenharia**"
- 7 cards em mosaico (item 1 maior, 2x2):
  1. Construção Residencial
  2. Construção Comercial
  3. Construção Industrial
  4. Reformas
  5. Ampliações
  6. Gerenciamento de Obras
  7. Consultoria Técnica
- Cada card tem CTA próprio "Solicitar Orçamento" → `#contact` (total: 7 CTAs nesta seção)

### Segments (`#segments`)
- Tag: "Um Portfólio, Três Escalas"
- Título: "A mesma engenharia, **três contextos** diferentes"
- 3 tabs: Residencial (ativa por padrão), Comercial, Industrial/Infraestrutura
- Cada painel: título + 1 parágrafo + ilustração SVG
  - Residencial: "Casas e reformas onde o detalhe de acabamento importa..."
  - Comercial: "Espaços pensados para operar: fluxo de pessoas, prazos..."
  - Industrial: "O mesmo padrão técnico usado em projetos para empresas como Elektro, Eldorado, ISA Energia e State Grid..."

### Process (`#process`)
- Tag: "Como Trabalhamos"
- Título: "Do Contato **à Entrega**"
- Subtítulo: "Um método estruturado que transforma seu projeto em realidade com previsibilidade e qualidade."
- 4 passos numerados (01-04), cada um com título + descrição + ilustração SVG:
  1. Contato
  2. Planejamento
  3. Execução
  4. Entrega

### Testimonials (`#testimonials`)
- Tag: "Depoimentos"
- Título: "O Que Nossos **Clientes** Dizem"
- 2 cards, **ambos 100% placeholder**:
  - Texto: `"[Inserir depoimento real do cliente]"`
  - Nome: `[Inserir Nome]`
  - Projeto: `[Inserir Tipo de Projeto]`
  - Avaliação fixa: 5 estrelas em ambos
  - Avatares: ícone SVG genérico (um "residencial", um "comercial") — não são fotos

### FAQ (`#faq`)
- Tag: "Perguntas Frequentes"
- Título: "Tire Suas **Dúvidas**"
- 6 perguntas em accordion nativo:
  1. Quanto tempo leva para receber um orçamento?
  2. Vocês atendem residências, comércios e indústrias?
  3. Como funciona o acompanhamento da obra?
  4. É possível reformar sem sair do imóvel?
  5. Vocês emitem documentação técnica (ART/RRT)?
  6. Existe garantia após a entrega da obra?

### Contact (`#contact`)
- Tag: "Contato"
- Título: "Vamos **Construir** Juntos"
- Texto: "Solicite um orçamento ou tire suas dúvidas. Nossa equipe está pronta para transformar seu projeto em realidade."
- Dados de contato reais: `vperin@uol.com.br`, `(18) 99737-5322`, "Rua Dr. Orency Rodrigues da Silva Nº. 917"
- Formulário Netlify com: Nome*, Telefone, Email*, Tipo de Serviço (select customizado com 7 opções), Mensagem*, botão "Enviar Mensagem"
- Campos com validação inline (ícone de sucesso/erro) e honeypot anti-spam

### Footer
- Logo + tagline: "Engenharia que sustenta grandes empresas. Cuidado que sustenta cada lar."
- Coluna "Navegação": 6 links (mesmos do menu)
- Coluna "Serviços": 5 itens em texto (não são links)
- Linha de copyright: "© 2026 Perin Construções. Todos os direitos reservados." + "Projetado com engenharia"

---

## 4. Altura total da página

O CSS usa `--section-padding: 160px 40px` (desktop) e `100px 24px` (mobile) como padding vertical padrão de quase todas as seções (about, services, process, portfolio, clients, differentials, testimonials, contact, faq, segments), aplicado via `padding: var(--section-padding)`. Isso significa **~320px de padding vertical (160 topo + 160 base) só de respiro, por seção**, em 10 das 13 seções — sem contar hero e footer que têm regras próprias.

Como o conteúdo interno de cada seção é dinâmico (grids, cards, carrosséis) e depende de viewport, largura de fonte e wrap de texto, **não é possível cravar um valor exato em px sem renderizar a página no navegador e medir**. Uma medição precisa exigiria abrir a página real (Playwright/DevTools) e capturar `scrollHeight` — o que não foi feito neste levantamento por ser puramente factual sobre o código-fonte. Como referência estrutural do que consome altura:

- Hero: fixo, `100vh` (mínimo 700px)
- Demais 10 seções com `--section-padding`: cada uma soma no mínimo ~320px de padding + altura do conteúdo (varia de "2 linhas de texto" a "carrossel de 420px de altura")
- Footer: `padding: 80px 40px 40px` + conteúdo em grid

**Recomendação para completar este item**: medir `document.documentElement.scrollHeight` em desktop (1440px) e mobile (390px) com o DevTools ou um script Playwright, e comparar contra `window.innerHeight` de cada breakpoint para obter o número de "telas cheias". Isso não foi feito aqui por exigir renderização real do site, fora do escopo de leitura estática de código.

---

## 5. CTAs (oportunidades de conversão)

| Local | Texto do CTA | Destino |
|---|---|---|
| Hero | "Ver Projetos" | `#portfolio` |
| Hero | "Solicitar Orçamento" | `#contact` |
| Services — card 1 | "Solicitar Orçamento" | `#contact` |
| Services — card 2 | "Solicitar Orçamento" | `#contact` |
| Services — card 3 | "Solicitar Orçamento" | `#contact` |
| Services — card 4 | "Solicitar Orçamento" | `#contact` |
| Services — card 5 | "Solicitar Orçamento" | `#contact` |
| Services — card 6 | "Solicitar Orçamento" | `#contact` |
| Services — card 7 | "Solicitar Orçamento" | `#contact` |
| Contato | "Enviar Mensagem" (submit do formulário) | Envio Netlify |
| Nav (header) | "Contato" (link destacado) | `#contact` |
| Nav mobile | "Contato" (link destacado) | `#contact` |
| Footer | (nenhum CTA de ação, apenas links de navegação) | — |

**Total: 11 CTAs clicáveis** (2 no hero + 7 em Services + 1 no form + 2 no menu), todos convergindo para `#contact` (exceto "Ver Projetos", que vai para o portfólio, e o submit do form, que envia os dados).

---

## 6. Repetições de conteúdo

- **Os 4 clientes (Elektro, Eldorado, ISA Energia, State Grid)** aparecem em: Clients (logos), Differentials (card 2, texto), Segments (painel Industrial, texto), e Portfolio (4 dos 6 projetos são desses mesmos clientes).
- **"Equipe própria / mão de obra qualificada"** aparece em: Differentials (card 3) e Process (passo 3 - Execução).
- **"Acompanhamento / relatórios / comunicação durante a obra"** aparece em: Differentials (card 4) e FAQ (pergunta 3).
- **"Documentação técnica / ART / RRT / garantia"** aparece em: Differentials (card 6), Process (passo 4 - Entrega) e FAQ (perguntas 5 e 6).
- **"Três segmentos / três escalas" (residencial, comercial, industrial)** aparece em: About (texto), Services (grid de 7, mas 3 primeiros são exatamente esses), Segments (seção inteira dedicada a isso), e FAQ (pergunta 2).
- **CTA "Solicitar Orçamento"** se repete 7 vezes idênticas dentro da seção Services (uma por card), todas levando ao mesmo destino `#contact`.

---

## 7. Seções dependentes de conteúdo real do cliente (ainda não fornecido)

| Seção | O que falta | Evidência no código |
|---|---|---|
| About | Foto real da equipe/obra | SVG placeholder com texto "[Inserir foto real da equipe/obra]" (`index.html:199`) |
| Clients | Mais 4 logos de clientes (client-05 a client-08) | Comentário TODO explícito no HTML (`index.html:238`) |
| Portfolio | Fotos reais de obra para 4 dos 6 projetos (Eldorado, Elektro, ISA Energia, State Grid usam só o logo como "foto real" + 4 placeholders cada); projeto "Residencial Villaggio" é 100% placeholder | Array `portfolioProjects` em `script.js:792-835`, todos referenciando `assets/images/placeholders/placeholder-obra-0X.webp` |
| Testimonials | Ambos os depoimentos (texto, nome, tipo de projeto) | Texto literal `[Inserir depoimento real do cliente]`, `[Inserir Nome]`, `[Inserir Tipo de Projeto]` (`index.html:688-718`) |

---

## 8. Resumo de complexidade técnica por seção (ordenado do mais simples ao mais complexo)

1. **FAQ** — HTML/CSS nativo (`<details>`), zero JS.
2. **Footer** — grid CSS simples, zero JS além de smooth scroll padrão do site.
3. **Testimonials** — 2 cards estáticos, sem interatividade além do reveal padrão.
4. **Differentials** — grid estático com reveal em batch.
5. **About** — grid 2 colunas + reveal de texto.
6. **Segments** — lógica de tabs simples (troca de classe `.active`).
7. **Services** — grid assimétrico + hover animado em SVG via GSAP.
8. **Process** — timeline com `ScrollTrigger.batch()` único (otimizado, conforme comentário no próprio código).
9. **Clients** — carrossel infinito com JS dedicado (`initClientsCarousel`).
10. **Contact** — formulário com validação JS por campo, dropdown customizado acessível, animações de submit.
11. **Hero** — vídeo de fundo duplo, parallax, partículas, timeline de entrada GSAP.
12. **Portfolio** — a seção mais pesada: motor de carrossel customizado (~300 linhas), transições GSAP timeline entre galeria e viewer, gerenciamento de estado de 6 projetos com 5 fotos cada.

---

## 9. Notas gerais sobre o código

- Todo o site usa GSAP (vendorizado localmente) para reveals de entrada (`section-title-reveal`, `text-reveal`) e `ScrollTrigger.batch()` para animações ao scroll — aplicado de forma consistente na maioria das seções.
- O comentário em `script.js:2019-2041` documenta uma otimização prévia: passou de "1 ScrollTrigger por item" para "1 ScrollTrigger.batch() por seção", reduzindo custo de inicialização.
- Não há seção de "estatísticas/números" (contadores) atualmente visível no HTML, apesar de existir lógica de `counter-target` no JS (`script.js:756`) — não há elemento `.counter-target` no HTML atual, ou seja, esse trecho de JS está órfão/sem uso.
