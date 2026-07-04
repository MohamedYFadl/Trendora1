import {
  getAllProducts,
  getAllReviews,
  renderProducts,
  makeLink
} from "../services/product_services.js";


// --- Hero Slider ---
function initHeroSlider() {
  const wrapper = document.getElementById('sliderWrapper');
  if (!wrapper) return;

  const slides = Array.from(wrapper.children);
  let currentIndex = 0;
  const totalSlides = slides.length;
  let autoPlayInterval = null;
  const AUTO_PLAY_MS = 5000;

  function updateSlider(index) {
    if (index < 0) index = 0;
    if (index >= totalSlides) index = totalSlides - 1;
    wrapper.style.transform = `translateX(-${index * 100}%)`;
    currentIndex = index;
  }

  function nextSlide() {
    updateSlider((currentIndex + 1) % totalSlides);
  }

  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, AUTO_PLAY_MS);
  }

  updateSlider(0);
  startAutoPlay();
}

initHeroSlider();

function getProductDate(product) {
  return new Date(product.CreatedAt);
}

function createProductCard(product) {
  const discount = product.discountPercentage > 0;
  const oldPrice = discount ? `<span class="text-[10px] line-through opacity-60">$${product.price}</span>` : `<span class="h-4"></span>`;
  const currentPrice = discount
    ? Math.floor(product.price - (product.price * product.discountPercentage) / 100)
    : product.price;

  const discountBadge = discount
    ? `<span class="bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold mb-1">${product.discountPercentage}% OFF</span>`
    : "";

  return `
  <div class="group relative md:flex-1 md:hover:flex-3 transition-all duration-500 cursor-pointer h-64 md:h-[70vh] arrival-card" data-id="${product.id}">
        <img src="${product.mainImage}" alt="${product.name}" loading="lazy" class="w-full h-full object-cover" onerror="this.classList.add('error-fallback');this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23999"><rect width="100" height="100" rx="8" fill="%23eee"/><text x="50" y="45" text-anchor="middle" font-size="14">📷</text><text x="50" y="65" text-anchor="middle" font-size="10" fill="%23999">No Image</text></svg>')}'" />
        <div class="absolute inset-0 
                  bg-black/50 
                  flex flex-col justify-end p-6 text-white
                  opacity-100 md:opacity-0 md:group-hover:opacity-100
                  transition duration-500">
          <h3 class="text-xl font-semibold mb-2">${product.name}</h3>
          <div class="flex items-end justify-between w-full">
            <div class="flex flex-col">
              ${oldPrice}
              <span class="text-lg font-bold">$${currentPrice}</span>
            </div>
            ${discountBadge}
          </div>
        </div>
      </div>
  `;
}

(async function init() {
  try {
    const allProducts = await getAllProducts();
    if (!allProducts || allProducts.length === 0) return;

    const productsContainer = document.querySelector("#new-arrivals");
    if (productsContainer) {
      const newArrivals = [...allProducts]
        .sort((a, b) => getProductDate(b) - getProductDate(a))
        .slice(0, 8);

      productsContainer.innerHTML = newArrivals.map(createProductCard).join("");

      productsContainer.addEventListener("click", (e) => {
        const card = e.target.closest(".arrival-card");
        if (card) {
          const productId = card.dataset.id;
          if (productId) {
            window.location.hash = `#product?id=${productId}`;
          }
        }
      });
    }

    const topProductsContainer = document.querySelector("#top");
    if (topProductsContainer) {
      const topSelling = [...allProducts]
        .filter(product => product.discountPercentage > 0)
        .sort((a, b) => b.discountPercentage - a.discountPercentage).slice(0, 4);
      renderProducts(topSelling, topProductsContainer);
      makeLink(topProductsContainer.querySelectorAll(".product-link"));
    }

    const revContainer = document.querySelector("#rev");
    if (revContainer) {
      const reviews = await getAllReviews();
      const reviewsHTML = reviews.slice(0, 5).map((review) => {
        const ratingStars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
        return `
        <div class="shrink-0 border border-(--border) rounded-3xl p-6 w-80 mb-5 bg-(--sec-bg)">
          <div class="flex justify-between items-start mb-3">
              <div class="text-yellow-400 text-sm">${ratingStars}</div>
          </div>
          <div class="flex items-center mb-2">
              <h4 class="font-bold text-base mr-2">${review.userName || review.name || 'Anonymous'}</h4>
              <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
          </div>
          <p class="text-(--sec-text) opacity-70 text-sm leading-relaxed italic">"${review.comment}"</p>
        </div>`;
      }).join("");
      revContainer.innerHTML = reviewsHTML;
    }

  } catch (error) {
    const containers = ['#new-arrivals', '#top', '#rev'];
    containers.forEach(sel => {
      const el = document.querySelector(sel);
      if (el && el.children.length === 0) {
        el.innerHTML = '<div class="p-8 text-center text-(--onbg)/50">Unable to load content. Please try again.</div>';
      }
    });
  }
  document.dispatchEvent(new CustomEvent("page-ready"));
})();
