import * as productServices from '../services/product_services.js';
import * as checkout from '../services/checkout.js';
import { generateInvoice } from '../services/invoice_service.js';
const chatbot = document.getElementById('chat-window');
const messages = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const closeChat = document.getElementById('closeChat');
const openChat = document.getElementById('openChat');

function toggleChat() {
    if (chatbot.classList.contains('hidden')) {
        chatbot.classList.remove('hidden');
        chatbot.classList.add('flex');
    } else {
        chatbot.classList.remove('flex');
        chatbot.classList.add('hidden');
    }
}

closeChat.addEventListener('click', toggleChat);
openChat.addEventListener('click', toggleChat);

function addMessage(text, from = 'bot') {
    messages.innerHTML += `
      <div class="flex ${from === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="${from === 'user' ? 'border border-(--onbg)/20 text-(--onbg)' : 'bg-(--onbg) text-(--bg)'} px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm">
          ${text}
        </div>
      </div>`;
    messages.scrollTop = messages.scrollHeight;
}

function getIntent(message) {
    const m = message.toLowerCase();
    //m.includes('products')
    if (/\b(hi|hello|hey|start|welcome)\b/.test(m)) return 'greeting';
    if (/\b(product|products|item|items|shop|buying)\b/.test(m)) return 'products';
    if (/\b(price|prices|cost|how much)\b/.test(m)) return 'price';
    if (/\b(shipping|ship|shipping|delivery|time|arrive)\b/.test(m)) return 'shipping';
    if (/\b(orders|order|order status|order history|invoice|payment|my orders|myfatoorah)\b/.test(m)) return 'order';
    if (/\b(thank|thanks)\b/.test(m)) return 'thanks';


    return 'unknown';
}

async function botReply(userMessage) {
    const intent = getIntent(userMessage);

    switch (intent) {
        case 'greeting':
            return "Hello there! How can I help you shop today? 🛍️";

        case 'products':
            const categories = await productServices.getAllCategories();
            if (!categories.length) return "Sorry, I couldn't fetch the categories right now.";

            let categoryHtml = `<div class="space-y-2">
                        <p class="font-medium mb-1">What are you looking for today? Select a category:</p>
                        <div class="flex flex-wrap gap-2">`;
            categories.forEach(cat => {
                categoryHtml += `
                            <button data-category-id="${cat.id}" data-category-name="${cat.name}" class="category-btn bg-(--bgsecond) hover:bg-(--onbg) hover:text-(--bg) text-(--onbg) px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-(--onbg)/5 shadow-sm active:scale-95">
                                ${cat.name}
                            </button>
                        `;
            });
            categoryHtml += `</div></div>`;
            return categoryHtml;

        case 'price':
            return "To check a price, just ask about a specific product or say 'show products' to see our catalog! 🏷️";

        case 'shipping':
            return `
                        <div class="flex flex-col gap-1">
                            <span class="flex items-center gap-2 font-medium text-green-600">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                Standard Shipping
                            </span>
                            <span class="text-xs opacity-60">Delivery within 3-5 business days.</span>
                            <span class="text-xs text-blue-500 font-bold">Free shipping on orders over $50!</span>
                        </div>
                    `;
        case 'order':
            const order = await checkout.getUserOrder();

            if (!order || (Array.isArray(order) && order.length === 0)) {
                return "You don't have any orders yet. 🛒";
            }

            const userOrder = Array.isArray(order) ? order : [order];
            console.log(order);
            let orderHtml = `<div class="space-y-3">
                        <p class="font-medium mb-1">Here are your orders:</p>`;
            userOrder.forEach(item => {
                orderHtml += `
                <div class="space-y-3 bg-(--bgsecond)/20 p-3 rounded-2xl border border-(--onbg)/5">
                    <p class="font-bold text-(--onbg) flex items-center gap-2">
                        <span class="bg-green-500/10 text-green-500 p-1 rounded-full text-[10px]">📦</span>
                        Found your order!
                    </p>
                    <div class="text-xs space-y-2 opacity-80">
                        <p class="flex justify-between"><span>Order ID:</span> <span class="font-bold">#${item.id}</span></p>
                        <p class="flex justify-between"><span>Total:</span> <span class="text-blue-500 font-black">$${item.orderTotal}</span></p>
                        <p class="flex justify-between"><span>Status:</span> <span class="capitalize px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-bold">${item.orderStatus}</span></p>
                    </div>
                    <button data-order-id="${item.id}" id="downloadInvoice" class="download-invoice-btn w-full mt-2 bg-(--onbg) text-(--bg) py-3 px-4 rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xl transform active:scale-95">
                        <i class="fa-solid fa-file-pdf"></i> Download Invoice
                    </button>
                </div>
            `;
            });
            orderHtml += `</div>`;
            return orderHtml;
        case 'thanks':
            return "You're welcome! Happy shopping! 🌟";

        default:
            return "I didn't quite catch that. 🤔 You can ask me about <b>products</b>, <b>shipping</b>, or <b>prices</b>, or <b>order</b>.";
    }
}

async function generateInvoicePDF(orderId) {
    const order = await checkout.getUserOrderById(orderId);

    if (!order) return;
    const userOrder = order;

    generateInvoice(userOrder);
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    setTimeout(async () => {
        const reply = await botReply(text);
        addMessage(reply, 'bot');
    }, 500);
}

const sendMsgBtn = document.getElementById('sendMsgBtn');
if (sendMsgBtn) {
    sendMsgBtn.addEventListener('click', sendMessage);
}

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

messages.addEventListener('click', async (e) => {
    // Handle Invoice Download
    const invoiceBtn = e.target.closest('.download-invoice-btn');
    if (invoiceBtn) {
        const orderId = invoiceBtn.getAttribute('data-order-id');
        if (orderId) {
            generateInvoicePDF(Number(orderId));
        }
        return;
    }

    // Handle Category Selection
    const catBtn = e.target.closest('.category-btn');
    if (catBtn) {
        const categoryId = catBtn.getAttribute('data-category-id');
        const categoryName = catBtn.getAttribute('data-category-name');

        // Show user selection
        addMessage(`I want to see items from ${categoryName}`, 'user');

        // Fetch products for category
        const products = await productServices.getProductsByCategoryId(categoryId);
        if (products.length == 0) {
            addMessage("Sorry, I couldn't fetch the products right now.", 'bot');
            return;
        }
        const top3 = products.slice(0, 3);

        let productHtml = `<div class="space-y-3">
                    <p class="font-medium mb-1">Great choice! Here are some <b>${categoryName}</b> we recommend:</p>`;

        top3.forEach(p => {
            productHtml += `
                <a href="index.html#product?id=${p.id}">
                    <div class="group cursor-pointer flex items-center gap-3 bg-(--bgsecond)/30 p-2 rounded-xl border border-(--onbg)/5 hover:border-(--onbg)/20 transition">
                        <img src="${p.mainImage}" class="w-12 h-12 object-cover bg-white rounded-lg p-1 shadow-sm" alt="${p.name}">
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold text-(--onbg) truncate">${p.name}</p>
                            <p class="text-xs text-blue-500 font-extrabold">$${p.price}</p>
                        </div>
                    </div>
                </a>
            `;
        });
        setTimeout(() => {
            addMessage(productHtml, 'bot');
        }, 500);
    }
});
