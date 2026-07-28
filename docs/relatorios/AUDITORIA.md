# Auditoria Técnica — Projeto Perin Construções (Landing Page)

> Auditoria read-only. Nenhum arquivo de código foi alterado. Gerada em 13/07/2026.

## 1. Mapeamento geral

```
Perin_Rev/
├── index.html (1069 linhas)          → estrutura da landing page
├── script.js (1760 linhas)           → carrossel, formulário, interações, animações GSAP
├── styles.css (3057 linhas)          → todo o CSS do site
├── README.md (381 linhas)            → docs + changelog ("Histórico de Mudanças") já existente
├── AGENTS.md (472 linhas)            → contrato de comportamento para IA, regras imutáveis do carrossel
├── CLAUDE.md (6 linhas)              → aponta para AGENTS.md
├── PLANO-MELHORIAS.md, PRD.md, SPECS.md, plano-skills.md, relatorio.md → docs de apoio (ver §5)
├── package.json / jest.config.js     → só devDependencies de teste (jest, jsdom, puppeteer)
├── tests/unit/ , tests/regression/   → testes do carrossel
├── .claude/                          → skills do projeto (carousel-check, changelog-update etc.)
├── Projeto 1/ ... Projeto 11/, Duvidas/  → 88 fotos reais de obras (.webp) — NÃO usadas pelo site
├── eldorado.png, elektro.png, isa-energia.png, state-grid.png → logos de clientes usados no site
├── LOGO PERIN PNG ATUAL01.png / 02.jpg   → logos da empresa
├── trabalhando01.jpeg ... 05.jpeg    → fotos genéricas usadas como placeholder no portfólio fake
└── portfolio-screenshot.png
```

Núcleo do site: **5.886 linhas** somando index.html + script.js + styles.css. Sem build step; Bootstrap 5, GSAP/ScrollTrigger e Swiper carregados via CDN.

## 2. Arquivos problemáticos

### 2.1 Achado crítico — pastas "Projeto N" não estão integradas ao site
Nenhuma referência a `Projeto 1..11` ou `Duvidas` existe em `index.html`/`script.js`. O carrossel real usa um array fake em `script.js:247-290` (`portfolioProjects`) com **6 projetos fictícios**, reaproveitando os 4 logos de clientes e 5 fotos genéricas (`trabalhando01..05.jpeg`) como se fossem fotos de obra.

As **88 fotos reais**, já catalogadas em `relatorio.md`, nunca foram publicadas. O próprio `relatorio.md` (linha final) recomenda renomear as pastas com os nomes reais das obras e integrá-las ao carrossel — isso nunca foi feito.

### 2.2 Links quebrados (referenciados mas inexistentes no disco)

| Referência em `index.html` | Linha | Status |
|---|---|---|
| `href="assets/favicon.svg"` | 21 | **quebrado** — pasta `assets/` não existe |
| `src="assets/images/clients/client-05.png"` | 264 | **quebrado** |
| `src="assets/images/clients/client-06.png"` | 268 | **quebrado** |
| `src="assets/images/clients/client-07.png"` | 272 | **quebrado** |
| `src="assets/images/clients/client-08.png"` | 276 | **quebrado** |

Gera 404 em produção (não quebra layout, mas é falha real).

### 2.3 Dependência morta
Swiper (CSS `link` linha 28 + `script` linha ~1064) ainda é carregado, mas o próprio changelog do README registra que foi **substituído** pelo carrossel customizado (Cascading Slider). É peso morto (2 requisições externas desnecessárias).

### 2.4 Nomenclatura cruzada de fotos (não são backups, mas indicam organização incompleta)
- `Projeto 5/` contém arquivos `Projeto 5 - Foto N.webp` **e** `Projeto 6 - Foto N.webp` misturados.
- `Projeto 6/` contém **apenas** arquivos nomeados `Projeto 9 - Foto 4X.webp` — nenhum arquivo "Projeto 6" de fato.

Sugere que a movimentação física após a classificação em `relatorio.md` não foi concluída.

### 2.5 Backups/versões antigas/arquivos de teste esquecidos
Nenhum encontrado (`_old`, `_copy`, `v2`, `tmp` etc.) — apenas os testes legítimos em `tests/unit` e `tests/regression`.

## 3. Erros e inconsistências técnicas

