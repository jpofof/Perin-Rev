/**
 * @jest-environment jsdom
 *
 * Unit Tests — Clients Carousel (auto-rotate marquee)
 *
 * Regression guard for the "does not rotate on its own in mobile" bug:
 * a touchcancel (browser resolves an ambiguous gesture as page scroll
 * instead of carousel drag — no touchend ever fires) used to leave
 * isDragging stuck true forever, freezing the velocity self-correction
 * that keeps the marquee auto-rotating.
 *
 * Run: npm run test:unit
 */

'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
document.body.innerHTML = html;

global.gsap = {
  killTweensOf: jest.fn(),
  to: jest.fn(),
  set: jest.fn(),
  from: jest.fn(),
  fromTo: jest.fn(),
  timeline: jest.fn(() => ({ to: jest.fn().mockReturnThis(), eventCallback: jest.fn() })),
  utils: { toArray: jest.fn(() => []) },
};
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

// clientsTrack precisa ser reportado como "na viewport" para o loop de rAF
// iniciar (mesmo padrao do IntersectionObserver do video do hero) — jsdom
// nao calcula intersecao real, entao o polyfill entrega isIntersecting:true
// direto na primeira observacao.
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) { this.cb = cb; }
  observe(target) { this.cb([{ isIntersecting: true, target }]); }
  unobserve() {}
  disconnect() {}
};

jest.useFakeTimers();
require('../../script.js');
for (let i = 0; i < 20; i++) jest.runOnlyPendingTimers();

function getTranslateX(track) {
  const match = track.style.transform.match(/translate3d\(([-\d.]+)px/);
  return match ? parseFloat(match[1]) : null;
}

function fireTouch(track, type, clientX) {
  const evt = new Event(type, { bubbles: true, cancelable: true });
  evt.touches = [{ clientX }];
  track.dispatchEvent(evt);
}

function advanceFrames(n) {
  for (let i = 0; i < n; i++) jest.advanceTimersByTime(16);
}

describe('Clients Carousel — auto-rotate resilience', () => {
  const track = document.getElementById('clientsTrack');

  test('carousel element exists and auto-rotate loop is active', () => {
    expect(track).not.toBeNull();
    const x1 = getTranslateX(track);
    advanceFrames(5);
    const x2 = getTranslateX(track);
    expect(x1).not.toBeNull();
    expect(x2).not.toBeNull();
    expect(x2).not.toBe(x1);
  });

  test('velocity resumes converging to baseSpeed after a gesture is interrupted by touchcancel', () => {
    // 1) A real, completed drag (touchend) reverses direction hard: this sets
    // velocity = -22 (MAX_SPEED) and a new baseSpeed = -6.6 via the momentum
    // calc in onPointerUp. Convergence from -22 back to -6.6 happens gradually
    // over many frames (RETURN_SPRING + FRICTION), not instantly.
    fireTouch(track, 'touchstart', 300);
    fireTouch(track, 'touchmove', 100); // dx = -200 -> clamped momentum -22
    fireTouch(track, 'touchend', 100);

    // Only 2 frames of convergence — velocity is still far from baseSpeed.
    advanceFrames(2);

    // 2) A second, ambiguous gesture starts and gets cancelled by the browser
    // (resolved as page scroll) — no touchend ever fires. This is the exact
    // scenario that used to strand isDragging = true forever, freezing the
    // velocity correction mid-convergence.
    fireTouch(track, 'touchstart', 50);
    fireTouch(track, 'touchmove', 48);
    fireTouch(track, 'touchcancel', 48);

    // 3) Enough frames for the spring to fully converge velocity to baseSpeed
    // IF the correction loop is running again after the cancel.
    let prev = getTranslateX(track);
    advanceFrames(1);
    let last = getTranslateX(track);
    for (let i = 0; i < 250; i++) {
      prev = last;
      advanceFrames(1);
      last = getTranslateX(track);
    }
    const perFrameVelocity = last - prev;

    // The cancelled gesture's own tiny move (dx = -2) sets a new baseSpeed of
    // -0.63 via onPointerUp — which only runs on cancel if the touchcancel
    // handler is wired up. FRICTION applied every frame (not just in the
    // spring term) pulls the long-run equilibrium below baseSpeed itself, to
    // ~0.322 * baseSpeed ≈ -0.203 here — verified analytically and by running
    // this exact scenario against the fixed code. If isDragging were stuck
    // true (no touchcancel handler), velocity would stay frozen near -22
    // (the raw momentum from the FIRST gesture, only 2 frames into recovery
    // when the second touch started), nowhere near this range.
    expect(perFrameVelocity).toBeGreaterThan(-1);
    expect(perFrameVelocity).toBeLessThan(0);
  });
});
