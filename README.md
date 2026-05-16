# Artisane Server

Single-vendor e-commerce backend built with `Express`, `TypeScript`, `MongoDB`, `Mongoose`, `Zod`, and JWT authentication.

## Overview

This API currently supports:

- authentication with access and refresh token generation
- admin user management
- category CRUD
- product CRUD with search, filtering, sorting, and pagination
- order creation and lifecycle management
- review CRUD with per-user ownership rules
- admin dashboard statistics

The project follows a modular feature structure with shared middleware, validation, pagination utilities, and centralized error handling.

## Tech Stack

- `Node.js`
- `Express 5`
- `TypeScript`
- `MongoDB`
- `Mongoose`
- `Zod`
- `jsonwebtoken`
- `bcrypt`
- `cors`

## Current Features

- register, login, and protected `me` endpoint
- JWT-based route protection for `admin` and `user`
- hashed password auth with blocked-user and soft-deleted-user checks
- category CRUD with soft delete
- product CRUD with category population
- product list search by name
- product filtering by category and price range
- product sorting by `newest`, `price`, or computed `rating`
- paginated product, order, and review listings
- order creation with product snapshot fields and stock reduction
- order cancellation with stock restore
- payment status handling including `unpaid`, `paid`, `failed`, and `refunded`
- review creation with one-review-per-user-per-product enforcement
- admin dashboard stats for totals, revenue, low stock, and recent activity
- centralized error formatting for validation, duplicate, cast, and Zod errors

## Project Structure

```txt
src/
  app/
    config/
    errors/
    interface/
    middlewares/
    modules/
      auth/
      user/
      category/
      dashboard/
      product/
      order/
      review/
    routes/
    utils/
  app.ts
  server.ts
```

## API Base URL

```txt
http://localhost:5000/api/v1
```

Health route:

```txt
GET /
```

Returns:

```txt
Artisane Server is running
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL=your_mongodb_connection_string
NODE_ENV=development
BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## Installation

```bash
npm install
```

## Run The Project

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

## Available Scripts

- `npm run dev` - start development server with `tsx watch`
- `npm run build` - compile TypeScript into `dist/`
- `npm run start` - run compiled server from `dist/server.js`
- `npm run lint` - run ESLint on `src/**/*.ts`
- `npm run lint:fix` - run ESLint with automatic fixes
- `npm run prettier` - format `src` files
- `npm run prettier:check` - check formatting
- `npm run test` - placeholder script that currently exits with an error

## Main Routes

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

`register` and `login` return both `accessToken` and `refreshToken`.

### Users

Admin only:

- `POST /users/create-user`
- `GET /users`
- `GET /users/:id`
- `DELETE /users/:id`

### Categories

Public read, admin write:

- `POST /categories/create-category`
- `GET /categories`
- `GET /categories/:id`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Products

Public read, admin write:

- `POST /products/create-product`
- `GET /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`

Supported product query params on `GET /products`:

- `page`
- `limit`
- `searchTerm`
- `category`
- `minPrice`
- `maxPrice`
- `sortBy` with `newest`, `price`, or `rating`
- `sortOrder` with `asc` or `desc`

### Orders

- `POST /orders/create-order`
- `GET /orders/my-orders`
- `GET /orders`
- `GET /orders/:id`
- `PATCH /orders/:id/status`
- `PATCH /orders/:id/cancel`
- `DELETE /orders/:id`

Access rules:

- `create-order` and `my-orders` require authenticated `admin` or `user`
- `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, and `DELETE /orders/:id` are admin only
- users can cancel only their own orders
- admins can cancel any order

### Reviews

- `POST /reviews/create-review`
- `GET /reviews`
- `GET /reviews/product/:productId`
- `GET /reviews/:id`
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`

Access rules:

- review creation requires authenticated `admin` or `user`
- review update and delete are allowed for the review owner or an admin

### Dashboard

Admin only:

- `GET /dashboard/admin-stats`

Supported dashboard query params:

- `dateFrom` in a date-like format such as `2026-05-01`
- `dateTo` in a date-like format such as `2026-05-31`
- `orderStatus` with `pending`, `confirmed`, `processing`, `shipped`, `delivered`, or `cancelled`
- `paymentStatus` with `unpaid`, `paid`, `failed`, or `refunded`

Current dashboard response includes:

- total users
- total products
- total orders
- delivered-order revenue total
- monthly revenue for the last 12 months
- order status summary
- low-stock products
- recent users
- recent orders
- recent reviews
- applied filters summary

## Order Rules

Allowed status flow:

- `pending -> confirmed`
- `confirmed -> processing`
- `processing -> shipped`
- `shipped -> delivered`

Cancellation behavior:

- orders can be cancelled only when status is `pending`, `confirmed`, or `processing`
- `PATCH /orders/:id/status` cannot set `cancelled` directly
- cancelled orders restore stock
- if payment status is `paid`, cancelling changes it to `refunded`

## Authentication Notes

Protected routes require:

```txt
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Role model:

- `admin`
- `user`

## Response Shape

Most endpoints use a shared JSON response format:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "meta": {},
  "data": {},
  "errorSources": []
}
```

Paginated routes return pagination info in `meta`:

```json
{
  "page": 1,
  "limit": 10,
  "total": 25,
  "totalPage": 3
}
```

Default pagination:

- `page=1`
- `limit=10`
- maximum `limit=100`

## Validation and Error Handling

This project uses:

- `Zod` for request validation
- shared `validateRequest` middleware
- custom `AppError` for operational errors
- centralized global error handling
- duplicate key, cast error, validation error, and Zod error formatting

## Important Implementation Notes

- soft delete is used across multiple modules via `isDeleted`
- products reference categories and populate category `name` and `slug`
- product list rating is computed dynamically from non-deleted reviews
- orders store product snapshots such as `productName`, `productSlug`, `unitPrice`, `quantity`, and `subtotal`
- order, review, and dashboard data use populated user and product references where needed
- the server sets Google DNS (`8.8.8.8`, `8.8.4.4`) before connecting to MongoDB to avoid SRV lookup issues
- `cors()` and `express.json()` are enabled globally

## Suggested Next Improvements

- refresh token verification/rotation and logout endpoints
- stronger review rules based on completed purchases
- dashboard filters for date ranges and order status
- payment gateway integration
- image upload integration with cloud storage
- automated tests for auth, product, order, review, and dashboard modules

## Status

This backend is already a solid base for a simple single-vendor e-commerce application and now includes both operational sales flows and a lightweight admin dashboard API.
