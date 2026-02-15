import { isValidEmail, isValidPassword, isValidName, encrypt, decrypt } from '../Utilities/validation.js';

export async function registerUser(userData) {
    if (!isValidName(userData.fullName)) {
        throw new Error('Full name must be at least 3 characters');
    }

    if (!isValidEmail(userData.email)) {
        throw new Error('Invalid email format');
    }

    if (!isValidPassword(userData.password)) {
        throw new Error('Password must be at least 4 characters, including letters and numbers');
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.find(u => u.email === userData.email)) {
        throw new Error('This email is already registered');
    }

    const encryptedUser = {
        ...userData,
        password: encrypt(userData.password)
    };

    users.push(encryptedUser);
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, user: encryptedUser };
}

export async function loginUser(email, password) {
    if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    const user = users.find(u => {
        if (u.email === email) {
            const originalPassword = decrypt(u.password);
            return originalPassword === password;
        }
        return false;
    });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    localStorage.setItem('currentUser', JSON.stringify(user));

    return { success: true, user };
}

export function logout() {
    localStorage.removeItem('currentUser');

    const loginUrl = window.location.origin + window.location.pathname + '#login';

    window.location.replace(loginUrl);
}

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || null;
}

export function initAuthAnimation() {
    const container = document.querySelector('section');
    const triangles = document.querySelectorAll('.triangle');

    if (!container || triangles.length === 0) return;

    const handleTriangleMove = (e) => {
        const { clientX, clientY } = e;

        triangles.forEach((triangle) => {
            const rect = triangle.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = clientX - centerX;
            const dy = clientY - centerY;

            const radians = Math.atan2(dy, dx);
            const degrees = (radians * 180) / Math.PI + 90;

            const moveX = dx * 0.05;
            const moveY = dy * 0.05;

            triangle.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${degrees}deg)`;
        });
    };

    container.addEventListener('mousemove', handleTriangleMove);
}

export function isAuthenticated() {
    return localStorage.getItem('currentUser') !== null;
}
// get current user mail
export function getCurrentUserMail() {
    const user = getCurrentUser();
    if (user) {
        return user.email;
    }
    return null;
}