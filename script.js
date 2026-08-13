/* ============================================
   PERIN CONSTRUÇÕES — Premium JavaScript
   ============================================ */

'use strict';

// Helper global (fora de qualquer IIFE de debug) usado pelos checkpoints
// granulares dentro de initPage() — precisa estar disponivel la, entao nao
// pode viver dentro do bloco initPerfDebug() mais abaixo. No-op total (sem
// custo de performance) quando window.__perfDebugLog nao existe, ou seja,
// fora do modo ?debug=perf/?debug=all. Remover junto com o bloco
// initPerfDebug() quando a instrumentacao nao for mais necessaria.
function __perfCheckpoint(label) {
    if (window.__perfDebugLog) {
        window.__perfDebugLog.push({ event: label, t: Math.round(performance.now()) });
    }
}

// Instancia unica do Lenis, usada pelo menu mobile (lock/unlock de scroll) e
// pelo roteamento de cliques em ancoras (#about, #contact...). Permanece null
// sob prefers-reduced-motion — nesse caso o scroll nativo assume sem overhead.
let lenisInstance = null;

// === SMOOTH SCROLL (Lenis) ===
// Integrado com autoRaf:false + sincronizacao manual via gsap.ticker — NAO o
// autoRaf:true da referencia extraida (_archive/prototipos-extracao-perin/03-smooth-scroll/), que
// deixa o Lenis atualizar a posicao de scroll no proprio requestAnimationFrame
// sem avisar o ScrollTrigger, causando dessincronia/jitter entre o scroll
// suavizado e os triggers. Ver README da extracao para o detalhamento.
function initSmoothScroll() {
    const prefersReducedMotion = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    lenisInstance = new Lenis({
        autoRaf: false,
        syncTouch: false, // touch ja tem inercia nativa propria — nao empilhar duas
    });

    lenisInstance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Ancoras internas (#about, #services, #portfolio, #faq, #contact...)
    // precisam ser roteadas pelo lenis.scrollTo — se o navegador fizer o jump
    // nativo, o Lenis "corrige" a posicao de volta no frame seguinte,
    // produzindo um salto visivel (ver README da extracao).
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            lenisInstance.scrollTo(target);
        });
    });
}

// === DEBUG TEMPORARIO — FASE 1, salto de scroll (remover apos diagnostico) ===
// So ativa com ?debug=scroll na URL — nunca roda para usuarios normais. Bloco
// autocontido, nao interfere em nada do resto do arquivo. Seguro remover
// (junto com o </script> extra no index.html, se algum for adicionado) assim
// que a causa do salto de scroll estiver confirmada e corrigida.
(function initScrollJumpDebug() {
    var params = new URLSearchParams(location.search);
    var __dbg = params.get('debug');
    if (__dbg !== 'scroll' && __dbg !== 'all') return;

    var JUMP_THRESHOLD = 10; // reduzido de 30 — captura saltos menores/perceptiveis
    var VERBOSE_THRESHOLD = 5; // qualquer variacao > 5px entra no buffer
    var BUFFER_SIZE = 50; // buffer circular — nao cresce sem limite numa sessao longa

    var buffer = []; // circular, ultimos BUFFER_SIZE eventos (qualquer tipo)
    var lastY = window.scrollY;
    var lastTop = document.documentElement.scrollTop;
    var lastInnerH = window.innerHeight;
    var lastDocH = document.documentElement.scrollHeight;
    var startedAt = performance.now();
    var buttonShown = false;

    function pushEvent(entry) {
        entry.t = Math.round(performance.now() - startedAt);
        buffer.push(entry);
        if (buffer.length > BUFFER_SIZE) buffer.shift();
        window.__scrollDebugLog = buffer;
    }

    function showCopyButton(reason) {
        if (buttonShown) return;
        buttonShown = true;
        var btn = document.createElement('button');
        btn.textContent = '📋 Copiar log de debug';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;' +
            'padding:14px 18px;background:#2A873E;color:#fff;border:none;border-radius:8px;' +
            'font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        btn.addEventListener('click', function () {
            var payload = JSON.stringify({ reason: reason, log: window.__scrollDebugLog || buffer }, null, 2);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(payload).then(function () {
                    btn.textContent = '✅ Copiado!';
                }).catch(function () {
                    btn.textContent = '❌ Falhou — copie via console';
                });
            } else {
                btn.textContent = '❌ clipboard indisponivel';
            }
        });
        document.body.appendChild(btn);
    }

    // Intercepta TODA forma programatica de mover o scroll pra 0/topo, capturando
    // a pilha de chamadas exata (console.trace + string da stack no proprio log,
    // ja que nao da pra copiar o console do iPhone sem Mac). Se nenhuma dessas
    // disparar no momento do salto, e forte indicio de que NAO e o nosso codigo
    // — ex: o gesto nativo do iOS Safari de tocar a barra de status pra rolar
    // ao topo, que nao passa por nenhuma API JS interceptavel.
    function captureStack(label) {
        var stack = (new Error()).stack || 'stack indisponivel';
        pushEvent({ event: 'CHAMADA JS: ' + label, stack: stack.split('\n').slice(0, 8).join(' | ') });
        console.trace('[DEBUG-SCROLL] ' + label);
    }
    var origScrollTo = window.scrollTo;
    window.scrollTo = function () {
        captureStack('window.scrollTo(' + Array.prototype.slice.call(arguments).map(String).join(',') + ')');
        return origScrollTo.apply(this, arguments);
    };
    var origScroll = window.scroll;
    window.scroll = function () {
        captureStack('window.scroll(' + Array.prototype.slice.call(arguments).map(String).join(',') + ')');
        return origScroll.apply(this, arguments);
    };
    var origScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {
        captureStack('Element.scrollIntoView() em <' + this.tagName + (this.id ? '#' + this.id : '') + (this.className ? '.' + String(this.className).split(' ').join('.') : '') + '>');
        return origScrollIntoView.apply(this, arguments);
    };
    // scrollTop = 0 direto (documentElement e body — os dois alvos possiveis
    // pra "voltar ao topo" dependendo do modo de quirks do navegador).
    [document.documentElement, document.body].forEach(function (el) {
        var proto = Object.getPrototypeOf(el);
        var desc = null;
        while (proto && !desc) {
            desc = Object.getOwnPropertyDescriptor(proto, 'scrollTop');
            proto = Object.getPrototypeOf(proto);
        }
        if (!desc || !desc.set) return;
        Object.defineProperty(el, 'scrollTop', {
            configurable: true,
            get: function () { return desc.get.call(el); },
            set: function (v) {
                if (v === 0) captureStack('element.scrollTop = 0 em <' + el.tagName + '>');
                return desc.set.call(el, v);
            },
        });
    });
    // Foco programatico em elemento perto do topo tambem pode causar scroll
    // automatico do navegador ate ele (mesmo sem chamada explicita de scroll).
    document.addEventListener('focusin', function (e) {
        var rect = e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
        var docTop = rect ? rect.top + window.scrollY : null;
        if (docTop !== null && docTop < 400) { // elemento focado perto do topo do documento
            captureStack('focusin perto do topo em <' + e.target.tagName + (e.target.id ? '#' + e.target.id : '') + '> (docTop=' + Math.round(docTop) + ')');
        }
    }, true);

    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function' && !window.ScrollTrigger.__wrappedForDebug) {
        var origRefresh = window.ScrollTrigger.refresh;
        window.ScrollTrigger.refresh = function () {
            pushEvent({ event: 'ScrollTrigger.refresh()', scrollY: window.scrollY, scrollTop: document.documentElement.scrollTop, innerHeight: window.innerHeight, docHeight: document.documentElement.scrollHeight });
            return origRefresh.apply(this, arguments);
        };
        window.ScrollTrigger.__wrappedForDebug = true;
    }

    window.addEventListener('resize', function () {
        pushEvent({ event: 'resize', innerHeight: window.innerHeight });
    }, { passive: true });

    // Listener ativo pela sessao inteira (sem limite de tempo) — o salto pode
    // acontecer bem depois da janela inicial de inicializacoes.
    setInterval(function () {
        var y = window.scrollY;
        var top = document.documentElement.scrollTop;
        var innerH = window.innerHeight;
        var docH = document.documentElement.scrollHeight;

        var yDrop = lastY - y;
        var topDrop = lastTop - top;
        var changed = Math.abs(y - lastY) > VERBOSE_THRESHOLD || Math.abs(top - lastTop) > VERBOSE_THRESHOLD;

        if (changed) {
            pushEvent({ scrollY: y, scrollTop: top, innerHeight: innerH, docHeight: docH, dY: y - lastY, dTop: top - lastTop });
        }

        if (yDrop > JUMP_THRESHOLD || topDrop > JUMP_THRESHOLD) {
            pushEvent({
                event: 'SALTO DETECTADO', from: lastY, to: y, delta: yDrop,
                fromTop: lastTop, toTop: top, deltaTop: topDrop,
                innerHeight: innerH, lastInnerHeight: lastInnerH, docHeight: docH, lastDocHeight: lastDocH,
            });
            showCopyButton('salto automatico (scrollY ou scrollTop caiu > ' + JUMP_THRESHOLD + 'px)');
        }
        lastY = y;
        lastTop = top;
        lastInnerH = innerH;
        lastDocH = docH;
    }, 20);

    // Long-press manual (2s) em qualquer lugar da tela — ativa o botao mesmo
    // se a deteccao automatica nao disparar, pra sempre dar pra capturar o
    // buffer circular dos ultimos eventos.
    var pressTimer = null;
    function cancelPress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }
    document.addEventListener('touchstart', function (e) {
        var startX = e.touches[0].clientX, startY = e.touches[0].clientY;
        pressTimer = setTimeout(function () {
            pushEvent({ event: 'LONG-PRESS MANUAL (2s)' });
            showCopyButton('long-press manual');
        }, 2000);
        var moveHandler = function (ev) {
            var dx = Math.abs(ev.touches[0].clientX - startX);
            var dy = Math.abs(ev.touches[0].clientY - startY);
            if (dx > 15 || dy > 15) cancelPress(); // dedo se moveu — provavelmente e um scroll, nao um long-press
        };
        document.addEventListener('touchmove', moveHandler, { passive: true });
        document.addEventListener('touchend', function cleanup() {
            cancelPress();
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('touchend', cleanup);
        }, { once: true });
    }, { passive: true });

    console.log('[DEBUG-SCROLL] instrumentacao ativa (threshold=' + JUMP_THRESHOLD + 'px, buffer circular de ' + BUFFER_SIZE + ' eventos, sem limite de tempo). Toque e segure 2s em qualquer lugar pra forcar a captura manual.');
})();

