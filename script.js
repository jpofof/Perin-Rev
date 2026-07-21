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

// === ISOLAMENTO TEMPORARIO PARA DIAGNOSTICO POR ELIMINACAO (remover apos
// diagnostico) — ver audit/isolamento-query-params.md para a lista completa
// e o que cada flag desliga. Sem ?isolate=... na URL, __ISOLATE fica vazio e
// todo o comportamento normal do site permanece 100% inalterado. Calculado
// de forma sincrona, ANTES de initPage() rodar, para que os guards dentro
// das funcoes de inicializacao ja vejam as flags corretas.
var __ISOLATE = (function () {
    var params = new URLSearchParams(location.search);
    var raw = params.get('isolate');
    if (!raw) return {};
    var list = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (list.indexOf('minimal') !== -1) {
        list = list.concat(['no-video', 'no-gsap', 'no-particles', 'no-carousel-clients']);
    }
    var flags = {};
    list.forEach(function (f) { flags[f] = true; });
    return flags;
})();
window.__ISOLATE = __ISOLATE;

// true quando NENHUMA animacao/plugin GSAP deve rodar (nem timeline do hero,
// nem ScrollTrigger, nem o carrossel cascata do portfolio).
function __gsapDisabled() {
    return !!__ISOLATE['no-gsap'];
}
// true quando especificamente o ScrollTrigger deve ficar desligado — inclui
// o caso de no-gsap (que desliga tudo) e o caso mais cirurgico de
// no-scrolltrigger-only (que mantem GSAP/timeline do hero funcionando).
function __scrollTriggerDisabled() {
    return !!(__ISOLATE['no-gsap'] || __ISOLATE['no-scrolltrigger-only']);
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

// === DESIGN TOKENS (referência para edição) ===
// Cores: --cor-preto-puro, --cor-branco-gelo, --cor-verde-floresta, --cor-verde-brilhante, --cor-verde-neon, --cor-bege-escuro, --cor-cinza-acastanhado, --cor-creme

// === HERO PARTICLES ===
function createParticles() {
    // ISOLAMENTO no-particles/minimal — pula a criacao das 50 particulas
    // animadas por completo (nao so pausa). Ver audit/isolamento-query-params.md.
    if (__ISOLATE['no-particles']) return;

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

    // ISOLAMENTO no-video/minimal — reaproveita exatamente a mesma logica de
    // remocao ja usada em mobile (nenhum byte de video baixado, so o poster
    // estatico do CSS aparece). Ver audit/isolamento-query-params.md.
    if (isMobile || prefersReducedMotion || isSlowConnection || __ISOLATE['no-video']) {
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
    // ISOLAMENTO no-geometries — os elementos ja foram removidos do DOM em
    // initPage() antes desta funcao rodar; nada a fazer aqui alem de sair
    // cedo (evita lancar ao tentar ler .style/.querySelectorAll de null).
    if (!geometries || !lighting || !grid) return;

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

        // Overlay: começa em 200px, cresce até no máximo 50% da altura da hero (max 400px)
        const maxOverlay = Math.min(hero.offsetHeight * 0.5, 400);
        const overlayH = 200 + (maxOverlay - 200) * progress;
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

    // ISOLAMENTO no-gsap/minimal — nenhuma chamada gsap.set/gsap.timeline
    // roda. Hero aparece direto no estado final via CSS/JS puro (opacity:1,
    // sem transform), sem timeline de entrada. Ver audit/isolamento-query-params.md.
    if (__gsapDisabled()) {
        document.querySelectorAll('.hero-badge, .hero-title-line, .hero-subtitle, .hero-actions').forEach(function (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        if (onDone) onDone();
        return;
    }

    // Force final state on all entrance elements FIRST (before any ScrollTrigger)
    // This prevents elements from remaining at opacity:0 if entrance never fires
    gsap.set('.hero-badge, .hero-title-line, .hero-subtitle, .hero-actions', {
        opacity: 1,
        y: 0,
        rotateX: 0,
    });

    // Then set initial animation state on elements that should animate
    // But only if hero is visible in viewport
    const isHeroVisible = hero.getBoundingClientRect().top < window.innerHeight;

    if (isHeroVisible) {
        // Reset to initial state for a fresh animation
        gsap.set('.hero-badge', { opacity: 0, y: 30 });
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
        tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.35 })
            .to('.hero-title-line-1', { opacity: 1, y: 0, rotateX: 0, duration: 0.45 }, '-=0.15')
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
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
}

// === SCROLL REVEAL ANIMATIONS ===
function initScrollReveals() {
    // ISOLAMENTO no-gsap/no-scrolltrigger-only/minimal — nenhum ScrollTrigger
    // roda. '.section-title-reveal' e '.text-reveal' ja sao opacity:1 por
    // padrao no CSS (nunca tem gsap.set de opacity:0 aplicado nelas), entao
    // pular os dois primeiros loops nao muda nada visualmente. So
    // '.process-step' (que comeca oculto via CSS) precisa da revelacao
    // forcada aqui. Ver audit/isolamento-query-params.md.
    if (__scrollTriggerDisabled()) {
        document.querySelectorAll('.process-step').forEach(function (el) {
            el.classList.add('revealed');
        });
        return;
    }

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
    // ISOLAMENTO no-gsap/no-scrolltrigger-only/minimal — nenhum
    // gsap.to/scrollTrigger roda para os contadores.
    if (__scrollTriggerDisabled()) return;
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

// Gera atributos srcset/sizes para imagens de placeholder que têm variantes -mobile/-desktop geradas no build manual de otimização (ver RELATORIO-PERFORMANCE.md)
function buildResponsiveImgAttrs(src) {
    var match = src.match(/^(.*\/placeholder-obra-\d+)\.webp$/);
    if (!match) return 'src="' + src + '"';
    var base = match[1];
    return 'src="' + base + '-desktop.webp" srcset="' + base + '-mobile.webp 800w, ' + base + '-desktop.webp 1280w" sizes="(max-width: 750px) 80vw, 60vw"';
}

// === PORTFOLIO PROJECTS DATA ===
const portfolioProjects = [
    {
        id: 'eldorado',
        name: 'Eldorado Brasil',
        subtitle: 'Obra Industrial • 2024',
        cover: 'assets/images/clients/eldorado.webp',
        photos: ['assets/images/clients/eldorado.webp', 'assets/images/placeholders/placeholder-obra-01.webp', 'assets/images/placeholders/placeholder-obra-02.webp', 'assets/images/placeholders/placeholder-obra-03.webp', 'assets/images/placeholders/placeholder-obra-04.webp']
    },
    {
        id: 'elektro',
        name: 'Elektro Redes',
        subtitle: 'Infraestrutura Elétrica • 2023',
        cover: 'assets/images/clients/elektro.webp',
        photos: ['assets/images/clients/elektro.webp', 'assets/images/placeholders/placeholder-obra-02.webp', 'assets/images/placeholders/placeholder-obra-03.webp', 'assets/images/placeholders/placeholder-obra-04.webp', 'assets/images/placeholders/placeholder-obra-05.webp']
    },
    {
        id: 'isa-energia',
        name: 'ISA Energia',
        subtitle: 'Subestação • 2023',
        cover: 'assets/images/clients/isa-energia.webp',
        photos: ['assets/images/clients/isa-energia.webp', 'assets/images/placeholders/placeholder-obra-03.webp', 'assets/images/placeholders/placeholder-obra-04.webp', 'assets/images/placeholders/placeholder-obra-05.webp', 'assets/images/placeholders/placeholder-obra-01.webp']
    },
    {
        id: 'state-grid',
        name: 'State Grid',
        subtitle: 'Linha de Transmissão • 2022',
        cover: 'assets/images/clients/state-grid.webp',
        photos: ['assets/images/clients/state-grid.webp', 'assets/images/placeholders/placeholder-obra-04.webp', 'assets/images/placeholders/placeholder-obra-05.webp', 'assets/images/placeholders/placeholder-obra-01.webp', 'assets/images/placeholders/placeholder-obra-02.webp']
    },
    {
        id: 'perin-sede',
        name: 'Sede Perin',
        subtitle: 'Construção Comercial • 2021',
        cover: 'assets/images/brand/logo-perin-principal.webp',
        photos: ['assets/images/brand/logo-perin-principal.webp', 'assets/images/placeholders/placeholder-obra-05.webp', 'assets/images/placeholders/placeholder-obra-01.webp', 'assets/images/placeholders/placeholder-obra-02.webp', 'assets/images/placeholders/placeholder-obra-03.webp']
    },
    {
        id: 'obra-residencial',
        name: 'Residencial Villaggio',
        subtitle: 'Construção Residencial • 2024',
        cover: 'assets/images/placeholders/placeholder-obra-01.webp',
        photos: ['assets/images/placeholders/placeholder-obra-01.webp', 'assets/images/placeholders/placeholder-obra-02.webp', 'assets/images/placeholders/placeholder-obra-03.webp', 'assets/images/placeholders/placeholder-obra-04.webp', 'assets/images/placeholders/placeholder-obra-05.webp']
    }
];

// === CASCADING SLIDER ENGINE (reusable) ===
function createCascadingSlider(listEl, collectionEl) {
    const slides = listEl.querySelectorAll('.cascading-slide');
    const prevBtn = document.querySelector('.cascading-slider-button-prev');
    const nextBtn = document.querySelector('.cascading-slider-button-next');
    let currentIndex = 0;
    const total = slides.length;

    if (total === 0) return { goTo: function () { }, destroy: function () { } };

    const DURATION = 0.70;
    const CURVE = 'cubic-bezier(0.40, 0.00, 0.30, 1.00)';
    let isTransitioning = false;

    const PCT_DESKTOP = [0.065, 0.135, 0.60, 0.135, 0.065];
    const PCT_NOTEBOOK = [0.08, 0.16, 0.52, 0.16, 0.08];
    const PCT_TABLET = [0.15, 0.70, 0.15];
    const PCT_MOBILE = [0.10, 0.80, 0.10];
    const gap = 8;

    listEl.style.display = '';
    listEl.style.willChange = '';
    listEl.style.backfaceVisibility = '';
    listEl.style.transform = '';
    listEl.style.width = '';
    listEl.style.overflow = '';

    slides.forEach((slide) => {
        slide.style.position = 'absolute';
        slide.style.flex = '';
        slide.style.display = '';
        slide.style.border = 'none';
        slide.style.boxShadow = 'none';
        slide.style.filter = 'none';
        slide.style.margin = '0';
        slide.style.willChange = 'left, width, opacity';
        slide.style.backfaceVisibility = 'hidden';
        slide.style.transform = '';
        slide.style.transition = 'none';
        slide.style.pointerEvents = '';

        const img = slide.querySelector('.cascading-slide-image img');
        if (img) {
            img.style.width = 'auto';
            img.style.height = '100%';
            img.style.minWidth = '';
            img.style.maxWidth = 'none';
        }
        const svg = slide.querySelector('.cascading-slide-image svg');
        if (svg) {
            svg.removeAttribute('viewBox');
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.display = 'block';
        }
    });

    function getBreakpoint() {
        const w = window.innerWidth;
        if (w <= 480) return 'mobile';
        if (w <= 750) return 'tablet';
        if (w <= 1200) return 'notebook';
        return 'desktop';
    }

    function getPCT() {
        const bp = getBreakpoint();
        switch (bp) {
            case 'mobile': return { pct: PCT_MOBILE, slots: 3 };
            case 'tablet': return { pct: PCT_TABLET, slots: 3 };
            case 'notebook': return { pct: PCT_NOTEBOOK, slots: 5 };
            default: return { pct: PCT_DESKTOP, slots: 5 };
        }
    }

    function getSizes() {
        const cw = listEl.offsetWidth;
        const { pct, slots } = getPCT();
        const ch = 420;
        const totalGaps = gap * (slots - 1);
        const usable = cw - totalGaps;
        const ws = (slots === 3)
            ? [Math.round(usable * pct[0]), Math.round(usable * pct[1]), Math.round(usable * pct[2])]
            : pct.slice(0, 5).map(p => Math.round(usable * p));
        return { containerWidth: cw, containerHeight: ch, ws, slots };
    }

    function positionSlides(index) {
        const { containerWidth, containerHeight, ws, slots } = getSizes();

        slides.forEach((slide) => {
            slide.style.transition = 'none';
            slide.style.height = containerHeight + 'px';
        });
        listEl.style.height = containerHeight + 'px';
        if (collectionEl) collectionEl.style.height = containerHeight + 'px';

        const visibleByDist = {};
        slides.forEach((slide, i) => {
            let dist = i - index;
            if (dist < -Math.floor(total / 2)) dist += total;
            if (dist > Math.floor(total / 2)) dist -= total;
            visibleByDist[dist] = slide;
        });

        const showSlide = (dist, slotStyle) => {
            const slide = visibleByDist[dist];
            if (!slide || !slotStyle) return;
            const absDist = Math.abs(dist);
            slide.style.transition = 'none';
            slide.style.height = containerHeight + 'px';
            slide.style.top = '50%';
            slide.style.transform = 'translateY(-50%)';
            slide.style.opacity = '1';
            slide.style.zIndex = Math.max(1, 10 - absDist);
            slide.style.pointerEvents = 'auto';
            gsap.killTweensOf(slide);
            gsap.to(slide, {
                left: slotStyle.left + 'px',
                width: slotStyle.width + 'px',
                duration: DURATION,
                ease: CURVE,
                overwrite: true,
            });
        };

        const numSlots = ws.length;
        const slotStyles = [];
        let accumulatedLeft = 0;
        for (let s = 0; s < numSlots; s++) {
            slotStyles.push({ left: accumulatedLeft, width: ws[s] });
            accumulatedLeft += ws[s] + gap;
        }

        if (slots === 3) {
            showSlide(-1, slotStyles[0]);
            showSlide(0, slotStyles[1]);
            showSlide(1, slotStyles[2]);
            slides.forEach(slide => {
                const sd = parseInt(Object.keys(visibleByDist).find(k => visibleByDist[k] === slide) || '');
                if (sd < -1 || sd > 1) {
                    slide.style.opacity = '0';
                    slide.style.pointerEvents = 'none';
                }
            });
        } else {
            for (let d = -2; d <= 2; d++) {
                showSlide(d, slotStyles[d + 2]);
            }
        }

        Object.entries(visibleByDist).forEach(([distStr, slide]) => {
            slide.removeAttribute('data-status');
            const d = parseInt(distStr);
            if (d === 0) slide.setAttribute('data-status', 'active');
            else if (Math.abs(d) <= 1) slide.setAttribute('data-status', 'near');
        });

        Object.values(visibleByDist).forEach((slide) => {
            const isActive = slide.getAttribute('data-status') === 'active';
            const content = slide.querySelector('.cascading-slide-content');
            if (content) {
                if (isActive) {
                    content.style.display = 'block';
                    content.style.transition = 'opacity ' + DURATION + 's ' + CURVE + ', transform ' + DURATION + 's ' + CURVE;
                    content.style.transitionDelay = '0.1s';
                    content.style.opacity = '1';
                    content.style.transform = 'translateY(0)';
                } else {
                    content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    content.style.transitionDelay = '0s';
                    content.style.opacity = '0';
                    content.style.transform = 'translateY(15px)';
                }
            }
        });

        const centerW = ws[Math.floor(ws.length / 2)];

        slides.forEach((slide) => {
            const img = slide.querySelector('.cascading-slide-image img');
            if (img) {
                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    const scale = Math.max(
                        centerW / img.naturalWidth,
                        containerHeight / img.naturalHeight
                    );
                    img.style.width = Math.round(img.naturalWidth * scale) + 'px';
                    img.style.height = Math.round(img.naturalHeight * scale) + 'px';
                } else {
                    img.style.width = centerW + 'px';
                    img.style.height = containerHeight + 'px';
                    img.addEventListener('load', function onImgLoad() {
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                            const scale = Math.max(
                                centerW / img.naturalWidth,
                                containerHeight / img.naturalHeight
                            );
                            img.style.width = Math.round(img.naturalWidth * scale) + 'px';
                            img.style.height = Math.round(img.naturalHeight * scale) + 'px';
                        }
                        img.removeEventListener('load', onImgLoad);
                    });
                }
            }
        });
    }

    function initSlides() {
        positionSlides(currentIndex);
    }

    function goTo(idx, btn) {
        if (isTransitioning || idx === currentIndex || total <= 1) return;
        isTransitioning = true;
        currentIndex = idx;
        positionSlides(currentIndex);
        if (btn) btn.classList.add('hover-active');
        setTimeout(function () {
            isTransitioning = false;
            if (btn) btn.classList.remove('hover-active');
        }, (DURATION + 0.02) * 1000);
    }

    slides.forEach(function (slide, i) { slide.addEventListener('click', function () { goTo(i); }); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo((currentIndex - 1 + total) % total, prevBtn); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo((currentIndex + 1) % total, nextBtn); });

    var keyHandler = function (e) {
        if (e.key === 'ArrowLeft') goTo((currentIndex - 1 + total) % total);
        if (e.key === 'ArrowRight') goTo((currentIndex + 1) % total);
    };
    document.addEventListener('keydown', keyHandler);

    var resizeTimeout;
    var resizeHandler = function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            initSlides();
        }, 150);
    };
    window.addEventListener('resize', resizeHandler);

    requestAnimationFrame(function () {
        initSlides();
        // O slider fixa a altura do container em 420px (ver getSizes()), sempre
        // maior que o clamp() do CSS em telas estreitas — isso muda a altura da
        // pagina DEPOIS que os ScrollTrigger.refresh() de load/fonts.ready ja
        // rodaram (initCascadingSlider e chamado na fila idle, depois do load),
        // deixando os marcadores de todas as secoes abaixo desatualizados. Disparar
        // o proprio refresh aqui, uma unica vez na montagem inicial, e robusto a
        // qualquer mudanca futura na ordem/timing do scheduling em initPage().
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    });

    return {
        goTo: goTo,
        destroy: function () {
            document.removeEventListener('keydown', keyHandler);
            window.removeEventListener('resize', resizeHandler);
        }
    };
}

