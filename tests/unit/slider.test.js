/**
 * @jest-environment jsdom
 *
 * Unit Tests — Cascading Slider Portfolio (v2 — Gallery + Viewer)
 *
 * Validate logic in isolation: PCT proportions, getSizes calculations,
 * DOM structure (dynamic slides), CSS rules, accessibility, image assets.
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
// (carousel, gallery, below-the-fold ScrollTrigger) run via requestIdleCallback,
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
// Helpers
// ────────────────────────────────────
function getCarouselState() {
  const list = document.getElementById('cascadingSliderList');
  const slides = list.querySelectorAll('.cascading-slide');
  return { list, slides, total: slides.length };
}

// ────────────────────────────────────
// PCT Proportions
// ────────────────────────────────────
describe('PCT Proportions', () => {
  test('desktop PCT sums to 100% within rounding', () => {
    const PCT_DESKTOP = [0.065, 0.135, 0.60, 0.135, 0.065];
    const sum = PCT_DESKTOP.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 3);
  });

  test('mobile PCT sums to 100% within rounding', () => {
    const PCT_MOBILE = [0.10, 0.80, 0.10];
    const sum = PCT_MOBILE.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 3);
  });

  test('center slot is 60% (desktop)', () => {
    const mid = Math.floor(5 / 2);
    expect([0.065, 0.135, 0.60, 0.135, 0.065][mid]).toBe(0.60);
  });

  test('center slot is 80% (mobile)', () => {
    const mid = Math.floor(3 / 2);
    expect([0.10, 0.80, 0.10][mid]).toBe(0.80);
  });
});

// ────────────────────────────────────
// getSizes calculations
// ────────────────────────────────────
describe('getSizes (simulated)', () => {
  test('desktop computes correct ws with gap=8 and 5 slots', () => {
    const PCT = [0.065, 0.135, 0.60, 0.135, 0.065];
    const gap = 8;
    const cw = 1358;
    const usable = cw - gap * 4;
    const ws = PCT.map(p => Math.round(usable * p));
    expect(usable).toBe(1326);
    expect(ws).toEqual([86, 179, 796, 179, 86]);
  });

  test('mobile computes correct ws with gap=8 and 3 slots', () => {
    const PCT = [0.10, 0.80, 0.10];
    const gap = 8;
    const cw = 400;
    const usable = cw - gap * 2;
    const ws = PCT.map(p => Math.round(usable * p));
    expect(usable).toBe(384);
    expect(ws[1]).toBe(307);
    const sumSlots = ws.reduce((a, b) => a + b, 0);
    expect(sumSlots + gap * 2).toBeLessThanOrEqual(cw);
    expect(sumSlots + gap * 2).toBeGreaterThanOrEqual(cw - 1);
  });
});

// ────────────────────────────────────
// DOM Structure (v2: dynamic gallery)
// ────────────────────────────────────
describe('DOM Structure', () => {
  test('cascadingSliderList exists in DOM', () => {
    const list = document.getElementById('cascadingSliderList');
    expect(list).not.toBeNull();
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
    const prev = document.querySelector('.cascading-slider-button-prev');
    const next = document.querySelector('.cascading-slider-button-next');
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
  });

  test('nav buttons have aria-labels', () => {
    const prev = document.querySelector('.cascading-slider-button-prev');
    const next = document.querySelector('.cascading-slider-button-next');
    expect(prev.getAttribute('aria-label')).toBeTruthy();
    expect(next.getAttribute('aria-label')).toBeTruthy();
  });

  test('cascading-slider-nav exists', () => {
    expect(document.querySelector('.cascading-slider-nav')).not.toBeNull();
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

  test('cascading-slide-image img has position absolute', () => {
    expect(css).toMatch(/\.cascading-slide-image img\s*\{[^}]*position:\s*absolute/);
  });

  test('cascading-slide-image img uses translate(-50%, -50%)', () => {
    expect(css).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
  });

  test('cascading-slide-image img height is 100%', () => {
    expect(css).toMatch(/\.cascading-slide-image img\s*\{[^}]*height:\s*100%/);
  });

  test('cascading-slide-image img width is auto (not 100%)', () => {
    const imgRule = css.match(/\.cascading-slide-image img\s*\{([^}]+)\}/);
    expect(imgRule).not.toBeNull();
    expect(imgRule[1]).toMatch(/width:\s*auto/);
  });

  test('cascading-slide-overlay background is transparent', () => {
    expect(css).toMatch(/\.cascading-slide-overlay\s*\{[^}]*background:\s*transparent/);
  });

  test('no :hover pseudo-class on slider buttons (uses hover-active class)', () => {
    const btnSection = css.slice(css.indexOf('.cascading-slider-button'));
    const hoverPseudo = btnSection.match(/\.cascading-slider-button:hover/);
    expect(hoverPseudo).toBeNull();
  });

  test('hover-active class exists as replacement for :hover', () => {
    expect(css).toMatch(/\.cascading-slider-button\.hover-active/);
  });

  test('touch-active class exists', () => {
    expect(css).toMatch(/\.cascading-slider-button\.touch-active/);
  });

  test('cascading-slider-collection has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slider-collection\s*\{[^}]*overflow:\s*hidden/);
  });

  test('cascading-slide has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slide\s*\{[^}]*overflow:\s*hidden/);
  });

  test('media query at 750px exists', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*750px\)/);
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
    const nav = document.querySelector('.cascading-slider-nav');
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