// === DEBUG TEMPORARIO — FASE 2, travamento real no Safari iOS (remover apos
// diagnostico) ===
// So ativa com ?debug=perf ou ?debug=all na URL — nunca roda para usuarios
// normais. Bloco autocontido. Motivacao: o WebPageTest so testa Chrome (mesmo
// em "modo mobile"), entao nunca reproduz o travamento real que o usuario e
// os pais dele sentem no Safari/WebKit do iPhone. Esta instrumentacao roda
// direto no dispositivo real para capturar dados que o Chrome nao reproduz —
// mesma estrategia que funcionou para o bug de salto de scroll acima.
(function initPerfDebug() {
    var params = new URLSearchParams(location.search);
    var __dbg = params.get('debug');
    if (__dbg !== 'perf' && __dbg !== 'all') return;

    var log = [];
    var startedAt = performance.now();
    window.__perfDebugLog = log;
    var buttonShown = false;

    function mark(event, extra) {
        var entry = Object.assign({ event: event, t: Math.round(performance.now() - startedAt) }, extra || {});
        log.push(entry);
    }

    function showCopyButton() {
        if (buttonShown) return;
        buttonShown = true;
        var btn = document.createElement('button');
        btn.textContent = '📋 Copiar log de performance';
        btn.style.cssText = 'position:fixed;bottom:80px;right:20px;z-index:999999;' +
            'padding:14px 18px;background:#1E5FBF;color:#fff;border:none;border-radius:8px;' +
            'font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        btn.addEventListener('click', function () {
            var payload = JSON.stringify({ log: window.__perfDebugLog || log }, null, 2);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(payload).then(function () {
                    btn.textContent = '✅ Copiado!';
                }).catch(function () {
                    btn.textContent = '❌ Falhou — copie via console';
                });
            } else {
                btn.textContent = '❌ clipboard indisponivel';
            }
        });
        document.body.appendChild(btn);
    }
    // Botao sempre disponivel desde o inicio — captura manual apos usar o site
    // normalmente por 15-20s, sem necessidade de deteccao automatica de anomalia.
    if (document.body) showCopyButton();
    else document.addEventListener('DOMContentLoaded', showCopyButton, { once: true });

    mark('script-start');

    // --- Passo 3 (Fase 2): instrumentacao ampla de timers, pra achar a fonte
    // do travamento periodico de ~3s reportado durante TODA a sessao (nao so
    // no carregamento). Investigacao de codigo (Passos 1-2) nao encontrou
    // nenhum listener de animationiteration/animationend nas particulas do
    // hero (createParticles() so usa animacao CSS pura, sem callback JS) nem
    // nenhum setInterval de producao com esse intervalo — entao, em vez de
    // instrumentar um candidato especifico, interceptamos setTimeout/
    // setInterval nativos SEM alterar comportamento: so logamos quando o
    // delay cai na janela 2500-3500ms, na criacao E no disparo do callback,
    // com stack resumida pra identificar a origem real (nosso codigo, GSAP
    // interno, ou outra lib de terceiro).
    var TIMER_WINDOW_MIN = 2500;
    var TIMER_WINDOW_MAX = 3500;
    var origSetTimeout = window.setTimeout;
    var origSetInterval = window.setInterval;
    function shortStack() {
        var stack = (new Error()).stack || '';
        return stack.split('\n').slice(2, 6).join(' | ');
    }
    window.setTimeout = function (fn, delay) {
        if (typeof delay === 'number' && delay >= TIMER_WINDOW_MIN && delay <= TIMER_WINDOW_MAX) {
            mark('setTimeout-created', { delay: delay, stack: shortStack() });
            var wrapped = function () {
                mark('setTimeout-fired', { delay: delay });
                if (typeof fn === 'function') return fn.apply(this, arguments);
            };
            return origSetTimeout.apply(window, [wrapped].concat(Array.prototype.slice.call(arguments, 1)));
        }
        return origSetTimeout.apply(window, arguments);
    };
    window.setInterval = function (fn, delay) {
        if (typeof delay === 'number' && delay >= TIMER_WINDOW_MIN && delay <= TIMER_WINDOW_MAX) {
            mark('setInterval-created', { delay: delay, stack: shortStack() });
            var wrapped = function () {
                mark('setInterval-fired', { delay: delay });
                if (typeof fn === 'function') return fn.apply(this, arguments);
            };
            return origSetInterval.apply(window, [wrapped].concat(Array.prototype.slice.call(arguments, 1)));
        }
        return origSetInterval.apply(window, arguments);
    };

    // --- Marcos ja conhecidos (DOMContentLoaded, load) ---
    document.addEventListener('DOMContentLoaded', function () { mark('DOMContentLoaded'); });
    window.addEventListener('load', function () { mark('load'); });

    // --- Hero entrance e Grupo A: wrap das funcoes globais existentes sem
    // alterar sua logica interna. Funciona porque declaracoes de funcao no
    // topo do arquivo sao hoisted antes deste IIFE rodar. ---
    if (typeof window.initHeroEntrance === 'function') {
        var origInitHeroEntrance = window.initHeroEntrance;
        window.initHeroEntrance = function (onDone) {
            mark('hero-entrance-start');
            return origInitHeroEntrance(function () {
                mark('hero-entrance-end');
                if (onDone) onDone();
            });
        };
    } else {
        mark('hero-entrance-hook-indisponivel');
    }

    if (typeof window.runBatchWhenIdle === 'function') {
        var origRunBatchWhenIdle = window.runBatchWhenIdle;
        window.runBatchWhenIdle = function (fns) {
            mark('grupoA-start');
            var result = origRunBatchWhenIdle(fns);
            mark('grupoA-end');
            return result;
        };
    } else {
        mark('grupoA-hook-indisponivel');
    }

    if (typeof window.initClientsCarousel === 'function') {
        var origInitClientsCarousel = window.initClientsCarousel;
        window.initClientsCarousel = function () {
            mark('clientsCarousel-init-start');
            var result = origInitClientsCarousel.apply(this, arguments);
            var track = document.getElementById('clientsTrack');
            var firstImg = track ? track.querySelector('img') : null;
            if (firstImg) {
                if (firstImg.complete) {
                    mark('clientsCarousel-first-image-loaded', { fromCache: true });
                } else {
                    firstImg.addEventListener('load', function () {
                        mark('clientsCarousel-first-image-loaded', { fromCache: false });
                    }, { once: true });
                }
            }
            return result;
        };
    } else {
        mark('clientsCarousel-hook-indisponivel');
    }

    // --- Frame timing via requestAnimationFrame: captura deltas > 50ms nos
    // primeiros ~9s de vida da pagina (janela onde os travamentos reais foram
    // relatados: hero entrance + Grupo A rodando). ---
    var RAF_WINDOW_MS = 9000;
    var lastFrameTime = startedAt;
    function rafTick(now) {
        var delta = now - lastFrameTime;
        if (delta > 50) {
            mark('frame-delta', { deltaMs: Math.round(delta) });
        }
        lastFrameTime = now;
        if (now - startedAt < RAF_WINDOW_MS) {
            requestAnimationFrame(rafTick);
        } else {
            mark('frame-timing-window-encerrada');
        }
    }
    requestAnimationFrame(rafTick);

    // --- Long tasks (PerformanceObserver) — suporte inconsistente no Safari
    // iOS, entao registramos explicitamente quando nao disponivel. ---
    if ('PerformanceObserver' in window) {
        try {
            new PerformanceObserver(function (list) {
                list.getEntries().forEach(function (entry) {
                    mark('longtask', { duration: Math.round(entry.duration), startTime: Math.round(entry.startTime), name: entry.name });
                });
            }).observe({ entryTypes: ['longtask'] });
        } catch (e) {
            mark('longtask-unsupported', { error: String(e) });
        }
    } else {
        mark('performance-observer-unsupported');
    }

    // --- Memoria: performance.memory nao existe no Safari — registra
    // indisponivel em vez de inventar dado. ---
    if (performance.memory) {
        mark('memory', {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
        });
    } else {
        mark('memory-unsupported');
    }

    // --- Heartbeat: setInterval de 200ms. Gap >500ms entre heartbeats
    // consecutivos = main thread bloqueado tempo suficiente pro proprio timer
    // atrasar — sinal direto de travamento percebido pelo usuario. ---
    var HEARTBEAT_INTERVAL = 200;
    var HEARTBEAT_GAP_THRESHOLD = 500;
    var lastHeartbeat = startedAt;
    setInterval(function () {
        var now = performance.now();
        var gap = now - lastHeartbeat;
        if (gap > HEARTBEAT_GAP_THRESHOLD) {
            mark('heartbeat-gap', { gapMs: Math.round(gap) });
        }
        lastHeartbeat = now;
    }, HEARTBEAT_INTERVAL);

    console.log('[DEBUG-PERF] instrumentacao ativa. Use o site normalmente por 15-20s e toque no botao para copiar o log.');
})();

// === DEBUG TEMPORARIO — FASE 3, vao vazio abaixo do carrossel em Safari/
// iPhone real (remover apos diagnostico) ===
// So ativa com ?debug=layout ou ?debug=all na URL — nunca roda para usuarios
// normais. Bloco autocontido, mesma estrategia dos blocos ?debug=scroll/
// ?debug=perf acima: sem Mac disponivel pra abrir o Web Inspector do Safari
// iOS, entao a captura roda direto no dispositivo real e o resultado sai via
// clipboard. Botao aparece imediatamente (nao depende de detectar uma
// anomalia) — abra o projeto no portfolio mobile, toque no botao, cole o
// resultado. Nao regenerar script.min.js so por causa deste bloco — e
// temporario, some quando o vao for diagnosticado/corrigido.
(function initLayoutDebug() {
    var params = new URLSearchParams(location.search);
    var __dbg = params.get('debug');
    if (__dbg !== 'layout' && __dbg !== 'all') return;

    function collectSnapshot() {
        var stage = document.querySelector('.portfolio-stage');
        var gallery = document.querySelector('.portfolio-gallery');
        var viewer = document.querySelector('.portfolio-viewer');
        var header = document.querySelector('.portfolio-header');

        // Adicionado para investigar divergencia hero mobile Safari real vs
        // emulacao Chrome DevTools (espacamento titulo -> subtitulo+botao ->
        // ROLE PARA EXPLORAR). window.visualViewport.height reflete a area
        // REALMENTE visivel no Safari iOS (exclui a barra de enderecos em
        // transicao) — window.innerHeight pode nao refletir isso, e e o
        // valor que a media query max-height:700px usa internamente.
        var hero = document.querySelector('.hero-architectural-scene');
        var heroTitle = document.querySelector('.hero-title');
        var heroSubtitle = document.querySelector('.hero-subtitle');
        var heroButton = document.querySelector('.hero-button-secondary');
        var heroIndicator = document.querySelector('.hero-scroll-indicator');
        var heroTitleCs = heroTitle ? getComputedStyle(heroTitle) : null;
        var heroIndicatorCs = heroIndicator ? getComputedStyle(heroIndicator) : null;

        return JSON.stringify({
            stage: stage ? stage.getBoundingClientRect() : null,
            gallery: gallery ? gallery.getBoundingClientRect() : null,
            viewer: viewer ? viewer.getBoundingClientRect() : null,
            header: header ? header.getBoundingClientRect() : null,
            fontsReady: document.fonts.status,
            windowHeight: window.innerHeight,
            visualViewportHeight: window.visualViewport ? window.visualViewport.height : null,
            devicePixelRatio: window.devicePixelRatio,
            scrollY: window.scrollY,
            hero: {
                rect: hero ? hero.getBoundingClientRect() : null,
                titleRect: heroTitle ? heroTitle.getBoundingClientRect() : null,
                subtitleRect: heroSubtitle ? heroSubtitle.getBoundingClientRect() : null,
                buttonRect: heroButton ? heroButton.getBoundingClientRect() : null,
                indicatorRect: heroIndicator ? heroIndicator.getBoundingClientRect() : null,
                titleMarginBottom: heroTitleCs ? heroTitleCs.marginBottom : null,
                indicatorBottom: heroIndicatorCs ? heroIndicatorCs.bottom : null,
                indicatorMargin: heroIndicatorCs ? heroIndicatorCs.margin : null,
                gapButtonToIndicator: (heroButton && heroIndicator)
                    ? Math.round(heroIndicator.getBoundingClientRect().top - heroButton.getBoundingClientRect().bottom)
                    : null,
            },
        }, null, 2);
    }

    function showCopyButton() {
        var btn = document.createElement('button');
        btn.textContent = '📐 Copiar snapshot de layout';
        btn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;' +
            'padding:14px 18px;background:#7C3AED;color:#fff;border:none;border-radius:8px;' +
            'font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        btn.addEventListener('click', function () {
            var payload = collectSnapshot();
            console.log('[DEBUG-LAYOUT] ' + payload);

            // navigator.clipboard.writeText() exige contexto seguro (HTTPS) —
            // indisponivel testando via IP local em HTTP no Safari iOS. Fallback
            // classico: textarea temporario com o texto selecionado (permite
            // copiar manualmente com o gesto nativo de selecao do iOS) + alert()
            // mostrando o mesmo conteudo, caso a selecao/copia manual falhe.
            var textarea = document.createElement('textarea');
            textarea.value = payload;
            textarea.style.cssText = 'position:fixed;top:70px;right:20px;left:20px;' +
                'z-index:999999;height:120px;font-size:12px;padding:8px;';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, payload.length);

            btn.textContent = '📋 Selecionado — copie manualmente';
            alert(payload);
        });
        document.body.appendChild(btn);
    }

    // Botao sempre disponivel desde o inicio — captura manual apos abrir um
    // projeto no portfolio, sem necessidade de deteccao automatica.
    if (document.body) showCopyButton();
    else document.addEventListener('DOMContentLoaded', showCopyButton, { once: true });

    console.log('[DEBUG-LAYOUT] instrumentacao ativa. Abra um projeto no portfolio e toque no botao para copiar o snapshot de layout.');
})();

