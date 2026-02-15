import { routes } from "./config/routes.js";

import { initTheme } from "./Utilities/theme.js";
import { renderAuthButtons } from "./Utilities/renderAuthButtons.js";
import * as authService from "./services/auth_services.js";
import { getAllProducts } from "./services/product_services.js";
// import * as checkout from './services/checkout.js';

// checkout.setOrderDefault();

// Reference to the currently loaded page script
let currentScript;

//Loads an HTML component into a specific element by ID
async function loadComponent(id, file) {
  const res = await fetch(`${file}?t=${Date.now()}`);
  const html = await res.text();
  document.getElementById(id).innerHTML = html;
}

// Dynamically loads a JavaScript module for the current page
// Removes the previous script to avoid conflicts
function loadJS(src) {
  if (currentScript) currentScript.remove();
  if (!src) return;

  currentScript = document.createElement("script");
  currentScript.src = `${src}?t=${Date.now()}`; // Cache busting
  currentScript.type = "module";
  document.body.appendChild(currentScript);
}

// Extracts the current page name from the URL hash Defaults to 'home'
function getPage() {
  return location.hash.split("?")[0].replace("#", "") || "home";
}

// Main router function
// Handles page navigation and layout visibility
async function router() {
  const page = getPage();

  // Redirect based on authentication status
  if (authService.isAuthenticated()) {
    if (page === "login" || page === "register") {
      window.location.hash = "#home";
      return;
    }
  }

  const route = routes[page] || routes.home;

  // Elements that should be hidden on login/register pages
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");
  const chatbot = document.getElementById("chatbot");

  // Hide layout elements on auth pages
  if (page === "login" || page === "register") {
    // if (header) header.style.display = 'none';
    // if (footer) footer.style.display = 'none';
    if (chatbot) chatbot.style.display = "none";
  } else {
    // if (header) header.style.display = 'block';
    // if (footer) footer.style.display = 'block';

    if (chatbot) chatbot.style.display = "block";
  }

  // Render login/logout buttons
  renderAuthButtons();

  // Load page HTML and JavaScript
  await loadComponent("content", route.html);

  // Apply entry animations to main sections
  const content = document.getElementById("content");
  if (content) {
    const mainSections = content.querySelectorAll("section");
    mainSections.forEach((section, index) => {
      // Add staggered delay
      section.style.animationDelay = `${index * 0.4}s`;

      // Alternate animations for visual variety
      const animationClass = index % 2 === 0 ? "animate-side" : "animate-top";
      section.classList.add(animationClass);
    });
  }

  loadJS(route.js);
}

// Load header and initialize theme

loadComponent("header", "html/header.html").then(() => {
  initTheme();
  renderAuthButtons();
  const script = document.createElement("script");
  script.src = "js/pages/header.js"
  script.type = "module";
  document.body.appendChild(script);
});

// Load footer

loadComponent("footer", "html/footer.html");

// Load chatbot only if not on auth pages
if (getPage() !== "login" && getPage() !== "register") {
  loadComponent("chatbot", "html/chatbot.html").then(() => {
    const script = document.createElement("script");
    script.src = "js/pages/chatbot.js?t=" + Date.now();
    script.type = "module";
    document.body.appendChild(script);
  });
}

router();

// Re-run router when URL hash changes
window.addEventListener("hashchange", router);
