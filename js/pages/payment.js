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

    if (!order) {
        return;
    }

    document.getElementById('display-order-id').innerText = `#${order.id}`;
    document.getElementById('display-order-date').innerText = new Date(order.orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    document.getElementById('display-order-total').innerText = `$${order.orderTotal.toFixed(2)}`;

    const downloadBtn = document.getElementById('download-invoice');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            generateInvoice(order);
        };
    }
}

init();
