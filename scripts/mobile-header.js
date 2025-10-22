// Mobile Header Scroll Shrinking

let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Only apply on mobile devices
    if (window.innerWidth <= 768) {
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    } else {
        header.classList.remove('scrolled');
    }

    lastScrollTop = scrollTop;
});

// Also check on resize
window.addEventListener('resize', () => {
    const header = document.querySelector('.header');
    if (window.innerWidth > 768) {
        header.classList.remove('scrolled');
    }
});
