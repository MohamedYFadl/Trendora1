export function massage(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const colors = {
        success: "bg-green-500",
        error: "bg-red-500",
        warning: "bg-yellow-500",
    };

    const toast = document.createElement("div");
    toast.className = `
        ${colors[type]}
        text-white px-6 py-4 rounded-xl shadow-2xl
        flex items-center justify-center gap-3
        opacity-100 backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        border border-white/20
    `;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
        <div class="flex justify-center items-center gap-2 text-center">
            <span class="font-bold text-lg capitalize">${escapeHtml(type)}:</span>
            <span class="font-medium">${escapeHtml(message)}</span>
        </div>
    `;

    toast.style.transform = "translateY(-20px)";
    toast.style.opacity = "0";

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = "translateY(0)";
        toast.style.opacity = "1";
    });

    setTimeout(() => {
        toast.style.transform = "translateY(-20px)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function getQueryParam(param) {
    const queryString = window.location.hash.split("?")[1];
    if (!queryString) return null;
    return new URLSearchParams(queryString).get(param);
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function setLoading(button, isLoading, originalText = '') {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.classList.add('btn-loading');
        button.innerHTML = `${originalText || button.textContent} <span class="opacity-0">...</span>`;
    } else {
        button.disabled = false;
        button.classList.remove('btn-loading');
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

export function showSkeleton(container, count = 6) {
    const skeletonHTML = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text-short"></div>
            <div class="skeleton-price"></div>
        </div>
    `).join('');
    container.innerHTML = skeletonHTML;
}