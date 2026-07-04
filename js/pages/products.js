import * as productService from "../services/product_services.js"
import { getQueryParam, debounce, showSkeleton } from "../Utilities/helpers.js"

document.querySelectorAll('.section-header').forEach(button => {
    button.addEventListener('click', function () {
        const sectionId = this.getAttribute('data-section');
        const content = document.getElementById(sectionId);
        const icon = this.querySelector('i');

        this.classList.toggle('collapsed');
        content.classList.toggle('collapsed');

        if (content.classList.contains('collapsed')) {
            content.style.height = "0px";
            content.style.opacity = "0";
            content.style.marginBottom = "0";
            icon.style.transform = "rotate(180deg)";
        } else {
            content.style.height = "auto";
            content.style.opacity = "1";
            content.style.marginBottom = "0.5rem";
            icon.style.transform = "rotate(0deg)";
        }
    });
});

const categories = await productService.getAllCategories();
const categoryContainer = document.getElementById("categories");
const urlCategoryId = getQueryParam('categoryId');

(function showCategories() {
    categories.forEach(c => {
        const isActive = urlCategoryId && Number(urlCategoryId) === c.id ? 'active' : '';
        categoryContainer.insertAdjacentHTML('beforeend', `
            <li class="flex justify-between items-center p-3.5 cursor-pointer text-(--main-text) opacity-70 text-sm category ${isActive}"
                data-value="${c.id}">
                <span>${c.name}</span><span><i class="fa-solid fa-angle-right"></i></span>
            </li>`);
    });
})();

const urlGender = getQueryParam('gender');

let filters = {
    minPrice: 50,
    maxPrice: 1000,
    categoryId: urlCategoryId ? Number(urlCategoryId) : null,
    gender: urlGender ? [urlGender] : [],
    dressStyle: [],
    size: [],
    search: ""
};

if (urlGender) {
    document.querySelectorAll('.gender').forEach(btn => {
        if (btn.dataset.value.toLowerCase() === urlGender.toLowerCase()) {
            btn.classList.add('active');
        }
    });
}

if (urlCategoryId) {
    const selectedCategoryContainer = document.querySelectorAll(".selectedCategory");
    const cat = await productService.getCategoryById(urlCategoryId);
    if (cat) selectedCategoryContainer.forEach(i => i.innerHTML = cat.name);
}

const minRange = document.getElementById("minRange");
const maxRange = document.getElementById("maxRange");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sliderTrack = document.getElementById("sliderTrack");
const maxGap = 10;

function updateSlider() {
    let minVal = parseInt(minRange.value);
    let maxVal = parseInt(maxRange.value);
    const min = parseInt(minRange.min);
    const max = parseInt(minRange.max);

    if (maxVal - minVal < maxGap) {
        if (event?.target === minRange) {
            minRange.value = maxVal - maxGap;
        } else {
            maxRange.value = minVal + maxGap;
        }
        minVal = parseInt(minRange.value);
        maxVal = parseInt(maxRange.value);
    }

    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    sliderTrack.style.background = `
    linear-gradient(to right, #ddd ${minPercent}%, #000 ${minPercent}%, #000 ${maxPercent}%, #ddd ${maxPercent}%)`;

    minPrice.textContent = `$ ${minVal}`;
    maxPrice.textContent = `$ ${maxVal}`;
    filters.minPrice = minVal;
    filters.maxPrice = maxVal;
}

minRange.addEventListener("input", updateSlider);
maxRange.addEventListener("input", updateSlider);
minRange.addEventListener("change", () => { currentPage = 1; loadPage(); });
maxRange.addEventListener("change", () => { currentPage = 1; loadPage(); });

updateSlider();

const sizeButtons = document.querySelectorAll(".size-item");
sizeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        btn.classList.toggle("active");
        if (btn.classList.contains("active")) {
            if (!filters.size.includes(value)) filters.size.push(value);
        } else {
            filters.size = filters.size.filter(s => s !== value);
        }
        currentPage = 1; loadPage();
    });
});

const dressItems = document.querySelectorAll(".style");
dressItems.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        btn.classList.toggle("active");
        if (btn.classList.contains("active")) {
            if (!filters.dressStyle.includes(value)) filters.dressStyle.push(value);
        } else {
            filters.dressStyle = filters.dressStyle.filter(d => d !== value);
        }
        currentPage = 1; loadPage();
    });
});

const allProducts = await productService.getAllProducts();
const selectedCategoryContainer = document.querySelectorAll(".selectedCategory");

