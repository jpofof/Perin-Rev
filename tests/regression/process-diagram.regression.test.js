/**
 * @jest-environment jsdom
 *
 * Regression Tests — initProcessDiagram (cluster de circulos + accordion)
 *
 * Regression guard:
 *  clique no item do accordion (nao so no circulo) deve ativar o circulo
 *  correspondente no cluster, em qualquer largura de tela (sem distincao de
 *  breakpoint/hover); apenas um step fica ativo por vez, mesmo com troca
 *  rapida entre eles; e hover isolado (sem clique) nao deve ativar nada.
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
  global.IntersectionObserver = class IntersectionObserver {
    constructor(cb) { this.cb = cb; }
    observe(target) { this.cb([{ isIntersecting: true, target }]); }
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
      // Resolve imediatamente, sem esperar o fallback de 3.5s.
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

function activeSteps() {
  const circles = Array.from(document.querySelectorAll('.process-circle'))
    .filter((c) => c.classList.contains('is-active'))
    .map((c) => c.dataset.stepIndex);
  const items = Array.from(document.querySelectorAll('.process-accordion-item'))
    .filter((i) => i.classList.contains('is-active'))
    .map((i) => i.dataset.stepIndex);
  return { circles, items };
}

describe('initProcessDiagram — cluster de circulos + accordion sincronizados', () => {
  beforeEach(() => {
    jest.resetModules();
    freshDom();
    polyfills();
  });

  test('step 0 ("/01") ja comeca ativo ao carregar', () => {
    loadScript();
    const { circles, items } = activeSteps();
    expect(circles).toEqual(['0']);
    expect(items).toEqual(['0']);
  });

  test('clique no item do accordion ativa o circulo correspondente e apenas um por vez', () => {
    loadScript();

    const head = document.querySelectorAll('.process-accordion-head')[2];
    head.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    const { circles, items } = activeSteps();
    expect(circles).toEqual(['2']);
    expect(items).toEqual(['2']);
  });

  test('clique no circulo ativa o item de accordion correspondente', () => {
    loadScript();

    const circle = document.querySelectorAll('.process-circle')[3];
    circle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    const { circles, items } = activeSteps();
    expect(circles).toEqual(['3']);
    expect(items).toEqual(['3']);
  });

  test('troca rapida entre itens via clique (01 -> 04 sem pausa) nao deixa mais de um step ativo', () => {
    loadScript();

    const heads = Array.from(document.querySelectorAll('.process-accordion-head'));
    heads.forEach((head) => head.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));

    const { circles, items } = activeSteps();
    expect(circles).toEqual(['3']);
    expect(items).toEqual(['3']);
  });

  test('hover isolado (sem clique) nao ativa nenhum step, em qualquer largura de tela', () => {
    loadScript();

    const diagramCol = document.querySelector('.process-diagram-col');
    diagramCol.style.display = 'none';

    const head = document.querySelectorAll('.process-accordion-head')[1];
    head.dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: true }));
    expect(activeSteps().items).toEqual(['0']); // hover ignorado, step 0 continua ativo

    head.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(activeSteps().items).toEqual(['1']); // clique ativa, independente da largura
  });
});

describe('#process — secao e uma excecao clara intencional (replica o video de referencia)', () => {
  test('nenhuma regra CSS define background-color de #process (alternancia claro/cinza)', () => {
    expect(css).not.toMatch(/#process\s*\{\s*background-color/);
  });

  test('.process-journey-section define fundo claro proprio (excecao ao tema escuro do site)', () => {
    const sectionMatch = css.match(/\.process-journey-section\s*\{([^}]*)\}/);
    expect(sectionMatch).not.toBeNull();
    expect(sectionMatch[1]).toMatch(/background:\s*var\(--color-bg-secondary\)/);
    expect(sectionMatch[1]).not.toMatch(/var\(--cor-preto-puro\)/);
  });

  test('titulo, subtitulo e eyebrow da secao usam texto escuro (fundo agora e claro)', () => {
    const titleMatch = css.match(/\.process-main-title\s*\{([^}]*)\}/);
    expect(titleMatch[1]).toMatch(/color:\s*var\(--color-text-primary\)/);

    const subtitleMatch = css.match(/\.process-subtitle\s*\{([^}]*)\}/);
    expect(subtitleMatch[1]).toMatch(/color:\s*var\(--color-text-secondary\)/);

    const eyebrowMatch = css.match(/\.process-diagram-eyebrow\s*\{([^}]*)\}/);
    expect(eyebrowMatch[1]).toMatch(/color:\s*var\(--color-text-secondary\)/);
  });

  test('labels "ETAPA 0X" e titulo/descricao do accordion usam texto escuro/verde de contraste adequado', () => {
    const labelMatch = css.match(/\.process-accordion-label\s*\{([^}]*)\}/);
    expect(labelMatch[1]).toMatch(/color:\s*var\(--color-accent-primary\)/);
    expect(labelMatch[1]).not.toMatch(/var\(--color-accent-glow\)/);

    const titleMatch = css.match(/\.process-accordion-title\s*\{([^}]*)\}/);
    expect(titleMatch[1]).toMatch(/color:\s*var\(--color-text-primary\)/);

    const descMatch = css.match(/\.process-accordion-body-inner p\s*\{([^}]*)\}/);
    expect(descMatch[1]).toMatch(/color:\s*var\(--color-text-secondary\)/);
  });
});

describe('.process-circle.is-active — estado ativo indicado com fundo claro de alto contraste', () => {
  test('circulo ativo tem fundo branco puro, distinto do fundo (agora tambem claro) da secao', () => {
    const match = css.match(/\.process-circle\.is-active\s*\{([^}]*)\}/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/background:\s*var\(--color-bg-card\)/);
    expect(match[1]).not.toMatch(/var\(--cor-preto-puro\)/);
  });

  test('circulo ativo usa borda de acento verde mais grossa que os inativos', () => {
    const match = css.match(/\.process-circle\.is-active\s*\{([^}]*)\}/);
    expect(match[1]).toMatch(/border-color:\s*var\(--cor-verde-floresta\)/);
    expect(match[1]).toMatch(/border-width:\s*2px/);
  });

  test('circulo ativo tem glow sutil (box-shadow verde), calibrado para fundo claro', () => {
    const match = css.match(/\.process-circle\.is-active\s*\{([^}]*)\}/);
    expect(match[1]).toMatch(/box-shadow:\s*0 0 20px rgba\(42, 135, 62, 0\.18\)/);
  });

  test('titulo do circulo ativo usa texto escuro (fundo agora e claro)', () => {
    const match = css.match(/\.process-circle-title\s*\{([^}]*)\}/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/color:\s*var\(--color-text-primary\)/);
  });

  test('circulo inativo tem borda escura sutil (visivel sobre fundo agora claro)', () => {
    const match = css.match(/\.process-circle\s*\{([^}]*)\}/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/border:\s*1px solid rgba\(26, 26, 26, 0\.15\)/);
  });
});
