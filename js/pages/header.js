import { getAllProducts } from "../services/product_services.js"

const desktopSearchInput = document.getElementById("search-input");
const desktopResultsContainer = document.getElementById("search-results");
const mobileSearchInput = document.getElementById("mobile-search-input");
const mobileResultsContainer = document.getElementById("mobile-search-results");
const burgerIcon = document.getElementById("burgerIcon");
const mobileMenu = document.getElementById("mobile-menu");
const mobileLink = document.querySelectorAll(".mobile-link")
const allProducts = await getAllProducts();
console.log(allProducts);

// function for search handling to get product by name
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
        noResults.classList.add(...["p-2", "text-(--onbg)", "text-center"]);
        resultsContainer.appendChild(noResults);
    } else {
        filteredProducts.forEach(product => {
            const div = document.createElement("div");
            div.textContent = product.name;
            div.setAttribute("data-value", product.id);
            div.classList.add(...["p-3", "cursor-pointer", "hover:bg-(--bgsecond)", "border-b", "border-(--onbg)", "last:border-b-0"]);
            resultsContainer.appendChild(div);

            div.addEventListener("click", function () {
                window.location.href = `/index.html#product?id=${div.dataset.value}`;
                resultsContainer.innerHTML = '';
                inputElement.value = "";
                if (resultsContainer === mobileResultsContainer) {
                    const mobileMenu = document.getElementById('mobile-menu');
                    mobileMenu.classList.add('scale-y-0', 'opacity-0');
                }
            });
        });
    }

    resultsContainer.classList.remove("hidden");
}
//search input desktop
desktopSearchInput.addEventListener("input", () => {
    handleSearch(desktopSearchInput, desktopResultsContainer);
});
desktopSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const query = desktopSearchInput.value.trim();
        if (query) {
            window.location.href = `index.html#products?search=${encodeURIComponent(query)}`;
            desktopResultsContainer.innerHTML = "";
            // If already on products page, products.js handles the input event, 
            // but we might want to ensure the url updates.
            // Actually, products.js updates the filter state. 
            // But changing hash manually re-triggers router? 
            // Ideally products.js listens to hashchange? 
            // No, products.js runs once. 
            // But my products.js doesn't listen to hash change for filter updates, it listens to input.
            // If I change hash here, router reloads the component. 
            // This is good for "Enter" behavior.
        }
    }
});

//search input mobile
mobileSearchInput.addEventListener("input", () => {
    handleSearch(mobileSearchInput, mobileResultsContainer);
});
mobileSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const query = mobileSearchInput.value.trim();
        if (query) {
            window.location.href = `index.html#products?search=${encodeURIComponent(query)}`;
            mobileResultsContainer.innerHTML = "";
            mobileMenu.classList.add('scale-y-0', 'opacity-0');
        }
    }
});
//hide the results if the user click outside the result container
document.addEventListener("click", (e) => {
    if (!desktopSearchInput.contains(e.target) && !desktopResultsContainer.contains(e.target)) {
        desktopResultsContainer.innerHTML = "";
    }
    if (!mobileSearchInput.contains(e.target) && !mobileResultsContainer.contains(e.target)) {
        mobileResultsContainer.innerHTML = "";
    }
});

burgerIcon.addEventListener("click", function () {
    mobileMenu.classList.toggle('scale-y-0');
    mobileMenu.classList.toggle('opacity-0');
})
mobileLink.forEach(link => {
    link.addEventListener("click", function () {
        mobileMenu.classList.toggle('scale-y-0');
        mobileMenu.classList.toggle('opacity-0');

    })
})




