import { getAllProducts } from "../services/product_services.js";
import { debounce } from "../Utilities/helpers.js";

const desktopSearchInput = document.getElementById("search-input");
const desktopResultsContainer = document.getElementById("search-results");
const mobileSearchInput = document.getElementById("mobile-search-input");
const mobileResultsContainer = document.getElementById("mobile-search-results");
const burgerIcon = document.getElementById("burgerIcon");
const mobileMenu = document.getElementById("mobile-menu");
const mobileLinks = document.querySelectorAll(".mobile-link");
const allProducts = await getAllProducts();

function handleSearch(inputElement, resultsContainer) {
    const query = inputElement.value.toLowerCase().trim();
    resultsContainer.innerHTML = "";

    if (!query) {
        resultsContainer.classList.add("hidden");
        return;
    }

    const limit = 5;
    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(query)
    ).slice(0, limit);

    if (filteredProducts.length === 0) {
        const noResults = document.createElement("div");
        noResults.textContent = "No products found";
        noResults.classList.add("p-2", "text-(--onbg)", "text-center", "opacity-60");
        resultsContainer.appendChild(noResults);
    } else {
        filteredProducts.forEach(product => {
            const div = document.createElement("div");
            div.textContent = product.name;
            div.dataset.value = product.id;
            div.classList.add("p-3", "cursor-pointer", "hover:bg-(--bgsecond)", "border-b", "border-(--onbg)/10", "last:border-b-0", "transition");
            div.setAttribute('role', 'option');
            resultsContainer.appendChild(div);

            div.addEventListener("click", function () {
                window.location.href = `#product?id=${div.dataset.value}`;
                resultsContainer.innerHTML = '';
                inputElement.value = "";
                resultsContainer.classList.add("hidden");
                if (resultsContainer === mobileResultsContainer) {
                    mobileMenu?.classList.add('scale-y-0', 'opacity-0');
    burgerIcon?.setAttribute('aria-expanded', 'false');
  }
});

            div.addEventListener("keydown", (e) => {
                if (e.key === 'Enter') div.click();
            });
        });
    }

    resultsContainer.classList.remove("hidden");
}

const debouncedSearchDesktop = debounce(() => {
    handleSearch(desktopSearchInput, desktopResultsContainer);
}, 200);

const debouncedSearchMobile = debounce(() => {
    handleSearch(mobileSearchInput, mobileResultsContainer);
}, 200);

if (desktopSearchInput) {
    desktopSearchInput.addEventListener("input", debouncedSearchDesktop);
    desktopSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const query = desktopSearchInput.value.trim();
            if (query) {
                window.location.href = `#products?search=${encodeURIComponent(query)}`;
                desktopResultsContainer.innerHTML = "";
                desktopResultsContainer.classList.add("hidden");
            }
        }
    });
}

if (mobileSearchInput) {
    mobileSearchInput.addEventListener("input", debouncedSearchMobile);
    mobileSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const query = mobileSearchInput.value.trim();
            if (query) {
                window.location.href = `#products?search=${encodeURIComponent(query)}`;
                mobileResultsContainer.innerHTML = "";
                mobileResultsContainer.classList.add("hidden");
                mobileMenu?.classList.add('scale-y-0', 'opacity-0');
                burgerIcon?.setAttribute('aria-expanded', 'false');
            }
        }
    });
}

document.addEventListener("click", (e) => {
    if (desktopSearchInput && !desktopSearchInput.contains(e.target) && !desktopResultsContainer?.contains(e.target)) {
        desktopResultsContainer.innerHTML = "";
        desktopResultsContainer?.classList.add("hidden");
    }
    if (mobileSearchInput && !mobileSearchInput.contains(e.target) && !mobileResultsContainer?.contains(e.target)) {
        mobileResultsContainer.innerHTML = "";
        mobileResultsContainer?.classList.add("hidden");
    }
});

if (burgerIcon && mobileMenu) {
    burgerIcon.addEventListener("click", function () {
        const isOpen = !mobileMenu.classList.contains('scale-y-0');
        mobileMenu.classList.toggle('scale-y-0');
        mobileMenu.classList.toggle('opacity-0');
        this.setAttribute('aria-expanded', !isOpen);
    });
}

mobileLinks.forEach(link => {
    link.addEventListener("click", function () {
        mobileMenu?.classList.add('scale-y-0', 'opacity-0');
        burgerIcon?.setAttribute('aria-expanded', 'false');
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu && !mobileMenu.classList.contains('scale-y-0')) {
        mobileMenu.classList.add('scale-y-0', 'opacity-0');
        burgerIcon?.setAttribute('aria-expanded', 'false');
        burgerIcon?.focus();
    }
});
