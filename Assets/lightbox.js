(function() {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <div>
            <img id="lightboxImage" src="" alt="">
            <div class="lightbox-caption" id="lightboxCaption"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector('#lightboxImage');
    const overlayCaption = overlay.querySelector('#lightboxCaption');
    const images = document.querySelectorAll('img.lightbox-image');

    function openLightbox(img) {
        overlayImg.src = img.src;
        overlayImg.alt = img.alt || img.title || 'Image';
        overlayCaption.textContent = img.alt || img.title || 'Image';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    images.forEach(img => {
        img.addEventListener('click', () => openLightbox(img));
    });

    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            closeLightbox();
        }
    });

    overlayImg.addEventListener('click', event => {
        event.stopPropagation();
    });

    overlay.addEventListener('transitionend', event => {
        if (event.propertyName === 'opacity' && !overlay.classList.contains('active')) {
            overlayImg.src = '';
            overlayCaption.textContent = '';
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && overlay.classList.contains('active')) {
            closeLightbox();
        }
    });
})();