// === CASCADING SLIDER (legacy wrapper for initPage) ===
function initCascadingSlider() {
    // ISOLAMENTO no-gsap/minimal — o carrossel cascata do portfolio (Carrossel
    // de Projetos, documentado em AGENTS.md) e GSAP-dependente por design;
    // nao inicializa sob este isolamento.
    if (__gsapDisabled()) return;
    var list = document.getElementById('cascadingSliderList');
    if (!list || list.querySelectorAll('.cascading-slide').length === 0) return;
    var collection = document.querySelector('.cascading-slider-collection');
    createCascadingSlider(list, collection);
}

// === PORTFOLIO GALLERY + VIEWER ENGINE ===
var portfolioSliderInstance = null;
var portfolioSavedScrollY = 0;

// === PORTFOLIO: Shared Element Transition Engine ===
// The card is the single protagonist — it never disappears.
// The carousel is born around it during expansion.

var portfolioState = {
    active: false,
    transitioning: false,
    currentProjectIndex: -1,
    currentProject: null,
    cardEl: null,
    cardImg: null,
    savedScrollY: 0,
    sliderInstance: null,
    sliderPopulated: false,
    // Cached references
    grid: null,
    gallery: null,
    viewer: null,
    backBtn: null,
    viewerTitle: null,
    viewerSubtitle: null,
    sliderList: null,
    sliderCollection: null,
    sliderNav: null,
    prevBtn: null,
    nextBtn: null,
    // Cached rects
    cardOrigRect: null,
    viewerContainerRect: null
};

