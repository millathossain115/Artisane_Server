# Artisane Server

A simple single-vendor e-commerce backend built with `Express`, `TypeScript`, `MongoDB`, `Mongoose`, `Zod`, and `JWT` authentication.

## Overview

This project provides the backend API for an e-commerce system with:
- authentication and authorization
- user management
- category management
- product management
- order placement and order lifecycle control
- review management

The codebase follows a modular structure so each feature stays isolated and easy to maintain.

## Tech Stack

- `Node.js`
- `Express`
- `TypeScript`
- `MongoDB`
- `Mongoose`
- `Zod`
- `JWT`
- `bcrypt`

## Current Features

- JWT-based auth with register, login, and protected profile route
- role-based access control for `admin` and `user`
- category CRUD
- product CRUD
- populated product category data in responses
- order creation with stock reduction
- order cancellation with stock restore
- order status transition rules
- review create/read/update/delete
- one review per user per product
- global error handling and request validation

## Order Rules

Implemented order lifecycle:

- `pending -> confirmed`
- `confirmed -> processing`
- `processing -> shipped`
- `shipped -> delivered`

Cancellation rules:

- orders can be cancelled only when status is `pending`, `confirmed`, or `processing`
- cancelling an order restores product stock
- paid orders become `refunded` when cancelled
- admin status update route cannot directly set `cancelled`

## Project Structure

```txt
src/
  app/
    config/
    errors/
    middlewares/
    modules/
      auth/
      user/
      category/
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

Root health route:

```txt
GET /
```

## Environment Variables

Create a `.env` file in the project root with:

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

- `npm run dev` - start in watch mode
- `npm run build` - compile TypeScript
- `npm run start` - run compiled build
- `npm run lint` - run ESLint
- `npm run lint:fix` - fix lint issues
- `npm run prettier` - format source files
- `npm run prettier:check` - check formatting

## Main Modules

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Users

- `POST /users/create-user`
- `GET /users`
- `GET /users/:id`
- `DELETE /users/:id`

### Categories

- `POST /categories/create-category`
- `GET /categories`
- `GET /categories/:id`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Products

- `POST /products/create-product`
- `GET /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`

### Orders

- `POST /orders/create-order`
- `GET /orders/my-orders`
- `GET /orders`
- `GET /orders/:id`
- `PATCH /orders/:id/status`
- `PATCH /orders/:id/cancel`
- `DELETE /orders/:id`

### Reviews

- `POST /reviews/create-review`
- `GET /reviews`
- `GET /reviews/product/:productId`
- `GET /reviews/:id`
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`

## Authentication Notes

- protected routes require:

```txt
Authorization: Bearer YOUR_ACCESS_TOKEN
```

- some routes are admin only
- public read routes are available for products, categories, and reviews

## Validation and Error Handling

This project uses:

- `Zod` for request body validation
- custom `AppError` for operational errors
- centralized global error handling
- Mongoose duplicate, cast, and validation error formatting

## Important Implementation Notes

- products use category references
- reviews are connected to both users and products
- orders store product snapshot data like name, slug, price, quantity, and subtotal
- soft delete is used in several modules through `isDeleted`

## Suggested Next Improvements

- product search, filter, and sorting
- review average rating and product rating summary
- payment gateway integration
- dashboard statistics
- image upload integration with cloud storage
- refresh token flow and logout
- tests for auth, product, order, and review modules

## Status

This backend is currently suitable as a learning project or a solid base for a simple single-vendor e-commerce application.
