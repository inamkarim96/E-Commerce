// shared/style.jsx

/* Navbar Styles */
export const navbarStyles = `
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    z-index: 1000;
    transition: var(--transition);
    padding: 0 2rem;
  }

  .navbar.scrolled {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    height: 70px;
    box-shadow: var(--shadow-sm);
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
  }

  .logo-icon {
    color: var(--primary);
  }

  .nav-links.desktop {
    display: flex;
    gap: 2rem;
  }

  .nav-link {
    font-weight: 500;
    color: var(--text-main);
    position: relative;
  }

  .nav-link:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--primary);
    transition: var(--transition);
  }

  .nav-link.active:after, 
  .nav-link:hover:after {
    width: 100%;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .nav-icon-btn {
    position: relative;
    color: var(--text-main);
  }

  .cart-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--accent);
    color: white;
    font-size: 0.7rem;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .mobile-menu-btn {
    display: none;
  }

  .mobile-menu {
    position: fixed;
    top: 80px;
    left: 0;
    width: 100%;
    background: white;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    transform: translateY(-100%);
    opacity: 0;
    transition: var(--transition);
    visibility: hidden;
    box-shadow: var(--shadow-md);
  }

  .mobile-menu.open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .mobile-link {
    font-size: 1.2rem;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .nav-links.desktop {
      display: none;
    }
    .mobile-menu-btn {
      display: block;
    }
    .navbar {
      padding: 0 1rem;
    }
  }
`;

/* Footer Styles */
export const footerStyles = `
  .footer {
    background: var(--bg-footer);
    color: white;
    padding: 5rem 2rem 2rem;
    margin-top: 5rem;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
    gap: 4rem;
    margin-bottom: 4rem;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-light);
    margin-bottom: 1.5rem;
  }

  .footer-desc {
    color: #9ca3af;
    line-height: 1.7;
    margin-bottom: 2rem;
  }

  .social-links {
    display: flex;
    gap: 1.5rem;
  }

  .social-links a {
    color: #9ca3af;
    transition: var(--transition);
  }

  .social-links a:hover {
    color: var(--primary-light);
    transform: translateY(-3px);
  }

  .footer-links h3, 
  .footer-contact h3 {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    position: relative;
  }

  .footer-links h3:after, 
  .footer-contact h3:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 40px;
    height: 2px;
    background: var(--primary-light);
  }

  .footer-links ul li {
    margin-bottom: 1rem;
  }

  .footer-links ul li a {
    color: #9ca3af;
    transition: var(--transition);
  }

  .footer-links ul li a:hover {
    color: white;
    padding-left: 5px;
  }

  .contact-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    color: #9ca3af;
    margin-bottom: 1.5rem;
  }

  .contact-item span {
    line-height: 1.4;
  }

  .footer-bottom {
    border-top: 1px solid #374151;
    padding-top: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .footer-legal {
    display: flex;
    gap: 2rem;
  }

  .footer-legal a:hover {
    color: white;
  }

  @media (max-width: 1024px) {
    .footer-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .footer-grid {
      grid-template-columns: 1fr;
      gap: 3rem;
    }
    .footer-bottom {
      flex-direction: column;
      gap: 1.5rem;
      text-align: center;
    }
  }
`;

/* MainLayout Styles */
export const mainLayoutStyles = `
  .main-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .content {
    flex: 1;
    margin-top: 80px; /* Offset for fixed navbar */
  }
`;

