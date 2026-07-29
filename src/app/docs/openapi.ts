const bearerSecurity = [{ bearerAuth: [] }];

const jsonContent = (schema: Record<string, unknown>) => ({
  'application/json': {
    schema,
  },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const requestBody = (
  schema: Record<string, unknown>,
  required = true,
  contentType = 'application/json',
) => ({
  required,
  content: {
    [contentType]: {
      schema,
    },
  },
});

const jsonBody = (schemaName: string, required = true) =>
  requestBody(ref(schemaName), required);

const multipartBody = (schemaName: string, required = true) =>
  requestBody(ref(schemaName), required, 'multipart/form-data');

const responses = {
  ok: {
    description: 'Request completed successfully',
    content: jsonContent(ref('SuccessResponse')),
  },
  created: {
    description: 'Resource created successfully',
    content: jsonContent(ref('SuccessResponse')),
  },
  noContent: {
    description: 'Resource deleted successfully',
    content: jsonContent(ref('SuccessResponse')),
  },
  validationError: {
    description: 'Validation failed',
    content: jsonContent(ref('ErrorResponse')),
  },
  unauthorized: {
    description: 'Missing or invalid bearer token',
    content: jsonContent(ref('ErrorResponse')),
  },
  forbidden: {
    description: 'Authenticated user does not have permission',
    content: jsonContent(ref('ErrorResponse')),
  },
  notFound: {
    description: 'Resource was not found',
    content: jsonContent(ref('ErrorResponse')),
  },
};

const idParam = (name = 'id', description = 'MongoDB object ID') => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', example: '66a0f8d2b3f4c7a1e5d9a123' },
});

const publicRefParam = {
  name: 'publicRef',
  in: 'path',
  required: true,
  description: 'Public payment reference',
  schema: { type: 'string', example: 'PAY-2026-0001' },
};

const paginationParams = [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
  },
];

const secured = (operation: Record<string, unknown>) => ({
  ...operation,
  security: bearerSecurity,
  responses: {
    ...(operation.responses as Record<string, unknown>),
    401: responses.unauthorized,
    403: responses.forbidden,
  },
});

