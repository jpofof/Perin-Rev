# Graphify — Automação e Manutenção do Grafo de Conhecimento

> Documentação de referência para desenvolvedores e assistentes de IA que trabalharem neste projeto.

---

## 1. O que é o Graphify neste projeto

O **Graphify** é uma ferramenta que constrói um **grafo de conhecimento** da base de código deste projeto. Ele analisa os arquivos-fonte (HTML, CSS, JavaScript) e mapeia:

- arquivos e módulos existentes;
- dependências e referências entre eles;
- componentes centrais ("god nodes") — arquivos/funções com alta conectividade e impacto;
- estrutura de comunidades (agrupamentos de código relacionado);
- relações cruzadas entre arquivos (quem chama, importa ou afeta o quê).

Esse grafo permite que a IA (e qualquer desenvolvedor) entenda rapidamente a **arquitetura real do projeto** — sem precisar ler todo o código-fonte manualmente — reduzindo tempo de exploração e risco de alterações que quebram dependências ocultas.

---

## 2. Estado atual da instalação

Este projeto possui uma instalação **project-scoped** do Graphify (local ao projeto, não global), com os seguintes componentes:

- **`.claude/`** — pasta de configuração do Claude Code, onde a skill `graphify` está registrada e disponível via `/graphify`.
- **`graphify-out/`** — diretório com os artefatos gerados pela análise mais recente do grafo.

### Arquivos gerados em `graphify-out/`

| Arquivo | Função |
|---|---|
| `graph.json` | Representação estruturada (nós e arestas) do grafo de conhecimento — usada por ferramentas e queries (`graphify query`, `graphify path`, `graphify explain`). |
| `graph.html` | Visualização interativa do grafo no navegador, útil para inspeção visual da arquitetura. |
| `GRAPH_REPORT.md` | Relatório em markdown com a leitura de alto nível do grafo: god nodes, comunidades, métricas de arquitetura. Referência para revisão ampla quando queries pontuais não bastam. |
| `.graphify_analysis.json` | Metadados internos da análise (estado, parâmetros e resultados intermediários usados pelo Graphify entre execuções). |

Outros artefatos internos (`cache/`, `.graphify_root`, `manifest.json`, `.graphify_labels.json*`) suportam o funcionamento incremental do Graphify e não devem ser editados manualmente.

---

## 3. Quando atualizar o Graphify

**Não é necessário atualizar o grafo a cada pequena alteração.** Alterações triviais (ajuste de texto, CSS pontual, correção de typo) não justificam nova análise.

Atualize o grafo **após**:

- criação de novos arquivos importantes (novos módulos, componentes, páginas);
- mudanças na arquitetura do projeto;
- grandes alterações no JavaScript (`script.js` e correlatos);
- mudanças no sistema de carrossel (ex.: Cascading Slider, `initCascadingSlider()`);
- alterações importantes envolvendo GSAP (novas animações, ScrollTrigger, timelines);
- refatorações (Extract Method, reorganização de módulos, etc.);
- mudanças que afetem a comunicação entre arquivos (novos imports, novos data attributes usados como contrato entre HTML/CSS/JS).

---

## 4. Comandos de atualização

```powershell
graphify . --code-only
```
Reanalisa o código-fonte do projeto (AST) e reconstrói o grafo de nós e arestas — arquivos, funções, dependências. É a atualização estrutural principal, sem custo de API (apenas análise estática).

```powershell
graphify cluster-only .
```
Recalcula os agrupamentos de comunidades e os god nodes a partir do grafo já atualizado — refina a leitura de arquitetura (quem são os componentes centrais e como se agrupam) sem refazer a análise AST completa.

**Fluxo típico:** execute `--code-only` primeiro (atualiza a estrutura), depois `cluster-only` (recalcula agrupamentos sobre a estrutura nova).

---

## 5. Fluxo recomendado

