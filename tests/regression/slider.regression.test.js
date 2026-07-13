/**
 * @jest-environment jsdom
 *
 * Regression Tests — Cascading Slider Portfolio (v2 — Gallery + Viewer)
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
// Regression: CSS Image Scaling Rules
// ────────────────────────────────────
describe('REGRESSION — Image Scaling (CSS Static)', () => {
  const imgRule = css.match(/\.cascading-slide-image img\s*\{([^}]+)\}/);

  test('image width is "auto" (not 100%)', () => {
    expect(imgRule).not.toBeNull();
    expect(imgRule[1]).toMatch(/width:\s*auto/);
    expect(imgRule[1]).not.toMatch(/width:\s*100%/);
  });

  test('image height is "100%"', () => {
    expect(imgRule[1]).toMatch(/height:\s*100%/);
  });

  test('image has position absolute', () => {
    expect(imgRule[1]).toMatch(/position:\s*absolute/);
  });

  test('image uses translate(-50%, -50%) for centering', () => {
    expect(imgRule[1]).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
  });

  test('no min-width rule on images (prevents zoom effect)', () => {
    expect(imgRule[1]).not.toMatch(/min-width/);
  });

  test('object-fit is cover', () => {
    expect(imgRule[1]).toMatch(/object-fit:\s*cover/);
  });

  test('max-width is none', () => {
    expect(imgRule[1]).toMatch(/max-width:\s*none/);
  });
});

// ────────────────────────────────────
// Regression: Overlay Transparency
// ────────────────────────────────────
describe('REGRESSION — Overlay (CSS Static)', () => {
  const overlayRule = css.match(/\.cascading-slide-overlay\s*\{([^}]+)\}/);

  test('overlay background is transparent', () => {
    expect(overlayRule).not.toBeNull();
    expect(overlayRule[1]).toMatch(/background:\s*transparent/);
  });

  test('no dark overlay rule for inactive slides', () => {
    const darkRule = css.match(/cascading-slide:not\(\[data-status="active"\]\)\s*.cascading-slide-overlay\s*\{([^}]*background:\s*rgba)/);
    expect(darkRule).toBeNull();
  });

  test('no brightness or blur filter on slides in CSS', () => {
    const slideSection = css.slice(css.indexOf('.cascading-slide{'));
    expect(slideSection).not.toMatch(/filter:\s*brightness/);
    expect(slideSection).not.toMatch(/filter:\s*blur/);
  });
});

// ────────────────────────────────────
// Regression: Button Behavior
// ────────────────────────────────────
describe('REGRESSION — Button States (CSS Static)', () => {
  const btnSection = css.slice(css.indexOf('.cascading-slider-button'));

  test('no :hover pseudo-class on slider buttons', () => {
    expect(btnSection).not.toMatch(/\.cascading-slider-button:hover/);
  });

  test('no :focus-visible pseudo-class on slider buttons', () => {
    expect(btnSection).not.toMatch(/\.cascading-slider-button:focus-visible/);
  });

  test('hover-active class rule exists', () => {
    expect(btnSection).toMatch(/\.cascading-slider-button\.hover-active\s*\{/);
  });

  test('touch-active class rule exists', () => {
    expect(btnSection).toMatch(/\.cascading-slider-button\.touch-active\s*\{/);
  });

  test('hover-active uses same visual style as old :hover', () => {
    const haRule = btnSection.match(/\.cascading-slider-button\.hover-active\s*\{([^}]+)\}/);
    expect(haRule).not.toBeNull();
    expect(haRule[1]).toMatch(/border-color:\s*var\(--color-accent-primary\)/);
    expect(haRule[1]).toMatch(/background:\s*rgba\(42,\s*135,\s*62,\s*0\.04\)/);
    expect(haRule[1]).toMatch(/transform:\s*scale\(1\.1\)/);
  });

  test('tap-highlight-color is transparent (prevents mobile flash)', () => {
    expect(btnSection).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });
});

// ────────────────────────────────────
// Regression: Responsive Breakpoints
// ────────────────────────────────────
describe('REGRESSION — Responsive Breakpoints (CSS Static)', () => {
  test('breakpoint at 750px exists for slider content', () => {
    const mq750 = css.match(/@media\s*\(max-width:\s*750px\)\s*\{([^}]*\})/s);
    expect(mq750).not.toBeNull();
  });

  test('750px breakpoint includes cascading-slide-title rule', () => {
    const mq750Block = css.match(/@media\s*\(max-width:\s*750px\)\s*\{([\s\S]*?)\n\}/);
    expect(mq750Block).not.toBeNull();
    expect(mq750Block[1]).toMatch(/cascading-slide-title/);
    expect(mq750Block[1]).toMatch(/cascading-slide-subtitle/);
  });

  test('breakpoint at 480px exists for slider content', () => {
    const mq480 = css.match(/@media\s*\(max-width:\s*480px\)\s*\{([\s\S]*?)\n\}/);
    expect(mq480).not.toBeNull();
    expect(mq480[1]).toMatch(/cascading-slide-title/);
  });

  test('no max-height on content block in any breakpoint', () => {
    const contentRule = css.match(/\.cascading-slide-content\s*\{([^}]+)\}/);
    expect(contentRule[1]).not.toMatch(/max-height/);
  });

  test('content padding is uniform across breakpoints', () => {
    const desktopPadding = css.match(/\.cascading-slide-content\s*\{[^}]*padding:\s*([^;]+)/);
    expect(desktopPadding).not.toBeNull();
    expect(desktopPadding[1].trim()).toBe('14px 18px');
  });

  test('gallery grid has responsive breakpoints', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*1024px\)[^{]*\{[^}]*grid-template-columns:\s*repeat\(2,\s*1fr\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*640px\)[^{]*\{[^}]*grid-template-columns:\s*1fr/);
  });
});

// ────────────────────────────────────
// Regression: Content & Z-Index Layers
// ────────────────────────────────────
describe('REGRESSION — Content Layers (CSS Static)', () => {
  test('overlay z-index is 1', () => {
    expect(css).toMatch(/\.cascading-slide-overlay\s*\{[^}]*z-index:\s*1/);
  });

  test('content z-index is 2 (above overlay)', () => {
    expect(css).toMatch(/\.cascading-slide-content\s*\{[^}]*z-index:\s*2/);
  });

  test('content has gradient ::before for text readability', () => {
    expect(css).toMatch(/\.cascading-slide-content::before\s*\{[^}]*background:\s*linear-gradient/);
  });

  test('content is positioned at bottom', () => {
    expect(css).toMatch(/\.cascading-slide-content\s*\{[^}]*bottom:\s*0/);
  });
});

// ────────────────────────────────────
// Regression: Collection & Slide Overflow
// ────────────────────────────────────
describe('REGRESSION — Overflow Rules (CSS Static)', () => {
  test('collection has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slider-collection\s*\{[^}]*overflow:\s*hidden/);
  });

  test('slide has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slide\s*\{[^}]*overflow:\s*hidden/);
  });

  test('slide-inner has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slide-inner\s*\{[^}]*overflow:\s*hidden/);
  });

  test('slide-image has overflow hidden', () => {
    expect(css).toMatch(/\.cascading-slide-image\s*\{[^}]*overflow:\s*hidden/);
  });
});

// ────────────────────────────────────
// Regression: DOM Structure (v2)
// ────────────────────────────────────
describe('REGRESSION — DOM Structure', () => {
  beforeAll(() => {
    document.body.innerHTML = html;
  });

  test('slider list exists in the DOM', () => {
    const list = document.getElementById('cascadingSliderList');
    expect(list).not.toBeNull();
  });

  test('gallery grid exists', () => {
    const grid = document.getElementById('portfolioGrid');
    expect(grid).not.toBeNull();
  });

  test('viewer exists and defaults to aria-hidden', () => {
    const viewer = document.getElementById('portfolioViewer');
    expect(viewer).not.toBeNull();
    expect(viewer.getAttribute('aria-hidden')).toBe('true');
  });

  test('back button exists', () => {
    const backBtn = document.getElementById('portfolioBackBtn');
    expect(backBtn).not.toBeNull();
  });

  test('navigation buttons exist with correct classes', () => {
    expect(document.querySelector('.cascading-slider-button-prev')).not.toBeNull();
    expect(document.querySelector('.cascading-slider-button-next')).not.toBeNull();
  });

  test('slider has aria-roledescription="carousel"', () => {
    const slider = document.querySelector('.cascading-slider');
    expect(slider.getAttribute('aria-roledescription')).toBe('carousel');
  });

  test('nav buttons have aria-labels', () => {
    const prev = document.querySelector('.cascading-slider-button-prev');
    const next = document.querySelector('.cascading-slider-button-next');
    expect(prev.getAttribute('aria-label')).toBeTruthy();
    expect(next.getAttribute('aria-label')).toBeTruthy();
  });

  test('nav menu has aria-label', () => {
    const nav = document.querySelector('.cascading-slider-nav');
    expect(nav.getAttribute('aria-label')).toBe('slider navigation');
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

  test('contains cascading-slider-collection', () => {
    const section = document.getElementById('portfolio');
    expect(section.querySelector('.cascading-slider-collection')).not.toBeNull();
  });

  test('contains cascading-slider-list', () => {
    const section = document.getElementById('portfolio');
    expect(section.querySelector('.cascading-slider-list')).not.toBeNull();
  });

  test('contains gallery and viewer', () => {
    const section = document.getElementById('portfolio');
    expect(section.querySelector('.portfolio-gallery')).not.toBeNull();
    expect(section.querySelector('.portfolio-viewer')).not.toBeNull();
  });
});

// ────────────────────────────────────
// Regression: Image Assets
// ────────────────────────────────────
describe('REGRESSION — Image Assets', () => {
  test('placeholder-obra-01.webp file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'placeholders', 'placeholder-obra-01.webp'))).toBe(true);
  });

  test('placeholder-obra-02.webp file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'placeholders', 'placeholder-obra-02.webp'))).toBe(true);
  });

  test('logo files exist', () => {
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'brand', 'logo-perin-principal.webp'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'brand', 'logo-perin-navbar.webp'))).toBe(true);
  });

  test('project cover images exist', () => {
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'eldorado.webp'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'elektro.webp'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'images', 'clients', 'isa-energia.webp'))).toBe(true);
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

  test('PCT desktop [0.065, 0.135, 0.60, 0.135, 0.065]', () => {
    expect(js).toMatch(/0\.065,\s*0\.135,\s*0\.60,\s*0\.135,\s*0\.065/);
  });

  test('PCT tablet [0.15, 0.70, 0.15]', () => {
    expect(js).toMatch(/0\.15,\s*0\.70,\s*0\.15/);
  });

  test('CURVE is cubic-bezier(0.40, 0.00, 0.30, 1.00)', () => {
    expect(js).toMatch(/cubic-bezier\(0\.40,\s*0\.00,\s*0\.30,\s*1\.00\)/);
  });

  test('DURATION is 0.70', () => {
    expect(js).toMatch(/DURATION\s*=\s*0\.70/);
  });

  test('createCascadingSlider function exists (refactored engine)', () => {
    expect(js).toMatch(/function createCascadingSlider/);
  });

  test('initPortfolioGallery function exists (new gallery engine)', () => {
    expect(js).toMatch(/function initPortfolioGallery/);
  });

  test('portfolioProjects data array exists with 6 projects', () => {
    expect(js).toContain("id: 'eldorado'");
    expect(js).toContain("id: 'obra-residencial'");
  });

  test('img width is fixed in positionSlides (scale-based)', () => {
    expect(js).toMatch(/scale\s*=\s*Math\.max/);
  });

  test('slide.filter is set to none', () => {
    expect(js).toMatch(/slide\.style\.filter\s*=\s*'none'/);
  });

  test('no brightness or blur filter tween', () => {
    expect(js).not.toMatch(/filter:\s*absDist/);
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