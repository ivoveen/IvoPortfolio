(function() {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <div>
            <img id="lightboxImage" src="" alt="">
            <video id="lightboxVideo" hidden muted loop playsinline controls></video>
            <div class="lightbox-caption" id="lightboxCaption"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector('#lightboxImage');
    const overlayVideo = overlay.querySelector('#lightboxVideo');
    const overlayCaption = overlay.querySelector('#lightboxCaption');
    const images = document.querySelectorAll('img.lightbox-image');
    const videos = document.querySelectorAll('video.project-video');
    let sourceVideo = null;
    let sourceVideoWasPlaying = false;

    function openLightbox(img) {
        overlayVideo.pause();
        overlayVideo.removeAttribute('src');
        overlayVideo.load();
        overlayVideo.hidden = true;
        overlayImg.hidden = false;
        overlayImg.src = img.src;
        overlayImg.alt = img.alt || img.title || 'Image';
        overlayCaption.textContent = img.alt || img.title || 'Image';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openVideoLightbox(video) {
        overlayImg.hidden = true;
        overlayVideo.hidden = false;
        overlayVideo.src = video.currentSrc || video.src;
        overlayVideo.loop = video.loop;
        overlayVideo.muted = video.muted;
        overlayVideo.autoplay = true;
        overlayCaption.textContent = video.getAttribute('aria-label') || video.title || 'Video';
        sourceVideo = video;
        sourceVideoWasPlaying = !video.paused && !video.ended;
        video.pause();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        overlayVideo.play().catch(error => {
            if (error.name !== 'AbortError') {
                console.warn('Lightbox video could not autoplay; use the video controls to start playback.', error);
            }
        });
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        overlayVideo.pause();

        if (sourceVideo && sourceVideoWasPlaying) {
            sourceVideo.play().catch(error => {
                console.warn('Inline video could not resume after closing the lightbox.', error);
            });
        }
        sourceVideo = null;
        sourceVideoWasPlaying = false;
    }

    images.forEach(img => {
        img.addEventListener('click', () => openLightbox(img));
    });

    videos.forEach(video => {
        video.addEventListener('click', () => openVideoLightbox(video));
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
            overlayVideo.removeAttribute('src');
            overlayVideo.load();
            overlayCaption.textContent = '';
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && overlay.classList.contains('active')) {
            closeLightbox();
        }
    });
})();
