# Uso real do Bootstrap — Investigação (sem implementação)

> Gerado em análise da branch `perf/otimizacao-performance`. Nenhum arquivo de código foi alterado nesta etapa — apenas leitura/grep/comparação. Nenhuma decisão foi executada; aguarda confirmação do usuário.

## Passo 1 — Mapeamento do uso real

### Classes CSS do Bootstrap

Metodologia: extraídas todas as 215 classes distintas usadas em `class="..."` no único HTML do projeto (`index.html`), e comparadas contra os padrões de nomenclatura do Bootstrap 5 (`container`/`container-fluid`, `row`, `col-*`, `btn`/`btn-*`, `navbar*`, `nav-*` nativo, `card*`, `dropdown*`, `modal*`, `collapse`, `carousel*`, `badge`, `alert*`, `list-group*`, `table*`, utilities `d-*`, `m*-*`/`p*-*`, `justify-content-*`, `align-items-*`, `text-*`, `form-*`).

**Resultado: nenhuma classe do Bootstrap é usada.** As únicas coincidências de nome encontradas (`nav-link`, `nav-links`, `nav-container`, `form-row`, `form-*`) são **nomenclatura própria do projeto**, confirmada em `styles.css`:
- `.nav-link` tem definição completa e independente em `styles.css:220-248` (cor, hover, `::after`, `-highlight`) — nada herdado do Bootstrap.
- `form-floating-group`, `form-floating-input`, `form-static-*`, `form-submit-*`, `form-valid-icon` são todas classes compostas específicas do formulário de contato customizado, sem relação com os componentes `.form-floating`/`.form-control` do Bootstrap.
- Nenhum `container`, `container-fluid`, `row`, `col-*`, `btn`, `btn-*`, `navbar`, `card`, `dropdown`, `modal`, `collapse`, `carousel`, `badge`, `alert`, `list-group` ou `table` (exatos, como classe isolada) aparece em `index.html`.
- O projeto já define seu próprio reset (`box-sizing: border-box`, `margin: 0` no seletor global, `styles.css:76-78`), independente do reset que o Bootstrap aplicaria.

**Percentual de uso estimado: ~0%** das ~1.500+ classes utilitárias/componentes que o Bootstrap 5 disponibiliza.

### Componentes JS do Bootstrap

- `grep -on 'data-bs-[a-z-]*="[^"]*"' index.html` → **zero ocorrências**. Nenhum `data-bs-toggle`, `data-bs-target`, `data-bs-dismiss` etc. em lugar nenhum.
- `grep -n "bootstrap\." script.js` e busca por `new bootstrap.Modal/Tooltip/Dropdown/Collapse/Carousel/Offcanvas/Toast`, `window.bootstrap`, `Popper` → **zero ocorrências** em `script.js` ou `index.html`.
- O menu mobile, o dropdown do formulário de contato e o carrossel de portfólio/clientes são **100% implementações customizadas** em `script.js` (`initNavigation()`, dropdown custom do formulário, `createCascadingSlider()`) — nenhuma delas usa a API do Bootstrap.

**Percentual de uso estimado: 0%** do bundle JS (que inclui Popper.js embutido, Modal, Tooltip, Popover, Dropdown, Collapse, Carousel nativo, Offcanvas, Toast, ScrollSpy).

### Peso atual (medido via Lighthouse, network real)

| Recurso | Resource Size (descomprimido) | Transfer Size (rede, gzip/brotli) |
|---|---|---|
| `bootstrap.min.css` | 232,8 KB | **34,0 KB** |
| `bootstrap.bundle.min.js` (inclui Popper) | 80,7 KB | **24,9 KB** |
| **Total via CDN hoje** | 313,5 KB | **58,9 KB transferidos** |

Peso estimado de um build customizado (Opção B): **próximo de 0 KB**, já que 0% das classes/componentes são usados. Não há uma "parte útil" do Bootstrap para extrair — qualquer build customizado (Sass com módulos ou PurgeCSS) resultaria em um arquivo essencialmente vazio, pois nenhum seletor do Bootstrap tem correspondência no HTML.

## Passo 2 — Comparação de estratégias

