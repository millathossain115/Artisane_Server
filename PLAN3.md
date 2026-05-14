# Next-Step Backend Plan After Current Auth Baseline

## Summary

The current backend has a working foundation: shared middleware/utils/errors, `user` module, initial `auth` module, JWT-based login/register, and route guards. The recommended next phase is to **finish auth hardening first**, then move into the product catalog flow.

Locked decisions:
- Keep role names as `admin` + `user` for now
- Prioritize **auth hardening** before category/product work

## Implementation Changes

### 1. Finish auth hardening and make it production-safe
- Standardize the auth middleware to accept the normal `Authorization: Bearer <token>` format instead of expecting the raw token only.
- Make token verification stricter:
  - reject malformed bearer headers
  - return consistent `401` responses for missing/invalid/expired tokens
- Add user-account checks inside protected auth flow:
  - prepare user status support such as `active` / `blocked`
  - prepare soft-delete support such as `isDeleted`
  - reject blocked/deleted users even if their token is valid
- Tighten `/auth/me` so it becomes the canonical “current logged-in user” endpoint.
- Add refresh-token support properly if you want persistent login:
  - endpoint for refresh
  - verify refresh token with refresh secret
  - issue new access token
- Keep `register` and `login` public, and keep user-management routes admin-only.

### 2. Clean up user/auth boundaries
- Keep the `User` model as the single data source for identity and roles.
- Keep `auth` responsible only for:
  - register
  - login
  - refresh
  - current-user profile
  - token validation and protection
- Update the user shape to fully support auth-driven lifecycle:
  - `password`
  - `role`
  - `status`
  - `isDeleted`
- Ensure sensitive fields like `password` are always excluded from normal reads unless explicitly selected.

### 3. Add missing auth-related validation and endpoint behavior
- Add validation for any new auth endpoints such as refresh-token or password-change if included in this phase.
- Decide and keep one consistent response contract for auth endpoints:
  - register returns tokens + user
  - login returns tokens + user
  - me returns current user
  - refresh returns a new access token, optionally refresh token too if rotating
- Keep controller flow consistent with `catchAsync`, `sendResponse`, `AppError`, and `globalErrorHandler`.

### 4. Stabilize route protection before adding business modules
- Confirm route access policy now, before category/product/cart/order are built:
  - public: register, login
  - authenticated `user` or `admin`: `GET /auth/me`
  - admin only: user listing, user lookup, delete user, future catalog management
- If self-service customer endpoints are planned later, reserve the pattern now:
  - `GET /auth/me`
  - optional future `PATCH /users/me`
- Do not add cart/order/customer-owned resources until token parsing and role enforcement are stable.

### 5. After auth hardening, begin catalog modules
- Build `category` next:
  - admin create/update/delete
  - public browse/list
- Build `product` immediately after category:
  - admin create/update/delete
  - public list/details
  - filtering, search, sort, pagination
  - stock and publish status
- Keep catalog public-read and admin-write from the start so cart/order work later without redoing access rules.

## Important API and Type Changes

- Keep roles as `admin | user` for now across:
  - JWT payload
  - user schema
  - route guards
  - validations
- Add user lifecycle fields to the `User` schema:
  - `status`
  - `isDeleted`
- Add or refine auth endpoints to this stable shape:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/refresh` if refresh flow is included in this phase
- Middleware should read bearer tokens from the `Authorization` header in standard format.

## Test Plan

- Auth:
  - register succeeds with valid payload
  - duplicate email is rejected
  - login succeeds with correct credentials
  - login fails with wrong password
  - `/auth/me` succeeds with valid bearer token
  - `/auth/me` fails with no token, malformed token, expired token
  - blocked/deleted users cannot access protected routes
- Role guards:
  - admin can access admin-only user routes
  - normal `user` cannot access admin-only routes
- Response and errors:
  - invalid auth payload triggers Zod validation
  - invalid JWT triggers consistent `401`
  - protected routes use the same error response shape as the rest of the app
- Readiness for next phase:
  - public category/product endpoints can be introduced without revisiting auth design

## Assumptions

- “Next” means the immediate engineering phase, not the full MVP roadmap.
- The current auth baseline is functional enough to refine, not restart.
- Role names remain `admin` and `user` to avoid a refactor right now.
- The next implementation order should be:
  1. auth hardening
  2. category
  3. product
  4. cart
  5. order
