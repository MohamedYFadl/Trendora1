import * as productService from "../services/product_services.js"
import { getQueryParam } from "../Utilities/helpers.js"

//Toggle filter items
document.querySelectorAll('.section-header').forEach(button => {
    button.addEventListener('click', function () {
        const sectionId = this.getAttribute('data-section');
        const content = document.getElementById(sectionId);
        const icon = this.querySelector('i');

        // Toggle collapsed state
        this.classList.toggle('collapsed');
        content.classList.toggle('collapsed');

        // Rotate icon
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

/* =========> Get All Categories  <=========  */

var categories = await productService.getAllCategories();
const categoryContainer = document.getElementById("categories");
const urlCategoryId = getQueryParam('categoryId');

(function showCategories() {

    categories.forEach(c => {
        const isActive = urlCategoryId && Number(urlCategoryId) === c.id ? 'active' : '';
        categoryContainer.innerHTML += ` 
                           <li class=" flex justify-between items-center p-3.5  cursor-pointer text-(--main-text) opacity-70 text-sm category ${isActive}"
                        data-value="${c.id}">
                        <span>${c.name}</span><span><i class="fa-solid fa-angle-right"></i></span>
                    </li>`
    })
})();

/* =========> Apply Filtration  <=========  */
//Default Values
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

// Set initial active state for Gender if URL param exists
if (urlGender) {
    document.querySelectorAll('.gender').forEach(btn => {
        if (btn.dataset.value.toLowerCase() === urlGender.toLowerCase()) {
            btn.classList.add('active');
        }
    });
}

// Update Category Title if URL param exists
if (urlCategoryId) {
    const selectedCategoryContainer = document.querySelectorAll(".selectedCategory");
    const cat = await productService.getCategoryById(urlCategoryId);
    if (cat) selectedCategoryContainer.forEach(i => i.innerHTML = cat.name);
}


//1. ===== Price Slider Track [Determine price] =====

const minRange = document.getElementById("minRange");
const maxRange = document.getElementById("maxRange");
let minPrice = document.getElementById("minPrice");
let maxPrice = document.getElementById("maxPrice");
const sliderTrack = document.getElementById("sliderTrack");
const maxGap = 10;

function updateSlider() {
    let minVal = parseInt(minRange.value);
    let maxVal = parseInt(maxRange.value);
    const min = parseInt(minRange.min);
    const max = parseInt(minRange.max);

    //Validation Range Inputs
    if (maxVal - minVal < maxGap) {
        if (event?.target === minRange) {
            minRange.value = maxVal - maxGap;
        } else {
            maxRange.value = minVal + maxGap;
        }
        minVal = minRange.value;
        maxVal = maxRange.value;
    }

    //Pass the values
    minPrice.value = minVal;
    maxPrice.value = maxVal;


    //Fill sliderTrack
    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    sliderTrack.style.background = `
    linear-gradient(
      to right,
      #ddd ${minPercent}%,
      #000 ${minPercent}%,
      #000 ${maxPercent}%,
      #ddd ${maxPercent}%
    )
  `;

    minPrice.textContent = `$ ${minVal}`;
    maxPrice.textContent = `$ ${maxVal}`;
    filters.minPrice = minVal
    filters.maxPrice = maxVal;
}

minRange.addEventListener("input", updateSlider);
maxRange.addEventListener("input", updateSlider);

// Add change event for reloading page to avoid excessive re-renders while dragging
minRange.addEventListener("change", () => { currentPage = 1; loadPage(); });
maxRange.addEventListener("change", () => { currentPage = 1; loadPage(); });

//in case the user does not change the price values
updateSlider();

//2. ======= Determine the size ========
const sizeButtons = document.querySelectorAll(".size-item");


sizeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        btn.classList.toggle("active");

        if (btn.classList.contains("active")) {
            // ADD
            if (!filters.size.includes(value)) {
                filters.size.push(value);
            }
        } else {
            // REMOVE
            filters.size = filters.size.filter(size => size !== value);
        }

        currentPage = 1; loadPage(); // Auto reload on filter change
    });
});

//3. ======= Determine the dress style =======

const dressItems = document.querySelectorAll(".style");

dressItems.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.value;

        btn.classList.toggle("active");

        if (btn.classList.contains("active")) {
            // ADD
            if (!filters.dressStyle.includes(value)) {
                filters.dressStyle.push(value);
            }
        } else {
            // REMOVE
            filters.dressStyle = filters.dressStyle.filter(
                dress => dress !== value
            );
        }

        currentPage = 1; loadPage(); // Auto reload
    });
});


