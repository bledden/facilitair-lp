// Form Handling and Email Submission

class EmailSignupHandler {
    constructor() {
        this.apiEndpoint = '/api/subscribe';
        this.init();
    }

    init() {
        const forms = document.querySelectorAll('.signup-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        });
    }

    async handleSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const emailInput = form.querySelector('input[type="email"]');
        const submitButton = form.querySelector('button[type="submit"]');
        const email = emailInput.value.trim();

        // Validate email
        if (!this.validateEmail(email)) {
            this.showMessage(form, 'Please enter a valid email address', 'error');
            return;
        }

        // Disable form during submission
        emailInput.disabled = true;
        submitButton.disabled = true;
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Submitting...';

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage(form, 'Success! Check your email for confirmation.', 'success');
                emailInput.value = '';

                // Track signup (if analytics is set up)
                this.trackSignup(email);
            } else {
                this.showMessage(form, data.message || 'Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage(form, 'Network error. Please check your connection and try again.', 'error');
        } finally {
            // Re-enable form
            emailInput.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showMessage(form, message, type) {
        // Remove existing messages
        const existingMessage = form.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.className = `form-message ${type}`;
        messageEl.textContent = message;

        // Add styles
        messageEl.style.cssText = `
            margin-top: 1rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            text-align: center;
            animation: fadeIn 0.3s ease-out;
            ${type === 'success'
                ? 'background: rgba(92, 225, 230, 0.1); color: var(--facilitair-teal); border: 1px solid rgba(92, 225, 230, 0.3);'
                : 'background: rgba(220, 38, 38, 0.1); color: #DC2626; border: 1px solid rgba(220, 38, 38, 0.3);'
            }
        `;

        form.appendChild(messageEl);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.opacity = '0';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }

    trackSignup(email) {
        // Placeholder for analytics tracking
        console.log('Signup tracked:', email);

        // If you have Google Analytics:
        // gtag('event', 'signup', {
        //     event_category: 'engagement',
        //     event_label: 'beta_signup'
        // });

        // If you have custom analytics:
        // window.analytics?.track('Beta Signup', { email });
    }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
    new EmailSignupHandler();
});
