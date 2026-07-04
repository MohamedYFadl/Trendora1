import { getCurrentUser } from '../services/auth_services.js';
import { massage, formatCurrency } from '../Utilities/helpers.js';
import * as cartServices from '../services/cart_services.js';
import { getAllProducts } from '../services/product_services.js';

const currentUser = getCurrentUser();
let cart = [];
let products = [];
let currentDiscount = 0;

async function init() {
    const loadingElem = document.getElementById('loadingCart');
    const itemsElem = document.getElementById('cartItems');
    const emptyMsg = document.getElementById('emptyCart');

    loadingElem?.classList.remove('hidden');
    itemsElem?.classList.add('hidden');
    emptyMsg?.classList.add('hidden');

    try {
        products = await getAllProducts();

        if (currentUser) {
            cart = await cartServices.getCart(currentUser.email);
        } else {
            cart = await cartServices.getCart('guest');
        }

        syncCartWithProducts();
        restoreDiscount();

        if (!cart || cart.length === 0) {
            emptyMsg?.classList.remove('hidden');
            itemsElem?.classList.add('hidden');
        }
    } catch (error) {
        massage('Failed to load cart data', 'error');
        itemsElem.innerHTML = '<div class="text-center py-8 text-(--onbg)/50">Unable to load cart. Please try again.</div>';
    } finally {
        loadingElem?.classList.add('hidden');
        if (cart?.length > 0) itemsElem?.classList.remove('hidden');
        displayCartItems();
        setupEventListeners();
    }
}

function syncCartWithProducts() {
    if (!cart.length || !products.length) return;

    const syncedCart = [];
    let updated = false;

    cart.forEach(cartItem => {
        const product = products.find(p => p.id == cartItem.productId);
        if (product) {
            if (cartItem.price !== product.price ||
                cartItem.name !== product.name ||
                cartItem.mainImage !== product.mainImage ||
                cartItem.discountPercentage !== product.discountPercentage) {
                cartItem.price = product.price;
                cartItem.name = product.name;
                cartItem.mainImage = product.mainImage;
                cartItem.discountPercentage = product.discountPercentage;
                updated = true;
            }
            if (cartItem.qty > product.stock) {
                cartItem.qty = product.stock;
                updated = true;
            }
            syncedCart.push(cartItem);
        } else {
            updated = true;
        }
    });

    if (updated) {
        cart = syncedCart;
        saveCart();
    }
}

function restoreDiscount() {
    const savedDiscount = localStorage.getItem('appliedDiscount');
    if (savedDiscount) {
        currentDiscount = JSON.parse(savedDiscount);
    }
}

function saveCart() {
    const key = currentUser ? currentUser.email : 'guest';
    cartServices.updateCart(key, cart);
}

