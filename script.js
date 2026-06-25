/* ============================================
   PERIN CONSTRUÇÕES — Premium JavaScript
   ============================================ */

'use strict';

// === DESIGN TOKENS (referência para edição) ===
// Cores: --cor-preto-puro, --cor-branco-gelo, --cor-verde-floresta, --cor-verde-brilhante, --cor-verde-neon, --cor-bege-escuro, --cor-cinza-acastanhado, --cor-creme

// === HERO PARTICLES ===
function createParticles() {
    const container = document.getElementById('heroParticles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (3 + Math.random() * 4) + 's';
        container.appendChild(particle);
    }
}

// === HERO MOUSE PARALLAX ===
function initHeroParallax() {
    const geometries = document.querySelector('.hero-geometries');
    const lighting = document.querySelector('.hero-lighting-layer');
    const grid = document.querySelector('.hero-grid-layer');

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        geometries.style.transform = `translate(${x * 20}px, ${y * 15}px)`;
        grid.style.transform = `translate(${x * 10}px, ${y * 8}px)`;

        const spots = lighting.querySelectorAll('.light-spot');
        spots.forEach((spot, index) => {
            const factor = (index + 1) * 5;
            spot.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
    });
}

// === HERO SCROLL EFFECTS — determinístico, derivado de heroProgress ===
// SEM ScrollTrigger scrub, SEM estados acumulados
// Cada frame calcula do zero: heroProgress → estilos visuais
function initHeroAnimations() {
    const hero = document.querySelector('.hero-architectural-scene');
    const canvas = document.querySelector('.hero-canvas');
    const overlay = document.querySelector('.hero-overlay-gradient');
    if (!hero || !canvas || !overlay) return;

    // Remove qualquer resíduo de estilos inline anteriores
    canvas.style.transform = '';
    canvas.style.opacity = '';
    overlay.style.height = '';

    // Calcula progresso (0 a 1) exclusivamente da posição atual do scroll
    function getHeroProgress() {
        const rect = hero.getBoundingClientRect();
        const heroH = hero.offsetHeight;
        // rect.top = 0 → progress 0 (topo)
        // rect.top = -heroH → progress 1 (totalmente passado)
        return Math.max(0, Math.min(1, -rect.top / heroH));
    }

    // Aplica estilos derivados exclusivamente do progresso — idempotente
    function applyHeroState(progress) {
        // Canvas: scale 1→0.95, opacity 1→0.5
        const scale = 1 - progress * 0.05;
        const opacity = 1 - progress * 0.5;
        canvas.style.transform = `scale(${scale})`;
        canvas.style.opacity = String(opacity);

        // Overlay: começa em 200px, cresce até no máximo 50% da altura da hero (max 400px)
        const maxOverlay = Math.min(hero.offsetHeight * 0.5, 400);
        const overlayH = 200 + (maxOverlay - 200) * progress;
        overlay.style.height = `${overlayH}px`;
    }

    // Apply imediatamente com o progresso atual
    applyHeroState(getHeroProgress());

    // Atualiza no scroll — sempre recalcula do zero, sem acumular
    window.addEventListener('scroll', () => {
        applyHeroState(getHeroProgress());
    }, { passive: true });

    // Recalcula no resize (hero height muda)
    window.addEventListener('resize', () => {
        applyHeroState(getHeroProgress());
    });
}

// === HERO ENTRANCE — safe for any scroll position ===
function initHeroEntrance() {
    const hero = document.querySelector('.hero-architectural-scene');
    if (!hero) return;

    // Force final state on all entrance elements FIRST (before any ScrollTrigger)
    // This prevents elements from remaining at opacity:0 if entrance never fires
    gsap.set('.hero-badge, .hero-title-line, .hero-subtitle, .hero-actions', {
        opacity: 1,
        y: 0,
        rotateX: 0,
    });

    // Then set initial animation state on elements that should animate
    // But only if hero is visible in viewport
    const isHeroVisible = hero.getBoundingClientRect().top < window.innerHeight;

    if (isHeroVisible) {
        // Reset to initial state for a fresh animation
        gsap.set('.hero-badge', { opacity: 0, y: 30 });
        gsap.set('.hero-title-line-1', { opacity: 0, y: 60, rotateX: 10 });
        gsap.set('.hero-title-line-2', { opacity: 0, y: 60, rotateX: 10 });
        gsap.set('.hero-title-line-3', { opacity: 0, y: 60, rotateX: 10 });
        gsap.set('.hero-subtitle', { opacity: 0, y: 30 });
        gsap.set('.hero-actions', { opacity: 0, y: 30 });

        // Animate entrance — NO delay, immediate
        const tl = gsap.timeline({
            delay: 0.4,
            defaults: { ease: 'power3.out' }
        });

        tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.7 })
        .to('.hero-title-line-1', { opacity: 1, y: 0, rotateX: 0, duration: 0.9 }, '-=0.3')
        .to('.hero-title-line-2', { opacity: 1, y: 0, rotateX: 0, duration: 0.9 }, '-=0.5')
        .to('.hero-title-line-3', { opacity: 1, y: 0, rotateX: 0, duration: 0.9 }, '-=0.5')
        .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .to('.hero-actions', { opacity: 1, y: 0, duration: 0.7 }, '-=0.3');
    }
    // If not visible, elements already have final state (opacity:1)
}