let selectedCategory = filters.categoryId;

const category = document.querySelectorAll(".category");
category.forEach(btn => {
    btn.addEventListener("click", async () => {
        const value = Number(btn.dataset.value);
        filterSideBar.classList.remove("show-filter");

        if (selectedCategory === value) {
            btn.classList.remove("active");
            selectedCategory = null;
            filters.categoryId = null;
            selectedCategoryContainer.forEach(i => i.innerHTML = "All Categories");
        } else {
            category.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedCategory = value;
            filters.categoryId = selectedCategory;
            const categoryName = await productService.getCategoryById(selectedCategory);
            selectedCategoryContainer.forEach(i => i.innerHTML = categoryName.name);
        }
        currentPage = 1;
        loadPage();
    });
});

const genderItems = document.querySelectorAll(".gender");
genderItems.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        btn.classList.toggle("active");
        if (btn.classList.contains("active")) {
            if (!filters.gender.includes(value)) filters.gender.push(value);
        } else {
            filters.gender = filters.gender.filter(g => g !== value);
        }
        currentPage = 1; loadPage();
    });
});

const searchInput = document.querySelector("#search-input");
const mobileSearchInput = document.querySelector("#mobile-search-input");

function handleSearch(e) {
    filters.search = e.target.value.trim().toLowerCase();
    currentPage = 1;
    loadPage();
}

const debouncedSearch = debounce(handleSearch, 300);

if (searchInput) {
    if (filters.search) searchInput.value = filters.search;
    searchInput.addEventListener("input", debouncedSearch);
}
if (mobileSearchInput) {
    if (filters.search) mobileSearchInput.value = filters.search;
    mobileSearchInput.addEventListener("input", debouncedSearch);
}

function renderProducts(productsToRender) {
    const productsContainer = document.querySelector(".product-items");

    if (productsToRender.length > 0) {
        productsContainer.innerHTML = productsToRender.map((item, index) => {
            const animationClass = index % 2 === 0 ? "animate-side" : "animate-top";
            const delay = (index * 0.1).toFixed(1);

            const currentPrice = item.discountPercentage
                ? parseInt(item.price - item.price * item.discountPercentage / 100)
                : parseInt(item.price);

            const priceHtml = item.discountPercentage
                ? `<div class="flex items-center space-x-2">
                     <span class="font-bold text-xl">$${currentPrice}</span>
                     <span class="text-gray-400 font-bold line-through">$${parseInt(item.price)}</span>
                     <span class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">-${item.discountPercentage}%</span>
                   </div>`
                : `<div class="font-bold text-xl">$${currentPrice}</div>`;

            return `
            <div class="group ${animationClass} product-card" style="animation-delay: ${delay}s" data-id="${item.id}">
                <a href="#product?id=${item.id}" class="cursor-pointer block h-full">
                <div class="bg-[#F0EEED] rounded-3xl overflow-hidden mb-4 relative aspect-[1/1.1]">
                    <img src="${item.mainImage}" alt="${item.name}" loading="lazy"
                        class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        onerror="this.onerror=null;this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23999"><rect width="100" height="100" rx="8" fill="%23eee"/><text x="50" y="45" text-anchor="middle" font-size="14">📷</text><text x="50" y="65" text-anchor="middle" font-size="10" fill="%23999">No Image</text></svg>')}'">
                </div>
                <h3 class="font-bold text-base md:text-lg mb-1 truncate">${item.name}</h3>
                <div class="flex items-center gap-2 mb-3">
                    <div class="rating" style="--rating: ${item.rating}" aria-label="${item.rating} out of 5 stars"></div>
                    <span class="text-sm opacity-60">${item.rating} / 5</span>
                </div>
                ${priceHtml}
                </a>
            </div>`;
        }).join('');
    }

    toggleEmptyState(productsToRender.length > 0);
}

let selectedSort = "default";
let currentPage = 1;
const pageSize = 6;

