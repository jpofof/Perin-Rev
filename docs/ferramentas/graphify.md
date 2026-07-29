# Graphify

> Documentação completa em `GRAPHIFY_AUTOMACAO.md` (raiz do projeto). Este arquivo resume comandos e checklist de verificação para uso rápido.

## O que é

Ferramenta de análise estática que constrói um grafo de conhecimento do código-fonte (HTML/CSS/JS) — arquivos, dependências, componentes centrais ("god nodes") e comunidades. Output em `graphify-out/` — **versionado** (padrão oficial da ferramenta, ver https://github.com/Graphify-Labs/graphify), para que qualquer `git pull` já traga o grafo pronto sem precisar rodar nada. Apenas `graphify-out/cost.json` (custo de API) fica fora do versionamento — ver `.gitignore`.

## Atualização automática (hook)

O grafo é reconstruído sozinho a cada commit via hooks instalados com `graphify hook install` (post-commit e post-checkout, registrados em `.git/hooks/`). A reconstrução usa apenas AST local — sem custo de API. Não é necessário rodar `graphify . --code-only` / `graphify cluster-only .` manualmente depois de mudanças normais.

Verificar o status dos hooks:
```powershell
graphify hook status
```

## Comandos (fallback manual)

Use apenas se quiser forçar uma atualização fora de um commit (ex: para inspecionar o grafo antes de commitar):

```powershell
graphify . --code-only
```
Reanalisa o código-fonte (AST) e reconstrói o grafo de nós e arestas. Sem custo de API.

```powershell
graphify cluster-only .
```
Recalcula comunidades e god nodes a partir do grafo já atualizado. Rodar depois de `--code-only`.

## Checklist de verificação

- [ ] `.claude/skills/`, `.claude/settings.json` e `.claude/CLAUDE.md` existem e não estão vazios.
- [ ] `graphify hook status` mostra post-commit e post-checkout instalados.
- [ ] `graphify-out/graph.html`, `graph.json`, `GRAPH_REPORT.md`, `.graphify_analysis.json` existem e estão versionados (`git ls-files graphify-out/`).
- [ ] `graphify-out/graph.html` abre no navegador e os módulos principais (carrossel, GSAP, tests) aparecem como comunidades reconhecíveis.
- [ ] `graphify-out/cost.json` **não** aparece para commit (`git status` limpo) — é o único arquivo do diretório que fica fora do versionamento.

## Último resultado conhecido

Atualizado em 2026-07-28, após o fix `mouseenter`/`mouseleave` no cascading slider (branch `fix/hover-sticky-slider-button`):

- 31 arquivos de código analisados (nós com `source_file` no grafo)
- 649 nós
- 1137 conexões
- 44 comunidades

Baseline anterior: 36 arquivos, 649 nós, 1145 conexões, 44 comunidades. A queda em arquivos/conexões reflete a reorganização de pastas (`docs/`, `prototipos/`, `legado/`, `assets-fonte/`) — caminhos antigos foram podados do grafo (`[graphify] Pruned 176 node(s) from 16 deleted or excluded source file(s)`), enquanto `design-system/` (novo, ainda não commitado) passou a ser incluído por já existir em disco.

## Como confirmar que está em uso

Modo estrito ativado via `graphify install --project --strict`. Bloqueia a primeira leitura bruta de arquivo de código por sessão de Claude Code, redirecionando para o grafo (`graphify query` / `explain` / `path`) antes de liberar a leitura — depois volta a ser apenas sugestão (nudge) pelo resto da sessão.

Pode ser alternado em runtime, sem reinstalar:
```powershell
$env:GRAPHIFY_HOOK_STRICT = "1"   # força modo estrito
$env:GRAPHIFY_HOOK_STRICT = "0"   # desativa o bloqueio, mantém só o nudge
```

**Sinal visível:** no início de uma nova sessão, ao pedir algo que exigiria ler código, a primeira tentativa de leitura direta deve ser bloqueada — a ferramenta retorna um erro pedindo para rodar `graphify query`/`explain`/`path` primeiro — e só a releitura seguinte, já orientada pelo grafo, é liberada. Isso fica registrado no log de tool calls da sessão.

## Consultas (uso pela IA)

- `graphify query "<pergunta>"` — subgrafo focado, mais barato que ler `GRAPH_REPORT.md` inteiro.
- `graphify path "<A>" "<B>"` — relação entre dois componentes.
- `graphify explain "<conceito>"` — aprofunda em um conceito específico.