const listResponses = {
  200: {
    description: 'List returned successfully',
    content: jsonContent(ref('PaginatedSuccessResponse')),
  },
  400: responses.validationError,
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Artisane Server API',
    version: '1.0.0',
    description:
      'REST API for the Artisane single-vendor e-commerce storefront and admin panel.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current host, versioned API',
    },
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local development',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description:
        'Secure identity flows for sign in, recovery, profile, and password control.',
    },
    {
      name: 'Users',
      description:
        'Admin workspace for account oversight, roles, status, and user records.',
    },
    {
      name: 'Categories',
      description:
        'Catalog studio for organizing products into browseable artisan collections.',
    },
    {
      name: 'Products',
      description:
        'Catalog studio for product creation, discovery, images, stock, and pricing.',
    },
    {
      name: 'Orders',
      description:
        'Operations flow for checkout, payment callbacks, order status, and shipments.',
    },
    {
      name: 'Reviews',
      description:
        'Customer voice tools for public reviews, ownership updates, and moderation.',
    },
    {
      name: 'Wishlist',
      description:
        'Personal shopping shelf for saved products and dashboard-ready wishlist data.',
    },
    {
      name: 'Addresses',
      description:
        'Delivery address book for authenticated customers and admins.',
    },
    {
      name: 'Dashboard',
      description:
        'Control room snapshots for admin metrics and customer account summaries.',
    },
    {
      name: 'Analytics',
      description:
        'Admin control room reports for business performance and store decisions.',
    },
    {
      name: 'Activity Logs',
      description:
        'Audit trail for operational visibility and admin action review.',
    },
    {
      name: 'Payment Logs',
      description:
        'Payment audit surface for references, status history, and transaction checks.',
    },
    {
      name: 'Home Content',
      description:
        'Content surface for storefront hero messaging and visual merchandising.',
    },
    {
      name: 'Promo',
      description:
        'Content surface for active banner offers and campaign visibility.',
    },
    {
      name: 'Locations',
      description: 'Courier lookup layer for districts and delivery zones.',
    },
    {
      name: 'Delivery',
      description: 'Courier event intake for Steadfast webhook status updates.',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        requestBody: jsonBody('RegisterUserInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: jsonBody('LoginInput'),
        responses: {
          200: {
            description: 'Login successful',
            content: jsonContent(ref('AuthTokenResponse')),
          },
          400: responses.validationError,
          401: responses.unauthorized,
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Login or register with Google credential',
        requestBody: jsonBody('GoogleAuthInput'),
        responses: {
          200: {
            description: 'Google login successful',
            content: jsonContent(ref('AuthTokenResponse')),
          },
          400: responses.validationError,
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: jsonBody('ForgotPasswordInput'),
        responses: {
          200: responses.ok,
          400: responses.validationError,
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: jsonBody('ResetPasswordInput'),
        responses: {
          200: responses.ok,
          400: responses.validationError,
        },
      },
    },
    '/auth/change-password': {
      patch: secured({
        tags: ['Auth'],
        summary: 'Change authenticated user password',
        requestBody: jsonBody('ChangePasswordInput'),
        responses: {
          200: responses.ok,
          400: responses.validationError,
        },
      }),
    },
    '/auth/me': {
      get: secured({
        tags: ['Auth'],
        summary: 'Get authenticated profile',
        responses: {
          200: responses.ok,
        },
      }),
      patch: secured({
        tags: ['Auth'],
        summary: 'Update authenticated profile',
        requestBody: multipartBody('UpdateProfileInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
        },
      }),
    },
    '/users/create-user': {
      post: secured({
        tags: ['Users'],
        summary: 'Create user or admin account',
        description: 'Requires super_admin role.',
        requestBody: jsonBody('CreateUserInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      }),
    },
    '/users': {
      get: secured({
        tags: ['Users'],
        summary: 'List users',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/users/stats': {
      get: secured({
        tags: ['Users'],
        summary: 'Get user statistics',
        responses: { 200: responses.ok },
      }),
    },
    '/users/{id}': {
      get: secured({
        tags: ['Users'],
        summary: 'Get user by ID',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      }),
      patch: secured({
        tags: ['Users'],
        summary: 'Update user',
        description: 'Requires super_admin role.',
        parameters: [idParam()],
        requestBody: jsonBody('UpdateUserInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
      delete: secured({
        tags: ['Users'],
        summary: 'Soft delete user',
        description: 'Requires super_admin role.',
        parameters: [idParam()],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/categories/create-category': {
      post: secured({
        tags: ['Categories'],
        summary: 'Create category',
        requestBody: multipartBody('CreateCategoryInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      }),
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        parameters: paginationParams,
        responses: listResponses,
      },
    },
    '/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category by ID',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      },
      patch: secured({
        tags: ['Categories'],
        summary: 'Update category',
        parameters: [idParam()],
        requestBody: multipartBody('UpdateCategoryInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
      delete: secured({
        tags: ['Categories'],
        summary: 'Soft delete category',
        parameters: [idParam()],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/products/create-product': {
      post: secured({
        tags: ['Products'],
        summary: 'Create product',
        requestBody: multipartBody('CreateProductInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      }),
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        parameters: [
          ...paginationParams,
          {
            name: 'searchTerm',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'brand',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'stock',
            in: 'query',
            schema: { type: 'string', enum: ['in-stock', 'out-of-stock'] },
          },
          {
            name: 'minPrice',
            in: 'query',
            schema: { type: 'number' },
          },
          {
            name: 'maxPrice',
            in: 'query',
            schema: { type: 'number' },
          },
          {
            name: 'minRating',
            in: 'query',
            schema: { type: 'number', minimum: 1, maximum: 5 },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'newest',
                'createdAt',
                'updatedAt',
                'name',
                'price',
                'stock',
                'rating',
              ],
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'] },
          },
        ],
        responses: listResponses,
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID or slug',
        parameters: [idParam('id', 'Product ID or slug')],
        responses: { 200: responses.ok, 404: responses.notFound },
      },
      patch: secured({
        tags: ['Products'],
        summary: 'Update product',
        parameters: [idParam()],
        requestBody: multipartBody('UpdateProductInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
      delete: secured({
        tags: ['Products'],
        summary: 'Soft delete product',
        parameters: [idParam()],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/orders/create-order': {
      post: secured({
        tags: ['Orders'],
        summary: 'Create order and payment session',
        requestBody: jsonBody('CreateOrderInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      }),
    },
    '/orders/my-orders': {
      get: secured({
        tags: ['Orders'],
        summary: 'List authenticated user orders',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/orders/payment/success': {
      post: {
        tags: ['Orders'],
        summary: 'SSLCommerz success callback',
        requestBody: jsonBody('PaymentCallbackInput', false),
        responses: { 200: responses.ok },
      },
      get: {
        tags: ['Orders'],
        summary: 'SSLCommerz success callback',
        responses: { 200: responses.ok },
      },
    },
    '/orders/payment/fail': {
      post: {
        tags: ['Orders'],
        summary: 'SSLCommerz failure callback',
        requestBody: jsonBody('PaymentCallbackInput', false),
        responses: { 200: responses.ok },
      },
      get: {
        tags: ['Orders'],
        summary: 'SSLCommerz failure callback',
        responses: { 200: responses.ok },
      },
    },
    '/orders/payment/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'SSLCommerz cancel callback',
        requestBody: jsonBody('PaymentCallbackInput', false),
        responses: { 200: responses.ok },
      },
      get: {
        tags: ['Orders'],
        summary: 'SSLCommerz cancel callback',
        responses: { 200: responses.ok },
      },
    },
    '/orders/payment/ipn': {
      post: {
        tags: ['Orders'],
        summary: 'SSLCommerz IPN callback',
        requestBody: jsonBody('PaymentCallbackInput', false),
        responses: { 200: responses.ok },
      },
    },
    '/orders': {
      get: secured({
        tags: ['Orders'],
        summary: 'List all orders',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/orders/{id}': {
      get: secured({
        tags: ['Orders'],
        summary: 'Get order by ID',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      }),
      delete: secured({
        tags: ['Orders'],
        summary: 'Soft delete order',
        parameters: [idParam()],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/orders/{id}/shipment': {
      post: secured({
        tags: ['Orders'],
        summary: 'Create Steadfast shipment',
        description: 'Requires super_admin role.',
        parameters: [idParam()],
        requestBody: jsonBody('CreateShipmentInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
    },
    '/orders/{id}/shipment/sync': {
      post: secured({
        tags: ['Orders'],
        summary: 'Sync one order shipment status',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      }),
    },
    '/orders/{id}/status': {
      patch: secured({
        tags: ['Orders'],
        summary: 'Update order or payment status',
        parameters: [idParam()],
        requestBody: jsonBody('UpdateOrderStatusInput'),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
    },
    '/orders/{id}/cancel': {
      post: secured({
        tags: ['Orders'],
        summary: 'Cancel order',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      }),
    },
    '/reviews/create-review': {
      post: secured({
        tags: ['Reviews'],
        summary: 'Create review',
        requestBody: jsonBody('CreateReviewInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      }),
    },
    '/reviews/admin': {
      get: secured({
        tags: ['Reviews'],
        summary: 'List reviews for admin',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/reviews/my-reviews': {
      get: secured({
        tags: ['Reviews'],
        summary: 'List authenticated user reviews',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/reviews/reviewable-products': {
      get: secured({
        tags: ['Reviews'],
        summary: 'List products user can review',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List public reviews',
        parameters: paginationParams,
        responses: listResponses,
      },
    },
    '/reviews/product/{productId}': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews for product',
        parameters: [idParam('productId', 'Product ID')],
        responses: listResponses,
      },
    },
    '/reviews/{id}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get review by ID',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      },
      patch: secured({
        tags: ['Reviews'],
        summary: 'Update review',
        parameters: [idParam()],
        requestBody: jsonBody('UpdateReviewInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
      delete: secured({
        tags: ['Reviews'],
        summary: 'Delete review',
        parameters: [idParam()],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/reviews/{id}/visibility': {
      patch: secured({
        tags: ['Reviews'],
        summary: 'Update review visibility',
        parameters: [idParam()],
        requestBody: jsonBody('UpdateReviewVisibilityInput'),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
    },
    '/wishlists/create-wishlist': {
      post: secured({
        tags: ['Wishlist'],
        summary: 'Add product to wishlist',
        requestBody: jsonBody('CreateWishlistInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      }),
    },
    '/wishlists/my-wishlist': {
      get: secured({
        tags: ['Wishlist'],
        summary: 'Get authenticated user wishlist',
        responses: { 200: responses.ok },
      }),
    },
    '/wishlists/dashboard': {
      get: secured({
        tags: ['Wishlist'],
        summary: 'Get dashboard wishlist data',
        responses: { 200: responses.ok },
      }),
    },
    '/wishlists/clear': {
      delete: secured({
        tags: ['Wishlist'],
        summary: 'Clear authenticated user wishlist',
        responses: { 200: responses.noContent },
      }),
    },
    '/wishlists/product/{productId}': {
      delete: secured({
        tags: ['Wishlist'],
        summary: 'Remove wishlist item by product ID',
        parameters: [idParam('productId', 'Product ID')],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/wishlists/{id}': {
      delete: secured({
        tags: ['Wishlist'],
        summary: 'Remove wishlist item by wishlist ID',
        parameters: [idParam()],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/addresses': {
      post: secured({
        tags: ['Addresses'],
        summary: 'Create address',
        requestBody: jsonBody('AddressInput'),
        responses: {
          201: responses.created,
          400: responses.validationError,
        },
      }),
    },
    '/addresses/my-addresses': {
      get: secured({
        tags: ['Addresses'],
        summary: 'List authenticated user addresses',
        responses: { 200: responses.ok },
      }),
    },
    '/addresses/{id}': {
      patch: secured({
        tags: ['Addresses'],
        summary: 'Update address',
        parameters: [idParam()],
        requestBody: jsonBody('AddressInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
          404: responses.notFound,
        },
      }),
      delete: secured({
        tags: ['Addresses'],
        summary: 'Delete address',
        parameters: [idParam()],
        responses: { 200: responses.noContent, 404: responses.notFound },
      }),
    },
    '/addresses/{id}/set-default': {
      patch: secured({
        tags: ['Addresses'],
        summary: 'Mark address as default',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      }),
    },
    '/dashboard/admin-stats': {
      get: secured({
        tags: ['Dashboard'],
        summary: 'Get admin dashboard stats',
        parameters: [
          {
            name: 'dateFrom',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'dateTo',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          { name: 'orderStatus', in: 'query', schema: { type: 'string' } },
          { name: 'paymentStatus', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: responses.ok },
      }),
    },
    '/dashboard/my-stats': {
      get: secured({
        tags: ['Dashboard'],
        summary: 'Get authenticated user dashboard stats',
        responses: { 200: responses.ok },
      }),
    },
    '/analytics/admin': {
      get: secured({
        tags: ['Analytics'],
        summary: 'Get admin analytics report',
        responses: { 200: responses.ok },
      }),
    },
    '/activity-logs/stats': {
      get: secured({
        tags: ['Activity Logs'],
        summary: 'Get activity log statistics',
        responses: { 200: responses.ok },
      }),
    },
    '/activity-logs': {
      get: secured({
        tags: ['Activity Logs'],
        summary: 'List activity logs',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/activity-logs/{id}': {
      get: secured({
        tags: ['Activity Logs'],
        summary: 'Get activity log by ID',
        parameters: [idParam()],
        responses: { 200: responses.ok, 404: responses.notFound },
      }),
    },
    '/payment-logs/stats': {
      get: secured({
        tags: ['Payment Logs'],
        summary: 'Get payment log statistics',
        responses: { 200: responses.ok },
      }),
    },
    '/payment-logs': {
      get: secured({
        tags: ['Payment Logs'],
        summary: 'List payment logs',
        parameters: paginationParams,
        responses: listResponses,
      }),
    },
    '/payment-logs/{publicRef}': {
      get: secured({
        tags: ['Payment Logs'],
        summary: 'Get payment log by public reference',
        parameters: [publicRefParam],
        responses: { 200: responses.ok, 404: responses.notFound },
      }),
    },
    '/home-content/hero': {
      get: {
        tags: ['Home Content'],
        summary: 'Get home hero content',
        responses: { 200: responses.ok },
      },
      patch: secured({
        tags: ['Home Content'],
        summary: 'Update home hero content',
        requestBody: multipartBody('UpdateHomeHeroInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
        },
      }),
    },
    '/promos/active': {
      get: {
        tags: ['Promo'],
        summary: 'Get active promo banner',
        responses: { 200: responses.ok },
      },
    },
    '/promos': {
      patch: secured({
        tags: ['Promo'],
        summary: 'Update promo banner',
        requestBody: jsonBody('PromoInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
        },
      }),
    },
    '/locations/districts': {
      get: {
        tags: ['Locations'],
        summary: 'Get courier districts',
        responses: { 200: responses.ok },
      },
    },
    '/locations/districts/{districtId}/zones': {
      get: {
        tags: ['Locations'],
        summary: 'Get courier zones by district',
        parameters: [
          {
            name: 'districtId',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '302' },
          },
        ],
        responses: { 200: responses.ok },
      },
    },
    '/delivery/webhook/steadfast': {
      post: {
        tags: ['Delivery'],
        summary: 'Receive Steadfast courier webhook',
        parameters: [
          {
            name: 'x-steadfast-signature',
            in: 'header',
            required: false,
            schema: { type: 'string' },
          },
        ],
        requestBody: jsonBody('SteadfastWebhookInput', false),
        responses: {
          200: responses.ok,
          400: responses.validationError,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Request completed successfully',
          },
          meta: { type: 'object', nullable: true },
          data: { nullable: true },
        },
      },
      PaginatedSuccessResponse: {
        allOf: [
          ref('SuccessResponse'),
          {
            type: 'object',
            properties: {
              meta: { $ref: '#/components/schemas/PaginationMeta' },
            },
          },
        ],
      },
      AuthTokenResponse: {
        allOf: [
          ref('SuccessResponse'),
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  user: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        ],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errorSources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email' },
              },
            },
          },
          stack: { type: 'string' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 25 },
          totalPage: { type: 'integer', example: 3 },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
          status: { type: 'string' },
        },
      },
      RegisterUserInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 100 },
          phone: { type: 'string', minLength: 7, maxLength: 20 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      GoogleAuthInput: {
        type: 'object',
        required: ['credential'],
        properties: {
          credential: { type: 'string' },
        },
      },
      ForgotPasswordInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      ResetPasswordInput: {
        type: 'object',
        required: ['password', 'token'],
        properties: {
          password: { type: 'string', minLength: 8, maxLength: 100 },
          token: { type: 'string' },
        },
      },
      ChangePasswordInput: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8, maxLength: 100 },
        },
      },
      UpdateProfileInput: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 50 },
          phone: { type: 'string', maxLength: 20 },
          alternativePhone: { type: 'string', maxLength: 20 },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: {
            type: 'string',
            enum: ['female', 'male', 'other', 'prefer_not_to_say'],
          },
          address: { type: 'string', maxLength: 200 },
          city: { type: 'string', maxLength: 80 },
          postalCode: { type: 'string', maxLength: 20 },
          avatar: { type: 'string', format: 'binary' },
        },
      },
      CreateUserInput: {
        allOf: [
          ref('RegisterUserInput'),
          {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'admin'] },
              status: { type: 'string' },
            },
          },
        ],
      },
      UpdateUserInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin'] },
          status: { type: 'string' },
        },
      },
      CreateCategoryInput: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          slug: { type: 'string', maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          image: { type: 'string', format: 'binary' },
        },
      },
      UpdateCategoryInput: {
        allOf: [ref('CreateCategoryInput')],
      },
      CreateProductInput: {
        type: 'object',
        required: ['name', 'slug', 'price', 'stock', 'category'],
        properties: {
          name: { type: 'string', maxLength: 150 },
          slug: { type: 'string', maxLength: 150 },
          description: { type: 'string', maxLength: 2000 },
          price: { type: 'number', minimum: 0 },
          stock: { type: 'integer', minimum: 0 },
          category: { type: 'string' },
          brand: { type: 'string', maxLength: 100 },
          images: {
            type: 'array',
            maxItems: 5,
            items: { type: 'string', format: 'binary' },
          },
        },
      },
      UpdateProductInput: {
        allOf: [ref('CreateProductInput')],
      },
      CreateOrderInput: {
        type: 'object',
        required: ['items', 'shippingAddress', 'contactPhone', 'paymentMethod'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['product', 'quantity'],
              properties: {
                product: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
              },
            },
          },
          shippingAddress: { type: 'string', maxLength: 500 },
          contactPhone: { type: 'string', minLength: 7, maxLength: 20 },
          paymentMethod: { type: 'string' },
          notes: { type: 'string', maxLength: 1000 },
        },
      },
      PaymentCallbackInput: {
        type: 'object',
        additionalProperties: true,
      },
      CreateShipmentInput: {
        type: 'object',
        properties: {
          alternativePhone: { type: 'string', maxLength: 20 },
          deliveryType: { type: 'integer', minimum: 0, maximum: 1 },
          itemDescription: { type: 'string', maxLength: 250 },
          note: { type: 'string', maxLength: 250 },
          recipientEmail: { type: 'string', format: 'email' },
          totalLot: { type: 'integer', minimum: 1 },
        },
      },
      UpdateOrderStatusInput: {
        type: 'object',
        properties: {
          orderStatus: {
            type: 'string',
            enum: [
              'pending',
              'confirmed',
              'processing',
              'shipped',
              'delivered',
              'cancelled',
            ],
          },
          paymentStatus: {
            type: 'string',
            enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
          },
        },
      },
      CreateReviewInput: {
        type: 'object',
        required: ['product', 'rating'],
        properties: {
          product: { type: 'string' },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 1000 },
        },
      },
      UpdateReviewInput: {
        type: 'object',
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 1000 },
        },
      },
      UpdateReviewVisibilityInput: {
        type: 'object',
        required: ['isHidden'],
        properties: {
          isHidden: { type: 'boolean' },
        },
      },
      CreateWishlistInput: {
        type: 'object',
        required: ['product'],
        properties: {
          product: { type: 'string' },
        },
      },
      AddressInput: {
        type: 'object',
        properties: {
          label: { type: 'string', example: 'Home' },
          fullName: { type: 'string' },
          phone: { type: 'string' },
          district: { type: 'string' },
          zone: { type: 'string' },
          addressLine: { type: 'string' },
          isDefault: { type: 'boolean' },
        },
        additionalProperties: true,
      },
      UpdateHomeHeroInput: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          images: {
            type: 'array',
            maxItems: 5,
            items: { type: 'string', format: 'binary' },
          },
        },
        additionalProperties: true,
      },
      PromoInput: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          isActive: { type: 'boolean' },
        },
        additionalProperties: true,
      },
      SteadfastWebhookInput: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
};
