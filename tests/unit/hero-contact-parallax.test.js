/**
 * @jest-environment jsdom
 *
 * Unit Tests — Hero contact card scroll parallax (initHeroContactCardParallax)
 *
 * Regression guard: o antigo scrollTrigger (GSAP ScrollTrigger, scrub:true)
 * foi substituido por um listener direto no evento 'scroll' do Lenis, que
 * calcula o progresso via getBoundingClientRect() do hero e aplica
 * translateY(progress * amplitude%) no wrapper. Este teste garante que:
 *  - progress 0 (topo do hero no topo da viewport) -> transform 0%
 *  - progress 1 (base do hero no topo da viewport) -> transform amplitude%
 *  - amplitude varia por breakpoint (-70% desktop, -30% mobile <768px)
 *  - prefers-reduced-motion continua desativando o efeito por completo
 *    (nenhum listener de scroll chega a ser registrado no Lenis)
 *
 * Run: npm run test:unit
 */

'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

function freshDom() {
    document.body.innerHTML = html;
}

let capturedScrollHandler;

function mockLenis() {
    capturedScrollHandler = null;
    global.Lenis = class Lenis {
        on(event, cb) {
            if (event === 'scroll') capturedScrollHandler = cb;
        }
        raf() {}
        scrollTo() {}
        stop() {}
        start() {}
    };
}

function polyfills({ reducedMotion = false } = {}) {
    global.gsap = {
        ticker: { add: jest.fn(), lagSmoothing: jest.fn() },
        killTweensOf: jest.fn(),
        to: jest.fn(),
        set: jest.fn(),
        from: jest.fn(),
        fromTo: jest.fn(),
        delayedCall: jest.fn(),
        timeline: jest.fn(() => ({ to: jest.fn().mockReturnThis() })),
        utils: { toArray: jest.fn(() => []) },
    };
    Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 0 });
    global.ResizeObserver = class ResizeObserver {
        constructor(cb) { this.cb = cb; }
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    global.IntersectionObserver = class IntersectionObserver {
        constructor(cb) { this.cb = cb; }
        observe(target) { this.cb([{ isIntersecting: true, target }]); }
        unobserve() {}
        disconnect() {}
    };
    window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: reducedMotion && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }));
}

describe('initHeroContactCardParallax — progresso via Lenis (sem ScrollTrigger)', () => {
    beforeEach(() => {
        jest.resetModules();
        freshDom();
        mockLenis();
    });

    test.each([
        ['desktop (>=768px)', 1440, -70],
        ['mobile (<768px)', 375, -30],
    ])('%s: progress 0 -> transform 0%%, progress 1 -> transform amplitude%%', (_label, width, amplitude) => {
        polyfills();
        Object.defineProperty(window, 'innerWidth', { writable: true, value: width });
        Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });

        require('../../script.js');

        const wrapper = document.querySelector('.hero-contact-card-parallax');
        const hero = document.querySelector('.hero-architectural-scene');
        expect(typeof capturedScrollHandler).toBe('function');

        const scrollableHeight = 2400; // hero.height - innerHeight
        const heroHeight = scrollableHeight + window.innerHeight;

        // progress 0: topo do hero no topo da viewport (rect.top = 0)
        hero.getBoundingClientRect = jest.fn(() => ({ top: 0, height: heroHeight }));
        capturedScrollHandler();
        expect(wrapper.style.transform).toBe('translateY(0%)');

        // progress 1: base do hero no topo da viewport (rect.top = -scrollableHeight)
        hero.getBoundingClientRect = jest.fn(() => ({ top: -scrollableHeight, height: heroHeight }));
        capturedScrollHandler();
        expect(wrapper.style.transform).toBe(`translateY(${amplitude}%)`);
    });

    test('prefers-reduced-motion desativa o efeito: nenhum listener de scroll e registrado no Lenis', () => {
        polyfills({ reducedMotion: true });
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 1440 });
        Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });

        require('../../script.js');

        expect(capturedScrollHandler).toBeNull();
    });
});