/* LandingPage Styles */
export const landingStyles = `
  .hero {
    height: 90vh;
    background: url('/hero-bg.png') no-repeat center center/cover;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    color: white;
    padding: 0 2rem;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
  }

  .hero h1 {
    font-size: 4.5rem;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
  }

  .hero h1 span {
    color: var(--accent);
  }

  .hero p {
    font-size: 1.25rem;
    margin-bottom: 2.5rem;
    opacity: 0.9;
  }

  .hero-btns {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
  }

  .btn {
    padding: 1rem 2.5rem;
    border-radius: var(--radius-full);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: var(--transition);
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-light);
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }

  .btn-outline {
    border: 2px solid white;
    color: white;
  }

  .btn-outline:hover {
    background: white;
    color: var(--text-main);
  }

  .features-section {
    padding: 6rem 0;
    background: white;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3rem;
  }

  .feature-card {
    text-align: center;
  }

  .feature-icon {
    color: var(--primary);
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
  }

  .feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .feature-card p {
    color: var(--text-muted);
  }

  .categories-section {
    padding: 6rem 0;
  }

  .section-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .section-header h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .category-card {
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: var(--transition);
  }

  .category-img {
    height: 250px;
    overflow: hidden;
  }

  .category-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .category-card:hover .category-img img {
    transform: scale(1.1);
  }

  .category-info {
    padding: 2rem;
  }

  .category-info h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .category-info span {
    display: block;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }

  .cat-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--primary);
  }

  @media (max-width: 1024px) {
    .hero h1 {
      font-size: 3.5rem;
    }
    .features-grid, 
    .categories-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2.8rem;
    }
    .features-grid, 
    .categories-grid {
      grid-template-columns: 1fr;
    }
    .hero-btns {
      flex-direction: column;
    }
  }
`;

/* ProductCard Styles */
export const productCardStyles = `
  .product-card {
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
    border: 1px solid var(--border);
  }

  .product-card:hover {
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-light);
  }

  .product-image-container {
    position: relative;
    height: 250px;
    overflow: hidden;
    background: #f3f4f6;
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .product-card:hover .product-image {
    transform: scale(1.1);
  }

  .product-badges {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 2;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
  }

  .badge-new {
    background: var(--primary);
  }

  .badge-discount {
    background: #ef4444;
  }

  .product-actions {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;
    transform: translateY(20px);
    opacity: 0;
    transition: var(--transition);
    z-index: 2;
  }

  .product-card:hover .product-actions {
    transform: translateY(0);
    opacity: 1;
  }

  .action-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-md);
    color: var(--text-main);
  }

  .action-btn:hover {
    background: var(--primary);
    color: white;
  }

  .action-btn.primary {
    background: var(--primary);
    color: white;
  }

  .action-btn.primary:hover {
    background: var(--primary-dark);
  }

  .product-info {
    padding: 1.5rem;
  }

  .product-category {
    font-size: 0.8rem;
    color: var(--primary);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
    display: block;
  }

  .product-title {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-main);
  }

  .product-rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .rating-count {
    font-size: 0.8rem;
    color: var(--text-light);
    margin-left: 0.5rem;
  }

  .product-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .product-price {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .current-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary);
  }

  .old-price {
    font-size: 0.9rem;
    color: var(--text-light);
    text-decoration: line-through;
  }

  .product-weight {
    font-size: 0.85rem;
    color: var(--text-muted);
    background: #f3f4f6;
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-sm);
  }

  .image-link {
    display: block;
    height: 100%;
    width: 100%;
  }

  .add-cart-btn-small {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.85rem;
    transition: var(--transition);
  }

  .add-cart-btn-small:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    .product-image-container {
      height: 200px;
    }
    .product-info {
      padding: 1rem;
    }
    .product-title {
      font-size: 1rem;
    }
  }
`;

