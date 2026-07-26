/**
 * @jest-environment jsdom
 *
 * Unit Tests — Init scheduling (hero entrance -> idle queue, portfolio slider mount)
 *
 * Regression guard:
 *  The non-critical init queue (carousels, below-the-fold ScrollTrigger,
 *  etc.) must not start until the hero entrance timeline's onComplete
 *  fires — starting earlier let requestIdleCallback's 200ms timeout force
 *  a non-critical function to run mid-animation on slow mobile CPUs,
 *  causing the hero title to "jump" instead of animating smoothly. A
 *  3.5s fallback timer covers the case where onComplete never fires.
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

// Drains both the chained requestIdleCallback/setTimeout(fn,0) fallback chain
// AND jsdom's requestAnimationFrame (which schedules via its own internal
// timer, not reliably caught by runOnlyPendingTimers alone) — needed because
// createCascadingSlider's initial mount runs inside a requestAnimationFrame.
function flush() {
  for (let i = 0; i < 30; i++) {
    jest.advanceTimersByTime(20);
    jest.runOnlyPendingTimers();
  }
}

function polyfills() {
  global.ScrollTrigger = { refresh: jest.fn(), config: jest.fn(), batch: jest.fn(), create: jest.fn() };
  Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
  Object.defineProperty(window, 'innerHeight', { writable: true, value: 812 });
  Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 5 });
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
}

describe('Hero entrance -> idle queue scheduling', () => {
  beforeEach(() => {
    jest.resetModules();
    freshDom();
    polyfills();
  });

  test('idle queue (e.g. cascading slider) does not start before hero entrance onComplete fires', () => {
    let capturedOnComplete = null;
    global.gsap = {
      killTweensOf: jest.fn(),
      to: jest.fn(),
      set: jest.fn(),
      from: jest.fn(),
      fromTo: jest.fn(),
      timeline: jest.fn((cfg) => {
        capturedOnComplete = cfg && cfg.onComplete;
        return { to: jest.fn().mockReturnThis() };
      }),
      utils: { toArray: jest.fn(() => []) },
    };

    jest.useFakeTimers();
    require('../../script.js');

    // Timeline captured onComplete but hasn't "finished" yet — createParticles
    // (first item in the idle queue) must not have run.
    expect(typeof capturedOnComplete).toBe('function');
    jest.advanceTimersByTime(500); // well under the 3.5s fallback
    expect(document.querySelectorAll('.hero-particles .particle').length).toBe(0);

    // Now simulate the hero timeline completing — the queue should start.
    capturedOnComplete();
    flush();
    expect(document.querySelectorAll('.hero-particles .particle').length).toBeGreaterThan(0);

    jest.useRealTimers();
  });

  test('3.5s fallback starts the idle queue even if hero onComplete never fires', () => {
    global.gsap = {
      killTweensOf: jest.fn(),
      to: jest.fn(),
      set: jest.fn(),
      from: jest.fn(),
      fromTo: jest.fn(),
      // onComplete intentionally never invoked, simulating a stalled/failed timeline.
      timeline: jest.fn(() => ({ to: jest.fn().mockReturnThis() })),
      utils: { toArray: jest.fn(() => []) },
    };

    jest.useFakeTimers();
    require('../../script.js');

    expect(document.querySelectorAll('.hero-particles .particle').length).toBe(0);

    flush();
    expect(document.querySelectorAll('.hero-particles .particle').length).toBeGreaterThan(0);

    jest.useRealTimers();
  });
});

describe('Portfolio cascading slider -> mounted from the idle queue', () => {
  // The cascading-slider__list is already sized via CSS (clamp() height,
  // always present in the static HTML) — initPortfolioSlider() only fills
  // its innerHTML with the 6 project slides, it never changes the portfolio
  // section's height. No ScrollTrigger.refresh() is needed for it
  // specifically (unlike the old dynamic gallery grid, which did resize the
  // section and needed an explicit refresh — removed along with the viewer).
  beforeEach(() => {
    jest.resetModules();
    freshDom();
    polyfills();
    global.gsap = {
      killTweensOf: jest.fn(),
      to: jest.fn(),
      set: jest.fn(),
      from: jest.fn(),
      fromTo: jest.fn(),
      delayedCall: jest.fn(),
      timeline: jest.fn((cfg) => {
        // Resolve immediately so the idle queue starts without waiting on the fallback.
        if (cfg && typeof cfg.onComplete === 'function') cfg.onComplete();
        return { to: jest.fn().mockReturnThis() };
      }),
      utils: { toArray: jest.fn(() => []) },
    };
  });

  test('initPortfolioSlider mounts 6 project slides and wires up navigation', () => {
    jest.useFakeTimers();
    require('../../script.js');
    flush();
    jest.useRealTimers();

    const viewport = document.getElementById('portfolioSliderTrilha');
    expect(viewport.children.length).toBeGreaterThanOrEqual(6);

    const activeBefore = viewport.querySelector('[data-status="active"]');
    expect(activeBefore).not.toBeNull();

    document.querySelector('[data-cascading-slider-next]').dispatchEvent(new window.Event('click'));

    const activeAfter = viewport.querySelector('[data-status="active"]');
    expect(activeAfter).not.toBe(activeBefore);
  });
});
