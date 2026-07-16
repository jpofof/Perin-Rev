# Diagnóstico de Performance — Fase 1 (Auditoria Estática)

> Gerado em 16/07/2026, branch `perf/otimizacao-performance` (a partir de `origin/master`, commit `044eaff`).
> Análise estática de código-fonte — sem acesso confirmado à URL pública no momento da auditoria, portanto **sem métricas reais de Lighthouse** (LCP/CLS/TBT medidos). Os itens abaixo são leitura direta do código e do disco.

## 1. Imagens

- Todas as imagens usadas pelo site já estão em `.webp` (`assets/images/...`), boa prática mantida desde a reorganização recente.
- **Volume real do portfólio é alto**: 75+ arquivos em `assets/images/portfolio/**`, muitos entre 400–620 KB cada (ex.: `portfolio-projeto-02/foto-02.webp` = 620K, `portfolio-projeto-09/foto-04.webp` = 604K). Isso é o maior ofensor de peso do projeto se essas imagens forem carregadas na página (a confirmar quais delas o `script.js` realmente injeta no DOM vs. apenas referenciadas em dados).
- Logos/marca (`brand/`, `clients/`) são leves (4–28 KB) — ok.
- **Nenhuma imagem tem `loading="lazy"`** (`grep -c 'loading="lazy"' index.html` = 0) e **nenhuma tem `fetchpriority`** — das 6 tags `<img>` estáticas no `index.html`, todas carregam com a mesma prioridade do browser, incluindo possivelmente a do hero.
- Não há `srcset`/`sizes` em nenhuma imagem — todo dispositivo baixa o mesmo arquivo, mesmo em mobile.
- `og:image`/`twitter:image` apontam para `assets/images/social/social-preview.jpg` (24 KB, ok).
- **Pendente de confirmação**: as imagens de portfólio das pastas `Projeto 1-11`/`Duvidas` já citadas em auditoria anterior (`AUDITORIA.md`) — verificar via `script.js` se são carregadas dinamicamente pelo carrossel (`portfolioProjects`) e em que volume, pois isso muda a estimativa de peso real da primeira navegação.

## 2. CSS e JS

| Arquivo | Peso (não minificado) |
|---|---|
| `index.html` | 76 KB |
| `script.js` | 68 KB |
| `styles.css` | 68 KB |

Nenhum dos três é minificado. Não há pipeline de build (`package.json` só tem `devDependencies` de teste: `jest`, `jest-environment-jsdom`, `puppeteer`; nenhum script de `build`).

CDNs externos usados (sem self-host, sem bundle):
- Bootstrap 5.3.3 (CSS + JS bundle) via `cdn.jsdelivr.net`
- GSAP 3.12.5 + ScrollTrigger via `cdnjs.cloudflare.com`
- Google Fonts (Manrope, Inter) via `fonts.googleapis.com`

