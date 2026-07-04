import * as productServices from '../services/product_services.js';
import { massage, setLoading } from '../Utilities/helpers.js';
import { getCurrentUser } from '../services/auth_services.js';
import * as cartServices from '../services/cart_services.js';

const currentUser = getCurrentUser();
let selectedRating = 0;

async function init() {
    const productId = productServices.getProductId();

    if (!productId || !(await productServices.getProductById(productId))) {
        window.location.hash = '#home';
        return;
    }

    const product = await productServices.getProductById(productId);

    renderProductDetails(product);
    setupGallery(product);
    setupQuantitySelector();
    setupReviewModal(productId);

    const reviewsCount = await productServices.countReviews(productId);
    const countEl = document.getElementById('reviews-count');
    if (countEl) countEl.innerText = `(${reviewsCount})`;

    renderReviews(productId, 2);
    renderRelatedProducts(product.categoryId);
    setupLoadMoreReviews(productId, reviewsCount);
    setupAddToCart(product);
}

function renderProductDetails(product) {
    const nameEl = document.getElementById('product-name');
    const descEl = document.getElementById('product-description');
    const mainImg = document.getElementById('main-image');
    if (nameEl) nameEl.innerText = product.name;
    if (descEl) descEl.innerText = product.description;
    if (mainImg) {
        mainImg.src = product.mainImage;
        mainImg.onerror = () => {
            mainImg.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="%23999"><rect width="200" height="200" rx="12" fill="%23eee"/><text x="100" y="90" text-anchor="middle" font-size="28">📷</text><text x="100" y="120" text-anchor="middle" font-size="14" fill="%23999">No Image</text></svg>');
        };
    }

    const ratingEl = document.getElementById("rating");
    if (ratingEl) {
        ratingEl.innerHTML = `
            <div class="rating" style="--rating: ${product.rating}" aria-label="${product.rating} out of 5 stars"></div>
            <span id="ratingText" class="text-sm opacity-70">${product.rating} / 5</span>
        `;
    }

    const priceContainer = document.getElementById('product-price');
    if (priceContainer) {
        if (product.discountPercentage) {
            const discountedPrice = productServices.calculateDiscountedPrice(product.price, product.discountPercentage);
            priceContainer.innerHTML = `
                <div class="flex items-center space-x-2">
                    <span class="font-bold text-xl">$${parseInt(discountedPrice)}</span>
                    <span class="text-sm font-normal opacity-40 line-through">$${parseInt(product.price)}</span>
                    <span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">-${product.discountPercentage}%</span>
                </div>`;
        } else {
            priceContainer.innerHTML = `<div class="font-bold text-xl">$${parseInt(product.price)}</div>`;
        }
    }

    const sizesContainer = document.getElementById('sizes');
    if (sizesContainer && sizesContainer.children.length === 0) {
        product.sizes.forEach(size => {
            sizesContainer.insertAdjacentHTML('beforeend', `
                <button class="bg-(--bgsecond) text-(--onbg) opacity-60 py-3 px-6 rounded-full hover:bg-(--onbg) hover:text-(--bg) hover:opacity-100 transition font-medium size-option" aria-label="Size ${size}">${size}</button>
            `);
        });
        setupSizeSelector();
    }
}

function setupGallery(product) {
    const imageSlider = document.getElementById('image-slider');
    const mainImage = document.getElementById('main-image');

    if (imageSlider && imageSlider.children.length === 0) {
        product.images.forEach(image => {
            imageSlider.insertAdjacentHTML('beforeend', `
                <div class="w-24 h-24 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 border-transparent hover:border-(--onbg) transition focus-within:border-(--onbg) img-slide" tabindex="0" role="button" aria-label="View product image">
                    <img src="${image}" alt="${product.name}" class="w-full h-full object-cover" loading="lazy">
                </div>
            `);
        });
    }

    const thumbnails = document.querySelectorAll('.img-slide');
    const handleThumbEnter = (thumb) => {
        thumbnails.forEach(t => t.classList.remove('border-black'));
        thumb.classList.add('border-black');
        const img = thumb.querySelector('img');
        if (img && mainImage) {
            const newSrc = img.src.replace('150x150', '600x700');
            mainImage.src = newSrc;
        }
    };
    const handleThumbLeave = () => {
        if (mainImage) mainImage.src = product.mainImage;
    };

    thumbnails.forEach(thumb => {
        thumb.addEventListener('mouseover', () => handleThumbEnter(thumb));
        thumb.addEventListener('mouseleave', handleThumbLeave);
        thumb.addEventListener('focus', () => handleThumbEnter(thumb));
        thumb.addEventListener('blur', handleThumbLeave);
    });
}

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