// === DESIGN TOKENS (referência para edição) ===
// Cores: --cor-preto-puro, --cor-branco-gelo, --cor-verde-floresta, --cor-verde-brilhante, --cor-verde-neon, --cor-bege-escuro, --cor-cinza-acastanhado, --cor-creme

// === HERO PARTICLES ===
function createParticles() {
    var __hookTestMarker789 = 1;
    const container = document.getElementById('heroParticles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (3 + Math.random() * 4) + 's';
        container.appendChild(particle);
    }

    // Pausa a animação CSS infinita quando o hero sai da viewport — sem isso
    // as 50 partículas continuam consumindo o main thread mesmo com o usuário
    // rolado até o fim da página.
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                container.classList.toggle('is-paused', !entry.isIntersecting);
            });
        }, { threshold: 0 });
        observer.observe(container);
    }
}

// === HERO VIDEO BACKGROUND (time-lapse forward/reverse loop) ===
// Mobile (<=768px, mesmo breakpoint usado no restante do CSS) nunca recebe o
// <video>: o poster estatico (ja definido como background-image em
// .hero-video-background) cobre o hero sozinho, evitando ~5,4MB de MP4 em
// conexoes moveis onde o ganho visual do time-lapse nao compensa o custo.
const HERO_VIDEO_MOBILE_QUERY = '(max-width: 768px)';

function initHeroVideoBackground() {
    const wrapper = document.getElementById('heroVideoBackground');
    const forward = document.getElementById('heroVideoForward');
    const reverse = document.getElementById('heroVideoReverse');
    if (!wrapper || !forward || !reverse) return;

    const isMobile = typeof window.matchMedia === 'function'
        && window.matchMedia(HERO_VIDEO_MOBILE_QUERY).matches;
    const prefersReducedMotion = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
    const isSlowConnection = connection && ['slow-2g', '2g'].includes(connection.effectiveType);

    if (isMobile || prefersReducedMotion || isSlowConnection) {
        // preload="none" nas duas tags garante que nenhum byte de video seja
        // baixado; removê-las do DOM evita qualquer chance de um browser
        // decidir buscar metadata por conta própria.
        forward.remove();
        reverse.remove();
        return;
    }

    // Em desktop, preload="none" no HTML não deve virar preload="auto" fixo
    // (isso reintroduziria o preload scanner buscando o vídeo em mobile antes
    // do JS decidir o breakpoint). Em vez disso, disparamos forward.load()
    // manualmente aqui, o mais cedo possível dentro do branch desktop, para
    // minimizar o atraso até canplaythrough em relação ao preload="auto" original.
    forward.load();

    const HELD_MOMENT_MS = 260;
    const FIRST_PLAY_OFFSET_S = 2;
    let currentClip = forward;
    let nextClip = reverse;
    let isFirstPlay = true;
    let reverseLoadRequested = false;
    let heroIsVisible = false;

    function requestReverseLoad() {
        if (reverseLoadRequested) return;
        reverseLoadRequested = true;
        reverse.load();
    }

    function handleEnded() {
        // Só busca/toca o próximo clipe se o hero ainda estiver na viewport
        // neste momento — evita baixar 2,7MB de reverse para quem já rolou
        // a página passado do hero antes do forward terminar.
        if (!heroIsVisible) return;
        requestReverseLoad();
        setTimeout(() => {
            nextClip.currentTime = 0;
            nextClip.play().catch(() => {});
            nextClip.classList.add('is-visible');
            currentClip.classList.remove('is-visible');
            const swap = currentClip;
            currentClip = nextClip;
            nextClip = swap;
        }, HELD_MOMENT_MS);
    }

    forward.addEventListener('ended', handleEnded);
    reverse.addEventListener('ended', handleEnded);

    function revealForward() {
        if (isFirstPlay && forward.duration > FIRST_PLAY_OFFSET_S * 2) {
            forward.currentTime = FIRST_PLAY_OFFSET_S;
        }
        isFirstPlay = false;
        forward.classList.add('is-visible');
        forward.play().catch(() => {});
    }

    if (forward.readyState >= 4) {
        revealForward();
    } else {
        forward.addEventListener('canplaythrough', revealForward, { once: true });
    }

    // Rastreia visibilidade do hero para handleEnded() decidir se vale a
    // pena buscar o reverse (2,7MB) — em vez de baixá-lo automaticamente
    // no instante em que o forward começa a tocar, como antes.
    const heroSection = document.querySelector('.hero-architectural-scene');
    if (typeof IntersectionObserver === 'function' && heroSection) {
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                heroIsVisible = entry.isIntersecting;
            });
        }, { threshold: 0.25 });
        visibilityObserver.observe(heroSection);
    } else {
        heroIsVisible = true;
    }
}

// === HERO MOUSE PARALLAX ===
function initHeroParallax() {
    const geometries = document.querySelector('.hero-geometries');
    const lighting = document.querySelector('.hero-lighting-layer');
    const grid = document.querySelector('.hero-grid-layer');

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        geometries.style.transform = `translate(${x * 20}px, ${y * 15}px)`;
        grid.style.transform = `translate(${x * 10}px, ${y * 8}px)`;

        const spots = lighting.querySelectorAll('.light-spot');
        spots.forEach((spot, index) => {
            const factor = (index + 1) * 5;
            spot.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
    });
}

// === HERO CONTACT CARD — PARALLAX NO SCROLL ===
// Pedido explicito: GSAP ScrollTrigger com scrub:true (diferente do padrao
// "sem ScrollTrigger scrub" usado em initHeroAnimations logo abaixo) — o
// card sobe ~70% da propria altura enquanto o hero percorre 100% da
// viewport, espelhando o valor medido na referencia Burkhard Projekte
// (translate3d(0, -69.9874%, 0) em scroll intermediario). yPercent (em vez
// de px) reproduz exatamente esse "% da propria altura", incluindo se o
// conteudo do card mudar de tamanho depois. scrub:true liga o progresso
// diretamente ao scroll — a sincronizacao Lenis -> ScrollTrigger.update ja
// existe em initSmoothScroll(), entao o scrub acompanha o scroll suavizado
// sem inercia propria adicional.
//
// Anima .hero-contact-card-parallax (wrapper), NAO o <a class="hero-contact-
// card"> — ver comentario no CSS: o transform inline que o GSAP escreve
// venceria o transform: translateY(-2px) do :hover se fosse o mesmo
// elemento. O wrapper so tem position/z-index/margin (layout), o <a> tem o
// hover — transform (compositor) e margin (layout) nao conflitam entre si.
function initHeroContactCardParallax() {
    const wrapper = document.querySelector('.hero-contact-card-parallax');
    const hero = document.querySelector('.hero-architectural-scene');
    if (!wrapper || !hero) return;

    const prefersReducedMotion = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Mobile: espaco vertical mais escasso e o card ja tem sobreposicao
    // menor (ver CSS) — amplitude reduzida em vez de desativada, senao o
    // efeito some por completo em tablet/mobile. Calculada uma vez no
    // carregamento; nao reavaliada em resize (mesma limitacao que outros
    // valores dependentes de innerWidth no projeto — cruzar o breakpoint
    // redimensionando a janela ao vivo nao reajusta a amplitude).
    const amplitude = window.innerWidth < 768 ? -30 : -70;

    gsap.to(wrapper, {
        yPercent: amplitude,
        ease: 'none',
        scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
    });
}

// === HERO SCROLL EFFECTS — determinístico, derivado de heroProgress ===
// SEM ScrollTrigger scrub, SEM estados acumulados
// Cada frame calcula do zero: heroProgress → estilos visuais
function initHeroAnimations() {
    const hero = document.querySelector('.hero-architectural-scene');
    const canvas = document.querySelector('.hero-canvas');
    const overlay = document.querySelector('.hero-overlay-gradient');
    if (!hero || !canvas || !overlay) return;

    // Remove qualquer resíduo de estilos inline anteriores
    canvas.style.transform = '';
    canvas.style.opacity = '';
    overlay.style.height = '';

    // Calcula progresso (0 a 1) exclusivamente da posição atual do scroll
    function getHeroProgress() {
        const rect = hero.getBoundingClientRect();
        const heroH = hero.offsetHeight;
        // rect.top = 0 → progress 0 (topo)
        // rect.top = -heroH → progress 1 (totalmente passado)
        return Math.max(0, Math.min(1, -rect.top / heroH));
    }

    // Aplica estilos derivados exclusivamente do progresso — idempotente
    function applyHeroState(progress) {
        // Canvas: scale 1→0.95, opacity 1→0.5
        const scale = 1 - progress * 0.05;
        const opacity = 1 - progress * 0.5;
        canvas.style.transform = `scale(${scale})`;
        canvas.style.opacity = String(opacity);

        // Overlay: começa em 150px (altura base do CSS, .hero-overlay-gradient),
        // cresce até no máximo ~0.5x a altura da hero (max 300px, mesma
        // proporção 2x de antes, escalada para a nova base menor)
        const maxOverlay = Math.min(hero.offsetHeight * 0.5, 300);
        const overlayH = 150 + (maxOverlay - 150) * progress;
        overlay.style.height = `${overlayH}px`;
    }

    // Apply imediatamente com o progresso atual
    applyHeroState(getHeroProgress());

    // Atualiza no scroll — throttle via rAF: agrupa múltiplos eventos de
    // scroll do mesmo frame em uma única leitura+escrita de layout, evitando
    // layout thrashing durante momentum scrolling em mobile.
    let heroScrollTicking = false;
    window.addEventListener('scroll', () => {
        if (heroScrollTicking) return;
        heroScrollTicking = true;
        requestAnimationFrame(() => {
            applyHeroState(getHeroProgress());
            heroScrollTicking = false;
        });
    }, { passive: true });

    // Recalcula no resize (hero height muda)
    window.addEventListener('resize', () => {
        applyHeroState(getHeroProgress());
    });
}

