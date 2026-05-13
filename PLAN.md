# Artisane Backend MVP Plan

## Summary

Build the backend in phased order around a **single-vendor ecommerce** flow with two stakeholders:

- `admin/owner`: manages catalog, orders, stock, customers, and site content
- `customer`: browses products, manages cart, places orders, and views order history

Chosen defaults for MVP:
- Scope: **Catalog + Cart + Orders**
- Checkout: **Cash/manual payment first**
- Existing foundation stays: modular structure, shared middleware, shared errors, shared utils, `user` module

## Implementation Plan

### 1. Harden the foundation first
- Add `auth` module next so `admin` and `customer` flows are protected properly.
- Extend `user` model to support auth fields and account state:
  - `password`
  - `isDeleted`
  - `status` such as `active` or `blocked`
  - keep `role` as `admin | customer`
- Add auth endpoints:
  - register customer
  - login
  - refresh token or re-login strategy
  - get current user profile
- Add auth middleware:
  - verify token
  - role guard for `admin`
- Apply `catchAsync`, `sendResponse`, `AppError`, and global error flow consistently to all modules.

### 2. Build product catalog management
- Create `category` module for admin-managed product grouping.
- Create `product` module as the main catalog entity.
- Product should support at minimum:
  - title
  - slug
  - description
  - price
  - stock quantity
  - category reference
  - images
  - availability or published status
  - optional tags like `painting`, `handmade`, `decor`
- Admin capabilities:
  - create/update/delete category
  - create/update/delete product
  - publish/unpublish product
  - update stock
- Customer capabilities:
  - browse product list
  - get single product details
  - filter by category
  - search by name/title
  - sort by price or newest
- Public API additions:
  - `/categories`
  - `/products`
  - query params for filtering, search, sort, pagination

### 3. Add cart flow for customers
- Create `cart` module tied to one customer.
- Cart item should store:
  - customer reference
  - product reference
  - quantity
  - unit price snapshot
- Customer capabilities:
  - add item to cart
  - update quantity
  - remove item
  - clear cart
  - view current cart with totals
- Service rules:
  - cannot add unpublished products
  - cannot exceed current stock
  - merging same product should increment quantity instead of duplicating lines

### 4. Add order and checkout flow
- Create `order` module after cart is stable.
- Order should store:
  - customer info snapshot
  - ordered items snapshot
  - subtotal
  - shipping cost if any
  - total price
  - payment method
  - payment status
  - order status
  - shipping address
  - contact phone
- For MVP use manual/cash-style payment states:
  - `paymentStatus`: `pending`, `paid`, `failed`
  - `orderStatus`: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`
- Customer capabilities:
  - place order from cart
  - view own order list
  - view single order details
  - cancel order only while still early-stage, such as `pending`
- Admin capabilities:
  - view all orders
  - update order status
  - update payment status manually
- Critical order behavior:
  - snapshot product title/price/image at order time
  - reduce stock when order is confirmed or placed
  - empty cart after successful order creation

### 5. Add admin operations and dashboard-ready endpoints
- Add admin-focused list endpoints with filtering:
  - all customers
  - all products
  - low stock products
  - all orders by status/date
- Add summary endpoints for future dashboard UI:
  - total customers
  - total products
  - total orders
  - total sales
  - pending orders count
- Keep these as simple aggregate APIs; no frontend-specific formatting logic in the backend.

### 6. Add supporting modules only after the sales flow works
- `review` module only after delivered-order flow exists.
- Restrict reviews to customers who bought the product, if you want stronger trust.
- Optional post-MVP modules:
  - wishlist
  - coupon/discount
  - banner/content management
  - shipping zone/rate config
  - analytics/audit log

## Important Interface and Behavior Changes

- `user.role` should move to `admin | customer` for clarity.
- `user` auth shape will need password-based fields and account-status fields.
- `product` and `order` should use snapshots where business history matters; do not rely only on live product data after purchase.
- Route protection rules:
  - public: product browsing, category browsing
  - customer-only: cart, own orders, profile
  - admin-only: product/category management, all orders, reporting endpoints

## Test Plan

- Auth:
  - customer can register/login
  - admin-only routes reject customer token
  - unauthenticated requests fail on protected routes
- Product/catalog:
  - admin can CRUD product/category
  - customer can browse/filter/search public products
  - unpublished products do not appear publicly
- Cart:
  - add/update/remove works
  - quantity cannot exceed stock
  - duplicate adds merge correctly
- Order:
  - customer can place order from valid cart
  - order stores item snapshots
  - cart clears after order creation
  - invalid stock prevents checkout
  - customer cannot access another customer’s order
  - admin can update order and payment status
- Errors:
  - invalid ObjectId hits cast error path
  - duplicate user email hits duplicate error path
  - invalid request body hits Zod handler

## Assumptions and Defaults

- This is a **single-vendor** store, so no seller module, multi-shop logic, or vendor payout flow is needed.
- Admin manages all products and orders centrally.
- MVP uses **manual/cash-first checkout**, so no payment gateway or webhook module is included yet.
- Reviews, wishlist, coupons, and advanced CMS content are out of MVP unless priorities change.
- Existing modular pattern remains the standard:
  - `route -> validation -> controller -> service -> model`
- Recommended build order:
  1. auth
  2. category
  3. product
  4. cart
  5. order
  6. admin reporting
  7. review and extras
