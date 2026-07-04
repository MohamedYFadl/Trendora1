import { massage, setLoading } from '../Utilities/helpers.js';
import { initAuthAnimation, setupPasswordToggle } from '../Utilities/auth_ui.js';
import * as authService from '../services/auth_services.js';
import { mergeGuestCartToUser } from '../services/cart_services.js';

function initLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    initAuthAnimation();
    setupPasswordToggle();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = loginForm.querySelector('input[type="email"]');
        const passInput = document.getElementById('password-input');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        const email = emailInput.value.trim();
        const password = passInput.value;

        if (!email) {
            massage('Please enter your email', 'error');
            emailInput.focus();
            return;
        }
        if (!password) {
            massage('Please enter your password', 'error');
            passInput.focus();
            return;
        }

        setLoading(submitBtn, true, 'Signing in...');

        try {
            const response = await authService.loginUser(email, password);

            if (response.success) {
                await mergeGuestCartToUser(email);
                massage('Welcome back! Login successful.', 'success');

                setTimeout(() => {
                    window.location.hash = '#home';
                }, 500);
            }
        } catch (error) {
            massage(error.message, 'error');
            setLoading(submitBtn, false);
        }
    });
}

initLogin();
