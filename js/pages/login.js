import { massage } from '../Utilities/helpers.js';
import { initAuthAnimation, setupPasswordToggle } from '../Utilities/auth_ui.js';
import * as authService from '../services/auth_services.js';
import { mergeGuestCartToUser } from '../services/cart_services.js';

export function initLogin() {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) return;

    initAuthAnimation();
    setupPasswordToggle();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = loginForm.querySelector('input[type="email"]');
        const passInput = document.getElementById('password-input');

        const email = emailInput.value.trim();
        const password = passInput.value;

        try {
            const response = await authService.loginUser(email, password);

            if (response.success) {
                await mergeGuestCartToUser(email);

                massage('Welcome back! Login successful.', 'success');

                setTimeout(() => {
                    const homeUrl = window.location.origin + window.location.pathname + '#home';
                    window.location.replace(homeUrl);

                    if (window.renderAuthButtons) window.renderAuthButtons();
                }, 500);
            }
        } catch (error) {
            massage(error.message, 'error');
        }
    });
}

initLogin();