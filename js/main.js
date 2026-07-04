import { routes } from "./config/routes.js";

import { initTheme } from "./Utilities/theme.js";
import { renderAuthButtons } from "./Utilities/renderAuthButtons.js";
import * as authService from "./services/auth_services.js";
import { massage } from "./Utilities/helpers.js";

let currentScript;

async function loadComponent(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const res = await fetch(`${file}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`Failed to load ${file}`);
    el.innerHTML = await res.text();
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-(--onbg)/50">Failed to load content. <button class="underline cursor-pointer" onclick="location.reload()">Reload page</button></div>`;
  }
}

function loadJS(src) {
  if (currentScript) currentScript.remove();
  if (!src) return;
  currentScript = document.createElement("script");
  currentScript.src = `${src}?t=${Date.now()}`;
  currentScript.type = "module";
  document.body.appendChild(currentScript);
}

function getPage() {
  return location.hash.split("?")[0].replace("#", "") || "home";
}

async function router() {
  const page = getPage();

  if (authService.isAuthenticated()) {
    if (page === "login" || page === "register") {
      window.location.hash = "#home";
      return;
    }
  }

  const route = routes[page] || routes.home;
  const chatbot = document.getElementById("chatbot");

  if (page === "login" || page === "register") {
    if (chatbot) chatbot.style.display = "none";
  } else {
    if (chatbot) chatbot.style.display = "block";
  }

  renderAuthButtons();

  await loadComponent("content", route.html);

  const content = document.getElementById("content");
  if (content) {
    const mainSections = content.querySelectorAll("section");
    mainSections.forEach((section, index) => {
      section.style.animationDelay = `${index * 0.2}s`;
      const animationClass = index % 2 === 0 ? "animate-side" : "animate-top";
      section.classList.add(animationClass);
    });
  }

  loadJS(route.js);
}

function hideSplash() {
  const splash = document.getElementById("splash-screen");
  if (!splash) return;
  splash.classList.add("hidden");
  setTimeout(() => splash.remove(), 500);
}

// Init
(async function init() {
  await loadComponent("header", "html/header.html");
  initTheme();
  renderAuthButtons();
  loadJS("js/pages/header.js");

  await loadComponent("footer", "html/footer.html");

  const page = getPage();
  if (page !== "login" && page !== "register") {
    await loadComponent("chatbot", "html/chatbot.html");
    loadJS("js/pages/chatbot.js");
  }

  await router();
  hideSplash();
})();

window.addEventListener("hashchange", router);

// --- Back to top ---
const backToTop = document.getElementById("back-to-top");
if (backToTop) {
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 400) {
          backToTop.classList.remove("opacity-0", "invisible", "translate-y-4");
        } else {
          backToTop.classList.add("opacity-0", "invisible", "translate-y-4");
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// --- Online/offline detection ---
window.addEventListener("offline", () => {
  massage("You are offline. Some features may be unavailable.", "warning");
});
window.addEventListener("online", () => {
  massage("Connection restored.", "success");
});