//4. Filter by category
const allProducts = await productService.getAllProducts();
const selectedCategoryContainer = document.querySelectorAll(".selectedCategory");

let selectedCategory = filters.categoryId;

const category = document.querySelectorAll(".category");
category.forEach(btn => {
    btn.addEventListener("click", async () => {

        const value = Number(btn.dataset.value);
        filterSideBar.classList.remove("show-filter")

        if (selectedCategory === value) {
            // Deselect if already selected
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
            selectedCategoryContainer.forEach(i => i.innerHTML = categoryName.name)
        }

        currentPage = 1;
        loadPage();
    })
});

//5. Filter by gender
const genderItems = document.querySelectorAll(".gender");

genderItems.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.value;

        btn.classList.toggle("active");

        if (btn.classList.contains("active")) {
            // ADD
            if (!filters.gender.includes(value)) {
                filters.gender.push(value);
            }
        } else {
            // REMOVE
            filters.gender = filters.gender.filter(
                gender => gender !== value
            );
        }

        currentPage = 1; loadPage(); // Auto reload
    });
});

//6. Search Functionality
const searchInput = document.querySelector("#search-input");
const mobileSearchInput = document.querySelector("#mobile-search-input");

function handleSearch(e) {
    filters.search = e.target.value.trim().toLowerCase();
    currentPage = 1;
    loadPage();
}

if (searchInput) {
    // Check if we came from another page with a search query
    if (filters.search) {
        searchInput.value = filters.search;
    }
    searchInput.addEventListener("input", handleSearch);
}

if (mobileSearchInput) {
    if (filters.search) {
        mobileSearchInput.value = filters.search;
    }
    mobileSearchInput.addEventListener("input", handleSearch);
}


