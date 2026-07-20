# Verificação de Produção — Commit `ab2b2ae`

> **Status:** Verificação concluída. Nenhuma alteração de código feita nesta etapa.
> **Data:** 20/07/2026
> **Motivação:** usuário reportou que os 3 sintomas corrigidos nesta sessão (hero "pulando", "Sobre Nós" cortada, carrossel de clientes parado) continuam **exatamente iguais** em dispositivo real após o deploy do commit `ab2b2ae` no Netlify. Antes de investigar mais código, eliminar com certeza a hipótese de cache/deploy divergente.

---

## Passo 1 — Diff byte-a-byte, produção vs. commit local

**Nota sobre o ambiente:** a primeira tentativa via `curl` falhou (exit 35, erro TLS do schannel do Windows: `CRYPT_E_NO_REVOCATION_CHECK` — a checagem de revogação de certificado não completou, provavelmente por uma restrição de rede do sandbox). Resolvido com a flag `--ssl-no-revoke`, que ignora especificamente a checagem de revogação (não a validação do certificado em si) e permitiu o download normal. Confirmado que a conectividade geral funcionava (teste com `google.com` teve sucesso antes mesmo dessa flag), então o problema era específico da negociação TLS com o domínio da Netlify neste ambiente, não ausência de rede.

Download de produção via `curl --ssl-no-revoke` e comparação por SHA256 + `diff` contra `git show ab2b2ae:<arquivo>`:

| Arquivo | Tamanho produção | Tamanho local (`ab2b2ae`) | SHA256 produção | SHA256 local | Resultado |
|---|---|---|---|---|---|
| `script.min.js` | 34.774 bytes | 34.774 bytes | `ffa5a0b8cc29500e...628c1234` | `ffa5a0b8cc29500e...628c1234` | **IDÊNTICO** |
| `styles.min.css` | 48.493 bytes | 48.493 bytes | `0d387984eaf721f3...335328fd` | `0d387984eaf721f3...335328fd` | **IDÊNTICO** |
| `index.html` | 75.550 bytes | (75.5xx bytes) | `ec4f27300793a934...f83f67b5` | `5133031c49c2eedc...ca44999d02` | **Diverge** (1 linha) |

`script.min.js` e `styles.min.css` — os dois arquivos que carregam a lógica das três correções desta sessão — são **byte-a-byte idênticos** entre produção e o commit local. Hash SHA256 igual, `diff` vazio.

`index.html` diverge em exatamente uma linha, e a causa é conhecida e inofensiva — **não relacionada às correções desta sessão**:

```diff
-                    <form class='contact-form' id='contactForm' method='POST' name='contato' novalidate>
+                    <form class="contact-form" id="contactForm" method="POST" name="contato" data-netlify="true"
+                        netlify-honeypot="website" novalidate></form>
```

Isso é o **pós-processamento automático de formulários da Netlify** (Netlify Forms): ao detectar `name="contato"` num `<form>`, a plataforma reescreve o HTML no momento do build/deploy para injetar `data-netlify="true"` e `netlify-honeypot="website"` (necessários para o backend de formulários da Netlify funcionar), além de normalizar aspas simples para duplas. Isso acontece com qualquer `<form>` named, é documentado no comportamento padrão do Netlify, e não toca em `<head>`, `<script>`, ou qualquer trecho relacionado ao hero/portfólio/carrossel. Não é evidência de deploy incompleto.

**Conclusão do Passo 1: sem divergência de cache/deploy.** A produção reflete exatamente o `script.js`/`script.min.js`/`styles.min.css` do commit `ab2b2ae`.

---

## Passo 2 — Confirmação da presença específica das três correções em produção

Busca direta no `script.min.js` baixado da produção (não no local — para eliminar qualquer dúvida residual sobre qual arquivo está sendo inspecionado):

**1) Fila idle aguardando `onComplete` da timeline do hero (+ fallback):**
```
initHeroEntrance(t),setTimeout(t,3500),window.addEventListener("resize",()=>ScrollTrigger.refresh())...
```
Presente — `initHeroEntrance` recebe o callback `t` (a função que inicia a fila), e o fallback `setTimeout(t,3500)` está logo em seguida, exatamente como implementado.

