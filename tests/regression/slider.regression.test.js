/**
 * @jest-environment jsdom
 *
 * Regression Tests — Cascading Slider Portfolio (v6 — galeria unica, 1 foto
 * por projeto, sem viewer de segunda tela)
 *
 * v5 (carrossel flex simples, sem GSAP) foi revertido a pedido do usuario —
 * o cascading slider Modus (card central maior via clip-path/GSAP, laterais
 * visiveis) e a implementacao correta e permanece intacto. A unica mudanca
 * real e que ele agora popula os 6 projetos diretamente (uma foto de
 * conclusao + nome + tipo/ano cada), sem grid de selecao e sem viewer
 * (openProject/closeProject removidos) — clicar num card lateral so chama
 * goTo(), levando aquele projeto ao centro.
 *
 * Guard against visual and functional regressions.
 * Static analysis of CSS, DOM, and structural integrity.
 *
 * Run: npm run test:regression
 */

'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', '..', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', '..', 'script.js'), 'utf8');

// ────────────────────────────────────
// Regression: CSS Image Rules
// ────────────────────────────────────
describe('REGRESSION — Image Rules (CSS Static)', () => {
  const imgRule = css.match(/\.cascading-slider__img\s*\{([^}]+)\}/);

  test('image width is "100%"', () => {
    expect(imgRule).not.toBeNull();
    expect(imgRule[1]).toMatch(/width:\s*100%/);
  });

  test('image height is "100%"', () => {
    expect(imgRule[1]).toMatch(/height:\s*100%/);
  });

  test('object-fit is cover', () => {
    expect(imgRule[1]).toMatch(/object-fit:\s*cover/);
  });
});

// ────────────────────────────────────
// Regression: Button Behavior
// ────────────────────────────────────
describe('REGRESSION — Button States (CSS Static)', () => {
  const btnSection = css.slice(css.indexOf('.cascading-slider__button'));

  test('no :hover pseudo-class on slider buttons', () => {
    expect(btnSection).not.toMatch(/\.cascading-slider__button:hover/);
  });

  test('no :focus-visible pseudo-class on slider buttons', () => {
    expect(btnSection).not.toMatch(/\.cascading-slider__button:focus-visible/);
  });

  test('hover-active class rule exists', () => {
    expect(btnSection).toMatch(/\.cascading-slider__button\.hover-active\s*\{/);
  });

  test('hover-active uses the project accent color (not the Modus orange)', () => {
    const haRule = btnSection.match(/\.cascading-slider__button\.hover-active\s*\{([^}]+)\}/);
    expect(haRule).not.toBeNull();
    expect(haRule[1]).toMatch(/border-color:\s*var\(--color-accent-primary\)/);
    expect(haRule[1]).not.toMatch(/#ffa574/);
  });

  test('tap-highlight-color is transparent (prevents mobile flash)', () => {
    expect(btnSection).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });
});

// ────────────────────────────────────
// Regression: Responsive Breakpoints (JS-driven)
// ────────────────────────────────────
describe('REGRESSION — Responsive Breakpoints (JS Static)', () => {
  test('breakpoints array has 4 tiers (479/767/991/Infinity)', () => {
    const breakpointsBlock = js.match(/breakpoints\s*=\s*\[([\s\S]*?)\];/);
    expect(breakpointsBlock).not.toBeNull();
    expect(breakpointsBlock[1]).toMatch(/maxWidth:\s*479/);
    expect(breakpointsBlock[1]).toMatch(/maxWidth:\s*767/);
    expect(breakpointsBlock[1]).toMatch(/maxWidth:\s*991/);
    expect(breakpointsBlock[1]).toMatch(/maxWidth:\s*Infinity/);
  });

  test('resize listener only recalculates on width change (no height-only churn)', () => {
    const fnStart = js.indexOf('function initCascadingSlider');
    const fnBody = js.slice(fnStart, js.indexOf('\nfunction ', fnStart + 10));
    expect(fnBody).toMatch(/window\.innerWidth === lastWidth/);
  });
});

// ────────────────────────────────────
// Regression: Overflow Rules
// ────────────────────────────────────
describe('REGRESSION — Overflow Rules (CSS Static)', () => {
  test('viewport (list) has overflow hidden (clips side cards)', () => {
    expect(css).toMatch(/\.cascading-slider__list\s*\{[^}]*overflow:\s*hidden/);
  });

  test('item-inner has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slider__item-inner\s*\{[^}]*overflow:\s*hidden/);
  });
});