// === NAVIGATION ===
function initNavigation() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    function updateNav() {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
    document.addEventListener('scroll', updateNav, { passive: true });

    toggle.addEventListener('click', () => {
        const isActive = mobileMenu.classList.contains('active');
        toggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        toggle.setAttribute('aria-expanded', !isActive);
        document.body.style.overflow = isActive ? '' : 'hidden';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
}

// === SCROLL REVEAL ANIMATIONS ===
function initScrollReveals() {
    gsap.utils.toArray('.section-title-reveal').forEach(title => {
        gsap.to(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
            },
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
        });
    });

    gsap.utils.toArray('.text-reveal').forEach(text => {
        gsap.to(text, {
            scrollTrigger: {
                trigger: text,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
        });
    });

    gsap.utils.toArray('.process-step').forEach((step, i) => {
        ScrollTrigger.create({
            trigger: step,
            start: 'top 80%',
            onEnter: () => {
                setTimeout(() => {
                    step.classList.add('revealed');
                }, i * 200);
            },
            once: true,
        });
    });
}

// === COUNTER ANIMATIONS ===
function initCounters() {
    gsap.utils.toArray('.counter-target').forEach(counter => {
        const target = counter.getAttribute('data-target');
        const numTarget = parseFloat(target);
        
        if (isNaN(numTarget)) return;

        gsap.to(counter, {
            scrollTrigger: {
                trigger: counter,
                start: 'top 85%',
                once: true,
            },
            innerHTML: numTarget,
            duration: 2,
            ease: 'power2.out',
            snap: { innerHTML: 1 },
            onUpdate: function () {
                const val = Math.round(this.progress() * numTarget);
                counter.innerHTML = val;
                if (val >= numTarget) {
                    counter.innerHTML = target === '[anos]' ? '15+' : target === '[indice]' ? '98%' : '200+';
                }
            },
        });
    });
}

// === CASCADING SLIDER PORTFOLIO ===
function initCascadingSlider() {
    const list = document.getElementById('cascadingSliderList');
    const collection = document.querySelector('.cascading-slider-collection');
    const slides = list.querySelectorAll('.cascading-slide');
    const prevBtn = document.querySelector('.cascading-slider-button-prev');
    const nextBtn = document.querySelector('.cascading-slider-button-next');
    let currentIndex = 0;
    const total = slides.length;

    const DURATION = 0.70;
    const CURVE = 'cubic-bezier(0.40, 0.00, 0.30, 1.00)';
    let isTransitioning = false;

    // Proportions per breakpoint (sum = 100% of usable width)
    const PCT_DESKTOP   = [0.065, 0.135, 0.60, 0.135, 0.065]; // >1200px:  5 slots
    const PCT_NOTEBOOK  = [0.08,  0.16,  0.52,  0.16,  0.08];  // ≤1200px:  5 slots
    const PCT_TABLET    = [0.15,  0.70,  0.15];                 // ≤750px:   3 slots
    const PCT_MOBILE    = [0.10,  0.80,  0.10];                 // ≤480px:   3 slots
    const gap = 8;

    // --- Clean up leftover inline styles from older implementations ---
    list.style.display = '';
    list.style.willChange = '';
    list.style.backfaceVisibility = '';
    list.style.transform = '';
    list.style.width = '';
    list.style.overflow = '';

    slides.forEach((slide) => {
        slide.style.position = 'absolute';
        slide.style.flex = '';
        slide.style.display = '';
        slide.style.border = 'none';
        slide.style.boxShadow = 'none';
        slide.style.filter = 'none';
        slide.style.margin = '0';
        slide.style.willChange = 'left, width, opacity';
        slide.style.backfaceVisibility = 'hidden';
        slide.style.transform = '';
        slide.style.transition = 'none';
        slide.style.pointerEvents = '';

        const img = slide.querySelector('.cascading-slide-image img');
        if (img) {
            img.style.width = 'auto';
            img.style.height = '100%';
            img.style.minWidth = '';
            img.style.maxWidth = 'none';
        }
        const svg = slide.querySelector('.cascading-slide-image svg');
        if (svg) {
            svg.removeAttribute('viewBox');
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.display = 'block';
        }
    });

    function getBreakpoint() {
        const w = window.innerWidth;
        if (w <= 480) return 'mobile';
        if (w <= 750) return 'tablet';
        if (w <= 1200) return 'notebook';
        return 'desktop';
    }

    function getPCT() {
        const bp = getBreakpoint();
        switch (bp) {
            case 'mobile':   return { pct: PCT_MOBILE,   slots: 3 };
            case 'tablet':   return { pct: PCT_TABLET,   slots: 3 };
            case 'notebook': return { pct: PCT_NOTEBOOK, slots: 5 };
            default:         return { pct: PCT_DESKTOP,  slots: 5 };
        }
    }

    function getSizes() {
        const cw = list.offsetWidth;
        const { pct, slots } = getPCT();
        const ch = 420;
        const totalGaps = gap * (slots - 1);
        const usable = cw - totalGaps;
        const ws = (slots === 3)
            ? [Math.round(usable * pct[0]), Math.round(usable * pct[1]), Math.round(usable * pct[2])]
            : pct.slice(0, 5).map(p => Math.round(usable * p));
        return { containerWidth: cw, containerHeight: ch, ws, slots };
    }

    function positionSlides(index) {
        const { containerWidth, containerHeight, ws, slots } = getSizes();

        slides.forEach((slide) => {
            slide.style.transition = 'none';
            slide.style.height = containerHeight + 'px';
        });
        list.style.height = containerHeight + 'px';
        collection.style.height = containerHeight + 'px';

        const visibleByDist = {};
        slides.forEach((slide, i) => {
            let dist = i - index;
            if (dist < -Math.floor(total / 2)) dist += total;
            if (dist > Math.floor(total / 2)) dist -= total;
            visibleByDist[dist] = slide;
        });

        const showSlide = (dist, slotStyle) => {
            const slide = visibleByDist[dist];
            if (!slide || !slotStyle) return;
            const absDist = Math.abs(dist);
            slide.style.transition = 'none';
            slide.style.height = containerHeight + 'px';
            slide.style.top = '50%';
            slide.style.transform = 'translateY(-50%)';
            slide.style.opacity = '1';
            slide.style.zIndex = Math.max(1, 10 - absDist);
            slide.style.pointerEvents = 'auto';
            gsap.killTweensOf(slide);
            gsap.to(slide, {
                left: slotStyle.left + 'px',
                width: slotStyle.width + 'px',
                duration: DURATION,
                ease: CURVE,
                overwrite: true,
            });
        };

        const numSlots = ws.length;
        const slotStyles = [];
        let accumulatedLeft = 0;
        for (let s = 0; s < numSlots; s++) {
            slotStyles.push({ left: accumulatedLeft, width: ws[s] });
            accumulatedLeft += ws[s] + gap;
        }

        if (slots === 3) {
            // Tablet/Mobile: 3 slots — [prev, current, next]
            // slot 0: dist -1, slot 1: dist 0, slot 2: dist 1
            showSlide(-1, slotStyles[0]);
            showSlide(0,  slotStyles[1]);
            showSlide(1,  slotStyles[2]);
            // Hide out-of-view slides
            slides.forEach(slide => {
                const sd = parseInt(Object.keys(visibleByDist).find(k => visibleByDist[k] === slide) || '');
                if (sd < -1 || sd > 1) {
                    slide.style.opacity = '0';
                    slide.style.pointerEvents = 'none';
                }
            });
        } else {
            // Desktop/Notebook: 5 slots — [-2, -1, 0, 1, 2]
            for (let d = -2; d <= 2; d++) {
                showSlide(d, slotStyles[d + 2]);
            }
        }

        // Update data-status on visible slides
        Object.entries(visibleByDist).forEach(([distStr, slide]) => {
            slide.removeAttribute('data-status');
            const d = parseInt(distStr);
            if (d === 0) slide.setAttribute('data-status', 'active');
            else if (Math.abs(d) <= 1) slide.setAttribute('data-status', 'near');
        });

        // Content visibility — show text only on the active (center) slide
        Object.values(visibleByDist).forEach((slide) => {
            const isActive = slide.getAttribute('data-status') === 'active';
            const content = slide.querySelector('.cascading-slide-content');
            if (content) {
                if (isActive) {
                    content.style.display = 'block';
                    content.style.transition = `opacity ${DURATION}s ${CURVE}, transform ${DURATION}s ${CURVE}`;
                    content.style.transitionDelay = '0.1s';
                    content.style.opacity = '1';
                    content.style.transform = 'translateY(0)';
                } else {
                    content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    content.style.transitionDelay = '0s';
                    content.style.opacity = '0';
                    content.style.transform = 'translateY(15px)';
                }
            }
        });

        // Fix image sizes — uniform scale across all slides, zero gaps
        const centerW = ws[Math.floor(ws.length / 2)]; // center slot width
        const imgScaleBase = Math.max(
            centerW / (slides[0].querySelector('img')?.naturalWidth || 1),
            containerHeight / (slides[0].querySelector('img')?.naturalHeight || 1)
        );

        slides.forEach((slide) => {
            const img = slide.querySelector('.cascading-slide-image img');
            if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                // Same scale for all images → same visual size, no zoom on transition
                const scale = Math.max(
                    centerW / img.naturalWidth,
                    containerHeight / img.naturalHeight
                );
                img.style.width  = Math.round(img.naturalWidth  * scale) + 'px';
                img.style.height = Math.round(img.naturalHeight * scale) + 'px';
            }
        });
    }

    function initSlides() {
        positionSlides(currentIndex);
    }

    function goTo(idx, btn = null) {
        if (isTransitioning || idx === currentIndex) return;
        isTransitioning = true;
        currentIndex = idx;
        positionSlides(currentIndex);
        if (btn) btn.classList.add('hover-active');
        setTimeout(() => {
            isTransitioning = false;
            if (btn) btn.classList.remove('hover-active');
        }, (DURATION + 0.02) * 1000);
    }

    slides.forEach((slide, i) => { slide.addEventListener('click', () => goTo(i)); });
    prevBtn.addEventListener('click', () => goTo((currentIndex - 1 + total) % total, prevBtn));
    nextBtn.addEventListener('click', () => goTo((currentIndex + 1) % total, nextBtn));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goTo((currentIndex - 1 + total) % total);
        if (e.key === 'ArrowRight') goTo((currentIndex + 1) % total);
    });

    // Resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initSlides();
        }, 150);
    });

    // Initial render via requestAnimationFrame
    requestAnimationFrame(() => {
        initSlides();
    });
}