**2) `ScrollTrigger.refresh()` após `initPortfolioGallery()` popular `#portfolioGrid`:**
```
function initPortfolioGallery(){var e=document.getElementById("portfolioGrid")...
...appendChild(m)}),"undefined"!=typeof ScrollTrigger&&ScrollTrigger.refresh(),i.addEventListener(...
```
Presente — o `ScrollTrigger.refresh()` aparece imediatamente após o `.appendChild(m)` do loop que insere os cards do portfólio (`m` é o card minificado), na mesma função que resolve `#portfolioGrid`.

**3) `touchcancel` no carrossel de clientes:**
```
...addEventListener("touchend",f),e.addEventListener("touchcancel",f),e.addEventListener("dragstart",e=>e...
```
Presente — registrado com a mesma função `f` do `touchend`, exatamente como implementado.

**Conclusão do Passo 2: as três correções estão presentes, no lugar certo, na produção.**

---

## Passo 3 — Diagnóstico honesto

Produção e commit local batem byte a byte nos arquivos que importam (`script.min.js`, `styles.min.css`). As três correções estão confirmadas presentes e no ponto exato do código onde deveriam estar. **Não há divergência de cache, CDN ou deploy incompleto.**

Isso significa que **as correções, apesar de bem fundamentadas na leitura estática do código e validadas via testes automatizados (Jest/jsdom) que reproduziam e confirmavam a correção da lógica isolada, não estão resolvendo o problema observável no dispositivo físico real.**

Não vou especular mais uma causa nem propor uma quarta correção às cegas. As possibilidades que vejo, sem conseguir distinguir entre elas sem dados reais do dispositivo, são (listadas para contexto, não como próxima ação):

- O diagnóstico original identificou causas reais e as corrigiu corretamente, mas **não são as causas dominantes** do que o usuário está percebendo — pode haver outro fator não identificado ainda que produz um sintoma visualmente idêntico.
- Os testes em jsdom (ambiente simulado, sem motor de renderização real, sem GPU, sem características específicas do Safari/Chrome mobile) validam a *lógica* das correções, mas não capturam o comportamento real de rede, cache do navegador do dispositivo, ou timing de rAF/GSAP em hardware físico.
- **Cache do navegador no próprio dispositivo do usuário** (não da Netlify/CDN, que já foi descartado) — o Passo 1 comprova que o servidor está servindo o conteúdo certo, mas não prova que o dispositivo de teste baixou essa versão (cache agressivo de Service Worker, cache do Safari em iOS, ou o usuário testando uma aba/PWA já carregada antes do deploy).

A causa raiz de por que os sintomas persistem **não está determinada por esta verificação** — este passo apenas eliminou uma hipótese (deploy/cache do servidor), não confirmou nenhuma outra.

**Recomendação:** antes de qualquer nova correção especulativa, o profiling real via Web Inspector remoto no iPhone (já documentado como pendente desde o início desta sessão, seção "Como validar no Safari real do iPhone" em `RELATORIO-PERFORMANCE.md`) deixou de ser "nice to have" e passou a ser necessário — é o único jeito de observar o que está de fato acontecendo no dispositivo, em vez de continuar validando lógica isolada em ambiente simulado. Também vale confirmar explicitamente com o usuário se o teste foi feito com hard refresh / aba anônima no dispositivo (elimina a hipótese de cache local do navegador do próprio aparelho).

---

## Passo 4 — Não aplicável

Não houve divergência entre produção e commit local (Passo 1 negativo). Este passo não se aplica.

---

## Resumo

| Passo | Resultado |
|---|---|
| 1 — Diff produção vs. local | **Idêntico** em `script.min.js`/`styles.min.css` (hash SHA256 igual). Única diferença em `index.html` é o pós-processamento de formulários da Netlify, não relacionado. |
| 2 — Presença das 3 correções | **Confirmadas** as três, no lugar certo, no arquivo servido pela produção. |
| 3 — Diagnóstico | Produção = código corrigido, e os sintomas persistem mesmo assim. **Não sei, com os dados disponíveis, por que as correções não estão resolvendo o problema real percebido no dispositivo.** Não vou especular uma quarta correção sem profiling real. |
| 4 — Divergência a corrigir | N/A — não houve divergência de deploy/cache de servidor. |

Nenhum código foi alterado nesta etapa.
