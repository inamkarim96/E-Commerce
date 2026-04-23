# NaturaDry Backend API

A robust, secure, and scalable e-commerce backend built for the **NaturaDry** ecosystem. This platform handles everything from product management and user authentication to multi-gateway payments and automated email notifications.

---

## Key Features

-   **Secure Authentication**: Multi-role (User/Admin) authentication using JWT and Bcrypt.
-   **Payment Integration**: Support for both **Stripe** (International) and **JazzCash** (Local) payment gateways.
-   **Product Management**: Full CRUD for products, categories, and reviews.
-   **Database Management**: PostgreSQL with **Knex.js** for migrations and seeding.
-   **Media Handling**: Automated image uploads and optimizations via **Cloudinary**.
-   **Communication**: Transactional emails powered by **SendGrid**.
-   **Security First**: 
    -   Rate limiting and slow-down protection.
    -   HTTP headers security with **Helmet**.
    -   Input validation with **Joi**.
-   **Performance**: Redis-ready for caching and advanced rate limiting.
-   **Testing Suite**: Comprehensive integration testing with **Jest** and **Supertest**.

---

## Tech Stack

-   **Runtime**: Node.js (v18+)
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **ORM/Query Builder**: Knex.js
-   **Authentication**: JSON Web Tokens (JWT)
-   **Caching**: Redis (ioredis)
-   **Testing**: Jest & Supertest
-   **Integrations**: Stripe, JazzCash, Cloudinary, SendGrid

---

## Getting Started

### Prerequisites
-   Node.js (>= 18.x)
-   PostgreSQL
-   Redis (optional, for rate limiting)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/NaturaDry.git
    cd NaturaDry/server
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the `server/` directory and populate it with your credentials:
    ```env
    PORT=5000
    DATABASE_URL=postgres://user:password@localhost:5432/naturadry
    JWT_SECRET=your_secret_key
    CLOUDINARY_URL=your_cloudinary_url
    STRIPE_SECRET_KEY=your_stripe_key
    SENDGRID_API_KEY=your_sendgrid_key
    ```

4.  **Run Migrations**:
    ```bash
    npm run migrate
    npm run seed
    ```

5.  **Start the server**:
    ```bash
    npm run dev
    ```

---

## Running Tests

```bash
npm test
```

---

## Project Structure

```text
server/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # Database logic
│   ├── routes/         # API endpoints
│   ├── middlewares/    # Auth & Security
│   └── server.js       # Entry point
├── migrations/         # DB Schema versions
├── seeds/              # Initial data
├── tests/              # Integration tests
└── knexfile.js         # DB configuration
```

---