function setupReviewModal(productId) {
    const reviewBtn = document.getElementById('open-review-modal');
    const closeReviewModal = document.getElementById('close-modal');
    const reviewModal = document.getElementById('review-modal');
    const starBtns = document.querySelectorAll('.star-btn');
    const submitBtn = document.getElementById('submit-review');
    const cancelReview = document.getElementById('cancel-review');
    const reviewComment = document.getElementById('review-comment');

    const toggleModal = (show) => {
        if (!reviewModal) return;
        reviewModal.classList.toggle('hidden', !show);
        if (show) {
            reviewModal.classList.add('flex');
        } else {
            reviewModal.classList.remove('flex');
            reviewComment.value = '';
            resetStars(starBtns);
        }
    };

    if (reviewBtn) reviewBtn.addEventListener('click', () => toggleModal(true));
    if (closeReviewModal) closeReviewModal.addEventListener('click', () => toggleModal(false));
    if (cancelReview) cancelReview.addEventListener('click', () => toggleModal(false));

    reviewModal?.addEventListener('click', (e) => {
        if (e.target === reviewModal) toggleModal(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && reviewModal && !reviewModal.classList.contains('hidden')) {
            toggleModal(false);
        }
    });

    starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            starBtns.forEach((b, i) => {
                b.classList.toggle('text-yellow-400', i < selectedRating);
            });
        });
    });

    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!validateReview(selectedRating, reviewComment.value)) return;

            setLoading(submitBtn, true, 'Submitting...');

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

            const reviewsCount = await productServices.countReviews(productId);
            const reviewsCountEl = document.getElementById('reviews-count');
            if (reviewsCountEl) reviewsCountEl.innerText = `(${reviewsCount})`;

            setLoading(submitBtn, false);
            massage('Review added successfully', 'success');
        });
    }
}

function resetStars(starBtns) {
    selectedRating = 0;
    starBtns.forEach(btn => btn.classList.remove('text-yellow-400'));
}

function validateReview(rating, comment) {
    if (!currentUser) {
        massage('Please login to add a review', 'error');
        return false;
    }
    if (rating === 0) {
        massage('Please select a rating', 'error');
        return false;
    }
    if (!comment.trim()) {
        massage('Please enter a comment', 'error');
        return false;
    }
    return true;
}

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

            setLoading(addToCartBtn, true, 'Adding...');
            await handleAddToCart(product, qty, sizeOption.innerText);
            setLoading(addToCartBtn, false);
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
                <a href="#product?id=${product.id}" class="${animationClass}" style="animation-delay: ${delay}s">
                    <div class="group cursor-pointer">
                        <div class="bg-[#F0EEED] rounded-3xl overflow-hidden mb-4 relative aspect-[1/1.1]">
                            <img src="${product.mainImage}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" loading="lazy">
                        </div>
                        <h3 class="font-bold text-base md:text-lg mb-1 truncate">${product.name}</h3>
                        <div class="flex items-center gap-2 mb-3">
                            <div class="rating" style="--rating: ${product.rating}" aria-label="${product.rating} out of 5 stars"></div>
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
        container.innerHTML = '<p class="text-(--onbg)/50 text-center col-span-full">Unable to load related products.</p>';
    }
}

async function renderReviews(productId, count = 4) {
    const container = document.getElementById('review-container');
    if (!container) return;

    try {
        const reviews = await productServices.getReviewsByProductId(productId);

        if (!reviews || reviews.length == 0) {
            container.innerHTML = '<p class="text-(--onbg)/50 col-span-full text-center py-8">No reviews yet. Be the first to review!</p>';
            return;
        }

        container.innerHTML = '';
        reviews.slice(0, count).forEach((review, index) => {
            const animationClass = index % 2 === 0 ? "animate-side" : "animate-top";
            const delay = (index * 0.1).toFixed(1);
            container.insertAdjacentHTML('beforeend', `
                <div class="border border-(--border) rounded-3xl p-6 md:p-8 ${animationClass}" style="animation-delay: ${delay}s">
                    <div class="flex justify-between items-start mb-3">
                        <div class="text-yellow-400 text-lg" aria-label="${review.rating} out of 5 stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
                    </div>
                    <div class="flex items-center mb-2">
                        <h4 class="font-bold text-lg mr-2">${review.userName}</h4>
                        <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <p class="text-(--onbg) opacity-70 mb-4 text-sm md:text-base leading-relaxed">"${review.comment}"</p>
                    <p class="text-(--onbg) opacity-40 text-sm font-medium">Posted on ${formatDate(review.CreatedAt)}</p>
                </div>
            `);
        });
    } catch (error) {
        container.innerHTML = '<p class="text-(--onbg)/50 col-span-full text-center py-8">Unable to load reviews.</p>';
    }
}

function setupLoadMoreReviews(productId, reviewsCount) {
    const loadMoreBtn = document.getElementById('load_more');
    if (!loadMoreBtn) return;

    loadMoreBtn.classList.toggle('hidden', reviewsCount <= 2);
    loadMoreBtn.addEventListener('click', () => {
        renderReviews(productId, 100);
        loadMoreBtn.classList.add('hidden');
    });
}

function formatDate(dateStr) {
    return dateStr.slice(0, 10).split('-').reverse().join('-');
}

init().finally(() => document.dispatchEvent(new CustomEvent("page-ready")));
