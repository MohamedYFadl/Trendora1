
export function initAuthAnimation() {
    const container = document.querySelector('section');
    const triangles = document.querySelectorAll('.triangle');

    if (!container || triangles.length === 0) return;

    container.addEventListener('mousemove', (e) => {
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
    });
}

export function setupPasswordToggle() {
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password-input');
    const eyeIcon = document.getElementById('eye-icon');

    if (!toggleBtn || !passwordInput || !eyeIcon) return;

    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';

        passwordInput.type = isPassword ? 'text' : 'password';

        if (isPassword) {
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    });
}