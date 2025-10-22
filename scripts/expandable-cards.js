// Expandable Card Functionality for All Expandable Cards
// Desktop: Row-based expansion (all cards in same row expand together)
// Mobile: One-at-a-time accordion behavior

document.addEventListener('DOMContentLoaded', () => {
    const expandableCards = document.querySelectorAll('.expandable-card');

    // Helper function to check if we're on mobile
    const isMobile = () => window.innerWidth < 768;

    // Helper function to get all cards in the same row
    const getCardsInSameRow = (card, parentContainer) => {
        if (!parentContainer) return [card];

        const allCards = Array.from(parentContainer.querySelectorAll('.expandable-card'));
        const cardTop = card.offsetTop;

        // Get all cards with the same offsetTop (same row)
        return allCards.filter(c => Math.abs(c.offsetTop - cardTop) < 5);
    };

    expandableCards.forEach(card => {
        // Make entire card clickable (except for links)
        card.addEventListener('click', (e) => {
            // Don't toggle if clicking on a link
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }

            // Toggle expanded state
            const wasExpanded = card.classList.contains('expanded');

            // Close other cards in the same container (accordion behavior)
            // Works for .expandable-grid, .stats-comparison, .stats-grid, or any parent container
            const parentContainer = card.closest('.expandable-grid, .stats-comparison, .stats-grid');

            if (isMobile()) {
                // MOBILE: One-at-a-time accordion behavior
                if (parentContainer) {
                    const cardsInContainer = parentContainer.querySelectorAll('.expandable-card');
                    cardsInContainer.forEach(otherCard => {
                        if (otherCard !== card) {
                            otherCard.classList.remove('expanded');
                        }
                    });
                }

                // Toggle current card
                if (wasExpanded) {
                    card.classList.remove('expanded');
                } else {
                    card.classList.add('expanded');
                }
            } else {
                // DESKTOP: Row-based expansion
                const cardsInRow = getCardsInSameRow(card, parentContainer);

                // Close all cards not in this row
                if (parentContainer) {
                    const allCardsInContainer = parentContainer.querySelectorAll('.expandable-card');
                    allCardsInContainer.forEach(otherCard => {
                        if (!cardsInRow.includes(otherCard)) {
                            otherCard.classList.remove('expanded');
                        }
                    });
                }

                // Toggle all cards in the same row
                if (wasExpanded) {
                    cardsInRow.forEach(rowCard => {
                        rowCard.classList.remove('expanded');
                    });
                } else {
                    cardsInRow.forEach(rowCard => {
                        rowCard.classList.add('expanded');
                    });
                }
            }
        });

        // Keyboard accessibility
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

        // Make card focusable for keyboard navigation
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-expanded', 'false');

        // Update aria-expanded when card state changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isExpanded = card.classList.contains('expanded');
                    card.setAttribute('aria-expanded', isExpanded);
                }
            });
        });

        observer.observe(card, {
            attributes: true,
            attributeFilter: ['class']
        });
    });

    // Handle window resize - switch between mobile/desktop behavior
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Close all expanded cards on resize to avoid confusion
            expandableCards.forEach(card => {
                card.classList.remove('expanded');
            });
        }, 250);
    });
});
