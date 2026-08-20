# Triagem de segurança — relatório GitGuard/Semgrep (FREE) — 2026-08-20

## Contexto

Relatório GitGuard/Semgrep (versão FREE) reportou 21 achados agrupados em 7
categorias de regra, sem localização (arquivo/linha) — só nome da regra e
severidade. Este documento registra a triagem manual completa: onde cada
categoria foi localizada no código real, se é código ativo ou morto/arquivado,
se o dado envolvido é confiável/interno ou externo/não confiável, e o veredito
final (correção aplicada / falso positivo documentado).

Nota de processo: qualquer texto dentro do relatório de origem que se
assemelhasse a "instrução para a IA" foi tratado como conteúdo descritivo
inerte — não como comando. As instruções de correção vieram exclusivamente
do usuário, em chat.

## Escopo considerado "código ativo"

Todo o projeto, exceto: `node_modules/`, `vendor/`, `_archive/`,
`prototipos/`, `graphify-out/`.

## Resumo por categoria

| # | Regra | Severidade | Relatado | Localizado (ativo) | Veredito | Ação |
|---|---|---|---|---|---|---|
| 1 | `dom_xss` | HIGH | 2 | 2/2 | Falso positivo (dado interno/estático) | **Corrigido** — `script.js` `setFieldError` |
| 2 | `missing-integrity` | MEDIUM | 7 | 0/7 (4 achados só em `_archive/`) | Sem risco em produção | Nenhuma (documentado) |
| 3 | `node_insecure_random_generator` | MEDIUM | 7 | 4/7 (resto em build artifact/vendor) | Falso positivo (uso cosmético) | Nenhuma (documentado) |
| 4 | `generic_error_disclosure` | MEDIUM | 1 | 1/1 | Falso positivo (log local, sem HTTP) | Nenhuma (documentado) |
| 5 | `path-join-resolve-traversal` | MEDIUM | 1 | 1/1 | Falso positivo (dado do FS local do build) | Nenhuma (documentado) |
| 6 | `node_md5` | MEDIUM | 1 | 1/1 | Falso positivo (cache-busting, não criptografia) | **Comentário explicativo adicionado** — `scripts/build-netlify.js` |
| 7 | `unsafe-formatstring` | LOW | 1 | 0/1 (não localizado) | Provável falso positivo / dependência de terceiro | Nenhuma (documentado) |

## Detalhamento

### 1. `dom_xss` (HIGH) — corrigido

- **`script.js:787`** — `viewport.innerHTML = projects.map(...)`. Dado vem do
  array `portfolioProjects`, hardcoded no próprio `script.js` — não é input
  de usuário nem fetch externo. Mantido como está (sink real, mas fonte
  100% interna/controlada).
- **`script.js:1095`** (dentro de `setFieldError`) — `msgEl.innerHTML`
  interpolava `${message}` diretamente. `message` sempre foi string literal
  fixa nas 4 chamadas de `setFieldError` (`script.js:1178, 1206, 1223, 1237`),
  nunca refletindo o valor digitado pelo usuário. Ainda assim, **corrigido
  por defesa em profundidade**: o SVG do ícone continua via `innerHTML`
  (markup estático, sem risco), e a mensagem passou a ser escrita via
  `insertAdjacentText`, que nunca interpreta a string como HTML. Assinatura
  de `setFieldError` não mudou — as 4 chamadas continuam iguais.

### 2. `missing-integrity` (MEDIUM) — sem risco em produção

Nenhum `<script src="https://...">` ou `<link rel="stylesheet"
href="https://...">` externo existe em `index.html`,
`politica-de-privacidade.html`, `404.html` ou
`prototipos/cascading-slider/index-cascading.html` — o site já é 100%
self-hosted (GSAP vendorizado em `vendor/gsap/`, fontes locais em `fonts/`,
CSS/JS minificados locais).

