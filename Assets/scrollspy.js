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

    const setActive = (id) => {
        sections.forEach(({ link }) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
    };

    const isHomePage = /(?:\/|\/index\.html)$/.test(window.location.pathname.replace(/\\/g, '/'));

    const updateActiveSection = () => {
        const triggerPoint = window.innerHeight * 0.45;
        let activeSection = sections[0];

        for (const entry of sections) {
            const rect = entry.section.getBoundingClientRect();
            if (rect.top <= triggerPoint) {
                activeSection = entry;
            }
        }

        if (isHomePage) {
            const lastEntry = sections[sections.length - 1];
            const lastRect = lastEntry.section.getBoundingClientRect();
            const isLastVisible = lastRect.top < window.innerHeight && lastRect.bottom > 0;
            const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

            if (isLastVisible && (isNearBottom || lastRect.height < triggerPoint)) {
                activeSection = lastEntry;
            }
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
        setActive(initialHash);
    } else {
        setActive(sections[0].section.id);
    }

    updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash && sections.some(({ section }) => section.id === hash)) {
            setActive(hash);
        }
    });
});