/* ShopPage Styles */
export const shopStyles = `
  .shop-page {
    padding-bottom: 6rem;
  }

  .shop-header {
    background: var(--primary);
    color: white;
    padding: 6rem 0;
    text-align: center;
    margin-bottom: 4rem;
    background-image: linear-gradient(rgba(45, 90, 39, 0.8), rgba(45, 90, 39, 0.8)), url('/hero-bg.png');
    background-size: cover;
    background-position: center;
  }

  .shop-header h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .shop-header p {
    font-size: 1.2rem;
    opacity: 0.9;
  }

  .shop-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 3rem;
  }

  .shop-sidebar {
    background: white;
    padding: 2rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    height: fit-content;
    position: sticky;
    top: 100px;
  }

  .filter-group {
    margin-bottom: 2.5rem;
  }

  .filter-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--bg-main);
  }

  .search-box {
    position: relative;
  }

  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    outline: none;
    transition: var(--transition);
  }

  .search-box input:focus {
    border-color: var(--primary);
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-light);
  }

  .filter-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    color: var(--text-muted);
    transition: var(--transition);
  }

  .filter-item:hover {
    color: var(--primary);
  }

  .filter-item input {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }

  .range-slider {
    width: 100%;
    accent-color: var(--primary);
  }

  .price-inputs {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .shop-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 1.5rem 2rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    margin-bottom: 2rem;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .sort-dropdown {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-main);
    padding: 0.25rem;
    border-radius: var(--radius-md);
  }

  .view-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    color: var(--text-light);
  }

  .view-btn.active {
    background: white;
    color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  .products-grid.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
  }

  .products-grid.list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 4rem;
  }

  .page-btn {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: white;
    border: 1px solid var(--border);
    font-weight: 600;
  }

  .page-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .page-btn:hover:not(.active) {
    border-color: var(--primary);
    color: var(--primary);
  }

  .page-btn.next {
    width: auto;
    padding: 0 1.5rem;
  }

  @media (max-width: 1024px) {
    .shop-layout {
      grid-template-columns: 1fr;
    }
    .shop-sidebar {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .shop-toolbar {
      flex-direction: column;
      gap: 1.5rem;
      text-align: center;
    }
  }
`;

/* CheckoutPage Styles */
export const checkoutStyles = `
  .checkout-page {
    padding: 4rem 0 8rem;
  }

  .checkout-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 5rem;
    align-items: flex-start;
  }

  .checkout-steps {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 4rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-light);
    font-weight: 600;
  }

  .step.active {
    color: var(--primary);
  }

  .step-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--text-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }

  .step.active .step-num {
    border-color: var(--primary);
    background: var(--primary);
    color: white;
  }

  .step-line {
    flex: 1;
    height: 2px;
    background: var(--border);
  }

  .form-step h2 {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .form-group.full {
    grid-column: span 2;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .form-group input {
    width: 100%;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    outline: none;
    transition: var(--transition);
  }

  .form-group input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(45, 90, 39, 0.1);
  }

  .payment-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .payment-card {
    padding: 2rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: var(--transition);
    position: relative;
  }

  .payment-card.selected {
    border-color: var(--primary);
    background: rgba(45, 90, 39, 0.02);
  }

  .payment-info span {
    font-weight: 700;
    font-size: 1.1rem;
    display: block;
    margin-bottom: 0.25rem;
  }

  .payment-info p {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .jazz-logo {
    background: #ef4444;
    color: white;
    width: 40px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.7rem;
    border-radius: 4px;
  }

  .card-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
    padding: 2rem;
    background: var(--bg-main);
    border-radius: var(--radius-lg);
  }

  .btn-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .next-btn, 
  .place-order-btn {
    background: var(--primary);
    color: white;
    padding: 1.25rem 2.5rem;
    border-radius: var(--radius-full);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: var(--transition);
  }

  .place-order-btn {
    flex: 1;
    justify-content: center;
    margin-left: 2rem;
  }

  .back-btn {
    color: var(--text-muted);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .review-summary {
    background: var(--bg-main);
    padding: 2.5rem;
    border-radius: var(--radius-lg);
    margin-bottom: 3rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }

  .review-section h3 {
    font-size: 1rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .review-section p {
    font-weight: 600;
    line-height: 1.6;
  }

  .checkout-summary {
    background: white;
    padding: 3rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    position: sticky;
    top: 100px;
  }

  .checkout-summary h3 {
    font-size: 1.4rem;
    margin-bottom: 2rem;
  }

  .summary-items {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 1rem;
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .sum-img {
    position: relative;
    width: 64px;
    height: 64px;
    background: var(--bg-main);
    border-radius: var(--radius-md);
  }

  .sum-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-md);
  }

  .sum-qty {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--primary);
    color: white;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .sum-info {
    flex: 1;
  }

  .sum-info h4 {
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }

  .sum-info span {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .sum-price {
    font-weight: 600;
  }

  .summary-costs {
    border-top: 1px solid var(--border);
    padding-top: 2rem;
    margin-bottom: 2rem;
  }

  .cost-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-weight: 500;
    color: var(--text-muted);
  }

  .cost-total {
    display: flex;
    justify-content: space-between;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--primary);
    padding-top: 1rem;
    border-top: 2px solid var(--bg-main);
  }

  .checkout-guarantee {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--text-light);
    font-size: 0.85rem;
    font-weight: 600;
  }

  @media (max-width: 1200px) {
    .checkout-layout {
      grid-template-columns: 1fr;
    }
    .checkout-summary {
      position: static;
    }
  }

  @media (max-width: 768px) {
    .form-grid, 
    .payment-options, 
    .review-summary {
      grid-template-columns: 1fr;
    }
    .form-group.full {
      grid-column: auto;
    }
    .checkout-steps {
      font-size: 0.8rem;
    }
  }
`;