function renderProducts(productsToRender) {
    var productsContainer = document.querySelector(".product-items");

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
                <a href="index.html#product?id=${item.id}" class="cursor-pointer block h-full">
                <div class="bg-[#F0EEED] rounded-3xl overflow-hidden mb-4 relative aspect-[1/1.1]">
                    <img src="${item.mainImage}" alt="${item.name}" loading="lazy"
                        class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                </div>
                <h3 class="font-bold text-base md:text-lg mb-1 truncate">${item.name}</h3>
                 <div class="flex items-center gap-2 mb-3">
                     <div class="rating" style="--rating: ${item.rating}"></div>
                     <span class="text-sm opacity-60">${item.rating} / 5</span>
                   </div>
                   ${priceHtml}
                </a>
            </div>
            `;
        }).join('');

    } else {
        productsContainer.innerHTML = "";
    }

    // Check execution
    toggleEmptyState(productsToRender.length > 0);
}

// render pagination buttons
let selectedSort = "default";
let currentPage = 1;
const pageSize = 6;
function renderPagination(meta) {
    var pageIndexContainer = document.querySelector(".page-index");
    pageIndexContainer.innerHTML = ""
    for (let i = 1; i <= meta.totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;

        let btnStyles = ["text-gray-500", "py-3", "px-3", "cursor-pointer", "rounded-4xl"]
        btn.classList.add(...btnStyles);

        if (i === meta.page) {
            btn.disabled = true;
            btn.classList.remove("text-gray-500")
            btn.classList.add("bg-gray-300", "text-black")
        }

        btn.onclick = () => {
            currentPage = i;
            loadPage();
        };

        pageIndexContainer.append(btn)
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    prevBtn.disabled = !meta.hasPreviousPage;
    nextBtn.disabled = !meta.hasNextPage;

    // Style disabled buttons
    prevBtn.style.opacity = meta.hasPreviousPage ? "1" : "0.5";
    nextBtn.style.opacity = meta.hasNextPage ? "1" : "0.5";
    prevBtn.style.cursor = meta.hasPreviousPage ? "pointer" : "not-allowed";
    nextBtn.style.cursor = meta.hasNextPage ? "pointer" : "not-allowed";

}
function paginate(items, page = 1, pageSize = 6) {

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (page < 1) page = 1;
    if (page > totalPages && totalPages > 0) page = totalPages;

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const data = items.slice(startIndex, endIndex);

    return {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        data
    };
}
function getFinalPrice(product) {
    if (product.discountPercentage) {
        return product.price - (product.price * product.discountPercentage / 100);
    }
    return product.price;
}

function sortProducts(products, sortType) {
    const sorted = [...products];

    switch (sortType) {
        case "price-asc":
            return sorted.sort(
                (a, b) => getFinalPrice(a) - getFinalPrice(b)
            );
        case "price-desc":
            return sorted.sort(
                (a, b) => getFinalPrice(b) - getFinalPrice(a)
            );
        case "rating":
            return sorted.sort((a, b) => b.rating - a.rating);
        case "name-asc":
            return sorted.sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        case "name-desc":
            return sorted.sort((a, b) =>
                b.name.localeCompare(a.name)
            );

        default:
            return sorted;
    }
}

async function loadPage() {
    let baseProducts = allProducts;

    let filteredProducts = filterProducts(baseProducts, filters);
    filteredProducts = sortProducts(filteredProducts, selectedSort);

    const result = paginate(filteredProducts, currentPage, pageSize);

    renderProducts(result.data);
    renderPagination(result);

    // Only scroll if not initial load or specific user action? 
    // Usually good to scroll top on page change.
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
function changeSorting(sortType) {
    selectedSort = sortType;
    currentPage = 1;
    loadPage();
}
const sort = document.getElementById("sort");
sort.addEventListener("change", function () {
    changeSorting(this.value)
})

document.getElementById("prevBtn").onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        loadPage();
    }
};
document.getElementById("nextBtn").onclick = () => {
    currentPage++;
    loadPage();
};

loadPage();


document.getElementById("btnFilter").addEventListener("click", function () {
    currentPage = 1;
    loadPage();
    filterSideBar.classList.remove("show-filter")
})


function filterProducts(products, filters) {
    return products.filter(product => {

        // Category
        if (filters.categoryId !== null &&
            product.categoryId !== filters.categoryId) {
            return false;
        }

        // Search
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(searchTerm);
            // Can extend to description or other fields if needed
            if (!matchesName) return false;
        }

        // Size
        if (filters.size && filters.size.length > 0) {
            const hasSize = product.sizes.some(size =>
                filters.size.includes(size)
            );
            if (!hasSize) return false;
        }

        // Style
        if (filters.dressStyle.length > 0) {
            const productStyle = product.style.toLowerCase();
            const selectedStyles = filters.dressStyle.map(s => s.toLowerCase());

            if (!selectedStyles.includes(productStyle)) {
                return false;
            }
        }
        if (filters.gender.length > 0) {
            const productGender = product.gender ? product.gender.toLowerCase() : "";
            const selectedGenders = filters.gender.map(g => g.toLowerCase());

            if (!selectedGenders.includes(productGender)) {
                return false;
            }
        }
        // Price
        const finalPrice = getFinalPrice(product);
        if ((filters.minPrice !== null && finalPrice < filters.minPrice) ||
            (filters.maxPrice !== null && finalPrice > filters.maxPrice)) {
            return false;
        }
        return true;
    });
}
function toggleEmptyState(hasProducts) {
    const emptyState = document.getElementById("emptyState");
    const productsGrid = document.querySelector(".product-items");
    const pagination = document.querySelector(".pagination")

    if (hasProducts) {
        emptyState.classList.add("hidden");
        productsGrid.classList.remove("hidden");
        pagination.classList.remove("hidden")
    } else {
        emptyState.classList.remove("hidden");
        productsGrid.classList.add("hidden");
        pagination.classList.add("hidden")

    }
}
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    filters = {
        minPrice: 50,
        maxPrice: 1000,
        categoryId: null,
        dressStyle: [],
        size: [],
        gender: [],
        search: ""
    };

    // Clear UI state
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));

    // Reset inputs
    if (searchInput) searchInput.value = "";
    minRange.value = 50;
    maxRange.value = 1000;

    updateSlider();

    // Reset category title
    selectedCategoryContainer.forEach(i => i.innerHTML = "All Categories");
    selectedCategory = null;

    currentPage = 1;
    loadPage();
});


var showFilter = document.getElementById("settings");
var filterSideBar = document.querySelector(".filters");

showFilter.addEventListener("click", function () {
    filterSideBar.classList.toggle("show-filter");
});
var closeBtn = document.getElementById("closeBtn");
closeBtn.addEventListener("click", function () {
    filterSideBar.classList.remove("show-filter")
})







