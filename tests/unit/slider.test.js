/**
 * @jest-environment jsdom
 *
 * Unit Tests — Cascading Slider Portfolio (v4 — Gallery + Viewer, Modus)
 *
 * Validate logic in isolation: DOM structure (dynamic slides), CSS rules,
 * accessibility, image assets.
 *
 * Run: npm run test:unit
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ────────────────────────────────────
// Load HTML fixture into jsdom
// ────────────────────────────────────
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
document.body.innerHTML = html;

// Load GSAP mock (avoids CDN dependency)
global.gsap = {
  killTweensOf: jest.fn(),
  to: jest.fn(),
  set: jest.fn(),
  from: jest.fn(),
  fromTo: jest.fn(),
  delayedCall: jest.fn(),
  timeline: jest.fn(() => ({ to: jest.fn().mockReturnThis() })),
  utils: { toArray: jest.fn(() => []) },
};

// Inject window helpers
global.ScrollTrigger = { refresh: jest.fn(), config: jest.fn(), batch: jest.fn(), create: jest.fn() };
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1440 });
Object.defineProperty(window, 'innerHeight', { writable: true, value: 900 });
Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 0 });

// Polyfill ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Load the script (it will execute initPage immediately). Non-critical inits
// (gallery, below-the-fold ScrollTrigger) run via requestIdleCallback,
// which jsdom doesn't implement — runWhenIdle() falls back to setTimeout(fn, 0).
// Fake timers flush that synchronously so the rest of this file can assert on
// the fully-initialized DOM, matching what happens for real in a browser a tick
// later.
// runOnlyPendingTimers (nao runAllTimers) em loop bem limitado: as inicializacoes
// nao-criticas rodam encadeadas, uma por requestIdleCallback (setTimeout(fn,0) no
// fallback do jsdom, que nao tem requestIdleCallback) — precisa de varias rodadas
// pra atravessar a cadeia toda. runAllTimers() nao serve aqui: o clients carousel
// tem um loop de requestAnimationFrame que se reagenda indefinidamente e abortaria
// com "infinite loop". O loop abaixo e bounded (nao "ate esvaziar"), entao nao
// persegue esse RAF para sempre.
jest.useFakeTimers();
require('../../script.js');
for (let i = 0; i < 20; i++) jest.runOnlyPendingTimers();
jest.useRealTimers();

// ────────────────────────────────────
// DOM Structure (v4: dynamic gallery + cascading slider)
// ────────────────────────────────────
describe('DOM Structure', () => {
  test('fotoSliderTrilha (viewport) exists in DOM', () => {
    const trilha = document.getElementById('fotoSliderTrilha');
    expect(trilha).not.toBeNull();
  });

  test('cascading slider wrapper exists with data-cascading-slider-wrap', () => {
    expect(document.querySelector('[data-cascading-slider-wrap]')).not.toBeNull();
  });

  test('viewport has data-cascading-viewport attribute', () => {
    const trilha = document.getElementById('fotoSliderTrilha');
    expect(trilha.hasAttribute('data-cascading-viewport')).toBe(true);
  });

  test('portfolio gallery grid exists', () => {
    const grid = document.getElementById('portfolioGrid');
    expect(grid).not.toBeNull();
  });

  test('portfolio gallery exists', () => {
    const gallery = document.getElementById('portfolioGallery');
    expect(gallery).not.toBeNull();
  });

  test('portfolio viewer exists', () => {
    const viewer = document.getElementById('portfolioViewer');
    expect(viewer).not.toBeNull();
  });

  test('gallery cards are rendered dynamically (6 projects)', () => {
    const cards = document.querySelectorAll('.portfolio-card');
    expect(cards.length).toBe(6);
  });

  test('each gallery card has an image and project name', () => {
    const cards = document.querySelectorAll('.portfolio-card');
    cards.forEach(card => {
      expect(card.querySelector('img')).not.toBeNull();
      expect(card.querySelector('.portfolio-card-name')).not.toBeNull();
    });
  });

  test('navigation buttons exist', () => {
    const prev = document.querySelector('[data-cascading-slider-prev]');
    const next = document.querySelector('[data-cascading-slider-next]');
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
  });

  test('nav buttons have aria-labels', () => {
    const prev = document.querySelector('[data-cascading-slider-prev]');
    const next = document.querySelector('[data-cascading-slider-next]');
    expect(prev.getAttribute('aria-label')).toBeTruthy();
    expect(next.getAttribute('aria-label')).toBeTruthy();
  });

  test('cascading-slider__nav exists', () => {
    expect(document.querySelector('.cascading-slider__nav')).not.toBeNull();
  });

  test('back-to-gallery button exists', () => {
    const backBtn = document.getElementById('portfolioBackBtn');
    expect(backBtn).not.toBeNull();
    expect(backBtn.getAttribute('aria-label')).toBeTruthy();
  });
});

// ────────────────────────────────────
// CSS Rules
// ────────────────────────────────────
describe('CSS Rules', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', '..', 'styles.css'), 'utf8');

  test('cascading-slider__img has object-fit cover', () => {
    expect(css).toMatch(/\.cascading-slider__img\s*\{[^}]*object-fit:\s*cover/);
  });

  test('cascading-slider__img width/height are 100%', () => {
    const imgRule = css.match(/\.cascading-slider__img\s*\{([^}]+)\}/);
    expect(imgRule).not.toBeNull();
    expect(imgRule[1]).toMatch(/width:\s*100%/);
    expect(imgRule[1]).toMatch(/height:\s*100%/);
  });

  test('cascading-slider__item uses clip-path driven by --clip variable', () => {
    expect(css).toMatch(/\.cascading-slider__item\s*\{[^}]*clip-path:\s*inset\(0px calc\(var\(--clip\)/);
  });

  test('cascading-slider__item is absolutely positioned (JS-driven transform)', () => {
    const rule = css.match(/\.cascading-slider__item\s*\{([^}]+)\}/);
    expect(rule).not.toBeNull();
    expect(rule[1]).toMatch(/position:\s*absolute/);
  });

  test('no :hover pseudo-class on slider buttons (uses hover-active class)', () => {
    const btnSection = css.slice(css.indexOf('.cascading-slider__button'));
    const hoverPseudo = btnSection.match(/\.cascading-slider__button:hover/);
    expect(hoverPseudo).toBeNull();
  });

  test('hover-active class exists as replacement for :hover', () => {
    expect(css).toMatch(/\.cascading-slider__button\.hover-active/);
  });

  test('cascading-slider__list has overflow hidden (viewport clips slides)', () => {
    expect(css).toMatch(/\.cascading-slider__list\s*\{[^}]*overflow:\s*hidden/);
  });

  test('cascading-slider__item-inner has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slider__item-inner\s*\{[^}]*overflow:\s*hidden/);
  });

  test('portfolio-card uses aspect-ratio 16/10', () => {
    expect(css).toMatch(/\.portfolio-card\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*10/);
  });

  test('portfolio-gallery-grid uses 3 columns on desktop', () => {
    expect(css).toMatch(/\.portfolio-gallery-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
  });

  test('portfolio-viewer-back exists with styling', () => {
    expect(css).toMatch(/\.portfolio-viewer-back\s*\{/);
  });
});

// ────────────────────────────────────
// Responsive breakpoints (JS-driven, not CSS media queries)
// ────────────────────────────────────
describe('Responsive Breakpoints (JS)', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', '..', 'script.js'), 'utf8');

  test('breakpoints table exists with 4 tiers', () => {
    expect(js).toMatch(/maxWidth:\s*479/);
    expect(js).toMatch(/maxWidth:\s*767/);
    expect(js).toMatch(/maxWidth:\s*991/);
    expect(js).toMatch(/maxWidth:\s*Infinity/);
  });

  test('desktop tier uses 60% active width', () => {
    expect(js).toMatch(/maxWidth:\s*Infinity,\s*activeWidth:\s*0\.60/);
  });

  test('smallest tier (<=479px) uses 78% active width', () => {
    expect(js).toMatch(/maxWidth:\s*479,\s*activeWidth:\s*0\.78/);
  });
});

// ────────────────────────────────────
// Touch Device Detection
// ────────────────────────────────────
describe('Touch Device Detection', () => {
  test('touchstart is available in window', () => {
    expect('ontouchstart' in window).toBe(false); // jsdom default
  });

  test('maxTouchPoints defaults to 0 in jsdom', () => {
    expect(navigator.maxTouchPoints).toBe(0);
  });
});

// ────────────────────────────────────
// Accessibility
// ────────────────────────────────────
describe('Accessibility', () => {
  test('slider has aria-roledescription="carousel"', () => {
    const slider = document.querySelector('.cascading-slider');
    expect(slider.getAttribute('aria-roledescription')).toBe('carousel');
  });

  test('portfolio section has aria-label', () => {
    const section = document.getElementById('portfolio');
    expect(section.getAttribute('aria-label')).toBeTruthy();
  });

  test('nav has aria-label for slider navigation', () => {
    const nav = document.querySelector('.cascading-slider__nav');
    expect(nav.getAttribute('aria-label')).toBe('slider navigation');
  });

  test('gallery has aria-label', () => {
    const gallery = document.getElementById('portfolioGallery');
    expect(gallery.getAttribute('aria-label')).toBeTruthy();
  });

  test('viewer defaults to aria-hidden="true"', () => {
    const viewer = document.getElementById('portfolioViewer');
    expect(viewer.getAttribute('aria-hidden')).toBe('true');
  });
});

// ────────────────────────────────────
// Image assets
// ────────────────────────────────────
describe('Image Assets', () => {
  test('placeholder-obra-01.webp exists', () => {
    const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'placeholders', 'placeholder-obra-01.webp'));
    expect(exists).toBe(true);
  });

  test('placeholder-obra-02.webp exists', () => {
    const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'placeholders', 'placeholder-obra-02.webp'));
    expect(exists).toBe(true);
  });

  test('eldorado.webp exists', () => {
    const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'eldorado.webp'));
    expect(exists).toBe(true);
  });

  test('elektro.webp exists', () => {
    const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'elektro.webp'));
    expect(exists).toBe(true);
  });

  test('project covers are referenced in portfolio data', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', '..', 'script.js'), 'utf8');
    expect(js).toContain("cover: 'assets/images/clients/eldorado.webp'");
    expect(js).toContain("cover: 'assets/images/clients/elektro.webp'");
    expect(js).toContain("cover: 'assets/images/clients/isa-energia.webp'");
    expect(js).toContain("cover: 'assets/images/clients/state-grid.webp'");
  });
});
