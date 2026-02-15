
import * as productServices from '../services/product_services.js';
import { massage } from '../Utilities/helpers.js';
import { getCurrentUser } from '../services/auth_services.js';
import * as cartServices from '../services/cart_services.js';

// Global variables
const currentUser = getCurrentUser();
let selectedRating = 0;

/**
 * Initialize the product details page
 */
async function init() {
    const productId = productServices.getProductId();

    // Redirect if no product ID or product doesn't exist
    if (!productId || !(await productServices.getProductById(productId))) {
        window.location.href = '/index.html';
        return;
    }

    const product = await productServices.getProductById(productId);

    // Render sections
    renderProductDetails(product);
    setupGallery(product);
    setupQuantitySelector();
    setupReviewModal(productId);

    // Initial renders
    const reviewsCount = await productServices.countReviews(productId);
    document.getElementById('reviews-count').innerText = `(${reviewsCount})`;

    renderReviews(productId, 2);
    renderRelatedProducts(product.categoryId);
    setupLoadMoreReviews(productId, reviewsCount);
    setupAddToCart(product);
}

/**
 * Render main product information
 */
function renderProductDetails(product) {
    document.getElementById('product-name').innerText = product.name;
    document.getElementById('product-description').innerText = product.description;
    document.getElementById('main-image').src = product.mainImage;

    // Rating
    document.getElementById("rating").innerHTML = `
        <div class="rating" style="--rating: ${product.rating}"></div>
        <span id="ratingText">${product.rating} / 5</span>
    `;

    // Price
    const priceContainer = document.getElementById('product-price');
    if (product.discountPercentage) {
        const discountedPrice = productServices.calculateDiscountedPrice(product.price, product.discountPercentage);
        priceContainer.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="font-bold text-xl">$${parseInt(discountedPrice)}</span>
                <span class="text-sm font-normal opacity-40 line-through">$${parseInt(product.price)}</span>
                <span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">-${product.discountPercentage}%</span>
            </div>
        `;
    } else {
        priceContainer.innerHTML = `<div class="font-bold text-xl">$${parseInt(product.price)}</div>`;
    }

    // Sizes
    const sizesContainer = document.getElementById('sizes');
    if (sizesContainer && sizesContainer.children.length === 0) {
        product.sizes.forEach(size => {
            sizesContainer.insertAdjacentHTML('beforeend', `
                <button class="bg-(--bgsecond) text-(--onbg) opacity-60 py-3 px-6 rounded-full hover:bg-(--onbg) hover:text-(--bg) hover:opacity-100 transition font-medium size-option">${size}</button>
            `);
        });
        setupSizeSelector();
    }
}

/**
 * Setup Image Gallery and Thumbnails
 */
function setupGallery(product) {
    const imageSlider = document.getElementById('image-slider');
    const mainImage = document.getElementById('main-image');

    if (imageSlider && imageSlider.children.length === 0) {
        product.images.forEach(image => {
            imageSlider.insertAdjacentHTML('beforeend', `
                <div class="w-24 h-24 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 border-transparent hover:border-(--onbg) transition focus:border-(--onbg) ring-offset-2 img-slide">
                    <img src="${image}" alt="${product.name}" class="w-full h-full object-cover">
                </div>
            `);
        });
    }

    const thumbnails = document.querySelectorAll('.img-slide');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('mouseover', () => {
            thumbnails.forEach(t => t.classList.remove('border-black'));
            thumb.classList.add('border-black');
            const img = thumb.querySelector('img');
            if (img) {
                // Assuming thumb image might be smaller version if specified in URL
                const newSrc = img.src.replace('150x150', '600x700');
                mainImage.src = newSrc;
            }
        });

        thumb.addEventListener('mouseleave', () => {
            thumb.classList.remove('border-black');
            mainImage.src = product.mainImage;
        });
    });
}

/**
 * Setup Size Selection Logic
 */
function setupSizeSelector() {
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeOptions.forEach(b => {
                b.classList.remove('bg-(--onbg)', 'text-(--bg)', 'opacity-100', 'selected');
                b.classList.add('bg-(--bgsecond)', 'text-(--onbg)', 'opacity-60');
            });
            btn.classList.remove('bg-(--bgsecond)', 'text-(--onbg)', 'opacity-60');
            btn.classList.add('bg-(--onbg)', 'text-(--bg)', 'opacity-100', 'selected');
        });
    });
}

/**
 * Setup Quantity Selector (+/-)
 */
function setupQuantitySelector() {
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyVal = document.getElementById('qty-val');

    if (qtyMinus && qtyPlus && qtyVal) {
        qtyMinus.addEventListener('click', () => {
            let val = parseInt(qtyVal.innerText);
            if (val > 1) qtyVal.innerText = val - 1;
        });

        qtyPlus.addEventListener('click', () => {
            let val = parseInt(qtyVal.innerText);
            qtyVal.innerText = val + 1;
        });
    }
}

/**
 * Setup Review Modal Actions
 */
function setupReviewModal(productId) {
    const reviewBtn = document.getElementById('open-review-modal');
    const closeReviewModal = document.getElementById('close-modal');
    const reviewModal = document.getElementById('review-modal');
    const starBtns = document.querySelectorAll('.star-btn');
    const submitReview = document.getElementById('submit-review');
    const cancelReview = document.getElementById('cancel-review');
    const reviewComment = document.getElementById('review-comment');

    const toggleModal = (show) => {
        if (!reviewModal) return;
        reviewModal.classList.toggle('hidden', !show);
        reviewModal.style.display = show ? 'flex' : 'none';
        if (!show) {
            reviewComment.value = '';
            resetStars(starBtns);
        }
    };

    if (reviewBtn) reviewBtn.addEventListener('click', () => toggleModal(true));
    if (closeReviewModal) closeReviewModal.addEventListener('click', () => toggleModal(false));
    if (cancelReview) cancelReview.addEventListener('click', () => toggleModal(false));

    starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            starBtns.forEach((b, i) => {
                b.classList.toggle('text-yellow-400', i < selectedRating);
            });
        });
    });

    if (submitReview) {
        submitReview.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!validateReview(selectedRating, reviewComment.value)) return;

            const review = {
                userName: currentUser.fullName,
                rating: selectedRating,
                comment: reviewComment.value,
                productId: productId,
                CreatedAt: new Date().toISOString(),
            };

            productServices.addReview(review);
            toggleModal(false);
            renderReviews(productId, 4);

            // Update reviews count in UI
            const reviewsCount = await productServices.countReviews(productId);
            const reviewsCountEl = document.getElementById('reviews-count');
            if (reviewsCountEl) reviewsCountEl.innerText = `(${reviewsCount})`;

            massage('Review added successfully', 'success');
        });
    }
}

function resetStars(starBtns) {
    selectedRating = 0;
    starBtns.forEach(btn => btn.classList.remove('text-yellow-400'));
}

function validateReview(rating, comment) {
    if (rating === 0) {
        massage('Please select a rating', 'error');
        return false;
    }
    if (!comment.trim()) {
        massage('Please enter a comment', 'error');
        return false;
    }
    if (!currentUser) {
        massage('Please login to add a review', 'error');
        return false;
    }
    return true;
}

/**
 * Add to Cart logic
 */
function setupAddToCart(product) {
    const addToCartBtn = document.getElementById('add-to-cart');
    const qtyVal = document.getElementById('qty-val');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async () => {
            const qty = qtyVal ? parseInt(qtyVal.innerText) : 1;
            const sizeOption = document.querySelector('.size-option.selected');

            if (!sizeOption) {
                massage('Please select a size', 'error');
                return;
            }

            await handleAddToCart(product, qty, sizeOption.innerText);
        });
    }
}

async function handleAddToCart(product, qty, size) {
    const productCart = {
        productId: product.id,
        name: product.name,
        price: product.price,
        discountPercentage: product.discountPercentage,
        mainImage: product.mainImage,
        qty: qty,
        size: size
    };

    const userKey = currentUser ? currentUser.email : 'guest';
    const cart = await cartServices.getCart(userKey);

    if (cart.find(p => p.productId == product.id)) {
        massage('Product already in cart', 'error');
    } else {
        cart.push({ ...productCart, userEmail: userKey });
        await cartServices.updateCart(userKey, cart);
        massage('Product added to cart', 'success');
    }
}

/**
 * Related Products Rendering
 */
async function renderRelatedProducts(categoryId) {
    const container = document.getElementById('product-container');
    if (!container || container.children.length > 0) return;

    try {
        const products = await productServices.getProductsByCategoryId(categoryId);
        products.slice(0, 4).forEach((product, index) => {
            const animationClass = index % 2 === 0 ? "animate-side" : "animate-top";
            const delay = (index * 0.1).toFixed(1);
            const discountedPrice = productServices.calculateDiscountedPrice(product.price, product.discountPercentage);
            container.insertAdjacentHTML('beforeend', `
                <a href="index.html#product?id=${product.id}" class="${animationClass}" style="animation-delay: ${delay}s">
                    <div class="group cursor-pointer">
                        <div class="bg-[#F0EEED] rounded-3xl overflow-hidden mb-4 relative aspect-[1/1.1]">
                            <img src="${product.mainImage}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                        </div>
                        <h3 class="font-bold text-base md:text-lg mb-1 truncate">${product.name}</h3>
                        <div class="flex items-center gap-2 mb-3">
                            <div class="rating" style="--rating: ${product.rating}"></div>
                            <span>${product.rating} / 5</span>
                        </div>
                        ${product.discountPercentage ? `
                            <div class="flex items-center space-x-2">
                                <span class="font-bold text-xl">$${parseInt(discountedPrice)}</span>
                                <span class="text-sm font-normal opacity-40 line-through">$${parseInt(product.price)}</span>
                                <span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full">-${product.discountPercentage}%</span>
                            </div>
                        ` : `<div class="font-bold text-xl">$${parseInt(product.price)}</div>`}
                    </div>
                </a>
            `);
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        console.error('Error rendering related products:', error);
    }
}

/**
 * Review Rendering
 */
async function renderReviews(productId, count = 4) {
    const container = document.getElementById('review-container');
    if (!container) return;

    try {
        const reviews = await productServices.getReviewsByProductId(productId);

        if (!reviews || reviews.length == 0) {
            container.innerHTML = '<p class="text-gray-500">No reviews yet.</p>';
            return;
        }

        container.innerHTML = '';
        reviews.slice(0, count).forEach((review, index) => {
            const animationClass = index % 2 === 0 ? "animate-side" : "animate-top";
            const delay = (index * 0.1).toFixed(1);
            container.insertAdjacentHTML('beforeend', `
                <div class="border border-(--border) rounded-3xl p-6 md:p-8 ${animationClass}" style="animation-delay: ${delay}s">
                    <div class="flex justify-between items-start mb-3">
                        <div class="text-yellow-400 text-lg">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
                        <button class="text-(--onbg) opacity-40 hover:opacity-100">•••</button>
                    </div>
                    <div class="flex items-center mb-2">
                        <h4 class="font-bold text-lg mr-2">${review.userName}</h4>
                        <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <p class="text-(--onbg) opacity-70 mb-4 text-sm md:text-base leading-relaxed">"${review.comment}"</p>
                    <p class="text-(--onbg) opacity-40 text-sm font-medium">Posted on ${formatDate(review.CreatedAt)}</p>
                </div>
            `);
        });
    } catch (error) {
        console.error('Error rendering reviews:', error);
    }
}

function setupLoadMoreReviews(productId, reviewsCount) {
    const loadMoreBtn = document.getElementById('load_more');
    if (!loadMoreBtn) return;

    loadMoreBtn.classList.toggle('hidden', reviewsCount <= 2);
    loadMoreBtn.onclick = () => {
        renderReviews(productId, 100); // Show all
        loadMoreBtn.classList.add('hidden');
    };
}

function formatDate(dateStr) {
    return dateStr.slice(0, 10).split('-').reverse().join('-');
}

// Start Initialization
init();
