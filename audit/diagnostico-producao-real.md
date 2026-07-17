# Diagnóstico contra produção real — perinconstrucoes.netlify.app

> Executado em 17/07/2026, contra `https://perinconstrucoes.netlify.app`. Fonte de verdade: a URL publicada, não os arquivos locais — motivado pelos 2 episódios anteriores desta sessão de `.min` local divergindo do que estava realmente em produção.

## Resumo executivo

| Pergunta | Resposta |
|---|---|
| Produção bate com o código local (último commit `9220b09`)? | **Sim** — confirmado por diff byte-a-byte |
| Cache-Control real bate com o `_headers` configurado? | **Não** para `vendor/gsap/*` — anomalia real, não corrigida |
| Lighthouse real mostra causa nova de travamento? | **Não** — score 93, nenhum "Opportunity" grande de main-thread/JS. O sintoma relatado ("travamento ocasional ao rolar") não é o que o Lighthouse mede (ele não simula scroll contínuo) |
| Recorrência de bug já corrigido ou causa nova? | **Nem uma coisa nem outra** — é a ausência de dado: Lighthouse audita carregamento, não scroll. A causa mais provável remanescente é estrutural e já identificada, não nova: as ≥57 instâncias de `ScrollTrigger` (Direção 3, nunca implementada) |

---

## Passo 1 — Produção reflete o código local?

Ambiente teve acesso à internet (funcionou com `--ssl-revoke-best-effort` no curl, mesma instabilidade de certificado já registrada em rodadas anteriores).

Baixado o conteúdo real (não só `HEAD`) de produção e comparado via `diff` byte-a-byte contra os arquivos locais do commit `9220b09` (HEAD no momento do teste):

| Arquivo | Resultado |
|---|---|
| `script.min.js` | **Idêntico** |
| `styles.min.css` | **Idêntico** |
| `vendor/gsap/gsap.min.js` | **Idêntico** |
| `vendor/gsap/ScrollTrigger.min.js` | **Idêntico** |

**Conclusão do Passo 1: a produção reflete exatamente o último commit local.** Não há deploy desatravado nem regressão de build — a causa raiz dos episódios anteriores (`.min` local sem regenerar) está descartada aqui: desta vez o Netlify publicou exatamente o que foi commitado e pushado.

Confirmado também via `network-requests` do Lighthouse: **zero requisições a `cdnjs.cloudflare.com`** em produção — o self-host do GSAP está de fato ativo, não é só teoria local.

## Passo 2 — Headers de cache reais

`curl -sI` contra as 3 URLs relevantes:

| Arquivo | `Cache-Control` retornado | Esperado (`_headers`) | Bate? |
|---|---|---|---|
| `script.min.js` | `public,max-age=2592000` | `public, max-age=2592000` (regra `/*.js`) | ✅ Sim |
| `styles.min.css` | `public,max-age=2592000` | `public, max-age=2592000` (regra `/*.css`) | ✅ Sim |
| `vendor/gsap/gsap.min.js` | `public,max-age=2592000` | `public, max-age=31536000, immutable` (regra `/vendor/gsap/*`) | ❌ **Não** |

### ⚠️ Achado novo — a correção de ordem no `_headers` da rodada anterior não teve o efeito esperado

O `_headers` publicado em produção (baixado e comparado) é **idêntico** ao local — com `/vendor/gsap/*` já movida para o **topo** do arquivo, antes de `/*.js`, exatamente como a pesquisa da rodada anterior recomendou ("Netlify processa top-to-bottom, primeira regra que casar vence"). Apesar disso, o header real retornado para `vendor/gsap/gsap.min.js` é o da regra genérica `/*.js` (`2592000`), não o da regra específica `/vendor/gsap/*` (`31536000, immutable`) que está **antes** no arquivo.

Isso **contradiz empiricamente** a conclusão da pesquisa anterior (baseada em fóruns/documentação, não em teste real). A evidência real de produção agora é mais forte que a pesquisa: ou o Netlify aplica alguma outra regra de resolução (ex: regra mais específica declarada depois vence; ou existe cache de edge/CDN do Netlify segurando uma resposta antiga mesmo com o header vindo errado — improvável já que o conteúdo do arquivo está atualizado). Isso **não foi corrigido nesta rodada** — só diagnosticado, conforme pedido.

**Impacto real**: baixo para o sintoma de travamento (isso afeta só a frequência de re-download em visitas repetidas, não causa jank durante o uso). Não é a causa do travamento relatado — é uma inconsistência de configuração à parte, que vale resolver depois por completude, mas não é prioridade para o sintoma principal.

## Passo 3 — Lighthouse real contra produção

Comando executado com sucesso (ambiente tinha acesso à internet):
```
npx lighthouse https://perinconstrucoes.netlify.app --preset=perf --form-factor=mobile \
  --throttling-method=simulate --screenEmulation.mobile=true --output=html --output=json \
  --output-path=./audit/lighthouse-producao-real
```
Relatórios salvos em `audit/lighthouse-producao-real.report.{html,json}`. Emulação: Moto G Power (Android), CPU 4x slowdown, RTT 150ms, throughput ~1.6Mbps — perfil "mobile médio", não um iPhone real, mas é o padrão comparável às rodadas anteriores desta sessão.

### Resultado

**Performance Score: 93** (nunca medido antes contra produção real — as rodadas anteriores usavam servidor local sem CDN/rede real).

