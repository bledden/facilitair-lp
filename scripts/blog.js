// Blog Post Expand/Collapse Functionality

document.addEventListener('DOMContentLoaded', () => {
    const readMoreBtns = document.querySelectorAll('.read-more-btn');

    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.getAttribute('data-post');
            const fullContent = document.getElementById(`post-${postId}`);

            if (fullContent.style.display === 'none' || fullContent.style.display === '') {
                // Expand
                fullContent.style.display = 'block';
                btn.textContent = 'Show Less';

                // Smooth scroll to full content
                setTimeout(() => {
                    fullContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            } else {
                // Collapse
                fullContent.style.display = 'none';
                btn.textContent = 'Read Full Post';

                // Scroll back to post title
                const postCard = btn.closest('.blog-post-card');
                if (postCard) {
                    postCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Handle internal anchor links within expanded content
    const anchorLinks = document.querySelectorAll('.toc a');
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
});
