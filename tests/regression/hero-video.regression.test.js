/**
 * @jest-environment jsdom
 *
 * Regression Tests — initHeroVideoBackground (retry de reproducao do video do hero)
 *
 * Regression guard:
 *  o video do hero as vezes ficava parado no poster indefinidamente quando o
 *  evento canplaythrough nao disparava (fetch travado/lento). A correcao
 *  cobre 3 caminhos: (1) canplaythrough dispara normalmente, (2) fallback por
 *  timeout quando canplaythrough nunca dispara, e (3) retry via
 *  IntersectionObserver quando o hero reentra na viewport com o clipe atual
 *  pausado (ex.: fetch travou antes do canplaythrough/fallback rodar).
 *
 * Run: npm run test:regression
 */

'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

const CANPLAYTHROUGH_FALLBACK_MS = 6000;

function freshDom() {
    document.body.innerHTML = html;
}

function flush() {
    for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(20);
        jest.runOnlyPendingTimers();
    }
}

let intersectionObserverInstances;

function polyfills() {
    global.ScrollTrigger = { refresh: jest.fn(), config: jest.fn(), batch: jest.fn(), create: jest.fn(), update: jest.fn() };
    global.Lenis = class Lenis {
        on() {}
        raf() {}
        scrollTo() {}
        stop() {}
        start() {}
    };
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 900 });
    Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 0 });
    window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }));
    global.ResizeObserver = class ResizeObserver {
        constructor(cb) { this.cb = cb; }
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    intersectionObserverInstances = [];
    global.IntersectionObserver = class IntersectionObserver {
        constructor(cb) {
            this.cb = cb;
            this.target = null;
            intersectionObserverInstances.push(this);
        }
        observe(target) { this.target = target; }
        unobserve() {}
        disconnect() {}
    };
    global.gsap = {
        ticker: { add: jest.fn(), lagSmoothing: jest.fn() },
        killTweensOf: jest.fn(),
        to: jest.fn(),
        set: jest.fn(),
        from: jest.fn(),
        fromTo: jest.fn(),
        delayedCall: jest.fn(),
        timeline: jest.fn((cfg) => {
            if (cfg && typeof cfg.onComplete === 'function') cfg.onComplete();
            return { to: jest.fn().mockReturnThis() };
        }),
        utils: { toArray: jest.fn(() => []) },
    };
}

function setReadyState(video, value) {
    Object.defineProperty(video, 'readyState', { configurable: true, value });
}

function loadScript() {
    jest.useFakeTimers();
    require('../../script.js');
}

describe('initHeroVideoBackground — retry de reproducao do video do hero', () => {
    let playSpy;
    let loadSpy;

    beforeEach(() => {
        jest.resetModules();
        freshDom();
        polyfills();
        playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockReturnValue(undefined);
        loadSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test('cenario 1: canplaythrough dispara normalmente e toca o forward uma unica vez', () => {
        loadScript();
        const forward = document.getElementById('heroVideoForward');
        setReadyState(forward, 2);

        forward.dispatchEvent(new Event('canplaythrough'));

        expect(forward.classList.contains('is-visible')).toBe(true);
        expect(playSpy).toHaveBeenCalledTimes(1);

        // Fallback nao deve tocar de novo apos o canplaythrough ja ter revelado o video.
        jest.advanceTimersByTime(CANPLAYTHROUGH_FALLBACK_MS);
        expect(playSpy).toHaveBeenCalledTimes(1);
    });

    test('cenario 2: fallback por timeout toca o forward quando canplaythrough nunca dispara', () => {
        loadScript();
        const forward = document.getElementById('heroVideoForward');
        setReadyState(forward, 0);

        expect(playSpy).not.toHaveBeenCalled();

        jest.advanceTimersByTime(CANPLAYTHROUGH_FALLBACK_MS);

        expect(forward.classList.contains('is-visible')).toBe(true);
        expect(playSpy).toHaveBeenCalledTimes(1);
    });

    test('cenario 3: retry via IntersectionObserver quando o hero reentra na viewport com o clipe pausado', () => {
        loadScript();
        const forward = document.getElementById('heroVideoForward');
        setReadyState(forward, 0);

        // Simula fetch travado: nem canplaythrough nem o fallback tocaram ainda.
        Object.defineProperty(forward, 'paused', { configurable: true, value: true });
        Object.defineProperty(forward, 'ended', { configurable: true, value: false });

        const heroSection = document.querySelector('.hero-architectural-scene');
        const observer = intersectionObserverInstances.find((o) => o.target === heroSection);
        expect(observer).toBeDefined();

        // load() ja foi chamado uma vez no branch desktop, antes de qualquer retry.
        const loadCallsBeforeRetry = loadSpy.mock.calls.length;

        // Hero sai da viewport, depois reentra — dispara o retry.
        observer.cb([{ isIntersecting: false, target: heroSection }]);
        observer.cb([{ isIntersecting: true, target: heroSection }]);

        // readyState < 2 -> recarrega antes de tentar tocar de novo.
        expect(loadSpy).toHaveBeenCalledTimes(loadCallsBeforeRetry + 1);
        expect(forward.classList.contains('is-visible')).toBe(true);
        expect(playSpy).toHaveBeenCalledTimes(1);
    });
});