| Métrica | Valor |
|---|---|
| First Contentful Paint | 1.7s |
| Largest Contentful Paint | 2.3s |
| Speed Index | 4.1s |
| Total Blocking Time | 170ms |
| Cumulative Layout Shift | 0 |
| Time to Interactive | 2.3s |
| Peso total da página | 249 KiB, 14 requisições |

### Foco em main-thread / JS execution (pedido explícito do usuário)

- **"Minimize main-thread work"**: 2.5s de trabalho total de main-thread durante o carregamento — `Other` 1118ms, `Style & Layout` 759ms, `Script Evaluation` 332ms, `Rendering` 228ms. Isso é custo de **carregamento**, não de scroll contínuo.
- **"Avoid long main-thread tasks"**: só **2 long tasks** detectadas (>50ms) durante todo o carregamento — 165ms em `ScrollTrigger.min.js` (provavelmente a criação das ≥57 instâncias de ScrollTrigger de uma vez) e 107ms em `script.min.js`. Nenhuma tarefa longa recorrente — mas o Lighthouse só audita ~alguns segundos ao redor do load, **não simula scroll contínuo pela página inteira**, então não pode capturar jank que só aparece rolando pelo hero/seções.
- **"Reduce JavaScript execution time"** (bootup-time): passou (score 1) — `gsap.min.js` é o maior custo (163ms de scripting, mais parse/compile), seguido do documento principal e `script.min.js` (105ms de scripting). Nada alarmante.
- **Render-blocking**: `styles.min.css` bloqueia ~150ms (pequeno, esperado — é o CSS crítico).

**Nenhuma "Opportunity" nova e significativa de JS/main-thread apareceu.** O que já foi corrigido nesta sessão (self-host do GSAP, throttle do scroll, IntersectionObserver das partículas/carrossel) está de fato refletido: não há mais requisição de CDN, não há mais long tasks recorrentes durante o load.

## Passo 4 — Recorrência ou causa nova?

**Nenhuma das duas, estritamente.** O Lighthouse audita o **carregamento inicial** (poucos segundos), não o comportamento durante scroll contínuo pela página — que é exatamente o sintoma relatado ("travamento ocasional ao rolar, mesmo em Wi-Fi"). Como o site carrega rápido e limpo (score 93, 2 long tasks só no load), a ferramenta **não tem visibilidade** sobre o que acontece quando o usuário rola de verdade — ela não pode confirmar nem refutar jank durante scroll.

Cruzando com o que já foi corrigido:
- ✅ Layout thrashing do scroll do hero — corrigido e confirmado em produção (conteúdo idêntico ao commit).
- ✅ `touchmove` global do clients carousel — corrigido e confirmado em produção.
- ✅ Partículas/carrossel pausando fora da viewport — corrigido e confirmado em produção.
- ✅ CDN externo eliminado — confirmado (zero requisições a `cdnjs.cloudflare.com` em produção real).
- ❌ **Nunca implementado**: Direção 3 do plano original — reduzir as ≥57 instâncias individuais de `ScrollTrigger` via `ScrollTrigger.batch()`. A long task de 165ms atribuída a `ScrollTrigger.min.js` no load é consistente com o custo de **criar** essas 57+ instâncias de uma vez — mas o custo *durante o scroll* (cada instância recalculando/verificando seu próprio trigger a cada evento) nunca foi medido em produção real, porque o Lighthouse não rola a página.

**Conclusão**: os itens fixados nesta sessão estão confirmadamente ativos em produção — não há regressão de deploy. O que resta como suspeito mais provável para o travamento "ocasional" é justamente o que ficou pendente desde o primeiro diagnóstico estático (57+ ScrollTriggers concorrendo durante o scroll) — mas isso **não é uma causa nova**, é a mesma hipótese antiga, ainda não testada em produção real porque nenhuma ferramenta síncrona (Lighthouse) consegue simular scroll contínuo. Também é possível que parte da variabilidade relatada ("às vezes mais, às vezes menos") seja inerente ao hardware do iPhone do usuário (throttling térmico, memória, outros apps em segundo plano) — algo que nenhuma auditoria de código pode eliminar, apenas mitigar reduzindo o trabalho total de JS/layout.

## Passo 5 — Recomendação priorizada (nada implementado)

1. **Maior prioridade real, mas fora do meu alcance de ferramenta**: repetir o teste de Web Inspector no iPhone real (passo a passo já documentado em `RELATORIO-PERFORMANCE.md`, seção "Mobile: travamento por sobrecarga de main thread"), agora contra a **URL de produção real**, não mais local. É a única forma de capturar o jank durante o scroll de fato — Lighthouse não serve para isso.
2. **Segunda prioridade, impacto médio-alto no sintoma**: implementar a Direção 3 pendente — `ScrollTrigger.batch()` para consolidar as ≥57 instâncias individuais em poucas instâncias por seção. É a única causa estrutural ainda não tratada e é coerente com a long task de 165ms observada no load real.
3. **Terceira prioridade, impacto baixo no sintoma mas correção de dívida real**: investigar por que `_headers` não resolve `/vendor/gsap/*` como esperado em produção, apesar da ordem já corrigida — pode exigir testar `netlify.toml` com bloco `[[headers]]` explícito em vez do arquivo `_headers` (mecanismo alternativo do Netlify, com resolução documentada de forma mais determinística), ou abrir suporte com o Netlify.

Nada foi alterado no código nesta rodada — só diagnóstico, como pedido.