/* AccountPage Styles */
export const accountStyles = `
  .account-page {
    padding: 4rem 0 8rem;
    background: var(--bg-main);
    min-height: 80vh;
  }

  .account-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 4rem;
    align-items: flex-start;
  }

  .account-sidebar {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .user-brief {
    padding: 2.5rem;
    background: var(--primary);
    color: white;
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .avatar {
    width: 50px;
    height: 50px;
    background: var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1.5rem;
    color: var(--text-main);
  }

  .account-nav {
    padding: 1rem 0;
  }

  .account-nav button {
    width: 100%;
    padding: 1.25rem 2.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-weight: 600;
    color: var(--text-muted);
    transition: var(--transition);
    text-align: left;
  }

  .account-nav button.active {
    color: var(--primary);
    background: rgba(45, 90, 39, 0.05);
    border-left: 4px solid var(--primary);
  }

  .logout-btn {
    margin-top: 2rem;
    color: #ef4444 !important;
    border-top: 1px solid var(--border);
  }

  .account-content {
    background: white;
    padding: 4rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .order-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    transition: var(--transition);
  }

  .status-badge.delivered {
    background: #ecfdf5;
    color: #059669;
  }

  .status-badge.shipped {
    background: #eff6ff;
    color: #2563eb;
  }

  .status-badge.cancelled {
    background: #fef2f2;
    color: #dc2626;
  }

  @media (max-width: 1024px) {
    .account-layout {
      grid-template-columns: 1fr;
    }
    .account-content {
      padding: 2.5rem;
    }
  }
`;

/* AdminLayout Styles */
export const adminLayoutStyles = `
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
    color: #1e293b;
  }

  .admin-sidebar {
    width: 280px;
    background: #1e293b;
    color: white;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
  }

  .admin-logo {
    padding: 2.5rem;
    margin-bottom: 2rem;
  }

  .admin-nav {
    flex: 1;
    padding: 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .admin-nav-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    color: #94a3b8;
    font-weight: 500;
  }

  .admin-nav-item.active {
    color: white;
    background: var(--primary);
  }

  .admin-main {
    flex: 1;
    margin-left: 280px;
    display: flex;
    flex-direction: column;
  }

  .admin-header {
    height: 80px;
    background: white;
    padding: 0 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 90;
  }

  .admin-search {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #f1f5f9;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-full);
    width: 400px;
  }

  .admin-content {
    padding: 3rem;
    flex: 1;
  }

  @media (max-width: 1024px) {
    .admin-sidebar {
      width: 80px;
    }
    .admin-sidebar span {
      display: none;
    }
    .admin-main {
      margin-left: 80px;
    }
  }
`;

