# Graph Report - Perin_Rev  (2026-07-28)

## Corpus Check
- 72 files · ~382,085 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 657 nodes · 1144 edges · 45 communities (41 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8820c0b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- script.js
- script.min.js
- gsap/gsap.min.js
- src-original/script.js
- js/gsap.min.js
- ScrollTrigger.min.js
- 03-smooth-scroll/lenis.min.js
- lenis/lenis.min.js
- design-system/package.json
- devDependencies
- ce
- r
- src/index.ts
- compilerOptions
- Tween
- clients-carousel.test.js
- slider.test.js
- r
- t
- Bc
- df
- Tween
- _d
- ja
- mc
- init-scheduling.test.js
- cb
- na
- check-min-freshness.js
- install-git-hooks.js
- Qa
- Za
- slider.regression.test.js
- K
- P
- Nc
- xe
- build.mjs
- prototipos/extracao-perin/03-smooth-scroll/implementacao.js
- pre-commit
- Cd
- Graphify

## God Nodes (most connected - your core abstractions)
1. `initPage()` - 21 edges
2. `Bc()` - 14 edges
3. `r()` - 13 edges
4. `s()` - 13 edges
5. `Tween()` - 13 edges
6. `compilerOptions` - 13 edges
7. `Tween()` - 13 edges
8. `initContactForm()` - 12 edges
9. `initContactForm()` - 12 edges
10. `initContactForm()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `eb()` --indirect_call--> `f()`  [INFERRED]
  vendor/gsap/gsap.min.js → script.min.js
- `initClientsCarousel()` --indirect_call--> `v()`  [INFERRED]
  script.min.js → prototipos/cascading-slider/js/gsap.min.js
- `hb()` --indirect_call--> `f()`  [INFERRED]
  prototipos/cascading-slider/js/gsap.min.js → script.min.js
- `O()` --indirect_call--> `t()`  [INFERRED]
  vendor/gsap/ScrollTrigger.min.js → vendor/gsap/gsap.min.js
- `P()` --indirect_call--> `ke()`  [INFERRED]
  vendor/gsap/ScrollTrigger.min.js → vendor/gsap/gsap.min.js

## Import Cycles
- None detected.

## Communities (45 total, 4 thin omitted)

### Community 0 - "script.js"
Cohesion: 0.07
Nodes (39): applyPhoneMask(), batchReveal(), buildResponsiveImgAttrs(), capitalizeName(), captureStack(), checkEmail(), checkName(), checkNameOnBlur() (+31 more)

### Community 1 - "script.min.js"
Cohesion: 0.08
Nodes (42): applyPhoneMask(), batchReveal(), buildResponsiveImgAttrs(), capitalizeName(), checkEmail(), checkName(), checkNameOnBlur(), checkPhone() (+34 more)

### Community 2 - "gsap/gsap.min.js"
Cohesion: 0.06
Nodes (14): ee(), Jd(), Kd(), la(), Ld(), ma(), Md(), na() (+6 more)

### Community 3 - "src-original/script.js"
Cohesion: 0.12
Nodes (37): applyPhoneMask(), buildResponsiveImgAttrs(), capitalizeName(), checkEmail(), checkName(), checkNameOnBlur(), checkPhone(), checkService() (+29 more)

### Community 4 - "js/gsap.min.js"
Cohesion: 0.07
Nodes (14): ia(), Md(), Nd(), oa(), Od(), pa(), Pd(), qa() (+6 more)

### Community 5 - "ScrollTrigger.min.js"
Cohesion: 0.07
Nodes (4): gc(), Ja(), Ka(), qb()

### Community 6 - "03-smooth-scroll/lenis.min.js"
Cohesion: 0.11
Nodes (17): advance(), cleanUpClassName(), constructor(), destroy(), emit(), isLocked(), isScrolling(), isStopped() (+9 more)

### Community 7 - "lenis/lenis.min.js"
Cohesion: 0.11
Nodes (17): advance(), cleanUpClassName(), constructor(), destroy(), emit(), isLocked(), isScrolling(), isStopped() (+9 more)

### Community 8 - "design-system/package.json"
Cohesion: 0.07
Nodes (27): description, devDependencies, esbuild, @types/react, @types/react-dom, typescript, files, main (+19 more)

### Community 9 - "devDependencies"
Cohesion: 0.08
Nodes (25): clean-css-cli, jest, jest-environment-jsdom, lighthouse, description, devDependencies, clean-css-cli, jest (+17 more)

### Community 10 - "ce"
Cohesion: 0.15
Nodes (20): Ae(), Animation(), ce(), $d(), Da(), ee(), he(), ka() (+12 more)

### Community 11 - "r"
Cohesion: 0.15
Nodes (20): _a(), ac(), Co(), db(), ea(), eb(), ga(), gb() (+12 more)

### Community 12 - "src/index.ts"
Cohesion: 0.24
Nodes (10): Badge(), BadgeProps, Button(), ButtonProps, ButtonVariant, BaseCardProps, Card(), CardProps (+2 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, emitDeclarationOnly, esModuleInterop, jsx, lib, module, moduleResolution (+9 more)

### Community 14 - "Tween"
Cohesion: 0.15
Nodes (17): _assertThisInitialized(), Ec(), Fc(), gc(), ka(), qa(), t(), tb() (+9 more)

### Community 15 - "clients-carousel.test.js"
Cohesion: 0.12
Nodes (3): fs, html, path

### Community 16 - "slider.test.js"
Cohesion: 0.15
Nodes (3): fs, html, path

### Community 17 - "r"
Cohesion: 0.24
Nodes (12): Ao(), cb(), cc(), ga(), gb(), ha(), hb(), r() (+4 more)

### Community 18 - "t"
Cohesion: 0.24
Nodes (11): _a(), Context(), Db(), Eb(), fb(), Gc(), Gw(), Hc() (+3 more)

### Community 19 - "Bc"
Cohesion: 0.22
Nodes (11): Bc(), Ha(), Ia(), ob(), rc(), tc(), uc(), Va() (+3 more)

### Community 20 - "df"
Cohesion: 0.27
Nodes (11): df(), ff(), gf(), hf(), jf(), M(), N(), of() (+3 more)

### Community 21 - "Tween"
Cohesion: 0.27
Nodes (10): _assertThisInitialized(), ic(), ta(), Timeline(), Tween(), w(), x(), xa() (+2 more)

### Community 22 - "_d"
Cohesion: 0.29
Nodes (10): be(), _d(), fa(), ia(), ie(), je(), ke(), le() (+2 more)

### Community 23 - "ja"
Cohesion: 0.28
Nodes (9): Aa(), Animation(), ha(), ja(), Jc(), Lc(), Ra(), Sa() (+1 more)

### Community 24 - "mc"
Cohesion: 0.22
Nodes (9): Cb(), J(), mb(), mc(), oc(), Ta(), tb(), Ua() (+1 more)

### Community 25 - "init-scheduling.test.js"
Cohesion: 0.29
Nodes (3): fs, html, path

### Community 26 - "cb"
Cohesion: 0.29
Nodes (7): Ab(), Bb(), cb(), Context(), fb(), Gw(), zb()

### Community 27 - "na"
Cohesion: 0.33
Nodes (6): Aa(), Ca(), na(), Vb(), wb(), Xb()

### Community 28 - "check-min-freshness.js"
Cohesion: 0.33
Nodes (3): fs, path, ROOT

### Community 29 - "install-git-hooks.js"
Cohesion: 0.33
Nodes (5): { execSync }, fs, hooksSrcDir, path, ROOT

### Community 30 - "Qa"
Cohesion: 0.53
Nodes (6): Db(), La(), Ma(), Na(), Qa(), z()

### Community 31 - "Za"
Cohesion: 0.40
Nodes (5): kb(), ob(), ra(), rb(), Za()

### Community 32 - "slider.regression.test.js"
Cohesion: 0.50
Nodes (4): css, fs, html, path

### Community 33 - "K"
Cohesion: 0.40
Nodes (5): A(), B(), F(), G(), K()

### Community 34 - "P"
Cohesion: 0.40
Nodes (5): O(), P(), pc(), r(), yb()

### Community 35 - "Nc"
Cohesion: 0.50
Nodes (4): ja(), Lc(), Nc(), ub()

### Community 36 - "xe"
Cohesion: 0.50
Nodes (4): Ud(), vd(), we(), xe()

### Community 44 - "Graphify"
Cohesion: 0.25
Nodes (7): Atualização automática (hook), Checklist de verificação, Comandos (fallback manual), Consultas (uso pela IA), Graphify, O que é, Último resultado conhecido

## Knowledge Gaps
- **80 isolated node(s):** `O que é`, `Atualização automática (hook)`, `Comandos (fallback manual)`, `Checklist de verificação`, `Último resultado conhecido` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `script.min.js` to `r`, `r`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `eb()` connect `r` to `script.min.js`, `gsap/gsap.min.js`, `Tween`, `ja`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `hb()` connect `r` to `script.min.js`, `js/gsap.min.js`, `ce`, `t`, `Tween`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `r()` (e.g. with `Co()` and `ea()`) actually correct?**
  _`r()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `s()` (e.g. with `jf()` and `pf()`) actually correct?**
  _`s()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `O que é`, `Atualização automática (hook)`, `Comandos (fallback manual)` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06848357791754019 - nodes in this community are weakly interconnected._