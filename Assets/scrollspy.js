document.addEventListener('DOMContentLoaded', () => {
    const navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
    const sections = navLinks
        .map(link => {
            const target = document.querySelector(link.getAttribute('href'));
            return target ? { link, section: target } : null;
        })
        .filter(Boolean);

    if (!sections.length) {
        return;
    }

    let currentId = null;
    const setActive = (id) => {
        sections.forEach(({ link }) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });

        // On phones the page links scroll sideways in one row: keep the active one in view
        if (id !== currentId) {
            currentId = id;
            const active = sections.find(({ section }) => section.id === id);
            const strip = active && active.link.parentElement;
            if (strip && strip.scrollWidth > strip.clientWidth) {
                const left = active.link.offsetLeft - (strip.clientWidth - active.link.offsetWidth) / 2;
                strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
            }
        }
    };

    // After clicking a nav link, keep that link highlighted until the reader scrolls by themselves.
    // Without this, a short section near the bottom of the page could never be highlighted.
    let lockedId = null;
    const unlock = () => { lockedId = null; };
    ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(type => {
        window.addEventListener(type, event => {
            if (type === 'mousedown' && event.target.closest('nav')) return;
            unlock();
        }, { passive: true });
    });

    sections.forEach(({ link, section }) => {
        link.addEventListener('click', () => {
            lockedId = section.id;
            setActive(lockedId);
        });
    });

    const updateActiveSection = () => {
        if (lockedId) {
            setActive(lockedId);
            return;
        }

        const triggerPoint = window.innerHeight * 0.45;
        let activeSection = sections[0];

        for (const entry of sections) {
            const rect = entry.section.getBoundingClientRect();
            if (rect.top <= triggerPoint) {
                activeSection = entry;
            }
        }

        // When the page is scrolled all the way down, the last section is the active one,
        // even if it is too short to reach the trigger point.
        const lastEntry = sections[sections.length - 1];
        const lastRect = lastEntry.section.getBoundingClientRect();
        const isLastVisible = lastRect.top < window.innerHeight && lastRect.bottom > 0;
        const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

        if (window.scrollY > 0 && isLastVisible && isNearBottom) {
            activeSection = lastEntry;
        }

        setActive(activeSection.section.id);
    };

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveSection();
                ticking = false;
            });
            ticking = true;
        }
    };

    const initialHash = window.location.hash.slice(1);
    if (initialHash && sections.some(({ section }) => section.id === initialHash)) {
        lockedId = initialHash;
        setActive(initialHash);
    } else {
        setActive(sections[0].section.id);
        updateActiveSection();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash && sections.some(({ section }) => section.id === hash)) {
            lockedId = hash;
            setActive(hash);
        }
    });
});