function displayCartItems() {
    const container = document.getElementById('cartItems');
    const emptyMsg = document.getElementById('emptyCart');
    if (!container) return;

    container.innerHTML = '';

    if (!cart || cart.length === 0) {
        emptyMsg?.classList.remove('hidden');
        updateSummary();
        return;
    }

    emptyMsg?.classList.add('hidden');

    cart.forEach(item => {
        const product = products.find(p => p.id == item.productId) || {};
        const maxStock = product.stock || 99;
        const discountedPrice = item.price - (item.price * (item.discountPercentage || 0) / 100);

        container.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col flex-wrap sm:flex-row border rounded-lg p-4 mb-4 bg-(--sec-bg) shadow-sm hover:shadow-md transition-all duration-300" data-id="${item.productId}">
                <img src="${item.mainImage || ''}" class="w-full sm:w-24 h-24 object-cover rounded" alt="${item.name || 'Product'}" loading="lazy"
                    onerror="this.onerror=null;this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23999"><rect width="100" height="100" rx="8" fill="%23eee"/><text x="50" y="55" text-anchor="middle" font-size="12" fill="%23999">No Image</text></svg>')}'">
                <div class="mt-4 sm:mt-0 sm:ml-4 grow">
                    <h3 class="font-bold text-(--onbg) text-lg">${item.name || 'Unnamed Product'}</h3>
                    <p class="text-sm text-(--onbg)/50 mb-2">Size: <span class="font-medium">${item.size || 'N/A'}</span></p>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-xl">${formatCurrency(discountedPrice)}</span>
                        ${item.discountPercentage > 0 ? `
                            <span class="text-sm font-normal opacity-50 line-through">${formatCurrency(item.price)}</span>
                            <span class="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">-${item.discountPercentage}%</span>
                        ` : ''}
                    </div>
                </div>
                <div class="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                    <button class="remove-item-btn text-(--onbg)/40 hover:text-red-500 transition-colors p-1" title="Remove Item" aria-label="Remove item">
                        <i class="fa-solid fa-trash-can text-xl" aria-hidden="true"></i>
                    </button>
                    <div class="flex flex-col items-end gap-1">
                        <div class="flex items-center text-(--onbg) border border-(--onbg)/20 rounded-full px-2 py-1 bg-(--bg)/50">
                            <button class="w-6 h-6 flex items-center justify-center font-bold text-(--onbg)/60 hover:text-(--onbg) update-qty-btn" data-change="-1" aria-label="Decrease quantity">-</button>
                            <span class="w-8 text-center font-medium text-(--onbg) text-sm">${item.qty || 1}</span>
                            <button class="w-6 h-6 flex items-center justify-center font-bold text-(--onbg)/60 hover:text-(--onbg) update-qty-btn" data-change="1" aria-label="Increase quantity" ${item.qty >= maxStock ? 'disabled' : ''}>+</button>
                        </div>
                        ${item.qty >= maxStock ? '<span class="text-[10px] text-red-500 font-medium">Max stock limit</span>' : ''}
                    </div>
                </div>
            </div>
        `);
    });

    updateSummary();
}

function updateSummary() {
    const subtotal = cart.reduce((sum, item) => {
        const discountedPrice = item.price - (item.price * (item.discountPercentage || 0) / 100);
        return sum + (discountedPrice * (item.qty || 1));
    }, 0);

    const delivery = subtotal < 500 ? 10 : 0;
    const discountAmount = subtotal * currentDiscount;
    const total = subtotal - discountAmount + delivery;

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText('subtotal', formatCurrency(subtotal));
    setText('discount', `-${formatCurrency(discountAmount)}`);
    setText('delivery', formatCurrency(delivery));
    setText('total', formatCurrency(total));
}

const cartItemsContainer = document.getElementById('cartItems');
if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;

        const removeBtn = target.closest('.remove-item-btn');
        if (removeBtn) {
            const id = removeBtn.closest('[data-id]').dataset.id;
            removeItem(id);
            return;
        }

        const qtyBtn = target.closest('.update-qty-btn');
        if (qtyBtn && !qtyBtn.hasAttribute('disabled')) {
            const id = qtyBtn.closest('[data-id]').dataset.id;
            const change = parseInt(qtyBtn.dataset.change);
            updateQuantity(id, change);
        }
    });
}

function removeItem(productId) {
    cart = cart.filter(item => item.productId != productId);
    saveCart();
    displayCartItems();
    massage('Item removed from cart', 'success');

    if (cart.length === 0) {
        document.getElementById('emptyCart')?.classList.remove('hidden');
    }
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.productId == productId);
    const product = products.find(p => p.id == productId);

    if (item && product) {
        const newQty = (item.qty || 1) + change;
        if (newQty < 1) return;
        if (newQty > product.stock) {
            massage(`Only ${product.stock} in stock`, 'warning');
            return;
        }
        item.qty = newQty;
        saveCart();
        displayCartItems();
    }
}

function setupEventListeners() {
    const applyPromoBtn = document.getElementById('applyPromo');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const codeInput = document.getElementById('promoCode');
            const code = codeInput?.value.trim().toUpperCase();
            const promoMessage = document.getElementById('promoMessage');

            if (!code) {
                massage('Please enter a promo code', 'warning');
                return;
            }

            if (code === "ITI2026") {
                currentDiscount = 0.10;
                localStorage.setItem('appliedDiscount', JSON.stringify(currentDiscount));
                massage('Promo code applied! 10% off', 'success');
                if (promoMessage) promoMessage.textContent = '10% Discount Applied';
            } else if (code === "ITI.NET") {
                currentDiscount = 0.20;
                localStorage.setItem('appliedDiscount', JSON.stringify(currentDiscount));
                massage('Promo code applied! 20% off', 'success');
                if (promoMessage) promoMessage.textContent = '20% Discount Applied';
            } else {
                currentDiscount = 0;
                localStorage.removeItem('appliedDiscount');
                massage('Invalid promo code', 'error');
                if (promoMessage) promoMessage.textContent = '';
            }
            updateSummary();
        });
    }

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            if (!currentUser) {
                massage('Please login to checkout', 'error');
                window.location.hash = "#login";
                return;
            }
            if (!cart || cart.length === 0) {
                massage('Your cart is empty', 'warning');
                return;
            }
            window.location.hash = "#checkout";
        });
    }
}

init().finally(() => document.dispatchEvent(new CustomEvent("page-ready")));
