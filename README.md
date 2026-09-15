# 🛒 Enterprise Multi-Vendor Marketplace & Order Management System

> **Auriga IT — Placement Drive 2026 | Round 2: AI Assist Round (AIR)**  
> Production-grade full-stack marketplace featuring multi-tenancy, atomic inventory reservation, real-time WebSocket order tracking, role-based access control (RBAC), and automated testing.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/harshitrathore97/multi-vendor-marketplace)

---

## 🌟 Key Highlights & Engineering Features

- **Multi-Role RBAC (Admin, Vendor, Customer)**: Strict authorization guards on both API routes and client-side views.
- **Atomic Inventory Control**: Concurrency-safe stock reservation during checkout prevents overselling and race conditions.
- **Real-Time Order Tracking**: Bi-directional WebSocket communication (Socket.IO) pushes instant order status updates to customer order steppers and vendor/admin consoles.
- **In-Memory Zero-Config Database**: Seamless local and Codespaces execution with MongoDB in-memory fallback and automated seed data.
- **Dynamic Coupon Engine**: Percentage-based and fixed-amount coupon discounts with validation rules and usage constraints.
- **Comprehensive Test Suite**: 29/29 passing Jest/Supertest automated tests covering authentication, RBAC, cart, inventory concurrency, payments, orders, and reviews.

---

## 🏗️ Architecture & Tech Stack

```
marketplace-platform/
├── backend/                  # Node.js + Express REST API & Socket.IO
│   ├── src/
│   │   ├── config/           # Database & Cache configuration
│   │   ├── controllers/      # Business logic (Auth, Product, Cart, Order, Admin, etc.)
│   │   ├── middleware/       # JWT Auth, RBAC, Rate Limiting, Error Handling
│   │   ├── models/           # Mongoose Data Models (User, Vendor, Product, Order, etc.)
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # Inventory, Payment Simulation, WebSockets
│   │   └── server.js         # HTTP & Socket.IO server initialization
│   └── tests/                # 8 test suites (29 unit & integration tests)
├── frontend/                 # React (Vite) Single Page Application
│   ├── src/
│   │   ├── api/              # Axios HTTP client with auth interceptors
│   │   ├── components/       # Reusable UI components (Navbar, RatingStars, StatusBadge, etc.)
│   │   ├── context/          # AuthContext, CartContext, SocketContext, NotificationContext
│   │   └── pages/            # Customer, Vendor, Admin, and Auth views
└── .devcontainer/            # GitHub Codespaces configuration
```

---

## 🚀 Quick Start (GitHub Codespaces or Local)

### Option A: Running in GitHub Codespaces
1. Open this repository in **GitHub Codespaces**.
2. Dependencies are automatically installed via `.devcontainer/devcontainer.json`.
3. In the terminal, start both backend and frontend servers:
   ```bash
   npm run dev
   ```
4. Codespaces will prompt you to open port **5173** in your browser.

### Option B: Running Locally

```bash
# 1. Install all dependencies across root, backend, and frontend
npm run install:all

# 2. Run both servers simultaneously (Backend on 5000, Frontend on 5173)
npm run dev
```

Alternatively, run in separate terminals:
- **Terminal 1 (Backend)**:
  ```bash
  cd backend
  npm run dev
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  cd frontend
  npm run dev
  ```

Access the application at: **http://localhost:5173** (API: **http://localhost:5000/api**)

---

## 🔑 Pre-Seeded Accounts

The database comes pre-seeded with sample users, vendors, products, and coupons:

| Role | Email | Password | Access / Capabilities |
|---|---|---|---|
| **Customer** | `customer@marketplace.com` | `Customer@123` | Browse catalog, add to cart, apply coupon, checkout, live order tracking |
| **Vendor 1** | `vendor1@marketplace.com` | `Vendor@123` | Vendor dashboard, create/edit products, manage incoming orders, update shipping status |
| **Vendor 2** | `vendor2@marketplace.com` | `Vendor@123` | Multi-vendor isolation, manage secondary store inventory |
| **Admin** | `admin@marketplace.com` | `Admin@123` | Full control: user management, vendor approval, product moderation, coupons, platform metrics |

---

## 🏷️ Test Coupons
- `WELCOME10` — 10% discount
- `SAVE20` — $20 fixed discount

---

## 🧪 Running Automated Tests

Run the full Jest test suite verifying 8 test suites and 29 test cases:

```bash
npm test
```
*Or directly in backend:*
```bash
cd backend
npm test -- --watchAll=false
```

```
Test Suites: 8 passed, 8 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        4.5s
```

---

## 📦 How to Add a New Product (Vendor Flow)

1. Log in with vendor credentials (`vendor1@marketplace.com` / `Vendor@123`).
2. Navigate to **Products** (`/vendor/products`) in the left sidebar.
3. Click the **+ Add Product** button.
4. Fill in:
   - **Product Name**
   - **Description**
   - **Price ($)** and **Stock Quantity**
   - **Category**
   - **Image URLs** (one per line)
5. Click **Create Product**. It will immediately appear in your vendor catalog and in the customer marketplace!
