# 🛒 Shop.co - Modern E-Commerce Platform

**🔗 Live Demo:** [shopco-shop.vercel.app](https://shopco-shop.vercel.app/)

A premium, fast, and responsive E-Commerce Single Page Application (SPA) built with a modern architecture using **Vanilla JavaScript (ES6+ Modules)**, **Tailwind CSS v4**, and smooth **CSS Transitions**.

![Banner](https://img.shields.io/badge/Status-Project_Completed-success?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-HTML--CSS--JS-blue?style=for-the-badge)
![Design](https://img.shields.io/badge/Design-Premium--Dark--Theme-black?style=for-the-badge)

---

## ✨ Key Features

### 🎞️ Smooth Page Transitions
- **Dynamic Entry Animations**: Content slides in smoothly from the side and top when navigating between pages.
- **Staggered Delays**: List items (products, reviews) appear sequentially with a cascading effect for a premium feel.
- **SPA-like Feel**: Fast navigation using a custom router that loads components without full page refreshes.

### 📱 Responsive & Premium Header
- **Fixed Navigation**: Header stays at the top for easy access.
- **Slide-down Transition**: The header animates smoothly on initial load.
- **Advanced Mobile Menu**: A fully animated, responsive side-navigation for smaller screens.
- **Interactive Search**: An animated search bar that expands and focuses for a better UX.

### 🌓 Advanced Theme Engine
- **Dark/Light Mode**: Full support for both themes with instant toggling.
- **System Memory**: Remembers user theme preferences using `localStorage`.
- **CSS Variables**: Unified color palette and spacing system using modern CSS variables.

### 🛍️ Core E-Commerce Functionality
- **Dynamic Product Engine**: Fetching and rendering products from JSON APIs.
- **Shopping Cart**: Real-time cart management (Add/Remove/Update).
- **Checkout & Invoices**: Integrated checkout flow with PDF invoice generation using `jsPDF`.
- **User Authentication**: Secure registration and login flow with encrypted storage.

---

## 🛠️ Tech Stack & Tools

| Technology | Usage |
| :--- | :--- |
| **HTML5** | Semantic structure for all pages and components. |
| **Tailwind CSS v4** | Modern, utility-first styling with high performance. |
| **JavaScript (ES6+)** | Pure JS logic with modular architecture. |
| **Tailwind CLI** | Built-in compiler for optimized CSS output. |
| **LocalStorage** | Persistent data for Cart, Auth, and Theme. |
| **jsPDF** | Client-side dynamic PDF generation for invoices. |

---

## 📁 Project Architecture

```bash
ecommerce-web/
├── html/          # Reusable component templates
├── js/
│   ├── Utilities/ # Helper functions (Theme, Validation, Helpers)
│   ├── config/    # Routes and API configurations
│   ├── api/       # Fetch wrappers and API endpoints
│   ├── services/  # Business logic (Auth, Products, Cart)
│   ├── pages/     # Page-specific initialization logic
│   └── main.js    # Entry point & Global router
├── css/
│   ├── main.css   # Source CSS with Tailwind directives & Animations
│   └── output.css # Minified production CSS (generated)
├── assets/        # Images, fonts, and static media
├── package.json   # Build scripts and dependencies
└── README.md      # You are here!
```

---

## 🚀 Development & Deployment

### Run Locally
To compile the Tailwind CSS with auto-watch for development:
```bash
npm run dev
```

### Production Build
To generate a minified, production-ready CSS file:
```bash
npm run build
```

### 🌍 Deployment on Vercel
The project is fully optimized for Vercel deployment:
1. Push the code to a **GitHub** repository.
2. Link the repository to **Vercel**.
3. Use `npm run build` as the build command.
4. Set the output directory to the root `/`.

---

## 📐 Architecture Principles
1. **Separation of Concerns**: Logic (Services), UI (Pages), and Data (API) are kept independent.
2. **Standardization**: Folder names and imports are case-sensitive and follow naming conventions (e.g., `Utilities`).
3. **No Placeholders**: Real dynamic rendering for all components.
4. **Consistency**: Global variables are used for all colors, spacing, and typography.

---

## � Meet the Team

Developed with ❤️ by our talented team:

| Name | GitHub Profile |
| :--- | :--- |
| **Mohamed Elsefy** | [@Mohamed-Elsefy](https://github.com/Mohamed-Elsefy) |
| **Osama** | [@osama816](https://github.com/osama816) |
| **Karim Khalifa** | [@KarimKhalifa98](https://github.com/KarimKhalifa98) |
| **Khaled** | [@the-khaled](https://github.com/the-khaled) |
| **Mohamed Y. Fadl** | [@MohamedYFadl](https://github.com/MohamedYFadl) |
| **Mostafa Sobhy** | [@mostafasobhy74-hub](https://github.com/mostafasobhy74-hub) |

*Aiming for the highest quality and cleanest code possible.*


