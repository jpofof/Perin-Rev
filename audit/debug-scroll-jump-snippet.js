/**
 * DIAGNÓSTICO TEMPORÁRIO — salto de scroll para trás (FASE 1)
 *
 * Não faz parte de script.js/script.min.js — não é código de produção.
 * Cola isso no console do Safari Web Inspector remoto (Mac conectado ao
 * iPhone por cabo, Safari → Develop → [seu iPhone] → aba do site) DEPOIS que
 * a página já carregou, ou injeta via um <script> temporário antes de
 * </body> se preferir rodar sem o Mac conectado (aí o log fica em
 * localStorage para exportar depois — ver instruções no final).
 *
 * O que faz: monitora window.scrollY, innerHeight (pega a barra de endereço
 * do Safari escondendo/aparecendo) e a altura do documento a cada 20ms,
 * durante os primeiros 8s. Se detectar uma queda de scrollY > 30px entre
 * duas amostras (o "salto para trás"), imprime um snapshot completo do que
 * mudou bem antes disso — incluindo qual ScrollTrigger.refresh() rodou por
 * último, se algum listener de resize disparou, etc.
 */
(function () {
    'use strict';
    var log = [];
    var lastY = window.scrollY;
    var lastInnerH = window.innerHeight;
    var lastDocH = document.documentElement.scrollHeight;
    var startedAt = performance.now();

    // Intercepta ScrollTrigger.refresh() para saber exatamente quando cada
    // refresh roda em relação ao salto (sem alterar o comportamento, só loga).
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function' && !window.ScrollTrigger.__wrappedForDebug) {
        var origRefresh = window.ScrollTrigger.refresh;
        window.ScrollTrigger.refresh = function () {
            var t = (performance.now() - startedAt).toFixed(0);
            var entry = { t: Number(t), event: 'ScrollTrigger.refresh() chamado', scrollY: window.scrollY, innerHeight: window.innerHeight, docHeight: document.documentElement.scrollHeight };
            log.push(entry);
            console.log('[DEBUG-SCROLL] refresh em t=' + t + 'ms', entry);
            return origRefresh.apply(this, arguments);
        };
        window.ScrollTrigger.__wrappedForDebug = true;
    }

    window.addEventListener('resize', function () {
        var t = (performance.now() - startedAt).toFixed(0);
        console.log('[DEBUG-SCROLL] evento resize em t=' + t + 'ms, innerHeight agora=' + window.innerHeight);
    }, { passive: true });

    var poll = setInterval(function () {
        var y = window.scrollY;
        var innerH = window.innerHeight;
        var docH = document.documentElement.scrollHeight;
        var t = performance.now() - startedAt;

        var entry = { t: Math.round(t), scrollY: y, innerHeight: innerH, docHeight: docH };
        log.push(entry);

        var yDrop = lastY - y;
        var innerHChanged = Math.abs(innerH - lastInnerH) > 2;
        var docHChanged = Math.abs(docH - lastDocH) > 5;

        if (yDrop > 30) {
            console.error('[DEBUG-SCROLL] *** SALTO DETECTADO *** scrollY caiu de ' + lastY.toFixed(0) + ' para ' + y.toFixed(0) + ' (delta ' + yDrop.toFixed(0) + 'px) em t=' + t.toFixed(0) + 'ms');
            console.error('[DEBUG-SCROLL] innerHeight no momento: ' + innerH + ' (era ' + lastInnerH + ')');
            console.error('[DEBUG-SCROLL] docHeight no momento: ' + docH + ' (era ' + lastDocH + ')');
            console.error('[DEBUG-SCROLL] últimas 20 amostras antes do salto:', log.slice(-21, -1));
            try {
                localStorage.setItem('__scrollJumpDebug_' + Date.now(), JSON.stringify({ jumpAt: t, from: lastY, to: y, innerH: innerH, lastInnerH: lastInnerH, docH: docH, lastDocH: lastDocH, recentLog: log.slice(-40) }));
                console.error('[DEBUG-SCROLL] Salvo em localStorage. Para exportar: copie a saída de Object.keys(localStorage).filter(k=>k.startsWith("__scrollJumpDebug_"))');
            } catch (e) { /* localStorage pode estar cheio/indisponível, log no console já é suficiente */ }
        }
        if (innerHChanged) {
            console.log('[DEBUG-SCROLL] innerHeight mudou de ' + lastInnerH + ' para ' + innerH + ' em t=' + t.toFixed(0) + 'ms (barra de endereço do Safari escondendo/aparecendo, provavelmente)');
        }
        if (docHChanged) {
            console.log('[DEBUG-SCROLL] docHeight mudou de ' + lastDocH.toFixed(0) + ' para ' + docH.toFixed(0) + ' em t=' + t.toFixed(0) + 'ms');
        }

        lastY = y;
        lastInnerH = innerH;
        lastDocH = docH;
    }, 20);

    setTimeout(function () {
        clearInterval(poll);
        window.__scrollDebugLog = log;
        console.log('[DEBUG-SCROLL] Captura encerrada (8s). Log completo em window.__scrollDebugLog (' + log.length + ' amostras). Copie via: copy(JSON.stringify(window.__scrollDebugLog))');
    }, 8000);

    console.log('[DEBUG-SCROLL] Instrumentação ativa por 8s. Role a página normalmente agora.');
})();
