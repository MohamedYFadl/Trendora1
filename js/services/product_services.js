let cachedProducts = null;
let cachedCategories = null;

// get all products from json file [Used in main,home,products]
export async function getAllProducts() {
  if (cachedProducts) return cachedProducts;
  const response = await fetch(`./data/product.json`);
  if (!response.ok) throw new Error('Failed to fetch products');
  cachedProducts = await response.json();
  return cachedProducts;
}

//get all categories from json [used in chatbot,products]
export async function getAllCategories() {
  if (cachedCategories) return cachedCategories;
  const response = await fetch("./data/categories.json");
  cachedCategories = await response.json();
  return cachedCategories;
}

// get product by id [Used in product details]
export async function getProductById(id) {
  const products = await getAllProducts();
  return products.find((product) => product.id == id);
}

// get products by categoryId [Used in chatbot,product details,product]
export async function getProductsByCategoryId(categoryId) {
  const products = await getAllProducts()
  const filteredProducts = products.filter(product => product.categoryId == categoryId)
  return filteredProducts;
}
//get category by name [Not used anywhere]
export async function getCategoryByName(categoryName) {
  const categories = await getAllCategories();
  return categories.find((category) => category.name == categoryName);
}

// get all reviews [Used in home]
export async function getAllReviews() {
  const products = await getAllProducts();
  let jsonReviews = [];
  products.forEach((product) => {
    if (product.reviews && Array.isArray(product.reviews)) {
      jsonReviews = jsonReviews.concat(product.reviews);
    }
  });

  const localReviews = JSON.parse(localStorage.getItem("reviews") || "[]");
  return [...jsonReviews, ...localReviews];
}

//get reviews (local storage & json file) for specific product  [Used in product details]
export async function getReviewsByProductId(productId) {
  const products = await getAllProducts();
  const product = products.find((p) => p.id == productId);
  const jsonReviews = product ? (product.reviews || []) : [];

  const localReviews = JSON.parse(localStorage.getItem("reviews") || "[]");
  const filteredLocalReviews = localReviews.filter((r) => r.productId == productId);

  return [...jsonReviews, ...filteredLocalReviews];
}

// get product by count [Not Used]
export async function getProductByCount(start, end) {
  const products = await getAllProducts();
  return products.slice(start, end);
}

//Used in product details
export async function countReviews(productId) {
  const reviews = await getReviewsByProductId(productId);
  return reviews.length;
}

// get discount [Not Used]
export async function getDiscount(productId) {
  const product = await getProductById(productId);
  return product ? product.discount : 0;
}
// Used in products
export async function getCategoryById(categoryId) {
  const categories = await getAllCategories();
  return categories.find((category) => category.id == categoryId);
}

// Calculate discounted price [Used in product details]
export function calculateDiscountedPrice(price, discountPercentage) {
  if (!discountPercentage) return price;
  return price - price * (discountPercentage / 100);
}
//get product id from url [Used in product details]
export function getProductId() {
  const hash = (location.hash || "").split("?")[1];
  if (!hash) return null;
  return new URLSearchParams(hash).get("id");
}

//add review [Used in product details]
export function addReview(review) {
  let reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
  if (!Array.isArray(reviews)) {
    reviews = [];
  }
  reviews.push(review);
  localStorage.setItem("reviews", JSON.stringify(reviews));
}


// Fetch all products [Not used]
export function renderProducts(products, container) {
  products.map((product) => {
    let p = `<div class="product-link group relative flex-none w-64 h-96 mb-4 rounded-2xl border border-gray-200 overflow-hidden shadow-sm" key="${product.id}"> 

  <div class="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-110" 
       style="background-image: url('${product.mainImage}'); background-size: cover; background-position: center;">
  </div>

  <div class="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

  <div class="absolute bottom-0 w-full z-20 p-4 backdrop-blur-xs bg-white/10 border-t border-white/10 text-white">

    <h3 class="font-medium text-sm line-clamp-2 mb-2">
      ${product.name}
    </h3>

    <div class="flex items-center gap-2 mb-2">
      <div class="rating rating-xs" style="--rating: ${product.rating}"></div>
      <span class="text-[10px] opacity-80">${product.rating} / 5</span>
    </div>

    <div class="flex items-end justify-between">
      <div class="flex flex-col">
        ${product.discountPercentage > 0 ? `
          <span class="text-[10px] line-through opacity-60">$${product.price}</span>
        ` : `<span class="h-4"></span>`}
        <span class="text-lg font-bold">
          $${product.discountPercentage > 0
        ? Math.floor(product.price - (product.price * product.discountPercentage) / 100)
        : product.price}
        </span>
      </div>

      ${product.discountPercentage > 0 ? `
        <span class="bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold mb-1">
          ${product.discountPercentage}% OFF
        </span>
      ` : ""}
    </div>
  </div>
</div>`;
    container.innerHTML += p;
  });
}

// make product on click go to product details page

export function makeLink(arr) {
  arr.forEach((e) => {
    e.addEventListener("click", () => {
      window.location.href = `#product?id=${e.getAttribute("key")}`;
    });
  });
}
