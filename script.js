(() => {
    const body = document.body;
    const menuButton = document.querySelector('.menu-button');
    const menuPanel = document.querySelector('.menu-panel');

    const closeMenu = ({ restoreFocus = false } = {}) => {
        if (!menuButton || !menuPanel) return;
        menuButton.setAttribute('aria-expanded', 'false');
        menuPanel.classList.remove('is-open');
        body.classList.remove('menu-open');
        if (restoreFocus) menuButton.focus();
    };

    if (menuButton && menuPanel) {
        menuButton.addEventListener('click', () => {
            const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
            menuButton.setAttribute('aria-expanded', String(willOpen));
            menuPanel.classList.toggle('is-open', willOpen);
            body.classList.toggle('menu-open', willOpen);
            if (willOpen) menuPanel.querySelector('a')?.focus();
        });
        menuPanel.addEventListener('click', (event) => {
            if (event.target === menuPanel || event.target.closest('a')) closeMenu();
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) closeMenu();
        });
    }

    const revealItems = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        revealItems.forEach((item, index) => {
            item.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
            observer.observe(item);
        });
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    }

    const fitLineGroups = [...document.querySelectorAll('[data-fit-lines]')];
    const fitLines = () => {
        fitLineGroups.forEach((group) => {
            group.style.removeProperty('font-size');
            const availableWidth = group.clientWidth;
            const lines = [...group.querySelectorAll(':scope > span')];
            const longestLine = Math.max(0, ...lines.map((line) => line.scrollWidth));
            if (!availableWidth || longestLine <= availableWidth) return;

            const currentSize = Number.parseFloat(getComputedStyle(group).fontSize);
            const fittedSize = Math.max(7, currentSize * ((availableWidth - 2) / longestLine));
            group.style.fontSize = `${fittedSize}px`;
        });
    };

    fitLines();
    document.fonts?.ready.then(fitLines);
    let fitFrame = 0;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(fitFrame);
        fitFrame = requestAnimationFrame(fitLines);
    });

    const galleryItems = [...document.querySelectorAll('[data-gallery-item]')];
    const lightbox = document.querySelector('[data-lightbox]');
    if (!galleryItems.length || !lightbox) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMenu({ restoreFocus: true });
        });
        return;
    }

    const image = lightbox.querySelector('[data-lightbox-image]');
    const caption = lightbox.querySelector('[data-lightbox-caption]');
    const count = lightbox.querySelector('[data-lightbox-count]');
    const closeButtons = lightbox.querySelectorAll('[data-lightbox-close]');
    const previousButton = lightbox.querySelector('[data-lightbox-prev]');
    const nextButton = lightbox.querySelector('[data-lightbox-next]');
    let currentIndex = 0;
    let previousFocus = null;
    let touchStartX = 0;

    const renderPhoto = () => {
        const item = galleryItems[currentIndex];
        image.src = item.dataset.src;
        image.alt = item.dataset.caption;
        caption.textContent = item.dataset.caption;
        count.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
    };

    const openLightbox = (index, trigger) => {
        currentIndex = index;
        previousFocus = trigger;
        renderPhoto();
        lightbox.hidden = false;
        body.classList.add('lightbox-open');
        lightbox.querySelector('.lightbox__close').focus();
    };

    const closeLightbox = () => {
        if (lightbox.hidden) return;
        lightbox.hidden = true;
        image.removeAttribute('src');
        body.classList.remove('lightbox-open');
        previousFocus?.focus();
    };

    const changePhoto = (direction) => {
        currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
        renderPhoto();
    };

    galleryItems.forEach((item, index) => item.addEventListener('click', () => openLightbox(index, item)));
    closeButtons.forEach((button) => button.addEventListener('click', closeLightbox));
    previousButton.addEventListener('click', () => changePhoto(-1));
    nextButton.addEventListener('click', () => changePhoto(1));

    lightbox.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (event) => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 55) changePhoto(distance > 0 ? -1 : 1);
    }, { passive: true });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (!lightbox.hidden) closeLightbox();
            else closeMenu({ restoreFocus: true });
            return;
        }
        if (lightbox.hidden) return;
        if (event.key === 'ArrowLeft') changePhoto(-1);
        if (event.key === 'ArrowRight') changePhoto(1);
        if (event.key === 'Tab') {
            const focusable = [...lightbox.querySelectorAll('button:not([disabled])')];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first.focus();
            }
        }
    });
})();
