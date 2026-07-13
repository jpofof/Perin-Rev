---
name: changelog-update
description: Registra toda alteração de código na seção "Histórico de Mudanças" do README.md deste projeto (o quê mudou, quais arquivos, data), conforme exigido pela seção 4 do AGENTS.md. Use ao final de qualquer tarefa de código, antes de considerar a tarefa concluída ou fazer commit.
---

# Changelog Update

`AGENTS.md` (seção "4. Processo Antes de Codificar" → "Documentação obrigatória") exige que toda alteração de código registre no `README.md`: o que mudou, quais arquivos foram alterados e a data. Esta skill fecha esse loop, que costuma ser esquecido.

## Passos

1. **Identifique o que mudou.** Use `git diff` / `git status` (ou o resumo da tarefa recém-concluída) para listar os arquivos alterados e a natureza da mudança (feature, fix, refactor, etc.).

2. **Localize a seção "Histórico de Mudanças"** em `README.md`. Leia as últimas 2-3 entradas para replicar o formato exato já usado (não invente um formato novo).

3. **Adicione uma nova entrada** no topo (mais recente primeiro, a menos que o arquivo já siga ordem cronológica ascendente — respeite o que já existe), contendo:
   - Data no formato já usado no arquivo (confirme o padrão: DD/MM/AAAA vs AAAA-MM-DD).
   - Descrição clara e objetiva do que mudou (em português, como o resto do README).
   - Lista dos arquivos alterados.

4. **Não reescreva o README inteiro** — edite apenas a seção de histórico, preservando todo o resto do arquivo.

5. Se a mudança também alterou uma regra de comportamento do agente (ex.: uma nova regra "imutável" tipo a do carrossel), avise que `AGENTS.md` também pode precisar de atualização — mas não o edite sem confirmação explícita, pois `AGENTS.md` é a fonte da verdade e mudanças nele têm peso maior.

## Critério de sucesso
- `README.md` tem uma entrada nova, no formato consistente com as anteriores, citando data, arquivos e descrição.
- Nenhum outro conteúdo do README foi alterado ou reformatado sem necessidade.