// ────────────────────────────────────
// Regression: DOM Structure (v6)
// ────────────────────────────────────
describe('REGRESSION — DOM Structure', () => {
  beforeAll(() => {
    document.body.innerHTML = html;
  });

  test('slider viewport (trilha) exists in the DOM', () => {
    const trilha = document.getElementById('portfolioSliderTrilha');
    expect(trilha).not.toBeNull();
  });

  test('navigation buttons exist with correct data attributes', () => {
    expect(document.querySelector('[data-cascading-slider-prev]')).not.toBeNull();
    expect(document.querySelector('[data-cascading-slider-next]')).not.toBeNull();
  });

  test('slider wrapper has data-cascading-slider-wrap', () => {
    expect(document.querySelector('[data-cascading-slider-wrap]')).not.toBeNull();
  });

  test('slider has aria-roledescription="carousel"', () => {
    const slider = document.querySelector('.cascading-slider');
    expect(slider.getAttribute('aria-roledescription')).toBe('carousel');
  });

  test('nav buttons have aria-labels', () => {
    const prev = document.querySelector('[data-cascading-slider-prev]');
    const next = document.querySelector('[data-cascading-slider-next]');
    expect(prev.getAttribute('aria-label')).toBeTruthy();
    expect(next.getAttribute('aria-label')).toBeTruthy();
  });

  test('nav menu has aria-label', () => {
    const nav = document.querySelector('.cascading-slider__nav');
    expect(nav.getAttribute('aria-label')).toBe('slider navigation');
  });

  test('gallery grid, viewer, and stage from the old openProject/closeProject flow no longer exist', () => {
    expect(document.getElementById('portfolioGrid')).toBeNull();
    expect(document.getElementById('portfolioGallery')).toBeNull();
    expect(document.getElementById('portfolioViewer')).toBeNull();
    expect(document.getElementById('portfolioStage')).toBeNull();
    expect(document.getElementById('portfolioBackBtn')).toBeNull();
  });
});

// ────────────────────────────────────
// Regression: Portfolio Section Structure
// ────────────────────────────────────
describe('REGRESSION — Portfolio Section', () => {
  test('section has id portfolio', () => {
    expect(document.getElementById('portfolio')).not.toBeNull();
  });

  test('section has aria-label', () => {
    const section = document.getElementById('portfolio');
    expect(section.getAttribute('aria-label')).toBeTruthy();
  });

  test('contains cascading-slider', () => {
    const section = document.getElementById('portfolio');
    expect(section.querySelector('.cascading-slider')).not.toBeNull();
  });

  test('contains cascading-slider__collection', () => {
    const section = document.getElementById('portfolio');
    expect(section.querySelector('.cascading-slider__collection')).not.toBeNull();
  });

  test('contains cascading-slider__list (viewport)', () => {
    const section = document.getElementById('portfolio');
    expect(section.querySelector('.cascading-slider__list')).not.toBeNull();
  });

  test('does not contain the old gallery grid or viewer', () => {
    const section = document.getElementById('portfolio');
    expect(section.querySelector('.portfolio-gallery-grid')).toBeNull();
    expect(section.querySelector('.portfolio-viewer')).toBeNull();
  });
});

// ────────────────────────────────────
// Regression: Image Assets
// ────────────────────────────────────
describe('REGRESSION — Image Assets', () => {
  test('placeholder-obra-03.webp file exists (cover photo in active use, script.js)', () => {
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'placeholders', 'placeholder-obra-03.webp'))).toBe(true);
  });

  test('logo files exist', () => {
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'brand', 'logo-perin-principal.webp'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'brand', 'logo-perin-navbar.webp'))).toBe(true);
  });

  test('project cover images exist', () => {
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'state-grid.webp'))).toBe(true);
  });
});