/* Admin Dashboard Styles */
export const adminDashboardStyles = `
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .stat-card {
    background: white;
    padding: 2rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    display: flex;
    gap: 1.5rem;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    background: rgba(45, 90, 39, 0.1);
    color: var(--primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1.8fr 1fr;
    gap: 2rem;
  }

  .dashboard-panel {
    background: white;
    padding: 2.5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
  }

  .admin-table th {
    text-align: left;
    padding: 1rem;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.85rem;
    text-transform: uppercase;
  }

  .status-pill.delivered {
    background: #ecfdf5;
    color: #059669;
  }

  .status-pill.processing {
    background: #fffbeb;
    color: #d97706;
  }

  @media (max-width: 1200px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }
`;

/* LoginPage Styles */
export const loginStyles = `
  .login-page {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    background: var(--bg-main);
  }

  .login-card {
    background: white;
    padding: 3.5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 480px;
    width: 100%;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-wrapper input {
    width: 100%;
    padding: 1rem 1rem 1rem 3.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .submit-btn {
    background: var(--primary);
    color: white;
    padding: 1.25rem;
    border-radius: var(--radius-md);
    font-weight: 700;
    width: 100%;
    margin-top: 1rem;
  }
`;

/* CartPage Styles */
export const cartStyles = `
  .cart-page {
    padding: 6rem 0 10rem;
  }

  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 4rem;
    align-items: flex-start;
  }

  .cart-header {
    display: grid;
    grid-template-columns: 1fr 120px 150px 120px;
    gap: 2rem;
    padding: 1.5rem 0;
    border-bottom: 2px solid var(--border);
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 1px;
    color: var(--text-muted);
  }

  .cart-item {
    display: grid;
    grid-template-columns: 1fr 120px 150px 120px;
    gap: 2rem;
    align-items: center;
    padding: 2.5rem 0;
    border-bottom: 1px solid var(--border);
  }

  .item-info {
    display: flex;
    gap: 2rem;
    align-items: center;
  }

  .item-img {
    width: 100px;
    height: 100px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #f3f4f6;
  }

  .item-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-details h3 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .item-details span {
    display: block;
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .remove-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .item-price, .item-total {
    font-weight: 700;
    font-size: 1.05rem;
  }

  .item-total {
    color: var(--primary);
  }

  .quantity-control {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: #f8fafc;
    padding: 0.5rem;
    border-radius: var(--radius-md);
    width: fit-content;
  }

  .order-summary {
    background: white;
    padding: 3rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    position: sticky;
    top: 120px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    color: var(--text-muted);
  }

  .summary-row.discount {
    color: #059669;
    font-weight: 600;
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-main);
  }

  .checkout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: white;
    padding: 1.25rem;
    border-radius: var(--radius-md);
    font-weight: 700;
    margin-top: 2.5rem;
    transition: var(--transition);
    width: 100%;
  }

  .checkout-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .promo-code {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
  }

  .promo-code input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    outline: none;
  }

  .promo-code button {
    padding: 0.75rem 1.5rem;
    background: var(--bg-main);
    color: var(--text-main);
    border-radius: var(--radius-md);
    font-weight: 600;
  }

  .cart-summary {
    background: white;
    padding: 3rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
  }

  @media (max-width: 1024px) {
    .cart-grid {
      grid-template-columns: 1fr;
    }
  }
`;