- **Credenciais/segredos**: nenhum hardcoded encontrado. Formulário usa Netlify Forms (`data-netlify="true"`) sem API key exposta.
- **`<img>` sem `alt`**: nenhuma no HTML estático — todas têm `alt` adequado.
- **Código morto**: `diagnoseHeroState()` em `script.js:1656-1700` é declarada mas **nunca chamada** em lugar nenhum — bloco de debug órfão (5 `console.log`, incluindo log estilizado `%c...`).
- **PII em log de produção**: `script.js:1211` faz `console.log('[Perin Form] Submitted to Netlify Forms:', ...)` expondo nome/telefone/e-mail do lead no console do navegador do próprio cliente. Viola a diretriz de "nunca PII em log" do AGENTS.md.
- **CSS**: nenhuma duplicação exata de seletor simples encontrada na varredura, mas o changelog indica pelo menos 10 reimplementações sucessivas da transição do portfólio ("surface-slide" → "curtain" → "viewport" etc.) — risco de resíduo de regras órfãs de abordagens descartadas. Recomenda-se auditoria manual dirigida a essas classes específicas.
- **Padrão de código**: consistente ao longo dos arquivos (não há sinais fortes de "mãos diferentes" na formatação), provavelmente porque o AGENTS.md já vem orientando sessões anteriores.

## 4. Qualidade e boas práticas

- **SEO**: title, description, keywords, robots, canonical, viewport, theme-color e Open Graph básico (`og:title/description/type/url`) presentes. **Faltam** `og:image` e Twitter Card — relevante para compartilhamento em redes sociais.
- **Performance**: imagens de portfólio real ainda não usadas, então não há como avaliar peso; imagens atuais (`trabalhando0N.jpeg`, logos) não parecem otimizadas/comprimidas para web (sem `.webp`/srcset na raiz, ao contrário das fotos das pastas Projeto N que já são `.webp`). Swiper morto soma requisições desnecessárias.
- **Acessibilidade**: `alt` presente em todas as imagens; não avaliado contraste/ARIA em profundidade nesta rodada.
- **Testes**: existem suites unit + regression cobrindo o carrossel, citadas no README como gate de qualidade a cada mudança — bom sinal de maturidade de processo.

## 5. Documentos já existentes (contexto)

| Arquivo | Conteúdo |
|---|---|
| README.md | Docs principais + changelog "Histórico de Mudanças" já mantido e atualizado |
| PLANO-MELHORIAS.md | Revisão técnica anterior, com itens já marcados como corrigidos |
| PRD.md | Requisitos de produto, com `[ASSUNÇÃO]` para dados de negócio não confirmados |
| SPECS.md | Specs técnicas por engenharia reversa do código |
| plano-skills.md | Planejamento das skills do projeto |
| relatorio.md | Catalogação das 88 fotos reais em pastas Projeto N — recomendação de integração nunca executada |

## 6. Sugestões de melhoria, por prioridade

**Crítico**
1. Decidir e integrar as fotos reais de obra (pastas `Projeto 1-11`) ao carrossel de portfólio, substituindo os 6 projetos fictícios — depende de nomes reais das obras (mencionado no próprio relatorio.md) e de corrigir a nomenclatura cruzada em `Projeto 5/` e `Projeto 6/` antes.
2. Corrigir os 5 links quebrados (`favicon.svg`, 4 logos de clientes 05-08) — ou remover as referências, ou adicionar os arquivos faltantes.

**Importante**
3. Remover o `console.log` de PII em `script.js:1211` (ou mascarar dados antes de logar).
4. Remover o bloco morto `diagnoseHeroState()` (`script.js:1656-1700`).
5. Remover Swiper (CSS+JS) do `index.html` já que foi substituído — reduz requisições externas.
6. Adicionar `og:image` e Twitter Card para SEO/compartilhamento social completo.

**Desejável**
7. Auditoria manual dirigida do CSS em busca de regras órfãs de versões anteriores do slider (`surface-slide`, `curtain`, `gallery-dim` etc.).
8. Otimizar/compactar as imagens da raiz (`trabalhando0N.jpeg`, logos) para `.webp` como já é feito nas pastas Projeto N.

---

## Próximo passo

Qual(is) item(ns) você quer que eu resolva primeiro?