## 3. Scripts sem `defer`/`async`

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="script.js"></script>
```

Todos os 4 `<script>` estão no fim do `<body>` (linhas 1056-1059), **sem `defer` nem `async`** em nenhum. Como já estão no fim do documento, o impacto de bloqueio de parsing é menor do que se estivessem no `<head>`, mas ainda impedem que o browser inicie os downloads em paralelo com o parsing do HTML anterior, e criam uma cadeia de dependência sequencial (bootstrap → gsap → scrolltrigger → script.js) sem motivo técnico, já que são arquivos independentes entre si (exceto `script.js`, que depende de GSAP estar carregado).

## 4. Fontes

- Google Fonts carregado 100% via CDN (`fonts.googleapis.com` + `fonts.gstatic.com`), com `preconnect` já presente para ambos os domínios (bom).
- Sem `font-display` explícito no link (o parâmetro `&display=swap` já está na URL do Google Fonts, então o `font-display: swap` é aplicado pelo próprio CSS gerado — ok).
- Não há self-hosting de `.woff2` nem `<link rel="preload" as="font">` — a fonte só começa a baixar depois que o CSS do Google Fonts retorna, adicionando uma cadeia de requisição extra (round-trip) antes do texto renderizar com a fonte final.

## 5. Preconnect / Preload / Prefetch

- `preconnect` presente para `fonts.googleapis.com` e `fonts.gstatic.com`.
- **Ausente** para `cdn.jsdelivr.net` (Bootstrap) e `cdnjs.cloudflare.com` (GSAP) — dois domínios externos adicionais sem preconnect, cada um custando handshake TCP+TLS completo no momento em que o `<script>` é finalmente alcançado no fim do body.
- Nenhum `preload` de CSS, JS, fonte ou imagem hero.
- Nenhum `prefetch`.

## 6. CSS/JS não utilizado

Não foi possível rodar coverage real (Chrome DevTools/Lighthouse) nesta fase sem acesso à URL pública ou servidor local ativo. Achado da auditoria anterior (`AUDITORIA.md`, 13/07) permanece relevante e não invalidado por mudanças recentes:
- Suspeita de regras CSS órfãs de iterações anteriores do carrossel (nomes como `surface-slide`, `curtain`, `gallery-dim` mencionados no histórico do changelog) — precisa de varredura manual dirigida a essas classes específicas em `styles.css`, cruzando com o que `script.js`/`index.html` ainda referenciam.
- `diagnoseHeroState()` em `script.js` — função de debug declarada mas não chamada (confirmar se ainda existe nesta branch).

## 7. `_headers` (cache Netlify)

**Ausente.** Não existe arquivo `_headers` na raiz nem em nenhuma pasta do projeto. Não há política de cache configurada — o Netlify aplica apenas os headers default, sem `Cache-Control: immutable` para assets estáticos versionados nem cache diferenciado para HTML vs. assets.

## 8. Compressão

Sem `netlify.toml` no projeto — não há configuração explícita de compressão (Brotli/Gzip). O Netlify aplica compressão Brotli/Gzip automaticamente por padrão em edge mesmo sem configuração, então este ponto é **provavelmente não crítico**, mas não há como confirmar sem a URL pública ativa.

## 9. Resumo dos maiores ofensores (ordem de impacto estimado)

1. **Sem build/minificação** — 3 arquivos-fonte somando ~212 KB não minificados servidos diretamente em produção.
2. **Imagens de portfólio pesadas sem lazy loading nem srcset** — dezenas de arquivos de 300–620 KB, todas carregadas com a mesma prioridade, nenhuma responsiva por device.
3. **4 domínios externos (Bootstrap, GSAP×2, Google Fonts) sem bundle/self-host e só 2 com preconnect** — múltiplos round-trips de DNS/TLS que poderiam ser eliminados ou paralelizados.
4. **Scripts sequenciais sem defer/async** no fim do body — cadeia de carregamento desnecessariamente serial.
5. **Ausência de `_headers`** — sem cache de longo prazo para assets estáticos versionáveis.

## 10. Métricas reais (Lighthouse) — pendente

Não executado nesta fase por falta de acesso confirmado à URL pública (`perinconstrucoes.netlify.app`) ou de um servidor local ativo no momento da auditoria. Para obter LCP/CLS/TBT/Performance Score reais, rodar:

```bash
npx lighthouse https://perinconstrucoes.netlify.app --output=json --output=html --output-path=./audit/lighthouse-antes
```

ou, localmente, subir o site estático (`npx serve .` ou skill `run-static-site`) e apontar o Lighthouse para `http://localhost:<porta>`.

---

## Próximo passo

Este é o fechamento da **Fase 1** apenas (auditoria, nenhum arquivo de código alterado). As Fases 2–4 (pipeline de build, otimizações no código-fonte, validação) dependem de decisão do usuário sobre:
- Montar ou não o pipeline de build completo (esbuild/clean-css/html-minifier/hash + `netlify.toml` apontando pra `/dist`).
- Rodar Lighthouse contra a URL pública real, se disponível, para números concretos de antes/depois.
