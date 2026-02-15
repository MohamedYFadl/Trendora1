import { massage } from '../Utilities/helpers.js';
import { initAuthAnimation, setupPasswordToggle } from '../Utilities/auth_ui.js';
import * as authService from '../services/auth_services.js';

export function initRegister() {
    const registerForm = document.getElementById('register-form');

    if (!registerForm) return;

    initAuthAnimation();
    setupPasswordToggle();

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = registerForm.querySelector('input[type="text"]');
        const emailInput = registerForm.querySelector('input[type="email"]');
        const passInput = document.getElementById('password-input');

        const fullName = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passInput.value;

        try {
            const userData = { fullName, email, password };
            const response = await authService.registerUser(userData);

            if (response.success) {
                massage(`Account created! Welcome ${fullName}`, 'success');
                setTimeout(() => {
                    location.hash = '#login';
                }, 500);
            }
        } catch (error) {
            massage(error.message, 'error');
        }
    });
}

initRegister();