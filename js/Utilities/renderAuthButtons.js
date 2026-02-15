import { logout } from '../services/auth_services.js';

export function renderAuthButtons() {
    const authContainer = document.getElementById('auth-buttons');
    if (!authContainer) return;

    // Get logged-in user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        // If user is logged in
        authContainer.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium opacity-70 hidden md:block text-(--onbg)">
                    Hi, ${currentUser.fullName.split(' ')[0]}
                </span>
                <button id="logout-btn"
                    class="bg-red-500/10 text-red-500 border border-red-500/20 px-5 py-2 rounded-full text-sm font-bold hover:bg-red-500 hover:text-white transition">
                    Logout
                </button>
            </div>
        `;

        // Logout event
        document.getElementById('logout-btn').addEventListener('click', () => {
            logout();
        });

    } else {
        // If user is not logged in
        authContainer.innerHTML = `
            <a href="#login"
                class="bg-(--onbg) text-(--bg) px-5 py-2 rounded-full text-sm font-bold hover:opacity-80 transition">
                Login
            </a>
        `;
    }
}