1. O desenvolvedor realiza alterações no código.
2. Verifica se a alteração foi **estrutural** (ver critérios da seção 3).
3. Caso necessário, executa a atualização do Graphify (`graphify . --code-only` seguido de `graphify cluster-only .`).
4. Continua utilizando o grafo atualizado (`graphify query`, `graphify path`, `graphify explain`, ou `GRAPH_REPORT.md`) como referência para análise do projeto.

---

## 6. Automação futura

Atualmente, **o Graphify não monitora alterações em tempo real** — a atualização é sempre manual, disparada por comando.

Possibilidades futuras para reduzir esse atrito:

- **Script PowerShell de atualização rápida** — um wrapper único (`update-graph.ps1`) que executa `--code-only` e `cluster-only` em sequência.
- **Integração com Git hooks** — por exemplo, um hook `post-commit` ou `post-merge` que dispara a atualização automaticamente quando arquivos relevantes (`*.js`, `*.html`, `*.css`) são alterados.
- **Automação com ferramentas de desenvolvimento** — integração a tasks do editor, watchers de arquivo, ou pipelines de CI que atualizem o grafo como parte do processo de build.

Nenhuma dessas automações está implementada hoje — este documento apenas registra o caminho possível caso o projeto opte por adotá-las.

---

## 7. Orientações para assistentes de IA

Ao trabalhar neste projeto, a IA deve:

- **Consultar o contexto do Graphify antes de alterações grandes.** Use `graphify query "<pergunta>"` quando `graphify-out/graph.json` existir; use `graphify path "<A>" "<B>"` para entender relações entre dois componentes e `graphify explain "<conceito>"` para aprofundar em um conceito específico. Essas consultas retornam um subgrafo focado, geralmente muito mais econômico em tokens do que ler `GRAPH_REPORT.md` inteiro ou fazer grep bruto no código.
- **Identificar arquivos relacionados antes de modificar código.** Antes de editar uma função ou componente, mapear quem depende dela evita quebras silenciosas.
- **Evitar mudanças isoladas que possam quebrar dependências.** Se o grafo indica que um arquivo é um god node (muitas conexões), qualquer alteração nele exige atenção redobrada às dependências.
- **Atualizar o grafo após grandes mudanças, quando necessário** (ver critérios da seção 3), rodando os comandos da seção 4.
- Usar `graphify-out/wiki/index.md` para navegação ampla, se esse arquivo existir, em vez de navegar por arquivos-fonte brutos.
- Ler `graphify-out/GRAPH_REPORT.md` apenas para revisão arquitetural ampla, ou quando `query`/`path`/`explain` não trouxerem contexto suficiente.

### Exemplos práticos aplicados a este projeto

- **Carrossel de portfólio (Cascading Slider):** antes de alterar `initCascadingSlider()` em `script.js`, consultar `graphify path "initCascadingSlider" "openProject"` para confirmar todos os pontos de integração (ciclo de vida com `openProject()`/`closeProject()`, listeners de `resize` e `keydown`) antes de modificar o comportamento.
- **Animações GSAP:** ao adicionar uma nova timeline ou `ScrollTrigger`, usar `graphify explain "ScrollTrigger"` para identificar outras animações já registradas na página e evitar conflitos de instância ou de listener de `resize`.
- **HTML/CSS/JavaScript:** ao introduzir um novo `data-*` attribute usado como contrato entre HTML e JS (ex.: `data-cascading-slider-prev`), verificar via grafo se esse atributo já é referenciado em outro contexto, evitando colisão de seletor.
- **Responsividade:** antes de alterar breakpoints ou larguras de componentes (ex.: tiers do Cascading Slider), consultar o grafo para localizar todos os pontos do JS/CSS que dependem desses valores, já que a responsividade deste componente é controlada via array de breakpoints no JS, não por media query.

---

*Este documento descreve o estado do Graphify neste projeto em 2026-07-28. Atualize-o caso o fluxo de automação evolua (ex.: adoção de Git hooks ou script de atualização).*