function initPortfolioGallery() {
    var grid = document.getElementById('portfolioGrid');
    var gallery = document.getElementById('portfolioGallery');
    var viewer = document.getElementById('portfolioViewer');
    var backBtn = document.getElementById('portfolioBackBtn');
    var viewerTitle = document.getElementById('portfolioViewerTitle');
    var viewerSubtitle = document.getElementById('portfolioViewerSubtitle');
    var sliderList = document.getElementById('cascadingSliderList');
    var sliderCollection = document.querySelector('.cascading-slider-collection');
    var sliderNav = document.querySelector('.cascading-slider-nav');
    var prevBtn = document.querySelector('.cascading-slider-button-prev');
    var nextBtn = document.querySelector('.cascading-slider-button-next');

    if (!grid || !gallery || !viewer || !sliderList) return;

    // Cache all refs
    portfolioState.grid = grid;
    portfolioState.gallery = gallery;
    portfolioState.viewer = viewer;
    portfolioState.backBtn = backBtn;
    portfolioState.viewerTitle = viewerTitle;
    portfolioState.viewerSubtitle = viewerSubtitle;
    portfolioState.sliderList = sliderList;
    portfolioState.sliderCollection = sliderCollection;
    portfolioState.sliderNav = sliderNav;
    portfolioState.prevBtn = prevBtn;
    portfolioState.nextBtn = nextBtn;

    // Viewer: absolute overlay via CSS — apenas visibilidade
    viewer.style.display = '';
    viewer.style.position = '';
    viewer.style.opacity = '';
    viewer.style.visibility = '';
    viewer.style.pointerEvents = '';
    viewer.setAttribute('aria-hidden', 'true');
    sliderNav.style.opacity = '0';
    sliderNav.style.pointerEvents = 'none';

    // --- Render gallery cards ---
    grid.innerHTML = '';
    portfolioProjects.forEach(function (project, index) {
        var card = document.createElement('div');
        card.className = 'portfolio-card';
        card.setAttribute('data-project-index', index);
        card.setAttribute('data-project-id', project.id);

        card.innerHTML =
            '<div class="portfolio-card-image-wrap">' +
            '<img ' + buildResponsiveImgAttrs(project.cover) + ' alt="' + project.name + '" loading="lazy">' +
            '</div>' +
            '<div class="portfolio-card-overlay"></div>' +
            '<div class="portfolio-card-name">' + project.name + '</div>' +
            '<div class="portfolio-card-cta">' +
            '<span class="portfolio-card-cta-btn">Ver Projeto</span>' +
            '</div>';

        card.addEventListener('click', function (e) {
            if (portfolioState.transitioning) return;
            e.preventDefault();
            openProject(index, card);
        });

        grid.appendChild(card);
    });

    // #portfolioGrid fica vazio no HTML estatico — os cards so existem depois
    // desta chamada. initPortfolioGallery roda na fila idle (script.js:1934+),
    // DEPOIS que initServicesReveal/initDifferentialsAnimation/initValuesReveal/
    // initTestimonialsReveal (itens anteriores da mesma fila) ja criaram seus
    // ScrollTrigger medindo a pagina SEM a grade do portfolio. Como portfolio
    // fica acima de services/segments/process/testimonials no DOM (index.html),
    // adicionar essa altura desloca a posicao real de todas essas secoes,
    // deixando os marcadores de ScrollTrigger ja criados desatualizados — a
    // causa raiz de secoes nao revelarem ao rolar ate que o fallback de 1.5s
    // (initScrollRevealFallback) force a revelacao. Disparar o refresh aqui
    // corrige a causa, nao so o sintoma.
    // ISOLAMENTO no-gsap/no-scrolltrigger-only/minimal — nao chama
    // ScrollTrigger.refresh() (a grade em si continua sendo populada
    // normalmente acima, isso nao e animacao).
    if (typeof ScrollTrigger !== 'undefined' && !__scrollTriggerDisabled()) {
        ScrollTrigger.refresh();
    }

    // --- Back button ---
    backBtn.addEventListener('click', function () {
        if (portfolioState.transitioning) return;
        closeProject();
    });

    // === VIEWPORT TRANSITION (eduardbodak-style) ===
    // O viewer é a nova viewport — ele desliza cobrindo a seção inteira.
    // A galeria antiga apenas escurece levemente enquanto fica para trás.
    // Conteúdo do viewer só aparece depois que a viewport termina de entrar.
    // O carrossel é montado durante o movimento, nunca antes.

    var VP_CURVE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    var VP_DURATION = 0.85; // duração do movimento da viewport
    var VP_DIM_COLOR = 'rgba(0, 0, 0, 0.18)'; // escurecimento da galeria antiga

    function openProject(index, cardEl) {
        var project = portfolioProjects[index];
        if (!project) return;

        portfolioState.transitioning = true;
        portfolioState.currentProjectIndex = index;
        portfolioState.currentProject = project;
        portfolioState.cardEl = cardEl;
        portfolioState.savedScrollY = window.scrollY;

        // Trava altura do palco
        var stage = document.getElementById('portfolioStage');
        var stageHeight = stage.offsetHeight;
        stage.style.minHeight = stageHeight + 'px';

        // Gallery vai para staged (atrás, será coberta pela viewport)
        gallery.classList.add('staged');

        // Prepara viewer como nova viewport — começa abaixo, fundo bege (já no CSS)
        viewer.setAttribute('aria-hidden', 'false');
        viewerTitle.textContent = project.name;
        viewerSubtitle.textContent = project.subtitle;
        gsap.set(viewer, { y: '100%', opacity: 1, visibility: 'visible', pointerEvents: 'none' });
        // Conteúdo começa invisível
        gsap.set(viewerTitle, { opacity: 0, y: 20 });
        gsap.set(viewerSubtitle, { opacity: 0, y: 20 });
        gsap.set(backBtn, { opacity: 0 });
        gsap.set(sliderNav, { opacity: 0, pointerEvents: 'none' });

        // === Build slides IMEDIATAMENTE — carrossel montado antes de a viewport cobrir ===
        sliderList.innerHTML = '';
        project.photos.forEach(function (photo, i) {
            var slide = document.createElement('div');
            slide.className = 'cascading-slide';
            slide.setAttribute('data-status', i === 0 ? 'active' : 'inactive');
            slide.innerHTML =
                '<div class="cascading-slide-inner">' +
                '<div class="cascading-slide-image">' +
                '<img ' + buildResponsiveImgAttrs(photo) + ' alt="' + project.name + ' foto ' + (i + 1) + '"' + (i === 0 ? '' : ' loading="lazy"') + '>' +
                '<div class="cascading-slide-overlay"></div>' +
                '</div>' +
                '<div class="cascading-slide-content">' +
                '<h3 class="cascading-slide-title">' + project.name + '</h3>' +
                '<p class="cascading-slide-subtitle">' + (i + 1) + ' / ' + project.photos.length + '</p>' +
                '</div>' +
                '</div>';
            sliderList.appendChild(slide);
        });
        sliderList.style.display = '';

        // Inicia o carrossel imediatamente (atrás da viewport — invisível)
        if (portfolioState.sliderInstance) portfolioState.sliderInstance.destroy();
        portfolioState.sliderInstance = createCascadingSlider(sliderList, sliderCollection);

        var allSlides = sliderList.querySelectorAll('.cascading-slide');
        var activeSlide = sliderList.querySelector('.cascading-slide[data-status="active"]');
        var sideSlides = sliderList.querySelectorAll('.cascading-slide:not([data-status="active"])');
        gsap.set(allSlides, { pointerEvents: 'none' });
        // Slides laterais começam invisíveis — aparecem só no stagger
        gsap.set(sideSlides, { opacity: 0 });

        // === MASTER TIMELINE ===
        var tl = gsap.timeline({
            onComplete: function () {
                portfolioState.transitioning = false;
                portfolioState.active = true;
                gsap.set(viewer, { y: '0%', pointerEvents: 'auto' });
                gsap.set(gallery, { visibility: 'hidden', pointerEvents: 'none' });
                // rAF garante que GSAP finalizou todas as escritas de estilo
                // antes de liberar as constraints de layout (overflow e bottom)
                requestAnimationFrame(function () {
                    viewer.style.bottom = 'auto';
                    stage.style.overflow = 'visible';
                });
            }
        });

        // FASE 1 (0→250ms): Galeria antiga escurece levemente — indica que vai para segundo plano
        tl.to(gallery, {
            opacity: 0.65,
            duration: 0.25,
            ease: 'power2.out'
        }, 'o');

        // FASE 2 (50ms→): VIEWPORT SOBE — viewer desliza de baixo, cobrindo toda a seção
        tl.to(viewer, {
            y: '0%',
            duration: VP_DURATION,
            ease: VP_CURVE
        }, 'o+=0.05');

        // FASE 3 (durante a subida): Galeria escurece mais — a nova tela está tomando o lugar
        tl.to(gallery, {
            opacity: 0.3,
            duration: VP_DURATION * 0.9,
            ease: 'power2.out'
        }, 'o+=0.06');

        // FASE 4: STAGGER — conteúdo aparece só depois da viewport terminar de entrar
        var contentBase = VP_DURATION + 0.05;

        tl.to(viewerTitle, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: VP_CURVE
        }, 'o+=' + contentBase);

        tl.to(viewerSubtitle, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: VP_CURVE
        }, 'o+=' + (contentBase + 0.08));

        tl.to(backBtn, {
            opacity: 1,
            duration: 0.30,
            ease: 'power2.out'
        }, 'o+=' + (contentBase + 0.16));

        tl.to(sliderNav, {
            opacity: 1,
            duration: 0.35,
            ease: 'power2.out'
        }, 'o+=' + (contentBase + 0.24));
        tl.set(sliderNav, { pointerEvents: 'auto' }, 'o+=' + (contentBase + 0.24));

        // Slides laterais
        sideSlides.forEach(function (slide, i) {
            tl.to(slide, {
                opacity: 1,
                duration: 0.40,
                ease: VP_CURVE
            }, 'o+=' + (contentBase + 0.32 + i * 0.04));
        });

        // Conteúdo do slide ativo
        var activeContent = activeSlide ? activeSlide.querySelector('.cascading-slide-content') : null;
        if (activeContent) {
            tl.to(activeContent, {
                opacity: 1,
                duration: 0.35,
                ease: 'power2.out'
            }, 'o+=' + (contentBase + 0.36));
        }

        // Libera pointer events
        tl.set(allSlides, { pointerEvents: 'auto' }, 'o+=' + (contentBase + 0.55));
        tl.set(viewer, { pointerEvents: 'auto' }, 'o+=' + (contentBase + 0.55));
    }

    // === VIEWPORT CLOSE — reverso ===
    function closeProject() {
        if (!portfolioState.active || !portfolioState.cardEl) return;

        portfolioState.transitioning = true;

        // Restaura overflow:hidden no stage para clipar o viewer durante a animação de descida
        var stage = document.getElementById('portfolioStage');
        stage.style.overflow = 'hidden';

        var otherCards = Array.from(grid.querySelectorAll('.portfolio-card:not([data-project-index="' + portfolioState.currentProjectIndex + '"])'));
        var allSlides = sliderList.querySelectorAll('.cascading-slide');

        viewer.style.pointerEvents = 'none';
        gsap.set(allSlides, { pointerEvents: 'none' });

        // Gallery atrás do viewer — vai para staged (absoluta), visível mas escurecida
        gallery.classList.add('staged');
        gallery.style.opacity = '0.3';
        gallery.style.visibility = 'visible';
        gallery.style.pointerEvents = 'none';

        var clickedIndex = portfolioState.currentProjectIndex;
        var sortedOtherCards = otherCards.slice().sort(function (a, b) {
            return Math.abs(parseInt(a.getAttribute('data-project-index')) - clickedIndex) -
                Math.abs(parseInt(b.getAttribute('data-project-index')) - clickedIndex);
        });
        gsap.set(sortedOtherCards, { opacity: 0, scale: 0.98 });

        // === REVERSE TIMELINE ===
        var tl = gsap.timeline({
            onComplete: function () {
                portfolioState.transitioning = false;
                portfolioState.active = false;

                gallery.classList.remove('staged');
                gallery.style.opacity = '';
                gallery.style.pointerEvents = '';
                gallery.style.visibility = '';

                viewer.style.opacity = '';
                viewer.style.visibility = '';
                viewer.style.pointerEvents = '';
                viewer.style.y = '';
                viewer.style.bottom = '';
                viewer.setAttribute('aria-hidden', 'true');

                viewerTitle.style.opacity = '';
                viewerTitle.style.y = '';
                viewerSubtitle.style.opacity = '';
                viewerSubtitle.style.y = '';
                backBtn.style.opacity = '';
                sliderNav.style.opacity = '';

                gsap.set(allSlides, { clearProps: 'all' });
                gsap.set(sortedOtherCards, { clearProps: 'all' });
                gsap.set(viewer, { clearProps: 'opacity,visibility,y,pointerEvents' });

                if (portfolioState.sliderInstance) {
                    portfolioState.sliderInstance.destroy();
                    portfolioState.sliderInstance = null;
                }
                sliderList.innerHTML = '';

                var stageClose = document.getElementById('portfolioStage');
                stageClose.style.minHeight = '';
                stageClose.style.overflow = '';

                window.scrollTo({ top: portfolioState.savedScrollY, behavior: 'instant' });
            }
        });

        // FASE 1 (0→200ms): Conteúdo desaparece
        tl.to(viewerTitle, { opacity: 0, y: 20, duration: 0.20, ease: 'power2.in' }, 'c');
        tl.to(viewerSubtitle, { opacity: 0, y: 20, duration: 0.20, ease: 'power2.in' }, 'c+=0.04');
        tl.to(backBtn, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 'c+=0.08');
        tl.to(sliderNav, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 'c+=0.12');
        tl.to(allSlides, { opacity: 0, duration: 0.25, ease: 'power2.in', stagger: 0.03 }, 'c+=0.14');

        // FASE 2 (250ms→): VIEWPORT DESCE — viewer desliza para baixo, revelando galeria escurecida
        tl.to(viewer, {
            y: '100%',
            duration: VP_DURATION,
            ease: VP_CURVE
        }, 'c+=0.30');

        // Gallery clareia de volta durante a descida
        tl.to(gallery, {
            opacity: 1,
            duration: VP_DURATION * 0.8,
            ease: VP_CURVE
        }, 'c+=0.32');

        // FASE 3: Cards da galeria voltam com stagger
        tl.to(sortedOtherCards, {
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: VP_CURVE,
            stagger: 0.06
        }, 'c+=' + (VP_DURATION * 0.70));

        // FINAL — viewer some, galeria pronta
        tl.set(viewer, { visibility: 'hidden' }, 'c+=' + (VP_DURATION + 0.20));
        tl.set(gallery, { pointerEvents: 'auto' }, 'c+=' + (VP_DURATION + 0.20));
    }
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
    // ISOLAMENTO no-gsap/minimal — nenhum gsap.fromTo roda; botoes continuam
    // clicaveis normalmente, so sem o efeito visual de ripple.
    if (__gsapDisabled()) return;
    document.querySelectorAll('.hero-button-primary, .form-submit-button').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = this.querySelector('.hero-button-glow, .form-submit-ripple') || this;
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
    // ISOLAMENTO no-gsap/no-scrolltrigger-only/minimal — nenhum gsap.set/
    // ScrollTrigger roda; conteudo forcado visivel direto via style puro.
    // Ver audit/isolamento-query-params.md.
    if (__scrollTriggerDisabled()) {
        document.querySelectorAll(selector).forEach(function (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        return;
    }
    gsap.set(selector, { opacity: 0, y });
    ScrollTrigger.batch(selector, {
        start,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration, stagger, ease, overwrite: true }),
        onLeaveBack: (batch) => gsap.to(batch, { opacity: 0, y, duration, stagger: leaveStagger, ease, overwrite: true }),
    });
}

