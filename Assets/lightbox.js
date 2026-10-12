// Click an image with the "lightbox-image" class to view it at full size.
// Click anywhere or press Escape to close it again.
(function () {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
        <div>
            <img id="lightboxImage" alt="">
            <div class="lightbox-caption" id="lightboxCaption"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector('#lightboxImage');
    const overlayCaption = overlay.querySelector('#lightboxCaption');

    function openLightbox(img) {
        overlayImg.src = img.currentSrc || img.src;
        overlayImg.alt = img.alt || '';
        overlayCaption.textContent = img.alt || '';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        overlayImg.removeAttribute('src');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('img.lightbox-image').forEach(img => {
        img.tabIndex = 0;  // reachable with the keyboard too
        img.addEventListener('click', () => openLightbox(img));
        img.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(img);
            }
        });
    });

    overlay.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && overlay.classList.contains('active')) {
            closeLightbox();
        }
    });
})();