/* ProductDetail Styles */
export const productDetailStyles = `
  .product-detail-page {
    padding: 4rem 0 8rem;
  }

  .breadcrumbs { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
    margin-bottom: 3rem; 
    color: var(--text-muted); 
    font-size: 0.9rem; 
  }
  
  .breadcrumbs a { 
    color: var(--text-main); 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
    font-weight: 600; 
  }
  
  .breadcrumbs .active { 
    color: var(--primary); 
    font-weight: 600; 
  }

  .product-main { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 5rem; 
    margin-bottom: 6rem; 
  }

  .main-image { 
    height: 600px; 
    background: #f3f4f6; 
    border-radius: var(--radius-lg); 
    overflow: hidden; 
  }

  .main-image img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
  }

  .thumbnails { 
    display: flex; 
    gap: 1rem; 
    margin-top: 1rem; 
  }

  .thumb { 
    width: 80px; 
    height: 80px; 
    border-radius: var(--radius-md); 
    overflow: hidden; 
    cursor: pointer; 
    border: 2px solid transparent; 
  }

  .thumb.active { 
    border-color: var(--primary); 
  }

  .thumb img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
  }

  .cat-tag { 
    color: var(--primary); 
    font-weight: 700; 
    text-transform: uppercase; 
    letter-spacing: 1px; 
    font-size: 0.85rem; 
  }

  .product-name { 
    font-size: 3rem; 
    margin: 1rem 0; 
    font-weight: 800; 
  }

  .rating-row { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
    margin-bottom: 2rem; 
  }

  .price-row { 
    display: flex; 
    align-items: center; 
    gap: 1.5rem; 
    margin-bottom: 2.5rem; 
  }

  .current-price { 
    font-size: 2.5rem; 
    font-weight: 800; 
    color: var(--primary); 
  }

  .old-price { 
    font-size: 1.5rem; 
    text-decoration: line-through; 
    color: var(--text-light); 
  }

  .short-desc { 
    line-height: 1.8; 
    color: var(--text-muted); 
    margin-bottom: 3rem; 
    font-size: 1.1rem; 
  }

  .weight-options { 
    display: flex; 
    gap: 1rem; 
    margin-top: 1rem; 
    margin-bottom: 3rem; 
  }

  .weight-btn {
    padding: 1rem 2rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    transition: var(--transition);
  }

  .weight-btn.active {
    border-color: var(--primary);
    background: rgba(45, 90, 39, 0.05);
    color: var(--primary);
  }

  .purchase-section { 
    display: flex; 
    gap: 2rem; 
    align-items: center; 
    margin-bottom: 4rem; 
  }

  .quantity-control { 
    display: flex; 
    align-items: center; 
    gap: 1.5rem; 
    background: var(--bg-main); 
    padding: 0.75rem 1.5rem; 
    border-radius: var(--radius-full); 
  }

  .add-to-cart-btn {
    background: var(--primary);
    color: white;
    padding: 1.25rem 3rem;
    border-radius: var(--radius-full);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: none;
    cursor: pointer;
    transition: var(--transition);
  }

  .add-to-cart-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .benefit-grid { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 2rem; 
    padding-top: 3rem; 
    border-top: 1px solid var(--border); 
  }

  .benefit-item { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
    color: var(--text-muted); 
    font-weight: 500; 
  }

  .tabs-section { 
    margin-top: 8rem; 
    margin-bottom: 8rem; 
  }

  .tab-headers { 
    display: flex; 
    gap: 4rem; 
    border-bottom: 1px solid var(--border); 
    margin-bottom: 3rem; 
  }

  .tab-headers button { 
    padding: 1.5rem 0; 
    font-size: 1.1rem; 
    font-weight: 600; 
    color: var(--text-light); 
    position: relative; 
    background: none;
    border: none;
    cursor: pointer;
  }

  .tab-headers button.active { 
    color: var(--primary); 
  }

  .tab-headers button.active:after { 
    content: ''; 
    position: absolute; 
    bottom: -1px; 
    left: 0; 
    width: 100%; 
    height: 3px; 
    background: var(--primary); 
  }

  .tab-pane { 
    max-width: 800px; 
    line-height: 1.8; 
    color: var(--text-muted); 
  }

  .nutrition-table { 
    width: 100%; 
    border-collapse: collapse; 
  }

  .nutrition-table tr { 
    border-bottom: 1px solid var(--border); 
  }

  .nutrition-table td { 
    padding: 1rem 0; 
  }

  .nutrient { 
    font-weight: 600; 
    color: var(--text-main); 
  }

  .value { 
    text-align: right; 
  }

  .related-section h2 { 
    font-size: 2rem; 
    margin-bottom: 3rem; 
    text-align: center; 
  }

  .related-grid { 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 2rem; 
  }

  @media (max-width: 1024px) { 
    .product-main { 
      grid-template-columns: 1fr; 
      gap: 3rem; 
    } 
    .main-image {
      height: 400px;
    }
    .related-grid { 
      grid-template-columns: repeat(2, 1fr); 
    } 
  }

  @media (max-width: 768px) { 
    .product-name { 
      font-size: 2.2rem; 
    } 
    .purchase-section { 
      flex-direction: column; 
      align-items: stretch;
    } 
    .tab-headers { 
      gap: 2rem; 
    } 
  }
`;