function initDifferentialsAnimation() {
    batchReveal('.differential-item', { y: 40, duration: 0.6, stagger: 0.1, ease: 'power2.out', start: 'top 85%' });
}

function initServicesReveal() {
    batchReveal('.service-mosaic-item', { y: 40, duration: 0.6, stagger: 0.1, ease: 'power2.out', start: 'top 85%' });
}

function initValuesReveal() {
    // Original disparava todos os .value-item pelo trigger compartilhado
    // '.values-row' (mesmo ponto de disparo para todos). ScrollTrigger.batch()
    // usa cada item como seu proprio trigger — como estao na mesma linha
    // (mesmo grid/flex row), o topo de cada item coincide com o topo da row,
    // entao o ponto de disparo na pratica e o mesmo (diferenca sub-pixel, se
    // houver). Documentado por transparencia, nao e um comportamento novo.
    batchReveal('.value-item', { y: 40, duration: 0.6, stagger: 0.15, ease: 'power2.out', start: 'top 80%' });
}

function initTestimonialsReveal() {
    batchReveal('.testimonial-card', { y: 40, duration: 0.6, stagger: 0.15, ease: 'power2.out', start: 'top 85%' });
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
    // ISOLAMENTO no-carousel-clients/minimal — nao inicializa (sem clonagem
    // de slides, sem rAF de rotacao). O track ja tem largura de fallback via
    // CSS (--slide-w com default), entao sobra como uma linha estatica dos
    // logos originais, sem rotacao automatica. Ver audit/isolamento-query-params.md.
    if (__ISOLATE['no-carousel-clients']) return;

    const track = document.getElementById('clientsTrack');
    if (!track) return;

    const originalSlides = Array.from(track.querySelectorAll('.clients-carousel-slide'));
    if (originalSlides.length < 2) return;

    let slideWidth = originalSlides[0].offsetWidth;
    const totalOriginal = originalSlides.length;
    const setWidth = totalOriginal * slideWidth;

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
    let baseSpeed = 2.8;               // px per frame, rightward (left-to-right) — positive = → → →
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
        if (!isDragging) {
            // Velocity drifts toward current baseSpeed (directional memory)
            velocity += (baseSpeed - velocity) * RETURN_SPRING;
            velocity *= FRICTION;

            // Snap to baseSpeed if very close
            if (Math.abs(velocity - baseSpeed) < 0.005) {
                velocity = baseSpeed;
            }
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

    // Resize
    const resizeObserver = new ResizeObserver(() => {
        slideWidth = originalSlides[0].offsetWidth;
    });
    resizeObserver.observe(track);

    // Pausa o loop de rAF quando o carrossel sai da viewport — este carrossel
    // fica no fim da página e, sem isso, o loop rodava para sempre desde o
    // load, mesmo com o usuário lendo o hero no topo.
    if ('IntersectionObserver' in window) {
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) start();
                else stop();
            });
        }, { threshold: 0 });
        visibilityObserver.observe(track);
    } else {
        start();
    }
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
    const selector = '.differential-item, .service-mosaic-item, .value-item, .testimonial-card, .process-step';
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
        } else if (__gsapDisabled()) {
            // ISOLAMENTO no-gsap/minimal — mesmo resultado visual sem chamar gsap.
            el.style.opacity = '1';
            el.style.transform = 'none';
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
    // ISOLAMENTO no-geometries — remove a grade de fundo, as formas SVG e as
    // luzes com blur do hero ANTES de qualquer init rodar, mantendo intacta a
    // timeline de entrada GSAP do texto/badge/subtitulo/botoes. Diferente de
    // no-gsap (que desliga a timeline inteira), este isolamento testa
    // especificamente se essas camadas — que animam via CSS puro
    // (@keyframes floatShape, independente do GSAP) e usam filter: blur(100px)
    // nos light-spots — sao a fonte do travamento, mesmo com a timeline do
    // hero rodando normalmente. Ver audit/isolamento-query-params.md.
    if (__ISOLATE['no-geometries']) {
        document.querySelectorAll('#heroGrid, #heroGeometries, #heroLighting').forEach(function (el) {
            el.remove();
        });
    }

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
    __perfCheckpoint('initNavigation-start');
    initNavigation();
    __perfCheckpoint('initNavigation-end');
    __perfCheckpoint('initButtonRipple-start');
    initButtonRipple(); // inclui o botao do hero — precisa estar pronto pra clique imediato
    __perfCheckpoint('initButtonRipple-end');
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
            initValuesReveal,
            initTestimonialsReveal,
            initServiceGridAdjust,
            initPortfolioGallery,
            initClientsCarousel,
        ]);

        // Grupo B — decorativo ou sem urgencia de estar pronto ao rolar
        // (particulas do hero, handlers de clique/hover/form, o carrossel
        // cascata do portfolio que nunca tem slides no load, e o fallback de
        // seguranca que so importa como rede depois que o Grupo A ja rodou).
        // Mantido no scheduling individual encadeado original.
        runQueueWhenIdle([
            createParticles,
            initSegmentsTabs,
            initServicesInteraction,
            initContactForm,
            initCustomSelect,
            initCascadingSlider,
            initScrollRevealFallback,
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
    // ISOLAMENTO no-gsap/no-scrolltrigger-only/minimal — nenhum dos listeners
    // abaixo e registrado, entao ScrollTrigger.refresh()/config() nunca e
    // chamado. Ver audit/isolamento-query-params.md.
    if (!__scrollTriggerDisabled()) {
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