// ────────────────────────────────────
// Regression: Script Integrity
// ────────────────────────────────────
describe('REGRESSION — Script Integrity', () => {
  test('initCascadingSlider function exists', () => {
    expect(js).toMatch(/function initCascadingSlider/);
  });

  test('initCascadingSlider drives layout via GSAP (clip-path + transform), not CSS transition', () => {
    expect(js).toMatch(/gsap\.to\(slide/);
    expect(js).toMatch(/gsap\.set\(slide/);
  });

  test('initPortfolioSlider mounts the gallery on page load (no grid, no viewer)', () => {
    expect(js).toMatch(/function initPortfolioSlider/);
    expect(js).toMatch(/initCascadingSlider\(viewport, portfolioProjects\)/);
  });

  test('portfolioProjects data array exists with 6 projects, one photo each', () => {
    expect(js).toContain("id: 'elektro'");
    expect(js).toContain("id: 'elektro-06'");
    const block = js.match(/const portfolioProjects = \[([\s\S]*?)\n\];/);
    expect(block).not.toBeNull();
    expect(block[1]).not.toMatch(/photos:\s*\[/);
  });

  test('slide clones are marked with data-clone (min. 9 slides for the cascading effect)', () => {
    expect(js).toMatch(/setAttribute\('data-clone', ''\)/);
  });

  test('destroy() clears the slider container (no residual state on reopen)', () => {
    const startIdx = js.indexOf('function initCascadingSlider');
    const endIdx = js.indexOf('function initPortfolioSlider', startIdx);
    expect(startIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeGreaterThan(startIdx);
    const fnSrc = js.slice(startIdx, endIdx);
    expect(fnSrc).toMatch(/viewport\.innerHTML\s*=\s*''/);
  });

  test('destroy() removes the document-level keydown listener (no leak across projects)', () => {
    const startIdx = js.indexOf('function initCascadingSlider');
    const endIdx = js.indexOf('function initPortfolioSlider', startIdx);
    const fnSrc = js.slice(startIdx, endIdx);
    expect(fnSrc).toMatch(/document\.addEventListener\('keydown', keyHandler\)/);
    expect(fnSrc).toMatch(/document\.removeEventListener\('keydown', keyHandler\)/);
  });

  test('clicking a side slide navigates via goTo — no viewer/second screen opens', () => {
    const startIdx = js.indexOf('function initCascadingSlider');
    const endIdx = js.indexOf('function initPortfolioSlider', startIdx);
    const fnSrc = js.slice(startIdx, endIdx);
    expect(fnSrc).toMatch(/slide\.addEventListener\('click',\s*handler\)/);
    expect(fnSrc).not.toMatch(/openProject/);
  });

  test('old gallery/viewer engine (openProject/closeProject/initPortfolioGallery) has been fully removed', () => {
    expect(js).not.toMatch(/function openProject\(/);
    expect(js).not.toMatch(/function closeProject\(/);
    expect(js).not.toMatch(/function initPortfolioGallery\(/);
    expect(js).not.toMatch(/portfolioState/);
  });
});

// ────────────────────────────────────
// Regression: HTML Source Integrity
// ────────────────────────────────────
describe('REGRESSION — HTML Source Integrity', () => {
  test('<head> tag is correctly formed (not malformed)', () => {
    const headMatch = html.match(/<head[^>]*>/i);
    expect(headMatch).not.toBeNull();
    expect(headMatch[0]).toBe('<head>');
  });

  test('DOCTYPE is present and correct', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  test('<html lang="pt-BR"> is present', () => {
    expect(html).toContain('<html lang="pt-BR">');
  });

  test('closing </html> is present', () => {
    expect(html).toContain('</html>');
  });

  test('opening and closing <body> tags are present', () => {
    expect(html).toMatch(/<body[^>]*>/);
    expect(html).toContain('</body>');
  });

  test('viewport meta tag is present', () => {
    expect(html).toContain('<meta name="viewport"');
  });
});
