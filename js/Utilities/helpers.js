export function massage(message, type = "success") {
    const container = document.getElementById("toast-container");

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

    toast.innerHTML = `
        <div class="flex justify-center items-center gap-2 text-center">
            <span class="font-bold text-lg capitalize">${type}:</span>
            <span class="font-medium">${message}</span>
        </div>
    `;


    toast.style.transform = "translateY(-20px)";
    toast.style.opacity = "0";

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = "translateY(0)";
        toast.style.opacity = "1";
    }, 10);

    setTimeout(() => {
        toast.style.transform = "translateY(-20px)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function getQueryParam(param) {
    const queryString = window.location.hash.split("?")[1];
    if (!queryString) return null;

    const params = new URLSearchParams(queryString);
    console.log(params.get(param));
    return params.get(param);
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}