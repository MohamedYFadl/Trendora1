import * as checkoutService from '../services/checkout.js';
import { generateInvoice } from '../services/invoice_service.js';

async function init() {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const orderId = params.get('orderId');

    if (!orderId) {
        window.location.hash = '#home';
        return;
    }

    const order = await checkoutService.getUserOrderById(parseInt(orderId));

    if (!order || !order.id) {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = '<div class="text-center py-20"><p class="text-(--onbg)/50">Order not found.</p><a href="#home" class="mt-4 inline-block text-(--onbg) underline">Go home</a></div>';
        }
        return;
    }

    const setId = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setId('display-order-id', `#${order.id}`);
    setId('display-order-date', new Date(order.orderDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    }));
    setId('display-order-total', `$${order.orderTotal.toFixed(2)}`);

    const downloadBtn = document.getElementById('download-invoice');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            generateInvoice(order);
        });
    }
}

init();
