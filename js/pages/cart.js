import { getCurrentUser } from '../services/auth_services.js';
import { massage, formatCurrency } from '../Utilities/helpers.js';
import * as cartServices from '../services/cart_services.js';
import { getAllProducts } from '../services/product_services.js'

const currentUser = getCurrentUser();
let cart = [];
let products = [];
let currentDiscount = 0;

async function init() {
    const loadingElem = document.getElementById('loadingCart');
    const itemsElem = document.getElementById('cartItems');

    // Show loading state
    if (loadingElem) loadingElem.classList.remove('hidden');
    if (itemsElem) itemsElem.classList.add('hidden');

    try {
        // Fetch products first for sync
        products = await getAllProducts();

        // Load cart
        if (currentUser) {
            cart = await cartServices.getCart(currentUser.email);
        } else {
            cart = await cartServices.getCart('guest');
        }

        // Sync cart with latest product data and restore discount
        syncCartWithProducts();
        restoreDiscount();

    } catch (error) {
        console.error('Failed to load cart or products:', error);
        massage('Failed to refresh data', 'error');
    } finally {
        // Hide loading state
        if (loadingElem) loadingElem.classList.add('hidden');
        if (itemsElem) itemsElem.classList.remove('hidden');
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
            // Update mutable fields if they differ
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
            // Ensure stock limit isn't exceeded
            if (cartItem.qty > product.stock) {
                cartItem.qty = product.stock;
                updated = true;
            }
            syncedCart.push(cartItem);
        } else {
            // Product no longer exists, remove it
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
    if (currentUser) {
        cartServices.updateCart(currentUser.email, cart);
    } else {
        cartServices.updateCart('guest', cart);
    }
}

export function displayCartItems() {
    const container = document.getElementById('cartItems');
    const emptyMsg = document.getElementById('emptyCart');

    if (!container) return;

    container.innerHTML = '';

    if (!cart || cart.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        updateSummary();
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');

    cart.forEach(item => {
        const product = products.find(p => p.id == item.productId) || {};
        const maxStock = product.stock || 99;
        const discountedPrice = item.price - (item.price * (item.discountPercentage || 0) / 100);

        container.innerHTML += `
            <div class="flex flex-col flex-wrap sm:flex-row border rounded-lg p-4 mb-4 bg-(--sec-bg) shadow-sm hover:shadow-md transition-all duration-300" data-id="${item.productId}">
                <img src="${item.mainImage || ''}" class="w-full sm:w-24 h-24 object-cover rounded" alt="${item.name || 'Product'}">
                
                <div class="mt-4 sm:mt-0 sm:ml-4 grow">
                    <h3 class="font-bold text-(--onbg) text-lg">${item.name || 'Unnamed Product'}</h3>
                    <p class="text-sm text-gray-500 mb-2">Size: <span class="font-medium">${item.size || 'N/A'}</span></p>
                    
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-xl">${formatCurrency(discountedPrice)}</span>
                        ${item.discountPercentage > 0 ? `
                            <span class="text-sm font-normal opacity-50 line-through">${formatCurrency(item.price)}</span>
                            <span class="min-w-[40px] text-center bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                -${item.discountPercentage}%
                            </span>
                        ` : ''}
                    </div>
                </div>

                <div class="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between w-full sm:w-auto">
                    <button class="remove-item-btn text-gray-400 hover:text-red-500 transition-colors p-1" title="Remove Item">
                        <i class="fa-solid fa-trash-can text-xl"></i>
                    </button>
                    
                    <div class="flex flex-col items-end gap-1">
                        <div class="flex items-center text-black border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
                            <button class="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white update-qty-btn" data-change="-1">-</button>
                            <span class="w-8 text-center font-medium text-black dark:text-white text-sm">${item.qty || 1}</span>
                            <button class="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white update-qty-btn" 
                                data-change="1" ${item.qty >= maxStock ? 'disabled class="opacity-30 cursor-not-allowed"' : ''}>+</button>
                        </div>
                        ${item.qty >= maxStock ? '<span class="text-[10px] text-red-500 font-medium whitespace-nowrap">Max stock limit</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    });

    updateSummary();
}

function updateSummary() {
    const subtotal = cart.reduce((sum, item) => {
        const discountedPrice = item.price - (item.price * (item.discountPercentage || 0) / 100);
        return sum + (discountedPrice * (item.qty || 1));
    }, 0);

    // Delivery logic: $10 shipping if < $500, else Free
    const delivery = subtotal < 500 ? 10 : 0;

    const discountAmount = subtotal * currentDiscount;
    const total = subtotal - discountAmount + delivery;

    const elements = {
        subtotal: document.getElementById('subtotal'),
        discount: document.getElementById('discount'),
        delivery: document.getElementById('delivery'),
        total: document.getElementById('total')
    };

    if (elements.subtotal) elements.subtotal.textContent = formatCurrency(subtotal);
    if (elements.discount) elements.discount.textContent = `-${formatCurrency(discountAmount)}`;
    if (elements.delivery) elements.delivery.textContent = formatCurrency(delivery);
    if (elements.total) elements.total.textContent = formatCurrency(total);
}

// Event Delegation
const cartItemsContainer = document.getElementById('cartItems');
if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;

        // Handle remove
        const removeBtn = target.closest('.remove-item-btn');
        if (removeBtn) {
            const id = removeBtn.closest('[data-id]').dataset.id;
            removeItem(id);
            return;
        }

        // Handle quantity
        const qtyBtn = target.closest('.update-qty-btn');
        if (qtyBtn) {
            const id = qtyBtn.closest('[data-id]').dataset.id;
            const change = parseInt(qtyBtn.dataset.change);
            // Check for disabled state explicitly
            if (!qtyBtn.hasAttribute('disabled')) {
                updateQuantity(id, change);
            }
        }
    });
}

function removeItem(productId) {
    cart = cart.filter(item => item.productId != productId);
    saveCart();
    displayCartItems();
    massage('Item removed from cart', 'success');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.productId == productId);
    const product = products.find(p => p.id == productId);

    if (item && product) {
        const newQty = (item.qty || 1) + change;

        // Validate
        if (newQty < 1) return;
        if (newQty > product.stock) {
            massage(`Sorry, only ${product.stock} items in stock`, 'warning');
            return;
        }

        item.qty = newQty;
        saveCart();
        // Update specific item UI or re-render? Re-render is safer for now.
        displayCartItems();
    }
}

function setupEventListeners() {
    // Payment Method Selection (if present)
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            // Handle payment method change if needed
        });
    });

    // Promo Code Event Listener
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

    // Checkout Button
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

// Initialize
init();