| | **Opção A — Vendorizar tudo** | **Opção B — Build customizado (Sass/PurgeCSS)** | **Opção C — Remover completamente** |
|---|---|---|---|
| Peso final estimado | 313,5 KB / 58,9 KB transferidos (idêntico ao CDN hoje, só muda a origem) | ~0-2 KB (praticamente vazio, dado 0% de uso real) | **0 KB** |
| Prós | Simples, zero manutenção de build, fácil atualizar versão (troca 1 arquivo) | Peso mínimo teórico | Elimina 100% do peso, das 2 requisições externas, do item de bloqueio de renderização (~1.1s) e do CSS não utilizado (11 KiB) reportados em `audit/proximas-oportunidades.md` |
| Contras | Mantém 100% de peso morto (nada é usado) — apenas move o problema do CDN para local, sem resolver o real ofensor | Processo de build que a rodada anterior decidiu conscientemente evitar; risco de purge remover algo usado dinamicamente via JS (mitigado aqui porque **não há nenhum uso**, então o risco é teórico/nulo); ainda assim exige infra de build só para produzir um arquivo quase vazio | Nenhum, dado que a investigação confirma 0% de uso real |
| Esforço de implementação | Baixo | Médio-alto (setup de Sass build ou PurgeCSS, mesmo que o resultado seja trivial) | **Baixíssimo** — apenas remover 3 linhas (`preconnect`, `<link>` CSS, `<script>` JS) do `index.html` |

## Passo 3 — Recomendação

**Recomendação: Opção C — remover o Bootstrap completamente.**

Justificativa:
1. **A investigação profunda confirma e piora os números já registrados em `audit/proximas-oportunidades.md`.** O item apontava ~1.1s de bloqueio de renderização e ~11 KiB de CSS não utilizado só pela parte medida pelo Lighthouse (`unused-css-rules` mede apenas o que sobra acima do que foi *executado/coberto* na sessão de teste, não o total). A investigação de uso real mostra que **é o CSS inteiro** que não é usado (232,8 KB / 34 KB transferidos), mais o **JS bundle inteiro** (80,7 KB / 24,9 KB transferidos) — nenhum componente, nenhuma classe, nenhum utilitário. O ganho real de remover é maior do que o que já estava documentado: **~58,9 KB a menos transferidos**, **2 requisições externas a menos**, e a eliminação total do maior item de `render-blocking-insight` (1125ms na medição "depois").
2. **Opção A (vendorizar) não resolve nada** — move o mesmo peso morto do CDN para local, sem eliminar nenhum byte desnecessário. Só faria sentido se houvesse uso real a preservar.
3. **Opção B (build customizado) é desproporcional** — monta infraestrutura de build (que a rodada anterior decidiu conscientemente não ter) para produzir, na prática, um arquivo quase vazio. O esforço não se paga: o mesmo resultado (~0 KB de Bootstrap) é alcançado com esforço muito menor apenas removendo a dependência.
4. **O projeto não depende de nenhuma classe ou componente do Bootstrap para funcionar** — todo o layout (grid, cards, formulário, navegação, carrosséis) já é CSS/JS customizado. Remover as 3 linhas do `<head>`/fim do `<body>` não deve alterar nenhum estilo visual, porque não há nenhuma classe do Bootstrap sendo consumida em lugar nenhum do HTML — mas isso **deve ser validado visualmente** antes de confirmar (ver ressalva abaixo).

### Ressalva importante antes de decidir

Apesar da investigação estática (grep de classes/atributos/chamadas JS) apontar 0% de uso, **o Bootstrap também aplica um reset/normalize CSS global** (tipografia, `<button>`, `<a>`, listas, etc.) que afeta elementos HTML puros mesmo sem classes explícitas do framework. Como o projeto já tem seu próprio reset parcial (`box-sizing: border-box`, `margin: 0` — `styles.css:76-78`), o risco é baixo, mas não nulo: pode haver algum elemento nativo (`<button>`, `<a>`, `<ul>`, elemento de formulário) que hoje recebe um estilo do reset do Bootstrap sem que o projeto tenha uma regra própria equivalente, e que mudaria visualmente ao remover. Antes de confirmar a remoção definitiva, recomendo:
- Testar localmente removendo as 3 linhas e comparando visualmente (desktop + mobile) com o estado atual, antes de aplicar em definitivo.

## Passo 4 — Aguardando decisão

Nenhuma alteração de código foi feita. Aguardando sua confirmação sobre qual opção seguir (recomendação: **C**) antes de tocar em `index.html` ou qualquer outro arquivo.