// === HERO ENTRANCE — safe for any scroll position ===
function initHeroEntrance(onDone) {
    const hero = document.querySelector('.hero-architectural-scene');
    if (!hero) { if (onDone) onDone(); return; }

    // Force final state on all entrance elements FIRST (before any ScrollTrigger)
    // This prevents elements from remaining at opacity:0 if entrance never fires
    gsap.set('.hero-title-line, .hero-subtitle, .hero-actions', {
        opacity: 1,
        y: 0,
        rotateX: 0,
    });

    // Then set initial animation state on elements that should animate
    // But only if hero is visible in viewport
    const isHeroVisible = hero.getBoundingClientRect().top < window.innerHeight;

    if (isHeroVisible) {
        // Reset to initial state for a fresh animation
        gsap.set('.hero-title-line-1', { opacity: 0, y: 60, rotateX: 10 });
        gsap.set('.hero-title-line-2', { opacity: 0, y: 60, rotateX: 10 });
        gsap.set('.hero-title-line-3', { opacity: 0, y: 60, rotateX: 10 });
        gsap.set('.hero-subtitle', { opacity: 0, y: 30 });
        gsap.set('.hero-actions', { opacity: 0, y: 30 });

        // Delay reduzido de 0.4 para 0.15: nao sincronizava com nenhum recurso
        // real (poster/fonte chegam antes em rede rapida, chegam muito depois
        // em rede lenta de qualquer forma) — era puro ritmo estetico. 0.15
        // mantem uma pequena pausa antes do badge sem o atraso de quase meio
        // segundo que se somava a percepcao de lentidao em rede rapida.
        const tl = gsap.timeline({
            delay: 0.15,
            defaults: { ease: 'power3.out' },
            onComplete: onDone,
        });

        // Durations/overlaps reduzidos pela metade (~2.85s -> ~1.5s de ponta a
        // ponta) — cascata continua perceptivel, so mais rapida. Ver RELATORIO-
        // PERFORMANCE.md, secao "Carregamento inicial", Passo 1.
        // .hero-badge removido do hero — passo do badge tirado da timeline,
        // hero-title-line-1 agora abre a cascata (mesmas duration/ease dos
        // demais passos, sem alterar a logica).
        tl.to('.hero-title-line-1', { opacity: 1, y: 0, rotateX: 0, duration: 0.45 })
            .to('.hero-title-line-2', { opacity: 1, y: 0, rotateX: 0, duration: 0.45 }, '-=0.25')
            .to('.hero-title-line-3', { opacity: 1, y: 0, rotateX: 0, duration: 0.45 }, '-=0.25')
            .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.35 }, '-=0.25')
            .to('.hero-actions', { opacity: 1, y: 0, duration: 0.35 }, '-=0.15');
    } else {
        // If not visible, elements already have final state (opacity:1) — nada a esperar.
        if (onDone) onDone();
    }
}

// === NAVIGATION ===
function initNavigation() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    function updateNav() {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
    document.addEventListener('scroll', updateNav, { passive: true });

    toggle.addEventListener('click', () => {
        const isActive = mobileMenu.classList.contains('active');
        toggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        toggle.setAttribute('aria-expanded', !isActive);
        document.body.style.overflow = isActive ? '' : 'hidden';
        // lenis.stop()/start() trava o scroll suavizado em si — o overflow:hidden
        // do body sozinho nao impede o Lenis de continuar animando por baixo do menu.
        if (isActive) lenisInstance?.start(); else lenisInstance?.stop();
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            lenisInstance?.start();
        });
    });
}

// === SCROLL REVEAL ANIMATIONS ===
function initScrollReveals() {
    gsap.utils.toArray('.section-title-reveal').forEach(title => {
        gsap.to(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
            },
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
        });
    });

    gsap.utils.toArray('.text-reveal').forEach(text => {
        gsap.to(text, {
            scrollTrigger: {
                trigger: text,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
        });
    });

    // Antes: 1 ScrollTrigger.create() por .process-step (uma instancia cada).
    // Agora: 1 unica instancia via ScrollTrigger.batch() para toda a secao —
    // mesmo start/once/stagger visual (200ms por item), so o mecanismo interno mudou.
    ScrollTrigger.batch('.process-step', {
        start: 'top 80%',
        once: true,
        onEnter: (batch) => {
            batch.forEach((step, i) => {
                setTimeout(() => {
                    step.classList.add('revealed');
                }, i * 200);
            });
        },
    });
}

// === COUNTER ANIMATIONS ===
function initCounters() {
    gsap.utils.toArray('.counter-target').forEach(counter => {
        const target = counter.getAttribute('data-target');
        const numTarget = parseFloat(target);

        if (isNaN(numTarget)) return;

        gsap.to(counter, {
            scrollTrigger: {
                trigger: counter,
                start: 'top 85%',
                once: true,
            },
            innerHTML: numTarget,
            duration: 2,
            ease: 'power2.out',
            snap: { innerHTML: 1 },
            onUpdate: function () {
                const val = Math.round(this.progress() * numTarget);
                counter.innerHTML = val;
                if (val >= numTarget) {
                    counter.innerHTML = target === '[anos]' ? '15+' : target === '[indice]' ? '98%' : '200+';
                }
            },
        });
    });
}

// As variantes -mobile/-desktop dos placeholders (ver RELATORIO-PERFORMANCE.md)
// foram removidas do repositorio numa limpeza de assets; so a versao base
// .webp existe hoje, entao o srcset foi removido e cada imagem usa apenas src.
// Todas as fotos de portfólio (placeholders + assets/images/portfolio/) sao 1280x960.
function buildResponsiveImgAttrs(src) {
    return 'src="' + src + '" width="1280" height="960"';
}

// === PORTFOLIO PROJECTS DATA ===
// Uma foto por projeto (a de conclusao) — sem galeria de multiplas fotos por
// projeto, sem viewer de segunda tela. O cascading slider abaixo e a propria
// galeria do portfolio: cada slide e um projeto.
const portfolioProjects = [
    {
        id: 'elektro',
        name: 'Elektro Redes',
        subtitle: 'Infraestrutura Elétrica • 2023',
        cover: 'assets/images/placeholders/placeholder-obra-03.webp',
    },
    {
        id: 'elektro-02',
        name: 'Elektro Redes',
        subtitle: 'Infraestrutura Elétrica • 2023',
        cover: 'assets/images/portfolio/elektro-02.webp',
    },
    {
        id: 'elektro-03',
        name: 'Elektro Redes',
        subtitle: 'Infraestrutura Elétrica • 2023',
        cover: 'assets/images/portfolio/elektro-03.webp',
    },
    {
        id: 'elektro-04',
        name: 'Elektro Redes',
        subtitle: 'Infraestrutura Elétrica • 2023',
        cover: 'assets/images/portfolio/elektro-04.webp',
    },
    {
        id: 'elektro-05',
        name: 'Elektro Redes',
        subtitle: 'Infraestrutura Elétrica • 2023',
        cover: 'assets/images/portfolio/elektro-05.webp',
    },
    {
        id: 'elektro-06',
        name: 'Elektro Redes',
        subtitle: 'Infraestrutura Elétrica • 2023',
        cover: 'assets/images/portfolio/elektro-06.webp',
    },
];