/* Admin Management Styles (Products/Orders/Users) */
export const adminManagementStyles = `
  .admin-products, .admin-orders, .admin-users {
    padding: 2rem 0;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
  }

  .page-header h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }

  .page-header p {
    color: var(--text-light);
  }

  .header-actions .add-btn {
    background: var(--primary);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: var(--radius-md);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: none;
    cursor: pointer;
    transition: var(--transition);
  }

  .header-actions .add-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
  }

  .toolbar {
    background: white;
    padding: 1.5rem 2rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
  }

  .search-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--bg-main);
    padding: 0.8rem 1.2rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
  }

  .search-bar input {
    width: 100%;
    background: none;
    border: none;
    outline: none;
    font-size: 1rem;
  }

  .table-container {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .admin-table th {
    background: #f9fafb;
    padding: 1.2rem 1.5rem;
    font-weight: 600;
    color: var(--text-main);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border);
  }

  .admin-table td {
    padding: 1.2rem 1.5rem;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .prod-img {
    width: 50px;
    height: 50px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #f3f4f6;
  }

  .status-pill {
    padding: 0.4rem 0.8rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
    display: inline-block;
  }

  .status-pill.active { background: #ecfdf5; color: #059669; }
  .status-pill.inactive { background: #fef2f2; color: #dc2626; }
  .status-pill.pending { background: #fffbeb; color: #d97706; }
  .status-pill.shipped { background: #eff6ff; color: #2563eb; }
  .status-pill.delivered { background: #ecfdf5; color: #059669; }

  .stock-level {
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  .stock-level.low { color: #dc2626; font-weight: 700; }

  .action-group {
    display: flex;
    gap: 0.5rem;
  }

  .action-group button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: white;
    cursor: pointer;
    transition: var(--transition);
  }

  .edit-btn:hover { border-color: var(--primary); color: var(--primary); }
  .delete-btn:hover { border-color: #ef4444; color: #ef4444; }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background: white;
    width: 100%;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
  }

  .modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 { font-size: 1.5rem; font-weight: 700; }
  .modal-header button { background: none; border: none; cursor: pointer; color: var(--text-light); }

  .modal-form { padding: 2rem; }

  .form-group { margin-bottom: 1.5rem; }
  .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; }
  
  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    outline: none;
    transition: var(--transition);
  }

  .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .form-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .cancel-btn {
    padding: 0.8rem 2rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: white;
    font-weight: 600;
    cursor: pointer;
  }

  .save-btn {
    padding: 0.8rem 2rem;
    border-radius: var(--radius-md);
    background: var(--primary);
    color: white;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }

  .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 768px) {
    .form-row { grid-template-columns: 1fr; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
    .toolbar { flex-direction: column; align-items: stretch; }
  }
`;


/* OrderConfirmation Styles */
export const confirmationStyles = `
  .confirmation-page {
    padding: 6rem 0 10rem;
    background: var(--bg-main);
    min-height: 80vh;
    display: flex;
    align-items: center;
  }

  .confirmation-card {
    background: white;
    max-width: 800px;
    margin: 0 auto;
    padding: 5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    text-align: center;
  }

  .success-icon {
    color: #10b981;
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
  }

  .order-number {
    font-size: 1.2rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
  }

  .status-timeline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 5rem;
  }

  .next-steps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 5rem;
  }

  .next-card {
    background: var(--bg-main);
    padding: 2.5rem;
    border-radius: var(--radius-lg);
    text-align: left;
  }

  @media (max-width: 768px) {
    .confirmation-card {
      padding: 3rem 1.5rem;
    }
    .next-steps {
      grid-template-columns: 1fr;
    }
  }
`;
