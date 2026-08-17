/**
 * @jest-environment jsdom
 *
 * Unit Tests — Cascading Slider Portfolio (v6 — galeria unica, 1 foto por
 * projeto, sem viewer de segunda tela)
 *
 * v5 (carrossel flex simples) foi revertido a pedido do usuario: o visual
 * (card central maior, laterais visiveis, clip-path via GSAP) do cascading
 * slider Modus e o correto e deve ser mantido. A unica mudanca real em
 * relacao ao componente original (que so populava "fotos de um projeto
 * aberto" dentro de um viewer) e que agora ele populam DIRETO os 6
 * projetos (uma foto de conclusao + nome + tipo/ano cada) como a propria
 * galeria da secao — sem grid de selecao, sem viewer/openProject/
 * closeProject. Clicar num card lateral so chama goTo() (comportamento
 * ja existente no engine original) e leva aquele projeto ao centro.
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

// Inject window helpers
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

// Polyfill ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Load the script (it will execute initPage immediately). Non-critical inits
// (portfolio slider, below-the-fold ScrollTrigger) run via requestIdleCallback,
// which jsdom doesn't implement — runWhenIdle() falls back to setTimeout(fn, 0).
// Fake timers flush that synchronously so the rest of this file can assert on
// the fully-initialized DOM, matching what happens for real in a browser a tick
// later.
jest.useFakeTimers();
require('../../script.js');
for (let i = 0; i < 20; i++) jest.runOnlyPendingTimers();
jest.useRealTimers();

// ────────────────────────────────────
// DOM Structure
// ────────────────────────────────────
describe('DOM Structure', () => {
  test('cascading slider wrapper exists with data-cascading-slider-wrap', () => {
    expect(document.querySelector('[data-cascading-slider-wrap]')).not.toBeNull();
  });

  test('slider viewport (trilha) exists in the DOM', () => {
    const trilha = document.getElementById('portfolioSliderTrilha');
    expect(trilha).not.toBeNull();
    expect(trilha.hasAttribute('data-cascading-viewport')).toBe(true);
  });

  test('at least 6 project slides are mounted (one photo per project)', () => {
    const slides = document.querySelectorAll('[data-cascading-slide]');
    expect(slides.length).toBeGreaterThanOrEqual(6);
  });

  test('each slide has exactly one image and a name + type overlay', () => {
    document.querySelectorAll('[data-cascading-slide]').forEach((slide) => {
      expect(slide.querySelectorAll('img').length).toBe(1);
      expect(slide.querySelector('.cascading-slider__item-nome')).not.toBeNull();
      expect(slide.querySelector('.cascading-slider__item-tipo')).not.toBeNull();
    });
  });

  test('exactly one slide is active at a time', () => {
    const active = document.querySelectorAll('[data-status="active"]');
    expect(active.length).toBe(1);
  });

  test('navigation buttons exist with correct data attributes', () => {
    expect(document.querySelector('[data-cascading-slider-prev]')).not.toBeNull();
    expect(document.querySelector('[data-cascading-slider-next]')).not.toBeNull();
  });

  test('nav buttons have aria-labels', () => {
    const prev = document.querySelector('[data-cascading-slider-prev]');
    const next = document.querySelector('[data-cascading-slider-next]');
    expect(prev.getAttribute('aria-label')).toBeTruthy();
    expect(next.getAttribute('aria-label')).toBeTruthy();
  });

  test('cascading-slider__nav exists with aria-label', () => {
    const nav = document.querySelector('.cascading-slider__nav');
    expect(nav).not.toBeNull();
    expect(nav.getAttribute('aria-label')).toBe('slider navigation');
  });

  test('gallery grid, viewer, and stage from the old openProject/closeProject flow no longer exist', () => {
    expect(document.getElementById('portfolioGrid')).toBeNull();
    expect(document.getElementById('portfolioGallery')).toBeNull();
    expect(document.getElementById('portfolioViewer')).toBeNull();
    expect(document.getElementById('portfolioBackBtn')).toBeNull();
    expect(document.querySelector('.portfolio-card')).toBeNull();
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

  test('per-slide name/type overlay rule exists (new: text lives on the slide, no viewer header)', () => {
    expect(css).toMatch(/\.cascading-slider__item-overlay\s*\{/);
    expect(css).toMatch(/\.cascading-slider__item-nome\s*\{/);
    expect(css).toMatch(/\.cascading-slider__item-tipo\s*\{/);
  });

  test('old gallery/viewer/card/stage CSS has been fully removed', () => {
    expect(css).not.toMatch(/\.portfolio-card\b/);
    expect(css).not.toMatch(/\.portfolio-gallery\s*[.{]/);
    expect(css).not.toMatch(/\.portfolio-gallery-grid\b/);
    expect(css).not.toMatch(/\.portfolio-viewer\b/);
    expect(css).not.toMatch(/\.portfolio-stage\b/);
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

  test('desktop tier uses 60% active width (card central maior, laterais visiveis)', () => {
    expect(js).toMatch(/maxWidth:\s*Infinity,\s*activeWidth:\s*0\.60/);
  });

  test('smallest tier (<=479px) uses 78% active width', () => {
    expect(js).toMatch(/maxWidth:\s*479,\s*activeWidth:\s*0\.78/);
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
});

// ────────────────────────────────────
// Script Integrity
// ────────────────────────────────────
describe('Script Integrity', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', '..', 'script.js'), 'utf8');

  test('initCascadingSlider and initPortfolioSlider exist', () => {
    expect(js).toMatch(/function initCascadingSlider\(/);
    expect(js).toMatch(/function initPortfolioSlider\(/);
  });

  test('slide click handler navigates via goTo (no viewer opens)', () => {
    const startIdx = js.indexOf('function initCascadingSlider');
    const endIdx = js.indexOf('function initPortfolioSlider');
    const fnSrc = js.slice(startIdx, endIdx);
    expect(fnSrc).toMatch(/slide\.addEventListener\('click',\s*handler\)/);
    expect(fnSrc).toMatch(/if \(index !== activeIndex\) goTo\(index\)/);
  });

  test('old viewer/gallery-grid engine (openProject/closeProject) has been fully removed', () => {
    expect(js).not.toMatch(/function openProject\(/);
    expect(js).not.toMatch(/function closeProject\(/);
    expect(js).not.toMatch(/function initPortfolioGallery\(/);
    expect(js).not.toMatch(/portfolioState/);
  });

  test('portfolioProjects data array exists with at least 6 projects, one cover photo each', () => {
    expect(js).toContain("id: 'elektro'");
    expect(js).toContain("id: 'elektro-06'");
    const match = js.match(/const portfolioProjects = \[([\s\S]*?)\n\];/);
    expect(match).not.toBeNull();
    // each object => one "cover:" occurrence, no "photos:" array (single photo per project)
    expect((match[1].match(/cover:/g) || []).length).toBeGreaterThanOrEqual(6);
    expect(match[1]).not.toMatch(/photos:/);
  });
});

// ────────────────────────────────────
// Image assets
// ────────────────────────────────────
describe('Image Assets', () => {
  test('placeholder-obra-03.webp exists (cover photo in active use, script.js)', () => {
    const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'placeholders', 'placeholder-obra-03.webp'));
    expect(exists).toBe(true);
  });

  test('elektro.svg (clients carousel logo) exists', () => {
    const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'elektro.svg'));
    expect(exists).toBe(true);
  });

  test('isa-energia-logo.png (clients carousel logo) exists', () => {
    const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'isa-energia-logo.png'));
    expect(exists).toBe(true);
  });

  test('project covers are referenced in portfolio data', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', '..', 'script.js'), 'utf8');
    expect(js).toContain("cover: 'assets/images/placeholders/placeholder-obra-03.webp'");
    expect(js).toContain("cover: 'assets/images/portfolio/elektro-02.webp'");
    expect(js).toContain("cover: 'assets/images/portfolio/elektro-06.webp'");
  });

  test('elektro-0X.webp portfolio photos exist', () => {
    ['02', '03', '04', '05', '06'].forEach((n) => {
      const exists = fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'portfolio', `elektro-${n}.webp`));
      expect(exists).toBe(true);
    });
  });
});
