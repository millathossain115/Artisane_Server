# Artisane Server Hardening Plan

## Summary
Stabilize the backend by fixing auth privilege escalation, unsafe logging, stock consistency, soft-delete edge cases, tooling failures, and missing test coverage before adding larger product features.

## Key Changes
- Remove `role` from public registration; only admin-only user creation may set role/status.
- Remove request-body/full-request console logs from controllers; keep only safe structured startup/error logs.
- Remove `isDeleted` from create/update validation bodies for user, category, and product APIs.
- Refactor order creation/cancellation to use MongoDB transactions and atomic stock updates; reject duplicate product IDs or merge quantities before stock validation.
- Change review uniqueness to support soft delete, either with a partial unique index on non-deleted reviews or by restoring/updating an existing soft-deleted review.
- Add refresh-token flow: `POST /auth/refresh-token`, `POST /auth/logout`, token rotation, and refresh-token invalidation storage.
- Add runtime env validation for required config values and commit `.env.example`.
- Fix lint/Prettier errors and run `npm audit fix` where compatible.

## Additions
- Add automated tests with Jest/Vitest + Supertest for auth, user permissions, products, orders, reviews, and dashboard.
- Add security middleware: `helmet`, rate limiting for auth routes, stricter CORS config, and request size limits.
- Add API documentation through OpenAPI/Swagger.
- Add image upload support for product/category images using cloud storage.
- Add payment integration later, after order stock consistency is fixed.
- Add admin controls for blocking/unblocking users and updating own profile/password.

## Test Plan
- Verify `npm run build`, `npm run lint`, and `npm run prettier:check` all pass.
- Test that public registration always creates normal users.
- Test that passwords/tokens are never logged or returned accidentally.
- Test concurrent and duplicate-item order creation cannot produce negative stock.
- Test cancelling an order restores stock exactly once.
- Test soft-deleted reviews do not permanently block future reviews.
- Test protected routes reject missing, invalid, blocked, and soft-deleted users.

## Assumptions
- This is intended to become a production-ready single-vendor e-commerce API.
- Admin creation of users should remain available.
- Soft delete should remain the default deletion strategy.
- Existing API route names can stay stable unless you choose to clean them up later.