// === CASCADING SLIDER (Modus) — galeria do portfolio ===
// Extraido de cascading-slider/js/cascading-slider.js. Ate a v4 este engine
// so era usado para as fotos de um projeto aberto no viewer (openProject/
// closeProject); o viewer de segunda tela foi removido e o slider passou a
// SER a propria galeria do portfolio — cada slide e um projeto (uma foto +
// nome + tipo/ano), nao mais fotos de um unico projeto. Clicar num card
// lateral chama goTo() (ja existia no engine original) e so navega aquele
// projeto ao centro — nunca abre nada. Logica de measure/layout/goTo mantida
// sem alteracoes.
function initCascadingSlider(viewport, projects) {
    if (!viewport || !projects || projects.length === 0) {
        return { destroy: function () { } };
    }

    var duration = 0.65;
    var ease = 'power3.inOut';
    var breakpoints = [
        { maxWidth: 479, activeWidth: 0.78, siblingWidth: 0.08 },
        { maxWidth: 767, activeWidth: 0.70, siblingWidth: 0.10 },
        { maxWidth: 991, activeWidth: 0.60, siblingWidth: 0.10 },
        { maxWidth: Infinity, activeWidth: 0.60, siblingWidth: 0.13 },
    ];

    viewport.innerHTML = projects.map(function (project, i) {
        return '<div class="cascading-slider__item" data-cascading-slide="" data-status="inactive" role="listitem" aria-roledescription="slide">' +
            '<div class="cascading-slider__item-inner">' +
            '<div class="cascading-slider__item-bg">' +
            '<img ' + buildResponsiveImgAttrs(project.cover) + ' alt="Obra concluída para ' + project.name + '" class="cascading-slider__img" draggable="false"' + (i === 0 ? ' loading="eager"' : ' loading="lazy"') + '>' +
            '</div>' +
            '<div class="cascading-slider__item-overlay">' +
            '<span class="cascading-slider__item-nome">' + project.name + '</span>' +
            '<span class="cascading-slider__item-tipo">' + project.subtitle + '</span>' +
            '</div>' +
            '</div></div>';
    }).join('');

    var prevButton = document.querySelector('[data-cascading-slider-prev]');
    var nextButton = document.querySelector('[data-cascading-slider-next]');
    var slides = Array.from(viewport.querySelectorAll('[data-cascading-slide]'));
    var totalSlides = slides.length;

    if (totalSlides < 9) {
        var originalSlides = slides.slice();
        while (slides.length < 9) {
            originalSlides.forEach(function (original) {
                var clone = original.cloneNode(true);
                clone.setAttribute('data-clone', '');
                viewport.appendChild(clone);
                slides.push(clone);
            });
        }
        totalSlides = slides.length;
    }

    var activeIndex = 0;
    var isAnimating = false;
    var slideWidth = 0;
    var slotCenters = {};
    var slotWidths = {};

    function readGap() {
        var raw = getComputedStyle(viewport).getPropertyValue('--gap').trim();
        if (!raw) return 0;
        var temp = document.createElement('div');
        temp.style.width = raw;
        temp.style.position = 'absolute';
        temp.style.visibility = 'hidden';
        viewport.appendChild(temp);
        var px = temp.offsetWidth;
        viewport.removeChild(temp);
        return px;
    }

    function getSettings() {
        var windowWidth = window.innerWidth;
        for (var i = 0; i < breakpoints.length; i++) {
            if (windowWidth <= breakpoints[i].maxWidth) return breakpoints[i];
        }
        return breakpoints[breakpoints.length - 1];
    }

    function getOffset(slideIndex, fromIndex) {
        if (fromIndex === undefined) fromIndex = activeIndex;
        var distance = slideIndex - fromIndex;
        var half = totalSlides / 2;
        if (distance > half) distance -= totalSlides;
        if (distance < -half) distance += totalSlides;
        return distance;
    }

    function measure() {
        var settings = getSettings();
        var viewportWidth = viewport.offsetWidth;
        var gap = readGap();

        var activeSlideWidth = viewportWidth * settings.activeWidth;
        var siblingSlideWidth = viewportWidth * settings.siblingWidth;
        var farSlideWidth = Math.max(0, (viewportWidth - activeSlideWidth - 2 * siblingSlideWidth - 4 * gap) / 2);

        slideWidth = activeSlideWidth;

        var visibleSlots = [
            { slot: -2, width: farSlideWidth },
            { slot: -1, width: siblingSlideWidth },
            { slot: 0, width: activeSlideWidth },
            { slot: 1, width: siblingSlideWidth },
            { slot: 2, width: farSlideWidth },
        ];

        var x = 0;
        visibleSlots.forEach(function (def, i) {
            slotCenters[String(def.slot)] = x + def.width / 2;
            slotWidths[String(def.slot)] = def.width;
            if (i < visibleSlots.length - 1) x += def.width + gap;
        });

        slotCenters['-3'] = slotCenters['-2'] - farSlideWidth / 2 - gap - farSlideWidth / 2;
        slotWidths['-3'] = farSlideWidth;
        slotCenters['3'] = slotCenters['2'] + farSlideWidth / 2 + gap + farSlideWidth / 2;
        slotWidths['3'] = farSlideWidth;

        slides.forEach(function (slide) {
            slide.style.width = slideWidth + 'px';
        });
    }

    function getSlideProps(offset) {
        var clamped = Math.max(-3, Math.min(3, offset));
        var slotWidth = slotWidths[String(clamped)];
        var clipAmount = Math.max(0, (slideWidth - slotWidth) / 2);
        var translateX = slotCenters[String(clamped)] - slideWidth / 2;

        return {
            x: translateX,
            '--clip': clipAmount,
            zIndex: 10 - Math.abs(clamped),
        };
    }

    function layout(animate, previousIndex) {
        slides.forEach(function (slide, index) {
            var offset = getOffset(index);

            if (offset < -3 || offset > 3) {
                if (animate && previousIndex !== undefined) {
                    var previousOffset = getOffset(index, previousIndex);
                    if (previousOffset >= -2 && previousOffset <= 2) {
                        var exitSlot = previousOffset < 0 ? -3 : 3;
                        gsap.to(slide, Object.assign({}, getSlideProps(exitSlot), {
                            duration: duration,
                            ease: ease,
                            overwrite: true,
                        }));
                        return;
                    }
                }

                var parkSlot = offset < 0 ? -3 : 3;
                gsap.set(slide, getSlideProps(parkSlot));
                return;
            }

            var props = getSlideProps(offset);
            slide.setAttribute('data-status', offset === 0 ? 'active' : 'inactive');

            if (animate) {
                gsap.to(slide, Object.assign({}, props, {
                    duration: duration,
                    ease: ease,
                    overwrite: true,
                }));
            } else {
                gsap.set(slide, props);
            }
        });
    }

    function goTo(targetIndex) {
        var normalizedTarget = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
        if (isAnimating || normalizedTarget === activeIndex) return;
        isAnimating = true;

        var previousIndex = activeIndex;
        var travelDirection = getOffset(normalizedTarget, previousIndex) > 0 ? 1 : -1;

        slides.forEach(function (slide, index) {
            var currentOffset = getOffset(index, previousIndex);
            var nextOffset = getOffset(index, normalizedTarget);
            var wasInRange = currentOffset >= -3 && currentOffset <= 3;
            var willBeVisible = nextOffset >= -2 && nextOffset <= 2;

            if (!wasInRange && willBeVisible) {
                var entrySlot = travelDirection > 0 ? 3 : -3;
                gsap.set(slide, getSlideProps(entrySlot));
            }

            var wasInvisible = Math.abs(currentOffset) >= 3;
            var willBeStaging = Math.abs(nextOffset) === 3;
            var crossesSides = currentOffset * nextOffset < 0;
            if (wasInvisible && willBeStaging && crossesSides) {
                gsap.set(slide, getSlideProps(nextOffset > 0 ? 3 : -3));
            }
        });

        activeIndex = normalizedTarget;
        layout(true, previousIndex);
        gsap.delayedCall(duration + 0.05, function () { isAnimating = false; });
    }

    function onPrevClick() {
        goTo(activeIndex - 1);
        if (prevButton) {
            prevButton.classList.add('hover-active');
            setTimeout(function () { prevButton.classList.remove('hover-active'); }, 200);
        }
    }
    function onNextClick() {
        goTo(activeIndex + 1);
        if (nextButton) {
            nextButton.classList.add('hover-active');
            setTimeout(function () { nextButton.classList.remove('hover-active'); }, 200);
        }
    }
    // .hover-active substitui :hover no CSS (evita sticky hover em touch,
    // onde nao existe mouseleave apos o tap). mouseenter/mouseleave cobrem o
    // feedback de mouse parado sobre o botao no desktop.
    var onPrevMouseEnter = function () { prevButton.classList.add('hover-active'); };
    var onPrevMouseLeave = function () { prevButton.classList.remove('hover-active'); };
    var onNextMouseEnter = function () { nextButton.classList.add('hover-active'); };
    var onNextMouseLeave = function () { nextButton.classList.remove('hover-active'); };
    // Ignora a navegacao quando o foco esta em um campo editavel (ex.: textarea
    // do formulario de contato), onde ArrowLeft/ArrowRight devem mover o cursor
    // de texto, nao o slider escondido em outra secao da pagina.
    var isEditableFocus = function () {
        var el = document.activeElement;
        if (!el) return false;
        var tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    var keyHandler = function (event) {
        if (isEditableFocus()) return;
        if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
        if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    };
    var slideClickHandlers = slides.map(function (slide, index) {
        var handler = function () { if (index !== activeIndex) goTo(index); };
        slide.addEventListener('click', handler);
        return handler;
    });
    // Protecao contra resize disparado so por mudanca de ALTURA (barra de
    // endereco mobile) — mesmo padrao do listener global de ScrollTrigger.
    var lastWidth = window.innerWidth;
    var resizeTimer;
    var resizeHandler = function () {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            measure();
            layout(false);
        }, 100);
    };

    if (prevButton) {
        prevButton.addEventListener('click', onPrevClick);
        prevButton.addEventListener('mouseenter', onPrevMouseEnter);
        prevButton.addEventListener('mouseleave', onPrevMouseLeave);
    }
    if (nextButton) {
        nextButton.addEventListener('click', onNextClick);
        nextButton.addEventListener('mouseenter', onNextMouseEnter);
        nextButton.addEventListener('mouseleave', onNextMouseLeave);
    }
    document.addEventListener('keydown', keyHandler);
    window.addEventListener('resize', resizeHandler);

    measure();
    layout(false);

    return {
        destroy: function () {
            if (prevButton) {
                prevButton.removeEventListener('click', onPrevClick);
                prevButton.removeEventListener('mouseenter', onPrevMouseEnter);
                prevButton.removeEventListener('mouseleave', onPrevMouseLeave);
            }
            if (nextButton) {
                nextButton.removeEventListener('click', onNextClick);
                nextButton.removeEventListener('mouseenter', onNextMouseEnter);
                nextButton.removeEventListener('mouseleave', onNextMouseLeave);
            }
            document.removeEventListener('keydown', keyHandler);
            window.removeEventListener('resize', resizeHandler);
            slides.forEach(function (slide, index) {
                slide.removeEventListener('click', slideClickHandlers[index]);
            });
            viewport.innerHTML = '';
        }
    };
}

// === PORTFOLIO — monta a galeria (cascading slider) no load da pagina ===
function initPortfolioSlider() {
    var viewport = document.getElementById('portfolioSliderTrilha');
    if (!viewport) return;
    initCascadingSlider(viewport, portfolioProjects);
}
// === SERVICE MOSAIC INTERACTIONS ===
function initServicesInteraction() {
    document.querySelectorAll('.service-mosaic-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            gsap.to(item.querySelector('.service-mosaic-visual svg'), {
                scale: 1.1, rotate: 5, duration: 0.4, ease: 'power2.out',
            });
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(item.querySelector('.service-mosaic-visual svg'), {
                scale: 1, rotate: 0, duration: 0.4, ease: 'power2.out',
            });
        });
    });
}

