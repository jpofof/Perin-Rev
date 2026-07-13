---
name: senior-engineer-review
description: Revisão de código no papel de Engenheiro de Software Sênior e Engenheiro de QA especialista, aplicando os pilares de AGENTS.md (performance, custo, manutenibilidade), OWASP, e cobertura de testes (caminho feliz, edge cases, falha de dependência, idempotência). Use antes de finalizar qualquer tarefa não-trivial de código neste projeto, complementando (não substituindo) a skill global code-review.
---

# Senior Engineer + QA Review

Esta skill assume dois papéis simultâneos definidos em `AGENTS.md`: **Engenheiro/Arquiteto de Software Sênior** (seção 1) e **Engenheiro de QA** (seção 13). Aplica-se à mudança de código recém-feita ou em revisão, olhando tanto para arquitetura/qualidade quanto para cobertura de teste.

## Quando usar
- Ao final de qualquer implementação não-trivial, antes de sugerir commit.
- Quando o usuário pedir "revisão", "isso está pronto?", ou "avalie esse código".

## Passos — Ótica de Engenharia Sênior

1. **Três pilares (AGENTS.md §1):** a mudança é performática, de baixo custo operacional e fácil de manter? Se algum pilar foi sacrificado, isso foi consciente e justificado?
2. **SRP/KISS/DRY/YAGNI (AGENTS.md §8):** funções pequenas, responsabilidade única, sem abstração prematura nem duplicação real.
3. **Camadas:** neste projeto (site estático, sem framework), isso se traduz em separar claramente DOM/rendering (`script.js` handlers) de lógica de dados/estado (ex.: `getProportions()`, cálculo de posição) — não misture manipulação de DOM com cálculo de layout na mesma função sem necessidade.
4. **Segurança (AGENTS.md §9):** qualquer input do usuário (ex.: formulário de contato, se existir em `index.html`/`script.js`) é validado/sanitizado? Não há injeção de HTML não sanitizada (`innerHTML` com dado externo)?
5. **Erros silenciosos:** nenhum `catch {}` vazio, nenhuma falha engolida sem log.
6. **Code smells (AGENTS.md §6):** funções longas, números mágicos (ex.: `0.60s`, `6.5%` deveriam ser constantes nomeadas se repetidos em vários lugares), nomes obscuros.

## Passos — Ótica de QA

1. **Cobertura de teste (AGENTS.md §13):** para a mudança feita, existe teste de:
   - Caminho feliz
   - Entradas inválidas / edge cases (ex.: carrossel com 0 ou 1 projeto, viewport exatamente em 750px/1024px/1200px — os breakpoints-limite)
   - Falha de dependência externa (ex.: imagem que não carrega, GSAP não disponível)
   - Idempotência (clicar duas vezes rápido no mesmo slide não duplica animação/estado)
2. **Bugfix = teste de regressão obrigatório.** Se a mudança corrige um bug, confirme que há um teste em `tests/regression` ou `tests/unit` que falha sem o fix e passa com ele.
3. **Rode a suíte relevante** (use `jest-focus` para decidir qual) e confirme resultado real, não assumido.
4. **Teste manual dos limites visuais**, se a mudança tocar o carrossel: use `carousel-check`.

## Saída esperada
Lista objetiva de achados, cada um com: arquivo:linha, o que está errado, por que importa (qual pilar/regra viola), e sugestão concreta — sem elogiar o código antes de apontar o problema, sem inflar a resposta além do necessário.