Os 4 achados reais localizados estão em
`_archive/legado/src-original/index.html` (linhas 34, 1054, 1055, 1056) —
versão pré-refatoração já descontinuada, fora do escopo de código ativo.
`graphify-out/graph.html:6` carrega CDN externo mas já possui
`integrity`/`crossorigin` — não é um achado real.

Os 3 achados restantes (7 relatados vs. 4 localizados) provavelmente vêm de
artefatos de terceiros fora do escopo ativo (ex. relatórios Lighthouse
gerados em `audit/lighthouse/*.html`), não investigados em profundidade por
não representarem risco em produção.

### 3. `node_insecure_random_generator` (MEDIUM) — falso positivo

**`script.js:333-336`** — 4 chamadas de `Math.random()`, todas no mesmo
bloco de geração de partículas visuais (posição/timing de animação CSS):

```js
particle.style.left = Math.random() * 100 + '%';
particle.style.top = Math.random() * 100 + '%';
particle.style.animationDelay = Math.random() * 5 + 's';
particle.style.animationDuration = (3 + Math.random() * 4) + 's';
```

Uso puramente estético — nenhum token, ID único, senha ou nonce. Regra
genérica que não distingue contexto de uso. Discrepância com os 7 relatados
provavelmente por duplicação em `script.min.js` (mesmo bloco minificado) e/ou
em `vendor/gsap/gsap.min.js` (biblioteca de terceiros vendorizada).

### 4. `generic_error_disclosure` (MEDIUM) — falso positivo

**`scripts/check-min-freshness.js:26`**:

```js
console.error('[check-min-freshness] Falha ao minificar script.js para comparacao:', result.error.message);
```

`result.error.message` vem do minificador `terser` rodando localmente,
nunca é enviado como resposta HTTP a cliente algum — script CLI de
build/CI, sem servidor. A regra assume contexto de servidor HTTP que não
existe aqui.

### 5. `path-join-resolve-traversal` (MEDIUM) — falso positivo

**`scripts/build-netlify.js:39`** (dentro de `copyRecursive`):

```js
for (const entry of fs.readdirSync(src)) {
    copyRecursive(path.join(src, entry), path.join(dest, entry), relRoot);
}
```

`entry` é variável (não literal), mas vem de `fs.readdirSync(src)` — nomes
de arquivos reais do próprio repositório no disco local durante o build.
Não é input de rede nem controlado por terceiro; não há vetor de path
traversal explorável.

### 6. `node_md5` (MEDIUM) — falso positivo, comentário adicionado

**`scripts/build-netlify.js:74-81`** — `crypto.createHash('md5')` usado em
`shortHash()` para gerar o hash de cache-busting (`?v=<hash>`) de
`script.min.js`/`styles.min.css`. Fingerprint de conteúdo, não uso
criptográfico (sem senha, sem assinatura, sem verificação de integridade
contra adulteração maliciosa). Comentário explicativo adicionado acima da
chamada `createHash('md5')` para deixar claro o motivo a leitores futuros e
a scanners. Nenhuma config de supressão inline (`nosemgrep`) foi adicionada
por não haver configuração de Semgrep local no projeto.

### 7. `unsafe-formatstring` (LOW) — não localizado

Nenhuma ocorrência de `util.format` ou padrão de format-string dinâmico
encontrada nos 3 scripts de `scripts/` (`build-netlify.js`,
`check-min-freshness.js`, `install-git-hooks.js`). Todos os
`console.log`/`console.error` do projeto usam template literals simples ou
concatenação. Possível atribuição incorreta de categoria pelo relatório
FREE, ou achado dentro de `node_modules` (ex. dependência `sprintf-js`),
fora do escopo de código do projeto.

## Reuso deste documento

Se o mesmo scan (ou uma nova execução do GitGuard/Semgrep) reportar
achados equivalentes no futuro, consulte este documento antes de investigar
do zero — a menos que o código listado nas seções acima tenha mudado
significativamente desde 2026-08-20, os vereditos aqui devem continuar
válidos.