function renderPagination(meta) {
    const pageIndexContainer = document.querySelector(".page-index");
    pageIndexContainer.innerHTML = "";
    for (let i = 1; i <= meta.totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.classList.add("text-gray-500", "py-3", "px-3", "cursor-pointer", "rounded-4xl");
        btn.setAttribute('aria-label', `Page ${i}`);

        if (i === meta.page) {
            btn.disabled = true;
            btn.classList.remove("text-gray-500");
            btn.classList.add("bg-gray-300", "text-black");
            btn.setAttribute('aria-current', 'page');
        }

        btn.addEventListener('click', () => {
            currentPage = i;
            loadPage();
        });

        pageIndexContainer.append(btn);
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    prevBtn.disabled = !meta.hasPreviousPage;
    nextBtn.disabled = !meta.hasNextPage;
    prevBtn.setAttribute('aria-label', 'Previous page');
    nextBtn.setAttribute('aria-label', 'Next page');
}

function paginate(items, page = 1, pageSize = 6) {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (page < 1) page = 1;
    if (page > totalPages && totalPages > 0) page = totalPages;
    const startIndex = (page - 1) * pageSize;
    return {
        page, pageSize, totalItems, totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        data: items.slice(startIndex, startIndex + pageSize)
    };
}

function getFinalPrice(product) {
    return product.discountPercentage
        ? product.price - (product.price * product.discountPercentage / 100)
        : product.price;
}

function sortProducts(products, sortType) {
    const sorted = [...products];
    switch (sortType) {
        case "price-asc": return sorted.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
        case "price-desc": return sorted.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
        case "rating": return sorted.sort((a, b) => b.rating - a.rating);
        case "name-asc": return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "name-desc": return sorted.sort((a, b) => b.name.localeCompare(a.name));
        default: return sorted;
    }
}

async function loadPage() {
    const productsContainer = document.querySelector(".product-items");

    showSkeleton(productsContainer, pageSize);

    const filteredProducts = sortProducts(filterProducts([...allProducts], filters), selectedSort);
    const result = paginate(filteredProducts, currentPage, pageSize);

    renderProducts(result.data);
    renderPagination(result);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function changeSorting(sortType) {
    selectedSort = sortType;
    currentPage = 1;
    loadPage();
}

const sort = document.getElementById("sort");
sort?.addEventListener("change", function () { changeSorting(this.value); });

document.getElementById("prevBtn")?.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; loadPage(); }
});

document.getElementById("nextBtn")?.addEventListener("click", () => {
    currentPage++; loadPage();
});

loadPage();

document.getElementById("btnFilter")?.addEventListener("click", function () {
    currentPage = 1;
    loadPage();
    filterSideBar.classList.remove("show-filter");
});

function filterProducts(products, filters) {
    return products.filter(product => {
        if (filters.categoryId !== null && product.categoryId !== filters.categoryId) return false;
        if (filters.search) {
            if (!product.name.toLowerCase().includes(filters.search)) return false;
        }
        if (filters.size?.length > 0) {
            if (!product.sizes?.some(s => filters.size.includes(s))) return false;
        }
        if (filters.dressStyle.length > 0) {
            if (!filters.dressStyle.map(s => s.toLowerCase()).includes(product.style?.toLowerCase())) return false;
        }
        if (filters.gender.length > 0) {
            if (!filters.gender.map(g => g.toLowerCase()).includes(product.gender?.toLowerCase())) return false;
        }
        const finalPrice = getFinalPrice(product);
        if ((filters.minPrice !== null && finalPrice < filters.minPrice) ||
            (filters.maxPrice !== null && finalPrice > filters.maxPrice)) return false;
        return true;
    });
}

function toggleEmptyState(hasProducts) {
    const emptyState = document.getElementById("emptyState");
    const productsGrid = document.querySelector(".product-items");
    const pagination = document.querySelector(".pagination");

    emptyState?.classList.toggle("hidden", hasProducts);
    productsGrid?.classList.toggle("hidden", !hasProducts);
    pagination?.classList.toggle("hidden", !hasProducts);
}

document.getElementById("clearFiltersBtn")?.addEventListener("click", () => {
    filters = { minPrice: 50, maxPrice: 1000, categoryId: null, dressStyle: [], size: [], gender: [], search: "" };
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    if (searchInput) searchInput.value = "";
    minRange.value = 50;
    maxRange.value = 1000;
    updateSlider();
    selectedCategoryContainer.forEach(i => i.innerHTML = "All Categories");
    selectedCategory = null;
    currentPage = 1;
    loadPage();
});

const showFilter = document.getElementById("settings");
const filterSideBar = document.querySelector(".filters");
const closeBtn = document.getElementById("closeBtn");

showFilter?.addEventListener("click", () => filterSideBar?.classList.toggle("show-filter"));
closeBtn?.addEventListener("click", () => filterSideBar?.classList.remove("show-filter"));

document.dispatchEvent(new CustomEvent("page-ready"));
