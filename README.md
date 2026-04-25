# 🌿 NaturaDry E-Commerce Platform

A premium, full-stack e-commerce solution for natural dried products. This platform features a high-performance backend and a modern, responsive frontend designed with a focus on user experience and visual excellence.

---

## ✨ Key Features

### 🛒 Frontend (React)
-   **Dynamic Product Discovery**: Search, filter by category, and toggle views (Grid/List).
-   **Hook-Based State Management**: Optimized data fetching using custom `useProducts` hook.
-   **Premium UI/UX**: Built with **Framer Motion** for smooth animations and **Tailwind-inspired** sleek styling.
-   **Advanced Admin Dashboard**: Real-time product management, stock tracking, and analytics.
-   **New! Image Upload During Creation**: Upload multiple product images simultaneously while adding new products.

### ⚙️ Backend (Node.js/Express)
-   **Secure Authentication**: Multi-role (User/Admin) protection using JWT and Bcrypt.
-   **Flexible Payments**: Integrated with **Stripe** and **JazzCash** for international and local transactions.
-   **Media Optimization**: Automated image handling via **Cloudinary**.
-   **Communication**: Transactional emails powered by **Resend**.
-   **Robust Security**: Rate limiting, Helmet security headers, and Joi input validation.
-   **Database**: PostgreSQL with **Knex.js** for reliable migrations and seeding.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Framer Motion, Lucide Icons, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js, Knex.js |
| **Database** | PostgreSQL, Redis (Caching) |
| **Integrations** | Cloudinary (Media), Stripe & JazzCash (Payments), Resend (Email) |

---

## 🚀 Getting Started

### Prerequisites
-   **Node.js** (>= 18.x)
-   **PostgreSQL** (Running instance)
-   **Cloudinary** account (For image storage)

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/inamkarim96/NaturaDry.git
    cd NaturaDry
    ```

2.  **Setup the Backend**:
    ```bash
    cd server
    npm install
    # Create .env and add your DATABASE_URL, CLOUDINARY_URL, etc.
    npm run migrate
    npm run seed
    npm run dev
    ```

3.  **Setup the Frontend**:
    ```bash
    cd ../client
    npm install
    # Create .env and add:
    # VITE_API_URL=http://localhost:5000/api
    npm run dev
    ```

---

## 📂 Project Structure

```text
NaturaDry/
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── api/         # Axios API services
│   │   ├── hooks/       # Custom React Hooks (e.g., useProducts)
│   │   ├── pages/       # Page components (Admin, Shop, etc.)
│   │   └── shared/      # Global styles and constants
├── server/              # Node.js Backend
│   ├── src/
│   │   ├── modules/     # Feature-based modules (Products, Auth, etc.)
│   │   ├── config/      # DB & Cloud configurations
│   │   └── utils/       # Shared helpers
│   ├── migrations/      # DB Schema versions
│   └── seeds/           # Initial demo data
└── README.md            # You are here
```

---

## 📝 Recent Updates

-   ✅ **Refactored Data Layer**: Introduced `useProducts` custom hook to unify product fetching across Admin and Shop pages.
-   ✅ **Enhanced Image Upload**: Enabled multi-image selection and uploading during initial product creation in the Admin panel.
-   ✅ **Security Polish**: Standardized response formats and improved error handling across the API.
