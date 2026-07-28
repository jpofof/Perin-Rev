# Graphify

> Documentação completa em `GRAPHIFY_AUTOMACAO.md` (raiz do projeto). Este arquivo resume comandos e checklist de verificação para uso rápido.

## O que é

Ferramenta de análise estática que constrói um grafo de conhecimento do código-fonte (HTML/CSS/JS) — arquivos, dependências, componentes centrais ("god nodes") e comunidades. Output em `graphify-out/` (não versionado — ver `.gitignore`).

## Comandos

```powershell
graphify . --code-only
```
Reanalisa o código-fonte (AST) e reconstrói o grafo de nós e arestas. Atualização estrutural principal, sem custo de API.

```powershell
graphify cluster-only .
```
Recalcula comunidades e god nodes a partir do grafo já atualizado. Rodar depois de `--code-only`.

## Quando atualizar

Após: novos arquivos importantes, mudança de arquitetura, grandes alterações em JS, mudanças no carrossel/GSAP, refatorações, mudanças que afetem comunicação entre arquivos. Não é necessário a cada alteração trivial (CSS cosmético, typo).

## Checklist de verificação

- [ ] `.claude/skills/`, `.claude/settings.json` e `.claude/CLAUDE.md` existem e não estão vazios.
- [ ] `graphify . --code-only` termina sem erro.
- [ ] `graphify cluster-only .` gera/atualiza `graphify-out/graph.html`, `graph.json`, `GRAPH_REPORT.md`, `.graphify_analysis.json`.
- [ ] `graphify-out/graph.html` abre no navegador e os módulos principais (carrossel, GSAP, tests) aparecem como comunidades reconhecíveis.
- [ ] `graphify-out/` **não** aparece para commit (`git status` limpo) — é cache local, já está no `.gitignore`.

## Último resultado conhecido

Atualizado em 2026-07-28, após o fix `mouseenter`/`mouseleave` no cascading slider (branch `fix/hover-sticky-slider-button`):

- 31 arquivos de código analisados (nós com `source_file` no grafo)
- 649 nós
- 1137 conexões
- 44 comunidades

Baseline anterior: 36 arquivos, 649 nós, 1145 conexões, 44 comunidades. A queda em arquivos/conexões reflete a reorganização de pastas (`docs/`, `prototipos/`, `legado/`, `assets-fonte/`) — caminhos antigos foram podados do grafo (`[graphify] Pruned 176 node(s) from 16 deleted or excluded source file(s)`), enquanto `design-system/` (novo, ainda não commitado) passou a ser incluído por já existir em disco.

## Consultas (uso pela IA)

- `graphify query "<pergunta>"` — subgrafo focado, mais barato que ler `GRAPH_REPORT.md` inteiro.
- `graphify path "<A>" "<B>"` — relação entre dois componentes.
- `graphify explain "<conceito>"` — aprofunda em um conceito específico.
