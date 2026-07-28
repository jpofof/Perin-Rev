# Headroom

## Papel conhecido

Ferramenta complementar ao Graphify: enquanto o Graphify mapeia a arquitetura (relações entre arquivos/componentes), o Headroom auxilia na inspeção do código e identifica pontos de atenção, problemas ou melhorias. Uso recomendado como apoio antes de grandes modificações.

## Em aberto — preencher quando souber

- Comando de execução exato (ex.: `headroom scan .`, `headroom analyze`, etc.).
- Gera output em disco ou é só terminal? Se gera arquivo: em qual pasta, e ela precisa entrar no `.gitignore` (mesmo padrão de `graphify-out/`)?
- Instalado globalmente ou project-scoped (dentro de `.claude/`)?
- Frequência recomendada de uso — a cada commit, ou só antes de mudanças grandes, no mesmo padrão do Graphify?

## Como fechar essa pendência

Rodar localmente:

```bash
headroom --help
```

(ou o comando equivalente em uso) e atualizar este arquivo com o comando real, o formato de output, e o checklist de verificação correspondente, no mesmo padrão de `docs/ferramentas/graphify.md`.