// === FORM VALIDATION HELPERS ===
function setFieldError(groupId, message) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('form-group-valid');
    group.classList.add('form-group-error');
    const msgEl = group.querySelector('.form-error-message');
    if (msgEl && message) {
        msgEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="7" fill="#D32F2F" opacity="0.15"/>
            <path d="M7 4V8M7 10V10.01" stroke="#D32F2F" stroke-width="1.5" stroke-linecap="round"/>
        </svg> ${message}`;
    }
}

function setFieldValid(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('form-group-error');
    group.classList.add('form-group-valid');
}

function clearFieldValidation(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('form-group-error', 'form-group-valid');
}

function clearAllValidations() {
    ['formGroupName', 'formGroupPhone', 'formGroupEmail', 'formGroupService'].forEach(clearFieldValidation);
}

// === PHONE MASK ===
function applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = '';
    if (value.length > 0) {
        formatted = '(' + value.slice(0, 2);
    }
    if (value.length > 2) {
        formatted += ') ' + value.slice(2, 7);
    }
    if (value.length > 7) {
        formatted += '-' + value.slice(7, 11);
    }
    input.value = formatted;
    return value; // returns raw digits
}

// === NAME VALIDATION ===
function validateName(name) {
    // Only letters, spaces, accents
    const cleaned = name.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    return {
        valid: cleaned.length >= 2 && cleaned.trim().length >= 2,
        cleaned: cleaned
    };
}

function capitalizeName(name) {
    return name
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
}

// === EMAIL VALIDATION ===
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// === CHECK NAME FIELD ===
function checkName() {
    const input = document.getElementById('formName');
    const raw = input.value;
    const { valid, cleaned } = validateName(raw);

    // Auto-remove invalid chars, preserve spaces
    if (raw !== cleaned) {
        input.value = cleaned;
    }

    if (!cleaned || cleaned.trim().length === 0) {
        clearFieldValidation('formGroupName');
        return false;
    }
    if (!valid) {
        setFieldError('formGroupName', 'Digite um nome válido (apenas letras e espaços).');
        return false;
    }
    setFieldValid('formGroupName');
    return true;
}

function checkNameOnBlur() {
    const input = document.getElementById('formName');
    const raw = input.value;
    const { cleaned } = validateName(raw);
    if (cleaned.trim().length > 0) {
        input.value = capitalizeName(cleaned);
    }
    // Re-validate after capitalization
    checkName();
}

// === CHECK PHONE FIELD ===
function checkPhone() {
    const input = document.getElementById('formPhone');
    const digits = input.value.replace(/\D/g, '');

    if (digits.length === 0) {
        clearFieldValidation('formGroupPhone');
        return false;
    }
    if (digits.length < 10 || digits.length > 11) {
        setFieldError('formGroupPhone', 'Digite um telefone válido com DDD.');
        return false;
    }
    setFieldValid('formGroupPhone');
    return true;
}

// === CHECK EMAIL FIELD ===
function checkEmail() {
    const input = document.getElementById('formEmail');
    const email = input.value.trim();

    if (email.length === 0) {
        clearFieldValidation('formGroupEmail');
        return false;
    }
    if (!validateEmail(email)) {
        setFieldError('formGroupEmail', 'Digite um email válido.');
        return false;
    }
    setFieldValid('formGroupEmail');
    return true;
}

// === CHECK SERVICE FIELD ===
function checkService() {
    const wrapper = document.getElementById('customServiceWrapper');
    const selectedText = document.getElementById('customServiceText');
    const hasValue = selectedText.classList.contains('selected');

    if (!hasValue) {
        setFieldError('formGroupService', 'Selecione um tipo de serviço.');
        return false;
    }
    setFieldValid('formGroupService');
    return true;
}

// === CONTACT FORM ===
function initContactForm() {
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('formName');
    const phoneInput = document.getElementById('formPhone');
    const emailInput = document.getElementById('formEmail');
    const msgInput = document.getElementById('formMessage');

    // --- Phone mask ---
    phoneInput.addEventListener('input', function () {
        applyPhoneMask(this);
        // Validate after mask update
        const digits = this.value.replace(/\D/g, '');
        if (digits.length > 0) checkPhone();
        else clearFieldValidation('formGroupPhone');
    });
    phoneInput.addEventListener('blur', checkPhone);

    // --- Name validations ---
    nameInput.addEventListener('input', function () {
        const { cleaned } = validateName(this.value);
        if (this.value !== cleaned) this.value = cleaned;
        if (cleaned.trim().length > 0) checkName();
        else clearFieldValidation('formGroupName');
    });
    nameInput.addEventListener('blur', checkNameOnBlur);

    // --- Email validations ---
    emailInput.addEventListener('input', function () {
        if (this.value.trim().length > 0) checkEmail();
        else clearFieldValidation('formGroupEmail');
    });
    emailInput.addEventListener('blur', checkEmail);

    // --- Service validation ---
    // Clear error when user selects a service
    document.getElementById('customServiceTrigger').addEventListener('click', function () {
        // Will be validated on submit, just clear error if reopening
        const selectedText = document.getElementById('customServiceText');
        if (selectedText && selectedText.classList.contains('selected')) {
            setFieldValid('formGroupService');
        } else {
            clearFieldValidation('formGroupService');
        }
    });

    // --- Prepare data for API submission ---
    function sanitizeString(str) {
        // Trim, strip HTML tags, limit length
        return String(str)
            .trim()
            .replace(/<[^>]*>/g, '')
            .slice(0, 1000);
    }

    function buildPayload() {
        // Read raw values, strip masks, sanitize
        const name = sanitizeString(document.getElementById('formName').value);
        const phoneRaw = document.getElementById('formPhone').value.replace(/\D/g, '');
        const email = sanitizeString(document.getElementById('formEmail').value);
        const service = document.getElementById('customServiceText').classList.contains('selected')
            ? (window.getSelectedService ? window.getSelectedService() : '')
            : '';
        const message = sanitizeString(document.getElementById('formMessage').value);
        const website = sanitizeString(document.getElementById('formWebsite').value);

        return {
            name,
            phone: phoneRaw,
            email,
            service,
            message,
            website,
            // Metadata for server-side validation & rate limiting
            _timestamp: Date.now(),
            _source: 'perin_contact_form_v1',
        };
    }

    function submitToAPI(payload) {
        const submitBtn = document.getElementById('formSubmit');
        const originalText = submitBtn.querySelector('.form-submit-text');

        // Build x-www-form-urlencoded body for Netlify Forms
        const params = new URLSearchParams();
        params.append('form-name', 'contato');
        Object.keys(payload).forEach(key => {
            params.append(key, payload[key]);
        });

        // Disable button during submission
        submitBtn.disabled = true;
        originalText.textContent = 'Enviando...';

        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Erro no servidor. Tente novamente.');
            // Success feedback
            originalText.textContent = 'Mensagem Enviada!';
            gsap.to(submitBtn, {
                background: '#3FCC5B', duration: 0.3, ease: 'power2.out',
            });

            setTimeout(() => {
                originalText.textContent = 'Enviar Mensagem';
                gsap.to(submitBtn, {
                    background: '#2A873E', duration: 0.3, ease: 'power2.out',
                });
                form.reset();
                clearAllValidations();
                submitBtn.disabled = false;
            }, 3000);
        })
        .catch(function (err) {
            console.error('[Perin Form] Submission error:', err);
            originalText.textContent = 'Erro ao enviar';
            gsap.to(submitBtn, {
                background: '#D32F2F', duration: 0.3, ease: 'power2.out',
            });

            setTimeout(() => {
                originalText.textContent = 'Enviar Mensagem';
                gsap.to(submitBtn, {
                    background: '#2A873E', duration: 0.3, ease: 'power2.out',
                });
                submitBtn.disabled = false;
            }, 3000);
        });
    }

    // --- Form submit ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Honeypot check — bots fill hidden fields
        const websiteField = document.getElementById('formWebsite');
        if (websiteField && websiteField.value.trim() !== '') {
            // Silently reject — don't let the bot know it was detected
            console.warn('[Perin Form] Honeypot triggered — bot detected, submission rejected.');
            // Show success to deceive bot, but don't send data
            const submitBtn = document.getElementById('formSubmit');
            const originalText = submitBtn.querySelector('.form-submit-text');
            originalText.textContent = 'Mensagem Enviada!';
            gsap.to(submitBtn, { background: '#3FCC5B', duration: 0.3, ease: 'power2.out' });
            setTimeout(() => {
                originalText.textContent = 'Enviar Mensagem';
                gsap.to(submitBtn, { background: '#2A873E', duration: 0.3, ease: 'power2.out' });
                form.reset();
                clearAllValidations();
            }, 3000);
            return;
        }

        // 2. Update hidden service input with selected value
        const serviceInput = document.getElementById('formService');
        if (serviceInput && window.getSelectedService) {
            serviceInput.value = window.getSelectedService() || '';
        }

        // 3. Run client-side validations (UX only — server re-validates)
        const nameOk = checkName();
        const phoneOk = checkPhone();
        const emailOk = checkEmail();
        const msgOk = msgInput.value.trim().length > 0;
        const serviceOk = checkService();

        if (!nameOk || !phoneOk || !emailOk || !msgOk || !serviceOk) {
            // Scroll to first error
            const firstError = document.querySelector('.form-group-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = firstError.querySelector('input, textarea, button');
                if (input) input.focus();
            }
            return;
        }

        // 4. Build sanitized payload and submit
        const payload = buildPayload();
        submitToAPI(payload);
    });

    // Floating labels: add/remove 'filled' class on input/change
    document.querySelectorAll('.form-floating-input').forEach(input => {
        function updateFilled() {
            if (input.value.trim() !== '') {
                input.classList.add('filled');
            } else {
                input.classList.remove('filled');
            }
        }
        input.addEventListener('input', updateFilled);
        input.addEventListener('change', updateFilled);
        updateFilled();
    });
}

// === CUSTOM SELECT (Tipo de Serviço) ===
function initCustomSelect() {
    const wrapper = document.getElementById('customServiceWrapper');
    const trigger = document.getElementById('customServiceTrigger');
    const optionsList = document.getElementById('customServiceOptions');
    const triggerText = document.getElementById('customServiceText');
    const options = optionsList.querySelectorAll('li[role="option"]');
    let isOpen = false;
    let selectedValue = '';
    let selectedIndex = -1;

    function toggleOpen() {
        isOpen = !isOpen;
        trigger.classList.toggle('open', isOpen);
        optionsList.classList.toggle('open', isOpen);
        trigger.setAttribute('aria-expanded', isOpen);
        wrapper.classList.toggle('has-value', selectedValue !== '');
    }

    function close() {
        isOpen = false;
        trigger.classList.remove('open');
        optionsList.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    }

    function selectOption(option) {
        const value = option.getAttribute('data-value');
        const text = option.querySelector('span').textContent;

        // Update trigger display
        triggerText.textContent = text;
        triggerText.classList.add('selected');
        selectedValue = value;
        wrapper.classList.add('has-value');

        // Update aria-selected on all options
        options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
        option.setAttribute('aria-selected', 'true');

        // Store selected index
        options.forEach((opt, i) => {
            if (opt === option) selectedIndex = i;
        });

        close();
    }

    // Trigger click
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOpen();
    });

    // Option click
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectOption(option);
        });

        // Keyboard support
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(option);
            }
        });
    });

    // Keyboard navigation on trigger
    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) toggleOpen();
            if (e.key === 'ArrowDown' && isOpen) {
                const nextIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0;
                options[nextIndex].focus();
            }
        }
        if (e.key === 'Escape' && isOpen) {
            close();
            trigger.focus();
        }
    });

    // Keyboard navigation inside options list
    optionsList.addEventListener('keydown', (e) => {
        const currentIndex = Array.from(options).indexOf(document.activeElement);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
            options[nextIndex].focus();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
            options[prevIndex].focus();
        }
        if (e.key === 'Escape') {
            close();
            trigger.focus();
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectOption(options[currentIndex]);
            trigger.focus();
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target) && isOpen) {
            close();
        }
    });

    // Expose selected value for form submission
    window.getSelectedService = function () {
        return selectedValue;
    };
}

// === BUTTON RIPPLE EFFECT ===
function initButtonRipple() {
    document.querySelectorAll('.form-submit-button').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = this.querySelector('.form-submit-ripple') || this;
            gsap.fromTo(ripple,
                { scale: 0, opacity: 0.5 },
                {
                    scale: 3, opacity: 0, duration: 0.6,
                    ease: 'power2.out',
                    transformOrigin: `${e.offsetX}px ${e.offsetY}px`,
                }
            );
        });
    });
}

// === SCROLL REVEAL HELPERS ===
// Antes: cada secao criava 1 ScrollTrigger por item (gsap.from + toggleActions
// 'play none none reverse' — anima ao entrar, reverte ao rolar de volta pra
// cima). Agora: 1 unica instancia via ScrollTrigger.batch() por secao. Para
// preservar o "reverse" do toggleActions original (que nao existe nativamente
// em batch), a mesma transicao e replicada manualmente em onEnter/onLeaveBack.
// O delay em cascata (delay: i*X) vira stagger (mesmo efeito visual, mesmo
// valor), aplicado dentro de cada grupo que entra junto na viewport.
//
// IMPORTANTE — leaveStagger:0 por padrao. Medido com Puppeteer (screenshots
// em 25/50/75% da transicao) que o toggleActions original, ao reverter, NAO
// produzia stagger visivel: o "delay" de um gsap.from() fica na CAUDA do
// tween, entao ao reverter a partir do estado 100% completo o delay vira
// tempo morto DEPOIS da animacao visual, nao antes — todos os itens saiam
// sincronizados. Usar o mesmo `stagger` do onEnter tambem no onLeaveBack
// introduzia uma cascata nova e perceptivel que nao existia antes (~150-300ms
// de defasagem entre itens grandes, acima do limiar de percepcao de
// assincronia). leaveStagger:0 restaura o comportamento sincronizado original.
function batchReveal(selector, { y = 40, duration = 0.6, stagger = 0.1, leaveStagger = 0, ease = 'power2.out', start = 'top 85%' } = {}) {
    gsap.set(selector, { opacity: 0, y });
    ScrollTrigger.batch(selector, {
        start,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration, stagger, ease, overwrite: true }),
        onLeaveBack: (batch) => gsap.to(batch, { opacity: 0, y, duration, stagger: leaveStagger, ease, overwrite: true }),
    });
}

// === PROCESS DIAGRAM — cluster de circulos + accordion sincronizados ===
// Ativacao por clique em qualquer largura de tela (circulo ou head do
// accordion), sem distincao de breakpoint/hover.
function initProcessDiagram() {
    const grid = document.getElementById('processDiagramGrid');
    if (!grid) return;

    const circles = Array.from(grid.querySelectorAll('.process-circle'));
    const accordionItems = Array.from(grid.querySelectorAll('.process-accordion-item'));
    if (!accordionItems.length) return;

    function setActive(stepIndex) {
        circles.forEach(circle => {
            circle.classList.toggle('is-active', circle.dataset.stepIndex === stepIndex);
        });
        accordionItems.forEach(item => {
            item.classList.toggle('is-active', item.dataset.stepIndex === stepIndex);
        });
    }

    circles.forEach(circle => {
        circle.addEventListener('click', () => setActive(circle.dataset.stepIndex));
    });

    accordionItems.forEach(item => {
        const head = item.querySelector('.process-accordion-head');
        if (!head) return;
        head.addEventListener('click', () => setActive(item.dataset.stepIndex));
    });

    batchReveal('.process-circle-cluster, .process-accordion-item', { y: 30, duration: 0.6, stagger: 0.08, ease: 'power2.out', start: 'top 85%' });
}

function initDifferentialsAnimation() {
    batchReveal('.differential-item', { y: 40, duration: 0.6, stagger: 0.1, ease: 'power2.out', start: 'top 85%' });
}

function initServicesReveal() {
    batchReveal('.service-mosaic-item', { y: 40, duration: 0.6, stagger: 0.1, ease: 'power2.out', start: 'top 85%' });
}

// === SERVICE MOSAIC GRID - DYNAMIC SIZING ===
function initServiceGridAdjust() {
    const adjustGrid = () => {
        const mosaic = document.getElementById('servicesMosaic');
        if (!mosaic) return;
        if (window.innerWidth <= 768) {
            mosaic.querySelectorAll('.service-mosaic-item').forEach(item => {
                item.style.gridColumn = '';
                item.style.gridRow = '';
            });
        }
    };
    adjustGrid();
    window.addEventListener('resize', adjustGrid);
}

// === CLIENTS CAROUSEL — physics-based drag, inertia, directional memory ===
function initClientsCarousel() {
    const track = document.getElementById('clientsTrack');
    if (!track) return;

    const originalSlides = Array.from(track.querySelectorAll('.clients-carousel-slide'));
    if (originalSlides.length < 2) return;

    // getGap: le o gap real do flex (muda por breakpoint — 16px/12px/10px).
    // setWidth precisa incluir o gap, senao o salto do loop infinito
    // (currentX -= setWidth) fica sistematicamente errado por
    // totalOriginal*gap px a cada ciclo — visivel como um "trava e volta"
    // periodico durante o autoplay.
    function getGap() {
        const g = parseFloat(window.getComputedStyle(track).columnGap);
        return Number.isNaN(g) ? 0 : g;
    }

    let gap = getGap();
    let slideWidth = originalSlides[0].offsetWidth + gap;
    const totalOriginal = originalSlides.length;
    let setWidth = totalOriginal * slideWidth;

    // Clone all slides twice for seamless infinite loop (3 sets total)
    for (let i = 0; i < 2; i++) {
        originalSlides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
    }

    // Set CSS custom properties for slide dimensions (used by card sizing)
    function setSlideDimensions() {
        const w = originalSlides[0].offsetWidth;
        const h = originalSlides[0].offsetHeight;
        track.style.setProperty('--slide-w', w + 'px');
        track.style.setProperty('--slide-h', h + 'px');
    }
    setSlideDimensions();

    // Physics state
    let currentX = -setWidth;          // start at first original set
    let velocity = 0;
    let baseSpeed = 4.2;               // px per frame, rightward (left-to-right) — positive = → → → (2.8 * 1.5, +50% de velocidade)
    const FRICTION = 0.95;             // inertia deceleration (higher = slides longer)
    const RETURN_SPRING = 0.025;       // how fast velocity returns to baseSpeed
    const MAX_SPEED = 22;              // max momentum on release
    const DRAG_FACTOR = 1.05;          // momentum multiplier on release
    let isDragging = false;
    let lastPointerX = 0;
    let dragDelta = 0;
    let rafId = null;

    track.style.willChange = 'transform';

    function animate() {
        // Durante o drag, onPointerMove e o unico escritor de currentX —
        // se este loop tambem somasse `velocity` aqui, as duas fontes
        // brigariam pelo mesmo valor a cada frame (movimento fantasma
        // somado ao gesto do usuario), causando o travamento/"correcao"
        // brusca ao soltar o dedo/mouse.
        if (!isDragging) {
            // Velocity drifts toward current baseSpeed (directional memory)
            velocity += (baseSpeed - velocity) * RETURN_SPRING;
            velocity *= FRICTION;

            // Snap to baseSpeed if very close
            if (Math.abs(velocity - baseSpeed) < 0.005) {
                velocity = baseSpeed;
            }

            currentX += velocity;

            // Seamless wrap
            const wrapThreshold = setWidth * 1.5;
            if (currentX < -wrapThreshold) {
                currentX += setWidth;
            } else if (currentX > -setWidth * 0.5) {
                currentX -= setWidth;
            }

            track.style.transform = `translate3d(${currentX}px, 0, 0)`;
        }
        rafId = requestAnimationFrame(animate);
    }

    function stop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function start() {
        if (rafId) return;
        velocity = baseSpeed;
        rafId = requestAnimationFrame(animate);
    }

    // --- Drag handlers ---
    function onPointerDown(e) {
        isDragging = true;
        const x = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        lastPointerX = x;
        dragDelta = 0;
        track.style.transition = 'none';
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const dx = x - lastPointerX;
        lastPointerX = x;
        dragDelta += dx;
        currentX += dx;

        // Wrap during drag
        const wrapThreshold = setWidth * 1.5;
        if (currentX < -wrapThreshold) {
            currentX += setWidth;
        } else if (currentX > -setWidth * 0.5) {
            currentX -= setWidth;
        }

        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    }

    function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;

        // Calculate momentum from drag — positive = right, negative = left
        const momentum = dragDelta * DRAG_FACTOR;

        // Clamp momentum
        const clampedMomentum = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, momentum));

        // If there was meaningful drag, set direction + velocity from it
        if (Math.abs(clampedMomentum) > 0.1) {
            velocity = clampedMomentum;
            baseSpeed = clampedMomentum > 0
                ? Math.max(clampedMomentum * 0.3, 0.5)   // rightward
                : Math.min(clampedMomentum * 0.3, -0.5); // leftward
            // Ensure baseSpeed isn't zero
            if (Math.abs(baseSpeed) < 0.5) baseSpeed = baseSpeed >= 0 ? 0.5 : -0.5;
        }
        // If no meaningful drag, keep current direction
        // baseSpeed remembers the last direction set by the user

        dragDelta = 0;
    }

    // Mouse events
    track.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Touch events — registrados no track (não no window): eventos de touch
    // continuam disparando no elemento de origem mesmo com o dedo fora dele,
    // então escopar aqui evita um listener não-passivo na página inteira,
    // que desativaria o scroll-ahead do navegador globalmente.
    track.addEventListener('touchstart', onPointerDown, { passive: true });
    track.addEventListener('touchmove', onPointerMove, { passive: false });
    track.addEventListener('touchend', onPointerUp);
    // touchcancel: o navegador pode interromper o toque sem disparar touchend
    // (comum em mobile quando o gesto e resolvido como scroll da pagina em vez
    // de drag do carrossel). Sem isso, isDragging ficava travado em true para
    // sempre, congelando o mecanismo de retomada de velocidade (RETURN_SPRING
    // em animate() so roda quando !isDragging) — o carrossel parava de girar
    // sozinho depois do primeiro toque ambiguo. Mesmo reset de onPointerUp.
    track.addEventListener('touchcancel', onPointerUp);

    // Prevent text selection while dragging
    track.addEventListener('dragstart', (e) => e.preventDefault());

    // Resize — recalcula tudo que depende da largura do slide (--slide-w/-h,
    // setWidth do wrap infinito) e reescala currentX na mesma proporcao, senao
    // o wrap continua usando a largura antiga enquanto o card real ja mudou de
    // tamanho — os clones do loop infinito saem de alinhamento e sobrepoem uns
    // aos outros visualmente.
    const resizeObserver = new ResizeObserver(() => {
        const newGap = getGap();
        const newSlideWidth = originalSlides[0].offsetWidth + newGap;
        if (!newSlideWidth || newSlideWidth === slideWidth) return;
        const ratio = newSlideWidth / slideWidth;
        slideWidth = newSlideWidth;
        gap = newGap;
        setSlideDimensions();
        setWidth = totalOriginal * slideWidth;
        currentX *= ratio;
    });
    resizeObserver.observe(track);

    // Pausa o loop de rAF quando o carrossel sai da viewport — este carrossel
    // fica no fim da página e, sem isso, o loop rodava para sempre desde o
    // load, mesmo com o usuário lendo o hero no topo.
    //
    // Observa #clientsStage (contêiner fixo, sem transform, do tamanho real da
    // faixa visível) em vez de #clientsTrack. Track é 3x mais largo que a área
    // visível (clones para o loop infinito) e tem seu translate3d reescrito a
    // cada frame pelo próprio loop que este observer controla — observar um
    // alvo que se transforma continuamente enquanto o observer decide se ele
    // deve continuar se transformando é uma referência circular: o navegador
    // pode entregar uma leitura isIntersecting:false espúria mesmo com o
    // elemento comprovadamente visível (boundingTop idêntico ao instante
    // anterior), interrompendo o autoplay para sempre. Confirmado via teste
    // automatizado (audit/carrossel-clientes-mobile.md) — stage, por ser
    // estático, não sofre esse problema.
    const visibilityTarget = document.getElementById('clientsStage') || track;
    if ('IntersectionObserver' in window) {
        // Rede de segurança extra: debounce por tempo (não por contagem de
        // callbacks) antes de parar. Uma saída real de viewport normalmente
        // dispara UMA única notificação de isIntersecting:false — exigir 2
        // callbacks consecutivos nunca seria satisfeito nesse caso e quebraria
        // o stop() legítimo (confirmado em teste). Em vez disso, adia o
        // stop() por STOP_DEBOUNCE_MS; se uma notificação isIntersecting:true
        // chegar antes do timeout disparar (o padrão da leitura espúria
        // original: false seguido de true poucos ms depois), o stop() pendente
        // é cancelado. start() continua imediato, sem debounce.
        const STOP_DEBOUNCE_MS = 100;
        let pendingStopTimer = null;
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (pendingStopTimer) {
                        clearTimeout(pendingStopTimer);
                        pendingStopTimer = null;
                    }
                    start();
                } else if (!pendingStopTimer) {
                    pendingStopTimer = setTimeout(() => {
                        pendingStopTimer = null;
                        stop();
                    }, STOP_DEBOUNCE_MS);
                }
            });
        }, { threshold: 0 });
        visibilityObserver.observe(visibilityTarget);
    } else {
        start();
    }
}

// initClientsCarousel() so roda depois que a timeline de entrada do hero
// termina (ver startIdleQueue()/initHeroEntrance) — ~1.5s-1.8s de proposito,
// pra nao competir por CPU com a animacao critica do hero. Isso deixa o
// carrossel visivelmente parado ("congelado") se o usuario rolar ate a
// secao de clientes antes desse tempo passar (ex: F5 seguido de scroll
// rapido). scheduleClientsCarouselEarly() cobre esse caso: observa a secao
// de clientes com margem generosa e, assim que ela se aproxima da viewport,
// inicializa o carrossel imediatamente (via requestIdleCallback, sem
// competir com frame em andamento), sem esperar o hero terminar. O guard
// clientsCarouselInitialized garante que so um dos dois gatilhos (este ou o
// startIdleQueue) efetivamente rode initClientsCarousel().
let clientsCarouselInitialized = false;
function initClientsCarouselOnce() {
    if (clientsCarouselInitialized) return;
    clientsCarouselInitialized = true;
    initClientsCarousel();
}

function scheduleClientsCarouselEarly() {
    const clientsStage = document.getElementById('clientsStage');
    if (!clientsStage || typeof IntersectionObserver !== 'function') return;

    const earlyObserver = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        earlyObserver.disconnect();
        runWhenIdle(initClientsCarouselOnce);
    }, { rootMargin: '800px 0px', threshold: 0 });
    earlyObserver.observe(clientsStage);
}

// === SCROLL REVEAL FALLBACK — segurança contra ScrollTrigger nunca disparar ===
// Causa raiz do bug original: initPage() roda em DOMContentLoaded, antes de
// imagens (portfolio, mosaico de serviços, avatares) terminarem de carregar.
// Os marcadores de start do ScrollTrigger são calculados com a página ainda
// curta; em mobile (rede mais lenta, ignoreMobileResize:true suprime o resize
// do endereço do Safari) esses marcadores nunca são recalculados, e o
// scroll do usuário não atinge o ponto onde o ScrollTrigger acha que deveria
// disparar — o elemento fica com opacity:0 (aplicado inline pelo gsap.from())
// para sempre. window.load + ScrollTrigger.refresh() corrige a causa raiz;
// este fallback é a rede de segurança caso, por qualquer motivo futuro, um
// elemento ainda fique retido perto da viewport sem revelar.
function initScrollRevealFallback() {
    const GRACE_PERIOD_MS = 1500;
    const selector = '.differential-item, .service-mosaic-item, .process-step';
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    function isHidden(el) {
        if (el.classList.contains('process-step')) {
            return !el.classList.contains('revealed');
        }
        return parseFloat(window.getComputedStyle(el).opacity) < 1;
    }

    function forceReveal(el) {
        if (!isHidden(el)) return;
        if (el.classList.contains('process-step')) {
            el.classList.add('revealed');
        } else {
            gsap.set(el, { opacity: 1, x: 0, y: 0 });
        }
    }

    if (typeof IntersectionObserver !== 'function') {
        elements.forEach(forceReveal);
        return;
    }

    // Observa continuamente (não é um disparo único pós-load): cobre também
    // elementos que o usuário só alcança rolando bem mais tarde.
    const fallbackObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            // Dá tempo do ScrollTrigger legítimo disparar primeiro — só força
            // a revelação se, depois da folga, o elemento ainda estiver preso.
            setTimeout(() => {
                if (isHidden(el)) forceReveal(el);
            }, GRACE_PERIOD_MS);
            fallbackObserver.unobserve(el);
        });
    }, { rootMargin: '200px 0px', threshold: 0 });

    elements.forEach(el => fallbackObserver.observe(el));
}

// Roda fn assim que o main thread ficar ocioso, com timeout de seguranca (nao
// espera para sempre se o thread ficar ocupado). Fallback setTimeout(fn, 0)
// para navegadores sem requestIdleCallback (Safari).
function runWhenIdle(fn, timeout) {
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(fn, { timeout: timeout || 200 });
    } else {
        setTimeout(fn, 0);
    }
}

// Roda cada funcao da lista em seu proprio requestIdleCallback, encadeados
// (a proxima so e agendada depois que a anterior termina) — nao agrupa tudo
// num unico callback. Motivo historico: numa tentativa anterior a esta,
// quando a fila inteira comecava logo apos DOMContentLoaded (sem esperar o
// hero terminar), fatiar evitava competir com a ANIMACAO do hero por CPU sob
// throttle. Isso ainda vale para funcoes que nao tem urgencia de conteudo —
// ver runBatchWhenIdle() abaixo para o caso em que a fila so comeca DEPOIS
// que o hero ja terminou (aqui o espacamento entre itens deixou de proteger
// nada e so atrasa desnecessariamente conteudo que o usuario pode rolar ate
// ver a qualquer momento).
function runQueueWhenIdle(fns) {
    let i = 0;
    function next() {
        if (i >= fns.length) return;
        const fn = fns[i++];
        runWhenIdle(() => {
            fn();
            next();
        });
    }
    next();
}

// Roda todas as funcoes da lista em UM UNICO requestIdleCallback, uma logo
// apos a outra, sem espacamento entre elas. So faz sentido chamar isto DEPOIS
// que o hero ja terminou de animar (ver startIdleQueue()) — nesse ponto nao
// ha mais nenhuma animacao critica competindo por frame, entao nao ha motivo
// para in fatiar essas funcoes em idle callbacks separados: medido nesta
// sessao, juntas elas somam so ~140ms de trabalho sincrono (ScrollReveals
// 60ms + ClientsCarousel 27ms + ValuesReveal 14ms + resto), mas encadeadas
// via requestIdleCallback individual (200ms de timeout cada) o navegador
// espacava a execucao em rajadas de ~100ms entre si, levando quase 2s
// (~3.26s a ~5.3s medido em producao via WebPageTest) para a fila terminar —
// tempo real o suficiente para o usuario rolar ate uma secao ou olhar o
// carrossel de clientes antes do ScrollTrigger/inicializacao correspondente
// ter rodado, reproduzindo os sintomas de "corta"/"carrossel parado" mesmo
// com as correcoes de ordem (Correcao 2) e touchcancel (Correcao 3) ja
// presentes — o problema nao era mais logica errada, era so demorar demais
// pra rodar.
function runBatchWhenIdle(fns) {
    runWhenIdle(() => {
        fns.forEach(fn => fn());
    });
}

// === INIT ALL ===
function initPage() {
    // Critico — a unica coisa visivel no primeiro frame e o hero. Mantido
    // sincrono e o mais enxuto possivel para o GSAP ticker (requestAnimationFrame)
    // conseguir avancar a timeline de entrada sem competir por CPU.
    //
    // DEBUG TEMPORARIO (Fase 2, ?debug=perf) — checkpoints granulares em volta
    // de cada chamada sincrona, pra achar qual delas (ou a soma) consome os
    // ~3,8s de bloqueio do main thread medidos no iPhone real. __perfCheckpoint
    // e no-op fora do modo debug. Nao altera ordem nem comportamento de nenhuma
    // funcao. Remover junto com initPerfDebug() apos o diagnostico.
    __perfCheckpoint('initPage-sync-start');
    __perfCheckpoint('initHeroVideoBackground-start');
    initHeroVideoBackground();
    __perfCheckpoint('initHeroVideoBackground-end');
    __perfCheckpoint('initHeroParallax-start');
    initHeroParallax();
    __perfCheckpoint('initHeroParallax-end');
    __perfCheckpoint('initHeroAnimations-start');
    initHeroAnimations();
    __perfCheckpoint('initHeroAnimations-end');
    __perfCheckpoint('initHeroContactCardParallax-start');
    initHeroContactCardParallax();
    __perfCheckpoint('initHeroContactCardParallax-end');
    __perfCheckpoint('initNavigation-start');
    initNavigation();
    __perfCheckpoint('initNavigation-end');
    __perfCheckpoint('initSmoothScroll-start');
    initSmoothScroll();
    __perfCheckpoint('initSmoothScroll-end');
    __perfCheckpoint('initButtonRipple-start');
    initButtonRipple(); // inclui o botao do hero — precisa estar pronto pra clique imediato
    __perfCheckpoint('initButtonRipple-end');
    // Custo de setup e so um IntersectionObserver.observe() (nao mexe em
    // DOM/layout) — nao compete com o primeiro frame do hero. Ver comentario
    // em scheduleClientsCarouselEarly() para o motivo de existir.
    scheduleClientsCarouselEarly();
    __perfCheckpoint('initPage-sync-end');

    // Nao-critico — tudo abaixo da dobra (ScrollTrigger de secoes ainda fora da
    // tela, carrosseis, formulario, particulas decorativas do hero). Antes,
    // tudo isso rodava sincrono ANTES do primeiro frame do hero conseguir
    // pintar, produzindo uma long task de ~400ms (medido) que travava a
    // animacao de entrada no meio. Adiado para depois que o thread ficar
    // ocioso (ou no maximo 200ms), sem alterar nenhuma logica interna das
    // funcoes — so o momento em que rodam.
    //
    // O inicio da fila em si (nao cada item dentro dela) so acontece depois
    // que a timeline de entrada do hero termina (onComplete) — antes disso,
    // mesmo respeitando "idle", o timeout de seguranca do requestIdleCallback
    // (200ms) podia forcar uma funcao nao-critica a rodar competindo por CPU
    // bem no meio da animacao do hero em device mobile mais lento, causando
    // o titulo "pular" em vez de animar suave. onComplete e a garantia real
    // de que o hero ja terminou. Fallback de 3.5s cobre o caso da timeline
    // nunca completar (ex: usuario sai da pagina, erro).
    let queueStarted = false;
    function startIdleQueue() {
        if (queueStarted) return;
        queueStarted = true;
        // Grupo A — afeta o que o usuario pode ver ao rolar ou interagir logo
        // apos o hero terminar (ScrollTrigger de reveal de secao, carrossel de
        // clientes, grade do portfolio). initCounters (ScrollTrigger de numeros
        // animados) e initServiceGridAdjust (rearranjo de grid da secao de
        // servicos em mobile) nao estavam na lista original pedida, mas
        // compartilham o mesmo risco — conteudo/layout visivel ao rolar — entao
        // foram incluidas aqui tambem. Roda tudo em UM idle callback, sem
        // espacamento entre itens.
        runBatchWhenIdle([
            initScrollReveals,
            initCounters,
            initServicesReveal,
            initDifferentialsAnimation,
            initProcessDiagram,
            initServiceGridAdjust,
            initPortfolioSlider,
            initClientsCarouselOnce,
        ]);

        // Grupo B — decorativo ou sem urgencia de estar pronto ao rolar
        // (particulas do hero, handlers de clique/hover/form, e o fallback de
        // seguranca que so importa como rede depois que o Grupo A ja rodou).
        // Mantido no scheduling individual encadeado original.
        runQueueWhenIdle([
            createParticles,
            initSegmentsTabs,
            initServicesInteraction,
            initContactForm,
            initCustomSelect,
            initScrollRevealFallback,
            initFaqAccordion,
        ]);
    }
    initHeroEntrance(startIdleQueue);
    setTimeout(startIdleQueue, 3500);

    // ScrollTrigger refresh on resize — so quando a LARGURA muda (rotacao de
    // tela, redimensionamento real de janela), nunca so por mudanca de altura.
    // Causa raiz confirmada via stack trace real no iPhone: no Safari iOS, a
    // barra de endereco dinamica (aparece/some durante o scroll) dispara varios
    // eventos de resize so por mudanca de ALTURA da viewport — cada um chamava
    // ScrollTrigger.refresh(), que internamente faz um scrollTo(0,0) pra medir
    // e depois restaura a posicao; ciclos sobrepostos desses refreshes faziam
    // a restauracao falhar, prendendo o scroll em 0 (o "salto pra tras"
    // reportado). ScrollTrigger.config({ ignoreMobileResize: true }) nao
    // protegia contra isso porque so filtra o listener INTERNO do proprio
    // GSAP, nao este listener manual. Debounce de 150ms e protecao extra
    // contra sequencias rapidas de resize de largura genuina (ex: redimensionar
    // a janela no desktop arrastando a borda).
    let lastWidth = window.innerWidth;
    let resizeRefreshTimeout;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return; // so altura mudou — ignora (barra de endereco do Safari)
        lastWidth = window.innerWidth;
        clearTimeout(resizeRefreshTimeout);
        resizeRefreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Recalcula os marcadores de start depois que TODAS as imagens/fontes
    // terminarem de carregar — evita marcadores calculados para uma página
    // ainda curta (causa raiz do bug de conteúdo não revelar em mobile).
    window.addEventListener('load', () => ScrollTrigger.refresh());

    // Gap encontrado no diagnostico de carregamento inicial: com font-display:swap,
    // a troca da fonte (reflow de metricas/quebra de linha) pode terminar DEPOIS do
    // evento 'load' em rede lenta — o refresh acima roda cedo demais nesse caso e a
    // primeira secao apos o hero fica com marcadores desatualizados de novo. Refresh
    // adicional quando document.fonts.ready resolver cobre esse caso especifico.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
}

// Initialize page immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

// === SEGMENTS SECTION — TAB SWITCHER (nova seção, adicionado sem alterar código existente) ===
function initSegmentsTabs() {
    const tabs = document.querySelectorAll('.segment-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.segment;
            const panel = document.querySelector(`[data-segment-panel="${target}"]`);
            if (!panel) return;

            document.querySelectorAll('.segment-tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.segment-panel').forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            panel.classList.add('active');
        });
    });
}

// === FAQ SECTION — ACCORDION VIA JS (substitui ::details-content, sem suporte no Safari iOS) ===
// Mantém o <details>/<summary> nativo (semântica e fallback sem JS), mas
// assume a transição de abertura/fechamento via max-height, controlada
// manualmente. Compatível com todos os navegadores, incluindo Safari iOS.
function initFaqAccordion() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
        const summary = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!summary || !answer) return;

        answer.style.maxHeight = item.hasAttribute('open') ? `${answer.scrollHeight}px` : '0px';

        summary.addEventListener('click', (event) => {
            event.preventDefault();
            if (item.dataset.animating === 'true') return;
            item.dataset.animating = 'true';

            const closing = item.hasAttribute('open');

            if (closing) {
                answer.style.maxHeight = `${answer.scrollHeight}px`;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        answer.style.maxHeight = '0px';
                    });
                });
            } else {
                item.setAttribute('open', '');
                answer.style.maxHeight = `${answer.scrollHeight}px`;
            }

            answer.addEventListener('transitionend', function onTransitionEnd(event) {
                if (event.propertyName !== 'max-height') return;
                answer.removeEventListener('transitionend', onTransitionEnd);
                if (closing) item.removeAttribute('open');
                item.dataset.animating = 'false';
            });
        });
    });
}