// === SERVICE MOSAIC INTERACTIONS ===
function initServicesInteraction() {
    document.querySelectorAll('.service-mosaic-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            gsap.to(item.querySelector('.service-mosaic-visual svg'), {
                scale: 1.1, rotate: 5, duration: 0.4, ease: 'power2.out',
            });
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(item.querySelector('.service-mosaic-visual svg'), {
                scale: 1, rotate: 0, duration: 0.4, ease: 'power2.out',
            });
        });
    });
}

// === FORM VALIDATION HELPERS ===
function setFieldError(groupId, message) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('form-group-valid');
    group.classList.add('form-group-error');
    const msgEl = group.querySelector('.form-error-message');
    if (msgEl && message) {
        msgEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="7" fill="#D32F2F" opacity="0.15"/>
            <path d="M7 4V8M7 10V10.01" stroke="#D32F2F" stroke-width="1.5" stroke-linecap="round"/>
        </svg> ${message}`;
    }
}

function setFieldValid(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('form-group-error');
    group.classList.add('form-group-valid');
}

function clearFieldValidation(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('form-group-error', 'form-group-valid');
}

function clearAllValidations() {
    ['formGroupName', 'formGroupPhone', 'formGroupEmail', 'formGroupService'].forEach(clearFieldValidation);
}

// === PHONE MASK ===
function applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = '';
    if (value.length > 0) {
        formatted = '(' + value.slice(0, 2);
    }
    if (value.length > 2) {
        formatted += ') ' + value.slice(2, 7);
    }
    if (value.length > 7) {
        formatted += '-' + value.slice(7, 11);
    }
    input.value = formatted;
    return value; // returns raw digits
}

// === NAME VALIDATION ===
function validateName(name) {
    // Only letters, spaces, accents
    const cleaned = name.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    return {
        valid: cleaned.length >= 2 && cleaned.trim().length >= 2,
        cleaned: cleaned
    };
}

function capitalizeName(name) {
    return name
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
}

// === EMAIL VALIDATION ===
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// === CHECK NAME FIELD ===
function checkName() {
    const input = document.getElementById('formName');
    const raw = input.value;
    const { valid, cleaned } = validateName(raw);

    // Auto-remove invalid chars, preserve spaces
    if (raw !== cleaned) {
        input.value = cleaned;
    }

    if (!cleaned || cleaned.trim().length === 0) {
        clearFieldValidation('formGroupName');
        return false;
    }
    if (!valid) {
        setFieldError('formGroupName', 'Digite um nome válido (apenas letras e espaços).');
        return false;
    }
    setFieldValid('formGroupName');
    return true;
}

function checkNameOnBlur() {
    const input = document.getElementById('formName');
    const raw = input.value;
    const { cleaned } = validateName(raw);
    if (cleaned.trim().length > 0) {
        input.value = capitalizeName(cleaned);
    }
    // Re-validate after capitalization
    checkName();
}

// === CHECK PHONE FIELD ===
function checkPhone() {
    const input = document.getElementById('formPhone');
    const digits = input.value.replace(/\D/g, '');

    if (digits.length === 0) {
        clearFieldValidation('formGroupPhone');
        return false;
    }
    if (digits.length < 10 || digits.length > 11) {
        setFieldError('formGroupPhone', 'Digite um telefone válido com DDD.');
        return false;
    }
    setFieldValid('formGroupPhone');
    return true;
}

// === CHECK EMAIL FIELD ===
function checkEmail() {
    const input = document.getElementById('formEmail');
    const email = input.value.trim();

    if (email.length === 0) {
        clearFieldValidation('formGroupEmail');
        return false;
    }
    if (!validateEmail(email)) {
        setFieldError('formGroupEmail', 'Digite um email válido.');
        return false;
    }
    setFieldValid('formGroupEmail');
    return true;
}

// === CHECK SERVICE FIELD ===
function checkService() {
    const wrapper = document.getElementById('customServiceWrapper');
    const selectedText = document.getElementById('customServiceText');
    const hasValue = selectedText.classList.contains('selected');

    if (!hasValue) {
        setFieldError('formGroupService', 'Selecione um tipo de serviço.');
        return false;
    }
    setFieldValid('formGroupService');
    return true;
}

// === CONTACT FORM ===
function initContactForm() {
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('formName');
    const phoneInput = document.getElementById('formPhone');
    const emailInput = document.getElementById('formEmail');
    const msgInput = document.getElementById('formMessage');

    // --- Phone mask ---
    phoneInput.addEventListener('input', function () {
        applyPhoneMask(this);
        // Validate after mask update
        const digits = this.value.replace(/\D/g, '');
        if (digits.length > 0) checkPhone();
        else clearFieldValidation('formGroupPhone');
    });
    phoneInput.addEventListener('blur', checkPhone);

    // --- Name validations ---
    nameInput.addEventListener('input', function () {
        const { cleaned } = validateName(this.value);
        if (this.value !== cleaned) this.value = cleaned;
        if (cleaned.trim().length > 0) checkName();
        else clearFieldValidation('formGroupName');
    });
    nameInput.addEventListener('blur', checkNameOnBlur);

    // --- Email validations ---
    emailInput.addEventListener('input', function () {
        if (this.value.trim().length > 0) checkEmail();
        else clearFieldValidation('formGroupEmail');
    });
    emailInput.addEventListener('blur', checkEmail);

    // --- Service validation ---
    // Clear error when user selects a service
    document.getElementById('customServiceTrigger').addEventListener('click', function () {
        // Will be validated on submit, just clear error if reopening
        const selectedText = document.getElementById('customServiceText');
        if (selectedText && selectedText.classList.contains('selected')) {
            setFieldValid('formGroupService');
        } else {
            clearFieldValidation('formGroupService');
        }
    });

    // --- Prepare data for API submission ---
    function sanitizeString(str) {
        // Trim, strip HTML tags, limit length
        return String(str)
            .trim()
            .replace(/<[^>]*>/g, '')
            .slice(0, 1000);
    }

    function buildPayload() {
        // Read raw values, strip masks, sanitize
        const name = sanitizeString(document.getElementById('formName').value);
        const phoneRaw = document.getElementById('formPhone').value.replace(/\D/g, '');
        const email = sanitizeString(document.getElementById('formEmail').value);
        const service = document.getElementById('customServiceText').classList.contains('selected')
            ? (window.getSelectedService ? window.getSelectedService() : '')
            : '';
        const message = sanitizeString(document.getElementById('formMessage').value);

        return {
            name,
            phone: phoneRaw,
            email,
            service,
            message,
            // Metadata for server-side validation & rate limiting
            _timestamp: Date.now(),
            _source: 'perin_contact_form_v1',
        };
    }

    function submitToAPI(payload) {
        // ============================================================
        // FUTURE: Replace this mock with actual API call:
        //
        // fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(payload),
        // })
        // .then(res => { if (!res.ok) throw new Error('Server error'); })
        // .then(showSuccess)
        // .catch(err => showError(err.message));
        //
        // Server-side should validate:
        //   - CSRF token
        //   - Rate limit (IP, session)
        //   - honeypot (website field filled = bot)
        //   - Name: 2-100 chars, letters/spaces/accents only
        //   - Phone: 10-11 digits
        //   - Email: valid format
        //   - Service: must be in allowed list
        //   - Message: 1-5000 chars
        //   - Sanitize all inputs (XSS, SQLi)
        //   - Log attempt (correlation ID)
        // ============================================================

        // For now, simulate success with animated feedback
        const submitBtn = document.getElementById('formSubmit');
        const originalText = submitBtn.querySelector('.form-submit-text');

        gsap.to(submitBtn, {
            scale: 0.95, duration: 0.1,
            ease: 'power2.out', yoyo: true, repeat: 1,
        });

        originalText.textContent = 'Mensagem Enviada!';
        gsap.to(submitBtn, {
            background: '#3FCC5B', duration: 0.3, ease: 'power2.out',
        });

        // Log sanitized payload for debugging
        console.log('[Perin Form] Payload ready for API:', JSON.stringify(payload, null, 2));

        setTimeout(() => {
            originalText.textContent = 'Enviar Mensagem';
            gsap.to(submitBtn, {
                background: '#2A873E', duration: 0.3, ease: 'power2.out',
            });
            form.reset();
            clearAllValidations();
        }, 3000);
    }

    // --- Form submit ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Honeypot check — bots fill hidden fields
        const websiteField = document.getElementById('formWebsite');
        if (websiteField && websiteField.value.trim() !== '') {
            // Silently reject — don't let the bot know it was detected
            console.warn('[Perin Form] Honeypot triggered — bot detected, submission rejected.');
            // Show success to deceive bot, but don't send data
            const submitBtn = document.getElementById('formSubmit');
            const originalText = submitBtn.querySelector('.form-submit-text');
            originalText.textContent = 'Mensagem Enviada!';
            gsap.to(submitBtn, { background: '#3FCC5B', duration: 0.3, ease: 'power2.out' });
            setTimeout(() => {
                originalText.textContent = 'Enviar Mensagem';
                gsap.to(submitBtn, { background: '#2A873E', duration: 0.3, ease: 'power2.out' });
                form.reset();
                clearAllValidations();
            }, 3000);
            return;
        }

        // 2. Update hidden service input with selected value
        const serviceInput = document.getElementById('formService');
        if (serviceInput && window.getSelectedService) {
            serviceInput.value = window.getSelectedService() || '';
        }

        // 3. Run client-side validations (UX only — server re-validates)
        const nameOk = checkName();
        const phoneOk = checkPhone();
        const emailOk = checkEmail();
        const msgOk = msgInput.value.trim().length > 0;
        const serviceOk = checkService();

        if (!nameOk || !phoneOk || !emailOk || !msgOk || !serviceOk) {
            // Scroll to first error
            const firstError = document.querySelector('.form-group-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = firstError.querySelector('input, textarea, button');
                if (input) input.focus();
            }
            return;
        }

        // 4. Build sanitized payload and submit
        const payload = buildPayload();
        submitToAPI(payload);
    });

    // Floating labels: add/remove 'filled' class on input/change
    document.querySelectorAll('.form-floating-input').forEach(input => {
        function updateFilled() {
            if (input.value.trim() !== '') {
                input.classList.add('filled');
            } else {
                input.classList.remove('filled');
            }
        }
        input.addEventListener('input', updateFilled);
        input.addEventListener('change', updateFilled);
        updateFilled();
    });
}

// === CUSTOM SELECT (Tipo de Serviço) ===
function initCustomSelect() {
    const wrapper = document.getElementById('customServiceWrapper');
    const trigger = document.getElementById('customServiceTrigger');
    const optionsList = document.getElementById('customServiceOptions');
    const triggerText = document.getElementById('customServiceText');
    const options = optionsList.querySelectorAll('li[role="option"]');
    let isOpen = false;
    let selectedValue = '';
    let selectedIndex = -1;

    function toggleOpen() {
        isOpen = !isOpen;
        trigger.classList.toggle('open', isOpen);
        optionsList.classList.toggle('open', isOpen);
        trigger.setAttribute('aria-expanded', isOpen);
        wrapper.classList.toggle('has-value', selectedValue !== '');
    }

    function close() {
        isOpen = false;
        trigger.classList.remove('open');
        optionsList.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    }

    function selectOption(option) {
        const value = option.getAttribute('data-value');
        const text = option.querySelector('span').textContent;

        // Update trigger display
        triggerText.textContent = text;
        triggerText.classList.add('selected');
        selectedValue = value;
        wrapper.classList.add('has-value');

        // Update aria-selected on all options
        options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
        option.setAttribute('aria-selected', 'true');

        // Store selected index
        options.forEach((opt, i) => {
            if (opt === option) selectedIndex = i;
        });

        close();
    }

    // Trigger click
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOpen();
    });

    // Option click
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectOption(option);
        });

        // Keyboard support
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(option);
            }
        });
    });

    // Keyboard navigation on trigger
    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) toggleOpen();
            if (e.key === 'ArrowDown' && isOpen) {
                const nextIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0;
                options[nextIndex].focus();
            }
        }
        if (e.key === 'Escape' && isOpen) {
            close();
            trigger.focus();
        }
    });

    // Keyboard navigation inside options list
    optionsList.addEventListener('keydown', (e) => {
        const currentIndex = Array.from(options).indexOf(document.activeElement);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
            options[nextIndex].focus();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
            options[prevIndex].focus();
        }
        if (e.key === 'Escape') {
            close();
            trigger.focus();
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectOption(options[currentIndex]);
            trigger.focus();
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target) && isOpen) {
            close();
        }
    });

    // Expose selected value for form submission
    window.getSelectedService = function () {
        return selectedValue;
    };
}

// === BUTTON RIPPLE EFFECT ===
function initButtonRipple() {
    document.querySelectorAll('.hero-button-primary, .form-submit-button').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = this.querySelector('.hero-button-glow, .form-submit-ripple') || this;
            gsap.fromTo(ripple,
                { scale: 0, opacity: 0.5 },
                {
                    scale: 3, opacity: 0, duration: 0.6,
                    ease: 'power2.out',
                    transformOrigin: `${e.offsetX}px ${e.offsetY}px`,
                }
            );
        });
    });
}

// === SCROLL REVEAL HELPERS ===
function initDifferentialsAnimation() {
    gsap.utils.toArray('.differential-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none reverse' },
            opacity: 0, y: 40, duration: 0.6, delay: i * 0.1, ease: 'power2.out',
        });
    });
}

function initServicesReveal() {
    gsap.utils.toArray('.service-mosaic-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none reverse' },
            opacity: 0, y: 40, duration: 0.6, delay: i * 0.1, ease: 'power2.out',
        });
    });
}

function initValuesReveal() {
    gsap.utils.toArray('.value-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: '.values-row', start: 'top 80%', toggleActions: 'play none none reverse' },
            opacity: 0, y: 40, duration: 0.6, delay: i * 0.15, ease: 'power2.out',
        });
    });
}

function initTestimonialsReveal() {
    gsap.utils.toArray('.testimonial-card').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none reverse' },
            opacity: 0, y: 40, duration: 0.6, delay: i * 0.15, ease: 'power2.out',
        });
    });
}

// === SERVICE MOSAIC GRID - DYNAMIC SIZING ===
function initServiceGridAdjust() {
    const adjustGrid = () => {
        const mosaic = document.getElementById('servicesMosaic');
        if (!mosaic) return;
        if (window.innerWidth <= 768) {
            mosaic.querySelectorAll('.service-mosaic-item').forEach(item => {
                item.style.gridColumn = '';
                item.style.gridRow = '';
            });
        }
    };
    adjustGrid();
    window.addEventListener('resize', adjustGrid);
}

// === CLIENTS CAROUSEL — physics-based drag, inertia, directional memory ===
function initClientsCarousel() {
    const track = document.getElementById('clientsTrack');
    if (!track) return;

    const originalSlides = Array.from(track.querySelectorAll('.clients-carousel-slide'));
    if (originalSlides.length < 2) return;

    let slideWidth = originalSlides[0].offsetWidth;
    const totalOriginal = originalSlides.length;
    const setWidth = totalOriginal * slideWidth;

    // Clone all slides twice for seamless infinite loop (3 sets total)
    for (let i = 0; i < 2; i++) {
        originalSlides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
    }

    // Set CSS custom properties for slide dimensions (used by card sizing)
    function setSlideDimensions() {
        const w = originalSlides[0].offsetWidth;
        const h = originalSlides[0].offsetHeight;
        track.style.setProperty('--slide-w', w + 'px');
        track.style.setProperty('--slide-h', h + 'px');
    }
    setSlideDimensions();

    // Physics state
    let currentX = -setWidth;          // start at first original set
    let velocity = 0;
    let baseSpeed = -2.8;              // px per frame, leftward (right-to-left) — negative = ← ← ←
    const FRICTION = 0.95;             // inertia deceleration (higher = slides longer)
    const RETURN_SPRING = 0.025;       // how fast velocity returns to baseSpeed
    const MAX_SPEED = 22;              // max momentum on release
    const DRAG_FACTOR = 1.05;          // momentum multiplier on release
    let isDragging = false;
    let lastPointerX = 0;
    let dragDelta = 0;
    let rafId = null;

    track.style.willChange = 'transform';

    function animate() {
        if (!isDragging) {
            // Velocity drifts toward current baseSpeed (directional memory)
            velocity += (baseSpeed - velocity) * RETURN_SPRING;
            velocity *= FRICTION;

            // Snap to baseSpeed if very close
            if (Math.abs(velocity - baseSpeed) < 0.005) {
                velocity = baseSpeed;
            }
        }

        currentX += velocity;

        // Seamless wrap
        const wrapThreshold = setWidth * 1.5;
        if (currentX < -wrapThreshold) {
            currentX += setWidth;
        } else if (currentX > -setWidth * 0.5) {
            currentX -= setWidth;
        }

        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
        rafId = requestAnimationFrame(animate);
    }

    function start() {
        if (rafId) return;
        velocity = baseSpeed;
        rafId = requestAnimationFrame(animate);
    }

    // --- Drag handlers ---
    function onPointerDown(e) {
        isDragging = true;
        const x = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        lastPointerX = x;
        dragDelta = 0;
        track.style.transition = 'none';
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const dx = x - lastPointerX;
        lastPointerX = x;
        dragDelta += dx;
        currentX += dx;

        // Wrap during drag
        const wrapThreshold = setWidth * 1.5;
        if (currentX < -wrapThreshold) {
            currentX += setWidth;
        } else if (currentX > -setWidth * 0.5) {
            currentX -= setWidth;
        }

        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    }

    function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;

        // Calculate momentum from drag — positive = right, negative = left
        const momentum = dragDelta * DRAG_FACTOR;

        // Clamp momentum
        const clampedMomentum = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, momentum));

        // If there was meaningful drag, set direction + velocity from it
        if (Math.abs(clampedMomentum) > 0.1) {
            velocity = clampedMomentum;
            baseSpeed = clampedMomentum > 0
                ? Math.max(clampedMomentum * 0.3, 0.5)   // rightward
                : Math.min(clampedMomentum * 0.3, -0.5); // leftward
            // Ensure baseSpeed isn't zero
            if (Math.abs(baseSpeed) < 0.5) baseSpeed = baseSpeed >= 0 ? 0.5 : -0.5;
        }
        // If no meaningful drag, keep current direction
        // baseSpeed remembers the last direction set by the user

        dragDelta = 0;
    }

    // Mouse events
    track.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Touch events
    track.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    // Prevent text selection while dragging
    track.addEventListener('dragstart', (e) => e.preventDefault());

    // Resize
    const resizeObserver = new ResizeObserver(() => {
        slideWidth = originalSlides[0].offsetWidth;
    });
    resizeObserver.observe(track);

    // Start
    start();
}

// === DIAGNÓSTICO — Hero State Inspector ===
// Loga estado de todos os elementos da Hero para identificar o bug de reload
function diagnoseHeroState(label) {
    const els = {
        canvas: document.querySelector('.hero-canvas'),
        overlay: document.querySelector('.hero-overlay-gradient'),
        badge: document.querySelector('.hero-badge'),
        title1: document.querySelector('.hero-title-line-1'),
        title2: document.querySelector('.hero-title-line-2'),
        title3: document.querySelector('.hero-title-line-3'),
        subtitle: document.querySelector('.hero-subtitle'),
        actions: document.querySelector('.hero-actions'),
        geometries: document.querySelector('.hero-geometries'),
        grid: document.querySelector('.hero-grid-layer'),
        lighting: document.querySelector('.hero-lighting-layer'),
    };
    
    console.log(`%c[Hero DIAG ${label}]`, 'font-weight:bold;color:#2A873E;');
    
    Object.entries(els).forEach(([name, el]) => {
        if (!el) return;
        const cs = getComputedStyle(el);
        console.log(`  ${name}:`, {
            opacity: cs.opacity,
            transform: cs.transform,
            visibility: cs.visibility,
            display: cs.display,
            height: cs.height,
            // If transform is applied, show parsed values
            hasScale: cs.transform !== 'none' && cs.transform.includes('scale'),
            hasTranslate: cs.transform !== 'none' && (cs.transform.includes('translateY') || cs.transform.includes('translateX')),
            hasRotate: cs.transform !== 'none' && cs.transform.includes('rotate'),
        });
    });
    
    // Hero scroll position context
    const hero = document.querySelector('.hero-architectural-scene');
    if (hero) {
        const rect = hero.getBoundingClientRect();
        const heroH = hero.offsetHeight;
        const progress = Math.max(0, Math.min(1, -rect.top / heroH));
        console.log(`  heroProgress: ${progress.toFixed(3)} (rect.top=${rect.top}, height=${heroH}, scrollY=${window.scrollY})`);
    }
    
    console.log('---');
}

// === INIT ALL ===
function initPage() {
    createParticles();
    initHeroParallax();
    initHeroEntrance();
    initHeroAnimations();
    initNavigation();
    initScrollReveals();
    initCounters();
    initServicesReveal();
    initDifferentialsAnimation();
    initValuesReveal();
    initTestimonialsReveal();
    initServicesInteraction();
    initButtonRipple();
    initContactForm();
    initCustomSelect();
    initServiceGridAdjust();
    initCascadingSlider();
    initClientsCarousel();

    // ScrollTrigger refresh on resize
    window.addEventListener('resize', () => ScrollTrigger.refresh());
    ScrollTrigger.config({ ignoreMobileResize: true });
}

// Initialize page immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
