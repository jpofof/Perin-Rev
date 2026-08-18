/**
 * @jest-environment jsdom
 *
 * Regression Tests — native scroll reveal (IntersectionObserver + CSS)
 *
 * Regression guard: substitui ~26-27 instancias de ScrollTrigger/batchReveal
 * por IntersectionObserver nativo em 3 das 6 categorias com efeito visual
 * real (.process-circle-cluster/.process-accordion-item, .differential-item,
 * .service-mosaic-item). .section-title-reveal/.text-reveal e .process-step
 * ja nao tinham efeito visual algum (ver README) e foram removidos sem
 * substituto. Este arquivo garante: (1) ScrollTrigger.batch nunca mais e
 * chamado, (2) as 3 categorias revelam via .is-revealed em scroll rapido
 * (batch) e lento (item a item), (3) o comportamento assimetrico
 * onEnter/onLeaveBack do GSAP original e preservado (sai ao rolar pra cima
 * e sair por baixo; NAO some ao rolar pra baixo e sair por cima).
 *
 * Run: npm run test:regression
 */

'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', '..', 'styles.css'), 'utf8');

function freshDom() {
  document.body.innerHTML = html;
}

function flush() {
  for (let i = 0; i < 30; i++) {
    jest.advanceTimersByTime(20);
    jest.runOnlyPendingTimers();
  }
}

class FakeIntersectionObserver {
  constructor(cb) {
    this.cb = cb;
    this.observed = [];
    FakeIntersectionObserver.instances.push(this);
  }
  observe(target) {
    this.observed.push(target);
  }
  unobserve(target) {
    this.observed = this.observed.filter((t) => t !== target);
  }
  disconnect() {
    this.observed = [];
  }
}
FakeIntersectionObserver.instances = [];

function observerFor(el) {
  return FakeIntersectionObserver.instances.find((o) => o.observed.includes(el));
}

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
  global.ResizeObserver = class ResizeObserver {
    constructor(cb) { this.cb = cb; }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  FakeIntersectionObserver.instances = [];
  global.IntersectionObserver = FakeIntersectionObserver;
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

function loadScript() {
  jest.useFakeTimers();
  require('../../script.js');
  flush();
  jest.useRealTimers();
}

describe('Scroll reveal nativo — substitui ScrollTrigger/batchReveal', () => {
  beforeEach(() => {
    jest.resetModules();
    freshDom();
    polyfills();
  });

  test('ScrollTrigger.batch nunca e chamado (as ~26-27 instancias antigas foram removidas)', () => {
    loadScript();
    expect(global.ScrollTrigger.batch).not.toHaveBeenCalled();
  });

  test('as 3 categorias com efeito visual real comecam sem is-revealed e cada elemento tem seu proprio IntersectionObserver', () => {
    loadScript();
    ['.process-circle-cluster', '.process-accordion-item', '.differential-item', '.service-mosaic-item'].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        expect(el.classList.contains('is-revealed')).toBe(false);
        expect(observerFor(el)).toBeDefined();
      });
    });
  });

  test('scroll rapido: varios itens entrando no mesmo tick recebem is-revealed com transition-delay escalonado (stagger)', () => {
    loadScript();
    const items = Array.from(document.querySelectorAll('.differential-item'));
    expect(items.length).toBeGreaterThanOrEqual(2);
    const observer = observerFor(items[0]);

    observer.cb(items.map((target) => ({ isIntersecting: true, target })));

    items.forEach((el, i) => {
      expect(el.classList.contains('is-revealed')).toBe(true);
      expect(el.style.transitionDelay).toBe(`${i * 0.1}s`);
    });
  });

  test('scroll lento: um item por vez tambem revela corretamente, sem depender de lote', () => {
    loadScript();
    const items = Array.from(document.querySelectorAll('.service-mosaic-item'));
    const observer = observerFor(items[0]);

    items.forEach((target) => {
      observer.cb([{ isIntersecting: true, target }]);
    });

    items.forEach((el) => expect(el.classList.contains('is-revealed')).toBe(true));
  });

  test('saida por BAIXO ao rolar pra cima (onLeaveBack) remove is-revealed', () => {
    loadScript();
    const el = document.querySelector('.differential-item');
    const observer = observerFor(el);

    observer.cb([{ isIntersecting: true, target: el }]);
    expect(el.classList.contains('is-revealed')).toBe(true);

    observer.cb([{
      isIntersecting: false,
      target: el,
      boundingClientRect: { top: 700 },
      rootBounds: { top: 0, bottom: 690 },
    }]);
    expect(el.classList.contains('is-revealed')).toBe(false);
  });

  test('saida por CIMA ao rolar pra baixo (onLeave, nao vinculado no GSAP original) NAO remove is-revealed', () => {
    loadScript();
    const el = document.querySelector('.service-mosaic-item');
    const observer = observerFor(el);

    observer.cb([{ isIntersecting: true, target: el }]);
    expect(el.classList.contains('is-revealed')).toBe(true);

    observer.cb([{
      isIntersecting: false,
      target: el,
      boundingClientRect: { top: -50, bottom: -10 },
      rootBounds: { top: 0, bottom: 690 },
    }]);
    expect(el.classList.contains('is-revealed')).toBe(true);
  });

  test('.section-title-reveal e .text-reveal permanecem visiveis sem nenhum observer/ScrollTrigger (no-op preservado)', () => {
    loadScript();
    document.querySelectorAll('.section-title-reveal, .text-reveal').forEach((el) => {
      expect(observerFor(el)).toBeUndefined();
      expect(el.classList.contains('is-revealed')).toBe(false);
    });
  });
});

describe('CSS — transicao nativa replica duration/ease do GSAP original (power2.out ~= cubic-bezier(0.215, 0.61, 0.355, 1))', () => {
  test('.differential-item e .service-mosaic-item: estado oculto usa opacity:0 e translate:0 40px (y original)', () => {
    const match = css.match(/\.differential-item:not\(\.is-revealed\),\s*\n\.service-mosaic-item:not\(\.is-revealed\)\s*\{([^}]*)\}/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/opacity:\s*0/);
    expect(match[1]).toMatch(/translate:\s*0\s*40px/);
  });

  test('.process-circle-cluster e .process-accordion-item: estado oculto usa translate:0 30px (y original)', () => {
    const match = css.match(/\.process-circle-cluster:not\(\.is-revealed\),\s*\n\.process-accordion-item:not\(\.is-revealed\)\s*\{([^}]*)\}/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/translate:\s*0\s*30px/);
  });

  test('todas as 4 classes com efeito visual real declaram transition de opacity/translate com o cubic-bezier de power2.out', () => {
    ['.differential-item', '.service-mosaic-item', '.process-circle-cluster', '.process-accordion-item'].forEach((sel) => {
      const escaped = sel.replace('.', '\\.');
      const re = new RegExp(escaped + '\\s*\\{([^}]*)\\}');
      const match = css.match(re);
      expect(match).not.toBeNull();
      expect(match[1]).toMatch(/opacity 0\.6s cubic-bezier\(0\.215, 0\.61, 0\.355, 1\)/);
      expect(match[1]).toMatch(/translate 0\.6s cubic-bezier\(0\.215, 0\.61, 0\.355, 1\)/);
    });
  });
});
