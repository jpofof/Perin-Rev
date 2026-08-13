/**
 * @jest-environment jsdom
 *
 * Unit Tests — Contact Form (initContactForm)
 *
 * Validates client-side behavior only: happy path submission, invalid
 * inputs blocking submit, honeypot silently rejecting bots without a
 * network call, and sanitizeString() stripping/trimming/truncating input.
 * No real network call is made — fetch is mocked.
 *
 * Run: npm run test:unit
 */

'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
document.body.innerHTML = html;

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

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

// jsdom does not implement scrollIntoView; the form's invalid-submit path
// calls it on the first errored field.
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.useFakeTimers();
require('../../script.js');
for (let i = 0; i < 20; i++) jest.runOnlyPendingTimers();
jest.useRealTimers();

function fillValidForm() {
  document.getElementById('formName').value = 'Joao Silva';
  document.getElementById('formName').dispatchEvent(new Event('input'));
  document.getElementById('formPhone').value = '18997375322';
  document.getElementById('formPhone').dispatchEvent(new Event('input'));
  document.getElementById('formEmail').value = 'joao@email.com';
  document.getElementById('formEmail').dispatchEvent(new Event('input'));
  document.getElementById('formMessage').value = 'Gostaria de um orcamento.';
  document.querySelector('#customServiceOptions li[data-value="residencial"]').dispatchEvent(
    new MouseEvent('click', { bubbles: true })
  );
}

function submitForm() {
  const form = document.getElementById('contactForm');
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

beforeEach(() => {
  fetch.mockClear();
  document.getElementById('contactForm').reset();
  document.getElementById('formWebsite').value = '';
  document.getElementById('customServiceText').textContent = 'Tipo de Serviço';
  document.getElementById('customServiceText').classList.remove('selected');
});

describe('Contact form — happy path', () => {
  test('accepts valid nome, telefone, email and mensagem', () => {
    fillValidForm();
    submitForm();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('submitted payload carries sanitized field values', () => {
    fillValidForm();
    submitForm();
    const [, options] = fetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(body.get('name')).toBe('Joao Silva');
    expect(body.get('email')).toBe('joao@email.com');
    expect(body.get('service')).toBe('residencial');
  });
});

describe('Contact form — invalid inputs', () => {
  test('blocks submission when required fields are empty', () => {
    submitForm();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('blocks submission with malformed email', () => {
    fillValidForm();
    document.getElementById('formEmail').value = 'not-an-email';
    document.getElementById('formEmail').dispatchEvent(new Event('input'));
    submitForm();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('blocks submission with malformed phone (too few digits)', () => {
    fillValidForm();
    document.getElementById('formPhone').value = '123';
    document.getElementById('formPhone').dispatchEvent(new Event('input'));
    submitForm();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('blocks submission when no service is selected', () => {
    document.getElementById('formName').value = 'Joao Silva';
    document.getElementById('formName').dispatchEvent(new Event('input'));
    document.getElementById('formPhone').value = '18997375322';
    document.getElementById('formPhone').dispatchEvent(new Event('input'));
    document.getElementById('formEmail').value = 'joao@email.com';
    document.getElementById('formEmail').dispatchEvent(new Event('input'));
    document.getElementById('formMessage').value = 'Gostaria de um orcamento.';
    submitForm();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Contact form — honeypot', () => {
  test('silently rejects submission without calling fetch when honeypot is filled', () => {
    fillValidForm();
    document.getElementById('formWebsite').value = 'http://spam.example';
    submitForm();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('sanitizeString (via submitted payload)', () => {
  test('strips HTML tags, trims whitespace and truncates at 1000 characters', () => {
    fillValidForm();
    document.getElementById('formMessage').value =
      '  <script>alert(1)</script>Mensagem com <b>tags</b> coladas  ' + 'x'.repeat(1100);
    submitForm();
    const [, options] = fetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    const message = body.get('message');
    expect(message).not.toContain('<');
    expect(message).not.toContain('>');
    expect(message.startsWith(' ')).toBe(false);
    expect(message.endsWith(' ')).toBe(false);
    expect(message.length).toBe(1000);
  });
});
